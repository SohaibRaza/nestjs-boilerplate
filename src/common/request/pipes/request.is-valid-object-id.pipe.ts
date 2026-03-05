import { EnumRequestStatusCodeError } from '@common/request/enums/request.status-code.enum';
import {
    ArgumentMetadata,
    BadRequestException,
    Injectable,
    PipeTransform,
} from '@nestjs/common';

/**
 * NestJS Pipe that validates ID format for route parameters.
 * Used to validate ID parameters in API endpoints before they reach controllers.
 * Ensures the ID is a non-empty string within the expected length range (cuid2 / UUID).
 *
 * @deprecated Class name kept for backward compatibility.
 * This pipe now validates cuid2/UUID IDs (PostgreSQL) instead of MongoDB ObjectIds.
 */
@Injectable()
export class RequestIsValidObjectIdPipe implements PipeTransform {
    /**
     * Validates that the input value is a valid non-empty ID string.
     * Throws BadRequestException if validation fails.
     *
     * @param {string} value - The input value to validate as an ID string
     * @param {ArgumentMetadata} metadata - NestJS argument metadata with parameter name and type
     * @returns {string} The validated ID string if valid
     * @throws {BadRequestException} If value is empty, not a string, or exceeds max length
     */
    async transform(
        value: string,
        metadata: ArgumentMetadata
    ): Promise<string> {
        if (
            !value ||
            typeof value !== 'string' ||
            value.length === 0 ||
            value.length > 36
        ) {
            throw new BadRequestException({
                statusCode: EnumRequestStatusCodeError.validation,
                message: 'request.error.isMongoId',
                messageProperties: {
                    property: metadata.data,
                },
            });
        }

        return value;
    }
}
