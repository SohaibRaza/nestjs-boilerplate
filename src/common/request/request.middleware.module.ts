import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
    ThrottlerGuard,
    ThrottlerModule,
    ThrottlerModuleOptions,
} from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';

import { RequestRequestIdMiddleware } from '@common/request/middlewares/request.request-id.middleware';
import { RequestUrlVersionMiddleware } from '@common/request/middlewares/request.url-version.middleware';
import { RequestCustomLanguageMiddleware } from '@common/request/middlewares/request.custom-language.middleware';

/**
 * Central middleware configuration module for HTTP request/response processing.
 * Configures throttling and custom NestJS middlewares.
 *
 * Note: Helmet, CORS, Compression, Body Parser, and Response-Time are now registered
 * as Fastify plugins in main.ts instead of NestJS middlewares.
 */
@Module({
    controllers: [],
    exports: [],
    providers: [
        {
            provide: APP_GUARD,
            useClass: ThrottlerGuard,
        },
    ],
    imports: [
        SentryModule.forRoot(),
        ThrottlerModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService): ThrottlerModuleOptions => ({
                throttlers: [
                    {
                        ttl: config.get<number>('request.throttle.ttlInMs'),
                        limit: config.get<number>('request.throttle.limit'),
                    },
                ],
            }),
        }),
    ],
})
export class RequestMiddlewareModule implements NestModule {
    /**
     * Configures the middleware processing pipeline for all HTTP requests.
     * Only includes middlewares compatible with Fastify's NestMiddleware interface.
     *
     * @param consumer - NestJS middleware consumer for applying middleware to routes
     */
    configure(consumer: MiddlewareConsumer): void {
        consumer
            .apply(
                RequestRequestIdMiddleware,
                RequestUrlVersionMiddleware,
                RequestCustomLanguageMiddleware
            )
            .forRoutes('{*wildcard}');
    }
}
