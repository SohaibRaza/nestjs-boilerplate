import { SetMetadata } from '@nestjs/common';
import { RequestIdempotencyMetaKey } from '@common/request/constants/request.constant';

/**
 * Decorator to mark a request handler as idempotent.
 * Applies RequestIdempotencyInterceptor logic to cache the response.
 *
 * @returns {MethodDecorator} Setting metadata to true.
 */
export const Idempotent = (): MethodDecorator =>
    SetMetadata(RequestIdempotencyMetaKey, true);
