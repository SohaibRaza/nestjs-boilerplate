import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { ENUM_AUTH_ACCESS_FOR } from 'src/common/auth/constants/auth.enum.constant';
import { ResponseIdSerialization } from 'src/common/response/serializations/response.id.serialization';

export class RoleGetSerialization extends ResponseIdSerialization {
    @ApiProperty({
        description: 'Active flag of role',
        example: true,
        required: true,
    })
    readonly isActive: boolean;

    @ApiProperty({
        description: 'Alias name of role',
        example: faker.name.jobTitle(),
        required: true,
    })
    readonly name: string;

    @ApiProperty({
        description: 'Representative for role',
        example: 'ADMIN',
        required: true,
    })
    readonly accessFor: ENUM_AUTH_ACCESS_FOR;

    @ApiProperty({
        description: 'Date created at',
        example: faker.date.recent(),
        required: true,
    })
    readonly createdAt: Date;

    @ApiProperty({
        description: 'Date updated at',
        example: faker.date.recent(),
        required: false,
    })
    readonly updatedAt: Date;

    @Exclude()
    readonly deletedAt?: Date;
}
