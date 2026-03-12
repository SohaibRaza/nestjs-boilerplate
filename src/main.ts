import './instrument';

import compress from '@fastify/compress';
import helmet from '@fastify/helmet';
import multipart from '@fastify/multipart';
import { Logger, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
    FastifyAdapter,
    NestFastifyApplication,
} from '@nestjs/platform-fastify';
import bytes from 'bytes';
import { plainToInstance } from 'class-transformer';
import { useContainer, validate } from 'class-validator';
import { Logger as PinoLogger } from 'nestjs-pino';
import fs from 'node:fs';
import { v7 as uuid } from 'uuid';

import { AppModule } from '@app/app.module';
import { AppEnvDto } from '@app/dtos/app.env.dto';
import { MessageService } from '@common/message/services/message.service';
import swaggerInit from 'src/swagger';

import { IRequestApp } from '@common/request/interfaces/request.interface';

async function bootstrap(): Promise<void> {
    const isTlsEnable = process.env.APP_HTTP_TLS_ENABLE === 'true';
    const httpsOptions = isTlsEnable
        ? {
              key: fs.readFileSync(process.env.APP_HTTP_TLS_KEY_PATH || ''),
              cert: fs.readFileSync(process.env.APP_HTTP_TLS_CERT_PATH || ''),
          }
        : undefined;

    const bodyLimit = bytes(
        process.env.REQUEST_BODY_JSON_LIMIT_IN_BYTES ?? '500kb'
    );

    const app = await NestFactory.create<NestFastifyApplication>(
        AppModule,
        new FastifyAdapter({
            // Generate UUID v7 as request IDs (instead of Fastify's default req-N format)
            genReqId: () => uuid(),
            bodyLimit,
            ...(httpsOptions ? { https: httpsOptions } : {}),
        }),
        {
            abortOnError: true,
            bufferLogs: false,
        }
    );

    // Custom Logger
    app.useLogger(app.get(PinoLogger));

    // Graceful Shutdown Hooks
    app.enableShutdownHooks();

    const configService = app.get(ConfigService);
    const env: string = configService.get<string>('app.env');
    const timezone: string = configService.get<string>('app.timezone');
    const host: string = configService.get<string>('app.http.host');
    const port: number = configService.get<number>('app.http.port');
    const globalPrefix: string = configService.get<string>('app.globalPrefix');
    const versioningPrefix: string = configService.get<string>(
        'app.urlVersion.prefix'
    );
    const version: string = configService.get<string>('app.urlVersion.version');
    const appName: string = configService.get<string>('app.name');
    const databaseUrl = configService.get<string>('database.url');
    const databaseDebug = configService.get<boolean>('database.debug');
    const loggerAuto = configService.get<boolean>('logger.auto');
    const loggerDebugEnable = configService.get<boolean>('logger.enable');
    const loggerDebugLevel = configService.get<string>('logger.level');

    // enable
    const versionEnable: string = configService.get<string>(
        'app.urlVersion.enable'
    );

    process.env.NODE_ENV = env;
    process.env.TZ = timezone;

    // Setting
    app.setGlobalPrefix(globalPrefix);
    useContainer(app.select(AppModule), { fallbackOnErrors: true });

    // Versioning
    if (versionEnable) {
        app.enableVersioning({
            type: VersioningType.URI,
            defaultVersion: version,
            prefix: versioningPrefix,
        });
    }

    // Validate Env
    const logger = new Logger(`${appName}-Main`);
    const classEnv = plainToInstance(AppEnvDto, process.env);
    const errors = await validate(classEnv, {
        skipMissingProperties: false,
        skipNullProperties: false,
        skipUndefinedProperties: false,
        validationError: {
            target: false,
            value: true,
        },
    });
    if (errors.length > 0) {
        const messageService = app.get(MessageService);
        const errorsMessage = messageService.setValidationMessage(errors);

        logger.error(
            `Env Variable Invalid: ${JSON.stringify(errorsMessage)}`,
            'NestApplication'
        );

        throw new Error('Env Variable Invalid. Please check your .env file.', {
            cause: errorsMessage,
        });
    }

    // --- Fastify Plugins ---

    // Helmet: Security headers
    await app.register(helmet as any, {
        contentSecurityPolicy: false, // disabled for Swagger UI compatibility
    });

    // Compression
    await app.register(compress as any);

    // Multipart (file uploads)
    await app.register(multipart as any, {
        limits: {
            fileSize:
                configService.get<number>(
                    'request.body.applicationOctetStream.limitInBytes'
                ) ?? 10 * 1024 * 1024, // 10MB default
        },
    });

    // CORS
    const corsAllowedOrigin = configService.get<string[]>(
        'request.cors.allowedOrigin'
    );
    const corsAllowedMethod = configService.get<string[]>(
        'request.cors.allowedMethod'
    );
    const corsAllowedHeader = configService.get<string[]>(
        'request.cors.allowedHeader'
    );

    app.enableCors({
        origin: (origin, callback) => {
            if (!origin) {
                return callback(null, true);
            }

            // Allow all if wildcard
            if (
                corsAllowedOrigin.includes('*') ||
                corsAllowedOrigin.length === 0
            ) {
                return callback(null, true);
            }

            // Check if the origin matches any allowed pattern
            const isAllowed = corsAllowedOrigin.some(pattern => {
                if (pattern.startsWith('*.')) {
                    const baseDomain = pattern.slice(2);
                    try {
                        const url = new URL(origin);
                        return (
                            url.hostname.endsWith('.' + baseDomain) ||
                            url.hostname === baseDomain
                        );
                    } catch {
                        return false;
                    }
                }
                return origin === pattern;
            });

            return callback(null, isAllowed);
        },
        methods: corsAllowedMethod,
        allowedHeaders: corsAllowedHeader,
        credentials: !corsAllowedOrigin.includes('*'),
        optionsSuccessStatus: 204,
        maxAge: 86400,
    });

    // Request ID, Correlation ID, and Response-Time hooks
    // These must be Fastify hooks (not NestJS middleware) to run on ALL requests,
    // including 404s and other non-routed requests.
    const fastifyInstance = app.getHttpAdapter().getInstance();
    fastifyInstance.addHook('onRequest', (request, reply, done) => {
        const req = request as IRequestApp;
        // Inject correlationId from request header or generate a new UUID
        const headerCorrelationId = request.headers['x-correlation-id'];
        const correlationId =
            typeof headerCorrelationId === 'string' && headerCorrelationId
                ? headerCorrelationId
                : uuid();
        req.correlationId = correlationId;
        reply.header('x-correlation-id', correlationId);
        reply.header('x-request-id', request.id);

        // Start response-time timer
        req.__startTime = process.hrtime.bigint();

        done();
    });

    fastifyInstance.addHook('onSend', (request, reply, _payload, done) => {
        const start = (request as IRequestApp).__startTime;
        if (start) {
            const diff = process.hrtime.bigint() - start;
            const ms = Number(diff) / 1_000_000;
            reply.header('X-Response-Time', `${ms.toFixed(3)}ms`);
        }
        done();
    });

    // Swagger
    await swaggerInit(app);

    // Listen
    await app.listen(port, host);

    logger.log('=='.repeat(30), 'NestApplication');
    logger.log(`App Environment: ${env}`, 'NestApplication');
    logger.log(`App Name: ${appName}`, 'NestApplication');
    logger.log(`App Global Prefix: ${globalPrefix}`, 'NestApplication');
    logger.log(
        `App Versioning Prefix: /${versioningPrefix}`,
        'NestApplication'
    );
    logger.log(`App Version: ${version}`, 'NestApplication');
    logger.log(`App Timezone: ${timezone}`, 'NestApplication');
    logger.log(
        `App URL: http://${host}:${port}${globalPrefix}`,
        'NestApplication'
    );
    logger.log(`Database URL: ${databaseUrl}`, 'NestApplication');
    logger.log(`Database Debug: ${databaseDebug}`, 'NestApplication');
    logger.log(`Logger Auto: ${loggerAuto}`, 'NestApplication');
    logger.log(`Logger Debug Enable: ${loggerDebugEnable}`, 'NestApplication');
    logger.log(`Logger Debug Level: ${loggerDebugLevel}`, 'NestApplication');
    logger.log('=='.repeat(30), 'NestApplication');
}

// NOSONAR: typescript:S7785 - top-level await requires `module: NodeNext` in tsconfig, which is a
// project-wide breaking change. The bootstrap wrapper is intentional here.
bootstrap();
