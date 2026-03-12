import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';

/**
 * Database utility service providing common database operations.
 *
 * This injectable service provides utility methods for database-related operations,
 * including ID generation using CUID2 format. The generated IDs are
 * URL-safe, collision-resistant, and well-suited as primary keys in PostgreSQL.
 *
 * @class DatabaseUtil
 * @injectable
 */
@Injectable()
export class DatabaseUtil {
    /**
     * Checks if the provided ID string is a valid non-empty string.
     *
     * In the PostgreSQL / CUID2 world, any non-empty string that fits within
     * the expected length range (1–36 chars) is considered valid.
     *
     * @param {string} id - The ID string to validate
     * @returns {boolean} True if the ID is a valid non-empty string
     */
    checkIdIsValid(id: string): boolean {
        return typeof id === 'string' && id.length > 0 && id.length <= 36;
    }

    /**
     * Creates a new unique identifier using CUID2.
     *
     * Generates a collision-resistant, URL-safe, sortable identifier.
     *
     * @returns {string} A CUID2 string identifier
     */
    createId(): string {
        return createId();
    }

    /**
     * Converts the provided data to a plain object compatible with Prisma JsonObject format.
     *
     * Performs a deep clone of the input and casts it to Prisma.JsonObject, ensuring
     * compatibility for Prisma JSON fields.
     *
     * @template T Input data type
     * @template N Output type, defaults to Prisma.JsonObject
     * @param {T} data - The data to convert
     * @returns {N} The plain object representation, compatible with Prisma JsonObject
     */
    toPlainObject<T, N = Prisma.JsonObject>(data: T): N {
        return structuredClone(data as unknown) as N;
    }

    /**
     * Converts the provided data to a plain array compatible with Prisma JsonObject array format.
     *
     * Performs a deep clone of the input and casts it to an array of Prisma.JsonObject,
     * making it suitable for Prisma JSON array fields.
     *
     * @template T Input data type
     * @template N Output array element type, defaults to Prisma.JsonObject
     * @param {T} data - The data to convert
     * @returns {N[]} The plain array representation, compatible with Prisma JsonObject[]
     */
    toPlainArray<T, N = Prisma.JsonObject>(data: T): N[] {
        return structuredClone(data) as N[];
    }
}
