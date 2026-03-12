import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    UseInterceptors,
    applyDecorators,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { FastifyRequest } from 'fastify';
import { Observable } from 'rxjs';

import {
    FileMaxMultiple,
    FileSizeInBytes,
} from '@common/file/constants/file.constant';
import {
    IFile,
    IFileUploadMultiple,
    IFileUploadMultipleField,
    IFileUploadMultipleFieldOptions,
    IFileUploadSingle,
} from '@common/file/interfaces/file.interface';

/**
 * Extended FastifyRequest type that stores processed multipart file results
 * using custom `__file` / `__files` properties, avoiding conflict with
 * @fastify/multipart's built-in `.file()` / `.files()` methods.
 */
type IRequestAppFiles = FastifyRequest & {
    __file?: IFile;
    __files?: IFile[] | Record<string, IFile[]>;
    body: Record<string, unknown>;
};

// ─── Single File ────────────────────────────────────────────────────────────

/**
 * NestJS interceptor that parses a single file upload via @fastify/multipart.
 * Attaches the result as `request.__file` (IFile).
 */
@Injectable()
class MultipartSingleInterceptor implements NestInterceptor {
    constructor(
        private readonly fieldName: string,
        private readonly maxFileSize: number
    ) {}

    async intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Promise<Observable<unknown>> {
        const ctx: HttpArgumentsHost = context.switchToHttp();
        const request = ctx.getRequest<FastifyRequest>() as IRequestAppFiles;

        if (!request.isMultipart()) {
            return next.handle();
        }

        const part = await request.file({
            limits: { fileSize: this.maxFileSize, files: 1 },
        });

        if (part?.fieldname === this.fieldName) {
            const buffer = await part.toBuffer();
            request.__file = {
                fieldname: part.fieldname,
                originalname: part.filename,
                encoding: part.encoding,
                mimetype: part.mimetype,
                size: buffer.length,
                buffer,
            };
        }

        return next.handle();
    }
}

// ─── Multiple Files (same field) ────────────────────────────────────────────

/**
 * NestJS interceptor that parses multiple file uploads via @fastify/multipart.
 * Attaches result as `request.__files` (IFile[]).
 */
@Injectable()
class MultipartArrayInterceptor implements NestInterceptor {
    constructor(
        private readonly fieldName: string,
        private readonly maxCount: number,
        private readonly maxFileSize: number
    ) {}

    async intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Promise<Observable<unknown>> {
        const ctx: HttpArgumentsHost = context.switchToHttp();
        const request = ctx.getRequest<FastifyRequest>() as IRequestAppFiles;

        if (!request.isMultipart()) {
            return next.handle();
        }

        const collected: IFile[] = [];
        const parts = request.files({
            limits: { fileSize: this.maxFileSize },
        });

        for await (const part of parts) {
            if (
                part.type === 'file' &&
                part.fieldname === this.fieldName &&
                collected.length < this.maxCount
            ) {
                const buffer = await part.toBuffer();
                collected.push({
                    fieldname: part.fieldname,
                    originalname: part.filename,
                    encoding: part.encoding,
                    mimetype: part.mimetype,
                    size: buffer.length,
                    buffer,
                });
            }
        }

        request.__files = collected;
        return next.handle();
    }
}

// ─── Multiple Fields ────────────────────────────────────────────────────────

/**
 * NestJS interceptor that parses multi-field file uploads via @fastify/multipart.
 * Attaches result as `request.__files` (Record<fieldname, IFile[]>).
 */
@Injectable()
class MultipartFieldsInterceptor implements NestInterceptor {
    constructor(
        private readonly fields: Array<{ name: string; maxCount: number }>,
        private readonly maxFileSize: number
    ) {}

    async intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Promise<Observable<unknown>> {
        const ctx: HttpArgumentsHost = context.switchToHttp();
        const request = ctx.getRequest<FastifyRequest>() as IRequestAppFiles;

        if (!request.isMultipart()) {
            return next.handle();
        }

        const result: Record<string, IFile[]> = {};
        const maxCounts = Object.fromEntries(
            this.fields.map(f => [f.name, f.maxCount])
        );

        const parts = request.files({
            limits: { fileSize: this.maxFileSize },
        });

        for await (const part of parts) {
            if (part.type !== 'file') {
                continue;
            }

            const fieldMax = maxCounts[part.fieldname] ?? 0;
            const existing = result[part.fieldname] ?? [];
            if (existing.length >= fieldMax) {
                continue;
            }

            const buffer = await part.toBuffer();
            result[part.fieldname] = [
                ...existing,
                {
                    fieldname: part.fieldname,
                    originalname: part.filename,
                    encoding: part.encoding,
                    mimetype: part.mimetype,
                    size: buffer.length,
                    buffer,
                },
            ];
        }

        request.__files = result;
        return next.handle();
    }
}

// ─── Public Decorators ────────────────────────────────────────────────────────

/**
 * Decorator for handling a single file upload.
 * File is attached to `request.__file` as `IFile`.
 *
 * @param {IFileUploadSingle} [options] - Optional per-field config
 */
export function FileUploadSingle(options?: IFileUploadSingle): MethodDecorator {
    return applyDecorators(
        UseInterceptors(
            new MultipartSingleInterceptor(
                options?.field ?? 'file',
                options?.fileSize ?? FileSizeInBytes
            )
        )
    );
}

/**
 * Decorator for handling multiple file uploads from the same field.
 * Files are attached to `request.__files` as `IFile[]`.
 *
 * @param {IFileUploadMultiple} [options] - Optional per-field config
 */
export function FileUploadMultiple(
    options?: IFileUploadMultiple
): MethodDecorator {
    return applyDecorators(
        UseInterceptors(
            new MultipartArrayInterceptor(
                options?.field ?? 'files',
                options?.maxFiles ?? FileMaxMultiple,
                options?.fileSize ?? FileSizeInBytes
            )
        )
    );
}

/**
 * Decorator for handling file uploads from multiple named fields.
 * Files are attached to `request.__files` as `Record<fieldname, IFile[]>`.
 *
 * @param {IFileUploadMultipleField[]} fields - Per-field configurations
 * @param {IFileUploadMultipleFieldOptions} [options] - Shared options (fileSize)
 */
export function FileUploadMultipleFields(
    fields: IFileUploadMultipleField[],
    options?: IFileUploadMultipleFieldOptions
): MethodDecorator {
    return applyDecorators(
        UseInterceptors(
            new MultipartFieldsInterceptor(
                fields.map(e => ({
                    name: e.field,
                    maxCount: e.maxFiles,
                })),
                options?.fileSize ?? FileSizeInBytes
            )
        )
    );
}
