import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { EnumActivityLogAction } from '@prisma/client';
import { Type } from 'class-transformer';

import { DatabaseDto } from '@common/database/dtos/database.dto';
import { RequestUserAgentDto } from '@common/request/dtos/request.user-agent.dto';
import { UserListResponseDto } from '@modules/user/dtos/response/user.list.response.dto';

export class ActivityLogResponseDto extends DatabaseDto {
    @ApiProperty({
        required: true,
        example: faker.string.uuid(),
    })
    userId: string;

    @ApiProperty({
        required: true,
        type: UserListResponseDto,
    })
    @Type(() => UserListResponseDto)
    user: UserListResponseDto;

    @ApiProperty({
        required: true,
        example: EnumActivityLogAction.userLoginCredential,
        enum: EnumActivityLogAction,
    })
    action: EnumActivityLogAction;

    @ApiProperty({
        required: true,
        example: faker.internet.ipv4(),
    })
    ipAddress: string;

    @ApiProperty({
        required: true,
        type: RequestUserAgentDto,
    })
    @Type(() => RequestUserAgentDto)
    userAgent: RequestUserAgentDto;

    @ApiProperty({
        required: false,
        example: { exampleKey: 'exampleValue' },
    })
    metadata?: unknown;
}
