import { Module } from '@nestjs/common';

import { ActivityLogRepository } from '@modules/activity-log/repositories/activity-log.repository';
import { ActivityLogService } from '@modules/activity-log/services/activity-log.service';
import { ActivityLogUtil } from '@modules/activity-log/utils/activity-log.util';

@Module({
    controllers: [],
    providers: [ActivityLogService, ActivityLogUtil, ActivityLogRepository],
    exports: [ActivityLogService, ActivityLogUtil, ActivityLogRepository],
    imports: [],
})
export class ActivityLogModule {}
