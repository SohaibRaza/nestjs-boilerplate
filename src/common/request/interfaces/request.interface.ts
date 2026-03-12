import { FastifyRequest } from 'fastify';
import { ApiKey, GeoLocation, UserAgent } from '@prisma/client';

import type { IFile } from '@common/file/interfaces/file.interface';
import { IPaginationQuery } from '@common/pagination/interfaces/pagination.interface';
import { IAuthJwtAccessTokenPayload } from '@modules/auth/interfaces/auth.interface';
import { RoleAbilityDto } from '@modules/role/dtos/role.ability.dto';
import { IUser } from '@modules/user/interfaces/user.interface';

export interface IRequestApp<
    T = IAuthJwtAccessTokenPayload,
> extends FastifyRequest {
    id: string;
    correlationId: string;
    user?: T;

    __startTime: bigint;
    __apiKey?: ApiKey;
    __user?: IUser;
    __abilities?: RoleAbilityDto[];

    __pagination?: IPaginationQuery;

    __language: string;
    __version: string;

    /** Single uploaded file (set by FileUploadSingle interceptor) */
    __file?: IFile;
    /** Multiple uploaded files (set by FileUploadMultiple / FileUploadMultipleFields) */
    __files?: IFile[] | Record<string, IFile[]>;
}

export interface IRequestLog {
    userAgent: UserAgent;
    ipAddress: string;
    geoLocation?: GeoLocation;
}
