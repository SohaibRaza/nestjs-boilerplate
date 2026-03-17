import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
    validate as uuidValidate,
    version as uuidVersion,
    v7 as uuidv7,
} from 'uuid';

/**
 * Database utility service providing common database operations.
 *
 * This injectable service provides utility methods for database-related operations,
 * including ID generation using UUID v7 format. The generated IDs are
 * sortable and well-suited as primary keys in PostgreSQL.
 *
 * @class DatabaseUtil
 * @injectable
 */
@Injectable()
export class DatabaseUtil {
    /**
     * Checks if the provided ID string is a valid UUID v7.
     *
     * @param {string} id - The ID string to validate
     * @returns {boolean} True if the ID is a valid UUID v7
     */
    checkIdIsValid(id: string): boolean {
        return uuidValidate(id) && uuidVersion(id) === 7;
    }

    /**
     * Creates a new unique identifier using UUID v7.
     *
     * Generates a sortable, unique identifier.
     *
     * @returns {string} A UUID v7 string identifier
     */
    createId(): string {
        return uuidv7();
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
