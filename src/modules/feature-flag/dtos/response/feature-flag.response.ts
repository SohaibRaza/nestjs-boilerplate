import { ApiProperty } from '@nestjs/swagger';

import { DatabaseDto } from '@common/database/dtos/database.dto';
import { IFeatureFlagMetadata } from '@modules/feature-flag/interfaces/feature-flag.interface';

export class FeatureFlagResponseDto extends DatabaseDto {
    @ApiProperty({
        description: 'Feature flag key',
    })
    key: string;

    @ApiProperty({
        description: 'Feature flag status',
    })
    isEnable: boolean;

    @ApiProperty({
        description: 'Feature flag metadata in JSON format',
    })
    metadata: IFeatureFlagMetadata;
}
