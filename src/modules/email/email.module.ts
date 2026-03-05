import { Module } from '@nestjs/common';

import { AwsModule } from '@common/aws/aws.module';
import { EmailUtil } from '@modules/email/utils/email.util';
import { EmailService } from '@modules/email/services/email.service';
import { EmailTemplateService } from '@modules/email/services/email.template.service';

@Module({
    imports: [AwsModule],
    providers: [EmailUtil, EmailTemplateService, EmailService],
    exports: [EmailUtil, EmailTemplateService, EmailService],
})
export class EmailModule {}
