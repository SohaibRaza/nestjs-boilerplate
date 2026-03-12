import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { ConfigService } from '@nestjs/config';
import { FastifyReply } from 'fastify';

import { FileImportException } from '@common/file/exceptions/file.import.exception';
import { HelperService } from '@common/helper/services/helper.service';
import { EnumMessageLanguage } from '@common/message/enums/message.enum';
import { IMessageValidationImportError } from '@common/message/interfaces/message.interface';
import { MessageService } from '@common/message/services/message.service';
import { IRequestApp } from '@common/request/interfaces/request.interface';
import { ResponseMetadataDto } from '@common/response/dtos/response.dto';
import { ResponseErrorDto } from '@common/response/dtos/response.error.dto';

/**
 * Exception filter specifically for handling file import validation errors.
 * Formats FileImportException into standardized error responses with validation error details.
 */
@Catch(FileImportException)
export class AppValidationImportFilter implements ExceptionFilter {
    constructor(
        private readonly messageService: MessageService,
        private readonly configService: ConfigService,
        private readonly helperService: HelperService
    ) {}

    /**
     * Handles FileImportException and formats file import validation errors into standardized responses.
     * Processes import-specific validation messages with metadata and localization support.
     * @param {FileImportException} exception - The file import exception to handle
     * @param {ArgumentsHost} host - Arguments host containing request/response context
     * @returns {Promise<void>}
     */
    async catch(
        exception: FileImportException,
        host: ArgumentsHost
    ): Promise<void> {
        const ctx: HttpArgumentsHost = host.switchToHttp();
        const response: FastifyReply = ctx.getResponse<FastifyReply>();
        const request: IRequestApp = ctx.getRequest<IRequestApp>();

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

        const message = this.messageService.setMessage(exception.message, {
            customLanguage: xLanguage,
        });
        const errors: IMessageValidationImportError[] =
            this.messageService.setValidationImportMessage(exception.errors, {
                customLanguage: xLanguage,
            });

        const responseBody: ResponseErrorDto = {
            statusCode: exception.statusCode,
            message,
            errors,
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
            .code(exception.httpStatus)
            .send(responseBody);

        return;
    }
}
