import { Cache } from '@nestjs/cache-manager';
import {
    BadRequestException,
    CallHandler,
    ExecutionContext,
    Inject,
    Injectable,
    NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { CacheMainProvider } from '@common/cache/constants/cache.constant';
import { RequestIdempotencyMetaKey } from '@common/request/constants/request.constant';
import { IRequestApp } from '@common/request/interfaces/request.interface';

/**
 * Interceptor that handles request idempotency caching.
 * Decorating an endpoint with `@Idempotent()` triggers this checking.
 */
@Injectable()
export class RequestIdempotencyInterceptor implements NestInterceptor {
    constructor(
        @Inject(CacheMainProvider) private readonly cacheManager: Cache,
        private readonly configService: ConfigService,
        private readonly reflector: Reflector
    ) {}

    async intercept(
        context: ExecutionContext,
        next: CallHandler
    ): Promise<Observable<any>> {
        const isIdempotent = this.reflector.get<boolean>(
            RequestIdempotencyMetaKey,
            context.getHandler()
        );

        if (!isIdempotent) {
            return next.handle();
        }

        const request = context.switchToHttp().getRequest<IRequestApp>();
        const idempotencyKey = request.headers['x-idempotency-key'] as string;

        if (!idempotencyKey) {
            throw new BadRequestException(
                'x-idempotency-key header is required for this operation.'
            );
        }

        const cacheKey = `idempotency:${request.user?.userId || 'guest'}:${idempotencyKey}`;
        const cachedResponse = await this.cacheManager.get(cacheKey);

        if (cachedResponse) {
            return of(cachedResponse);
        }

        const ttlInMs = this.configService.get<number>(
            'request.idempotency.ttlInMs'
        );

        return next.handle().pipe(
            tap(async response => {
                await this.cacheManager.set(cacheKey, response, ttlInMs);
            })
        );
    }
}
