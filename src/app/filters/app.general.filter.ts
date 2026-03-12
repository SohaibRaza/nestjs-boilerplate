import {
    ArgumentsHost,
    Catch,
    ExceptionFilter,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { ConfigService } from '@nestjs/config';
import { FastifyReply } from 'fastify';

import { HelperService } from '@common/helper/services/helper.service';
import { MessageService } from '@common/message/services/message.service';
import { IRequestApp } from '@common/request/interfaces/request.interface';
import { ResponseMetadataDto } from '@common/response/dtos/response.dto';
import * as Sentry from '@sentry/nestjs';
import { ResponseErrorDto } from '@common/response/dtos/response.error.dto';
import { EnumMessageLanguage } from '@common/message/enums/message.enum';

/**
 * Global exception filter that handles all unhandled exceptions in the application.
 * Implements NestJS ExceptionFilter interface to catch and process unhandled errors,
 * format them as standardized error responses, and send them to Sentry for monitoring.
 */
@Catch()
export class AppGeneralFilter implements ExceptionFilter {
    private readonly logger = new Logger(AppGeneralFilter.name);

    constructor(
        private readonly messageService: MessageService,
        private readonly configService: ConfigService,
        private readonly helperService: HelperService
    ) {}

    /**
     * Handles all unhandled exceptions and formats them as standardized error responses.
     * Sets response headers and sends exceptions to Sentry for monitoring.
     * @param {unknown} exception - The unhandled exception that was thrown
     * @param {ArgumentsHost} host - Arguments host containing request/response context
     * @returns {Promise<void>}
     */
    async catch(exception: unknown, host: ArgumentsHost): Promise<void> {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: FastifyReply = ctx.getResponse<FastifyReply>();
        const request: IRequestApp = ctx.getRequest<IRequestApp>();

        this.sendToSentry(exception);

        const statusHttp: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
        const messagePath = `http.${statusHttp}`;
        const statusCode = HttpStatus.INTERNAL_SERVER_ERROR;

        const today = this.helperService.dateCreate();
        const xLanguage: EnumMessageLanguage =
            (request.__language as EnumMessageLanguage) ??
            this.configService.get<EnumMessageLanguage>('message.language');
        const xTimestamp = this.helperService.dateGetTimestamp(today);
        const xTimezone = this.helperService.dateGetZone(today);
        const xVersion =
            request.__version ??
            this.configService.get<string>('app.urlVersion.version');
        const xRepoVersion = this.configService.get<string>('app.version');
        const xRequestId = String(request.id);
        const xCorrelationId = String(request.correlationId);
        const metadata: ResponseMetadataDto = {
            language: xLanguage,
            timestamp: xTimestamp,
            timezone: xTimezone,
            path: request.url,
            version: xVersion,
            repoVersion: xRepoVersion,
            requestId: xRequestId,
            correlationId: xCorrelationId,
        };

        const message: string = this.messageService.setMessage(messagePath, {
            customLanguage: xLanguage,
        });

        const responseBody: ResponseErrorDto = {
            statusCode,
            message,
            metadata,
        };

        response
            .header('x-custom-lang', xLanguage)
            .header('x-timestamp', xTimestamp)
            .header('x-timezone', xTimezone)
            .header('x-version', xVersion)
            .header('x-repo-version', xRepoVersion)
            .header('x-request-id', xRequestId)
            .header('x-correlation-id', xCorrelationId)
            .code(statusHttp)
            .send(responseBody);
    }

    /**
     * Sends exception to Sentry for error monitoring and logging.
     * Includes error handling for Sentry failures to prevent cascade errors.
     * @param {unknown} exception - The exception to send to Sentry
     * @returns {void}
     */
    sendToSentry(exception: unknown): void {
        try {
            this.logger.error(exception);
            Sentry.captureException(exception);
        } catch (error: unknown) {
            this.logger.error(error, 'Failed to send exception to Sentry');
        }
    }
}
