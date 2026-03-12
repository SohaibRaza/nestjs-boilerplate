import { Cache } from '@nestjs/cache-manager';
import { BadRequestException, CallHandler, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { lastValueFrom, of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Mocked } from 'vitest';

import { RequestIdempotencyInterceptor } from './request.idempotency.interceptor';
import { RequestIdempotencyMetaKey } from '../constants/request.constant';

describe('RequestIdempotencyInterceptor', () => {
    let interceptor: RequestIdempotencyInterceptor;
    let cacheManager: Mocked<Cache>;
    let configService: Mocked<ConfigService>;
    let reflector: Mocked<Reflector>;

    beforeEach(() => {
        cacheManager = {
            get: vi.fn(),
            set: vi.fn(),
            del: vi.fn(),
            stores: {},
        } as unknown as Mocked<Cache>;

        configService = {
            get: vi.fn().mockImplementation((key: string) => {
                if (key === 'request.idempotency.ttlInMs') {
                    return 10000;
                }
                return null;
            }),
        } as unknown as Mocked<ConfigService>;

        reflector = {
            get: vi.fn(),
            getAll: vi.fn(),
            getAllAndMerge: vi.fn(),
            getAllAndOverride: vi.fn(),
        } as unknown as Mocked<Reflector>;

        interceptor = new RequestIdempotencyInterceptor(
            cacheManager,
            configService,
            reflector
        );
    });

    const createMockExecutionContext = (
        isIdempotent: boolean,
        idempotencyKey?: string,
        userId?: string
    ): ExecutionContext => {
        reflector.get.mockReturnValue(isIdempotent);

        return {
            getHandler: vi.fn().mockReturnValue('mockHandler'),
            switchToHttp: vi.fn().mockReturnValue({
                getRequest: vi.fn().mockReturnValue({
                    headers: {
                        'x-idempotency-key': idempotencyKey,
                    },
                    user: userId ? { userId } : undefined,
                }),
            }),
        } as unknown as ExecutionContext;
    };

    it('should bypass interceptor if not marked with @Idempotent()', async () => {
        const mockContext = createMockExecutionContext(false);
        const mockCallHandler = { handle: vi.fn().mockReturnValue(of({ success: true })) } as unknown as CallHandler;

        const resultObservable = await interceptor.intercept(mockContext, mockCallHandler);
        const val = await lastValueFrom(resultObservable);
        
        expect(reflector.get).toHaveBeenCalledWith(
            RequestIdempotencyMetaKey,
            'mockHandler'
        );
        expect(mockCallHandler.handle).toHaveBeenCalled();
        expect(cacheManager.get).not.toHaveBeenCalled();
        expect(val).toEqual({ success: true });
    });

    it('should throw BadRequestException if idempotency key is missing', async () => {
        const mockContext = createMockExecutionContext(true);
        const mockCallHandler = { handle: vi.fn() } as unknown as CallHandler;

        await expect(
            interceptor.intercept(mockContext, mockCallHandler)
        ).rejects.toThrow(BadRequestException);
    });

    it('should return cached response if it exists', async () => {
        const idempotencyKey = 'test-key-123';
        const userId = 'user-123';
        const mockContext = createMockExecutionContext(true, idempotencyKey, userId);
        const mockCallHandler = { handle: vi.fn() } as unknown as CallHandler;

        const cachedData = { data: 'cached-result' };
        cacheManager.get.mockResolvedValue(cachedData);

        const resultObservable = await interceptor.intercept(mockContext, mockCallHandler);
        const val = await lastValueFrom(resultObservable);

        expect(cacheManager.get).toHaveBeenCalledWith(`idempotency:${userId}:${idempotencyKey}`);
        expect(mockCallHandler.handle).not.toHaveBeenCalled();
        expect(val).toEqual(cachedData);
    });

    it('should call handler and cache response if cache is empty', async () => {
        const idempotencyKey = 'test-key-456';
        const mockContext = createMockExecutionContext(true, idempotencyKey); // test guest branch

        const responseData = { data: 'fresh-result' };
        const mockCallHandler = { handle: vi.fn().mockReturnValue(of(responseData)) } as unknown as CallHandler;

        cacheManager.get.mockResolvedValue(null);

        const resultObservable = await interceptor.intercept(mockContext, mockCallHandler);
        const result = await lastValueFrom(resultObservable);
        
        expect(result).toEqual(responseData);
        expect(cacheManager.set).toHaveBeenCalledWith(
            `idempotency:guest:${idempotencyKey}`,
            responseData,
            10000 // the TTL length from mock
        );
    });

    it('should NOT cache the response if the handler throws an exception', async () => {
        const idempotencyKey = 'test-key-error';
        const mockContext = createMockExecutionContext(true, idempotencyKey);
        
        const mockCallHandler = { handle: vi.fn().mockReturnValue(throwError(() => new Error('Business logic error'))) } as unknown as CallHandler;

        cacheManager.get.mockResolvedValue(null);

        const resultObservable = await interceptor.intercept(mockContext, mockCallHandler);
        
        await expect(lastValueFrom(resultObservable)).rejects.toThrow('Business logic error');
        expect(cacheManager.set).not.toHaveBeenCalled();
    });

    it('should use undefined TTL if config service returns null', async () => {
        const idempotencyKey = 'test-key-ttl';
        const mockContext = createMockExecutionContext(true, idempotencyKey);
        const responseData = { data: 'ttl-result' };
        const mockCallHandler = { handle: vi.fn().mockReturnValue(of(responseData)) } as unknown as CallHandler;

        // Override the config service specifically for this test
        configService.get.mockImplementation(() => null);
        cacheManager.get.mockResolvedValue(null);

        const resultObservable = await interceptor.intercept(mockContext, mockCallHandler);
        const result = await lastValueFrom(resultObservable);
        
        expect(result).toEqual(responseData);
        expect(cacheManager.set).toHaveBeenCalledWith(
            `idempotency:guest:${idempotencyKey}`,
            responseData,
            null // because config returns null
        );
    });

    it('should use "guest" as userId if request.user is present but userId is missing', async () => {
        const idempotencyKey = 'test-key-no-userid';
        // Mocking user object without userId
        reflector.get.mockReturnValue(true);
        const mockContext = {
            getHandler: vi.fn().mockReturnValue('mockHandler'),
            switchToHttp: vi.fn().mockReturnValue({
                getRequest: vi.fn().mockReturnValue({
                    headers: { 'x-idempotency-key': idempotencyKey },
                    user: {}, // No userId
                }),
            }),
        } as unknown as ExecutionContext;

        const responseData = { data: 'no-userid-result' };
        const mockCallHandler = { handle: vi.fn().mockReturnValue(of(responseData)) } as unknown as CallHandler;

        cacheManager.get.mockResolvedValue(null);

        const resultObservable = await interceptor.intercept(mockContext, mockCallHandler);
        await lastValueFrom(resultObservable);
        
        expect(cacheManager.set).toHaveBeenCalledWith(
            `idempotency:guest:${idempotencyKey}`,
            responseData,
            10000
        );
    });
});
