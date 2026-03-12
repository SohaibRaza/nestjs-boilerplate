import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FastifyReply } from 'fastify';
import { IRequestApp } from '@common/request/interfaces/request.interface';

/**
 * URL-based API versioning middleware for managing multiple API versions.
 * Extracts and validates API version information from request URLs.
 */
@Injectable()
export class RequestUrlVersionMiddleware implements NestMiddleware {
    private readonly globalPrefix: string;

    private readonly urlVersionEnable: boolean;
    private readonly urlVersionPrefix: string;
    private readonly urlVersion: string;

    constructor(private readonly configService: ConfigService) {
        this.globalPrefix = this.configService.get<string>('app.globalPrefix');
        this.urlVersionEnable = this.configService.get<boolean>(
            'app.urlVersion.enable'
        );
        this.urlVersionPrefix = this.configService.get<string>(
            'app.urlVersion.prefix'
        );
        this.urlVersion = this.configService.get<string>(
            'app.urlVersion.version'
        );
    }

    /**
     * Processes incoming requests to extract and validate API version information.
     *
     * @param req - The Fastify request object extended with custom properties
     * @param _res - The Fastify reply object
     * @param next - The next middleware function
     */
    async use(
        req: IRequestApp,
        _res: FastifyReply,
        next: () => void
    ): Promise<void> {
        const originalUrl: string = req.url;
        let version = this.urlVersion;
        if (
            this.urlVersionEnable &&
            originalUrl.startsWith(
                `${this.globalPrefix}/${this.urlVersionPrefix}`
            )
        ) {
            const url: string[] = originalUrl.split('/');
            version = url[2].replace(this.urlVersionPrefix, '');
        }

        req.__version = version;

        next();
    }
}
