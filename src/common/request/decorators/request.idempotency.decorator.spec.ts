import { describe, expect, it } from 'vitest';

import { Idempotent } from './request.idempotency.decorator';
import { RequestIdempotencyMetaKey } from '../constants/request.constant';

describe('Idempotent Decorator', () => {
    it('should set the proper metadata key to true', () => {
        class TestClass {
            @Idempotent()
            testMethod(): boolean {
                return true;
            }
        }

        const metadataValue = Reflect.getMetadata(
            RequestIdempotencyMetaKey,
            TestClass.prototype.testMethod
        );

        expect(metadataValue).toBe(true);
    });

    it('should not affect methods without the decorator', () => {
        class TestClass {
            @Idempotent()
            decoratedMethod(): boolean { return true; }

            undecoratedMethod(): boolean { return false; }
        }

        const decoratedMeta = Reflect.getMetadata(
            RequestIdempotencyMetaKey,
            TestClass.prototype.decoratedMethod
        );

        const undecoratedMeta = Reflect.getMetadata(
            RequestIdempotencyMetaKey,
            TestClass.prototype.undecoratedMethod
        );

        expect(decoratedMeta).toBe(true);
        expect(undecoratedMeta).toBeUndefined();
    });
});
