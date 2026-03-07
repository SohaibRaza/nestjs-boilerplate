# Queue Documentation

This documentation explains the features and usage of **Queue Module**: Located at `src/queues`

## Overview

Queue module for background job processing using [BullMQ][ref-bullmq] and [Redis][ref-redis]. This module implements a DRY design pattern with singleton Redis connections for efficient resource management.

All queue configurations are centralized in `src/config/redis.config.ts`, with root setup and management located in `src/queues`.

## Related Documents

- [Configuration][ref-doc-configuration]
- [Environment][ref-doc-environment]

## Table of Contents

- [Overview](#overview)
- [Related Documents](#related-documents)
- [Configuration](#configuration)
- [Queue Structure](#queue-structure)
- [Available Queues](#available-queues)
- [Usage](#usage)
  - [Adding Jobs to Queue](#adding-jobs-to-queue)
  - [Job Options](#job-options)
- [Creating New Queue](#creating-new-queue)
- [Creating New Processor](#creating-new-processor)
- [QueueProcessorBase](#queueprocessorbase)
  - [Implementation](#implementation)
  - [Behavior](#behavior)
- [QueueException](#queueexception)
  - [Usage](#usage-1)
  - [Properties](#properties)
  - [Behavior](#behavior-1)
- [Bull Board Dashboard](#bull-board-dashboard)

## Configuration

Queue configuration is managed in `src/config/redis.config.ts`:

```typescript
export interface IConfigRedis {
    queue: {
        url: string;
        namespace: string;
    };
}
```

Environment variables:

- `QUEUE_REDIS_URL`: Redis connection URL (default: `redis://localhost:6379`)
- `APP_NAME`: Application name for connection naming
- `APP_ENV`: Application environment for connection naming

## Queue Structure

The queue system consists of:

1. **Queue Register Module** (`src/queues/queue.register.module.ts`): Global module for registering queues with default configurations
2. **Queue Module** (`src/queues/queue.module.ts`): Module for managing queue processors
3. **Queue Processor Base** (`src/queues/bases/queue.processor.base.ts`): Base class with error handling and Sentry integration
4. **Queue Processor Decorator** (`src/queues/decorators/queue.decorator.ts`): Custom decorator for processor registration

## Available Queues

Currently available queues defined in `src/queues/enums/queue.enum.ts`:

- `EnumQueue.email`: Email processing queue

Queue priorities:

- `HIGH`: 1
- `MEDIUM`: 5
- `LOW`: 10

## Usage

### Adding Jobs to Queue

Inject the queue into your service:

```typescript
export class YourService {
    constructor(
        @InjectQueue(EnumQueue.email) 
        private readonly emailQueue: Queue
    ) {}

    async sendEmail(data: EmailWorkerDto<unknown>): Promise<void> {
        await this.emailQueue.add(
            EnumSendEmailProcess.welcome,
            data,
            {
                priority: EnumQueueProperty.high,
                attempts: 3,
            }
        );
    }
}
```

### Job Options

Default job options (configured in `queue.register.module.ts`):

```typescript
{
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 5000,
    },
    removeOnComplete: 20,
    removeOnFail: 50,
}
```

You can override these options when adding jobs to the queue.

## Creating New Queue

1. Add new queue enum in `src/queues/enums/queue.enum.ts`:

```typescript
export enum EnumQueue {
    email = 'email',
    notification = 'notification', // New queue
}
```

1. Register queue in `src/queues/queue.register.module.ts`:

```typescript
static forRoot(): DynamicModule {
    const queues = [
        BullModule.registerQueue({
            name: EnumQueue.email,
            configKey: QueueConfigKey,
            defaultJobOptions: {
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 5000,
                },
                removeOnComplete: 20,
                removeOnFail: 50,
            },
        }),
        // Add new queue
        BullModule.registerQueue({
            name: EnumQueue.notification,
            configKey: QueueConfigKey,
            defaultJobOptions: {
                attempts: 5,
                backoff: {
                    type: 'fixed',
                    delay: 3000,
                },
                removeOnComplete: 10,
                removeOnFail: 20,
            },
        }),
    ];
    // ...
}
```

## Creating New Processor

1. Create processor class extending `QueueProcessorBase`:

```typescript
@QueueProcessor(EnumQueue.notification)
export class NotificationProcessor extends QueueProcessorBase {
    private readonly logger = new Logger(NotificationProcessor.name);

    constructor(
        private readonly notificationService: NotificationService
    ) {
        super();
    }

    async process(job: Job<NotificationWorkerDto, unknown, string>): Promise<void> {
        try {
            const jobName = job.name;
            
            switch (jobName) {
                case EnumNotificationProcess.sendPush:
                    await this.processPushNotification(job.data);
                    break;
                case EnumNotificationProcess.sendSms:
                    await this.processSms(job.data);
                    break;
                default:
                    break;
            }
        } catch (error: unknown) {
            this.logger.error(error);
        }

        return;
    }

    async processPushNotification(data: NotificationDto): Promise<boolean> {
        return this.notificationService.sendPush(data);
    }

    async processSms(data: NotificationDto): Promise<boolean> {
        return this.notificationService.sendSms(data);
    }
}
```

1. Register processor in `src/queues/queue.module.ts`:

```typescript
@Module({
    imports: [
        EmailModule,
        NotificationModule, // Add module
    ],
    providers: [
        EmailProcessor,
        NotificationProcessor, // Add processor
    ],
})
export class QueueModule {}
```

## QueueProcessorBase

`QueueProcessorBase` is the base class for all queue processors, extending `WorkerHost` from BullMQ with additional error handling, Sentry integration for monitoring fatal errors, retry logic support, and automatic failed job event handling.

### Implementation

Location: `src/queues/bases/queue.processor.base.ts`

```typescript
export abstract class QueueProcessorBase extends WorkerHost {
    @OnWorkerEvent('failed')
    onFailed(job: Job<unknown, null, string> | undefined, error: Error): void {
        const maxAttempts = job.opts.attempts ?? 1;
        const isLastAttempt = job.attemptsMade >= maxAttempts - 1;

        if (isLastAttempt) {
            let isFatal = true;

            if (error instanceof QueueException) {
                isFatal = !!error.isFatal;
            }

            if (isFatal) {
                try {
                    Sentry.captureException(error);
                } catch (_) {}
            }
        }
    }
}
```

### Behavior

1. **On Job Failure**: The `onFailed` method is automatically triggered
2. **Retry Check**: Determines if this is the last retry attempt
3. **Error Classification**:
   - `QueueException` with `isFatal: true` → Reports to Sentry
   - `QueueException` with `isFatal: false` → Does not report to Sentry
   - Other exceptions → Reports to Sentry (treated as fatal)
4. **Sentry Reporting**: Only reports on the final retry attempt to avoid duplicate alerts

## QueueException

`QueueException` is a custom exception class for queue error handling with Sentry integration control.

### Usage

```typescript
// Fatal error - will be reported to Sentry on last retry
throw new QueueException('Critical payment processing failed', true);

// Non-fatal error - will not be reported to Sentry
throw new QueueException('Temporary service unavailable', false);

// Default behavior (non-fatal)
throw new QueueException('Minor validation error');
```

### Properties

- `message`: Error message
- `isFatal`: Boolean flag to control Sentry reporting (default: `false`)

### Behavior

When a job fails:

1. The `QueueProcessorBase` catches the error
2. On the last retry attempt:
   - If error is `QueueException` with `isFatal: true` → Reports to Sentry
   - If error is `QueueException` with `isFatal: false` → Does not report to Sentry
   - If error is any other exception → Reports to Sentry (treated as fatal)
3. On non-last retry attempts → Never reports to Sentry

## Bull Board Dashboard

ACK NestJS Boilerplate includes Bull Board for queue monitoring and management.

Access the dashboard:

```bash
docker-compose up
```

Dashboard URL: `http://localhost:3010`

Default credentials:

- Username: `admin`
- Password: `admin123`

Configuration in `docker-compose.yml`:

```yaml
redis-bullboard:
    image: deadly0/bull-board:3.2.6
    ports:
        - 3010:3000
    environment:
        - REDIS_HOST=redis
        - REDIS_PORT=6379
        - BULL_PREFIX=Queue
        - USER_LOGIN=admin
        - USER_PASSWORD=admin123
```

<!-- REFERENCES -->

<!-- BADGE LINKS -->

<!-- CONTACTS -->

<!-- Repo LINKS -->

<!-- THIRD PARTY -->

[ref-redis]: https://redis.io
[ref-bullmq]: https://bullmq.io

[ref-doc-configuration]: configuration.md
[ref-doc-environment]: environment.md

<!-- CONTRIBUTOR -->
