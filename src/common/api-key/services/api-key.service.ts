import { Injectable } from '@nestjs/common';
import {
    IDatabaseCreateOptions,
    IDatabaseFindAllOptions,
    IDatabaseFindOneOptions,
    IDatabaseGetTotalOptions,
    IDatabaseManyOptions,
    IDatabaseSaveOptions,
} from 'src/common/database/interfaces/database.interface';
import { IApiKeyService } from 'src/common/api-key/interfaces/api-key.service.interface';
import { IApiKeyCreated } from 'src/common/api-key/interfaces/api-key.interface';
import {
    ApiKeyDoc,
    ApiKeyEntity,
} from 'src/common/api-key/repository/entities/api-key.entity';
import { ApiKeyRepository } from 'src/common/api-key/repository/repositories/api-key.repository';
import { HelperStringService } from 'src/common/helper/services/helper.string.service';
import { ConfigService } from '@nestjs/config';
import { HelperHashService } from 'src/common/helper/services/helper.hash.service';
import {
    ApiKeyCreateDto,
    ApiKeyCreateRawDto,
} from 'src/common/api-key/dtos/api-key.create.dto';
import {
    ApiKeyUpdateDateDto,
    ApiKeyUpdateDto,
} from 'src/common/api-key/dtos/api-key.update.dto';
import { HelperDateService } from 'src/common/helper/services/helper.date.service';

@Injectable()
export class ApiKeyService implements IApiKeyService {
    private readonly env: string;

    constructor(
        private readonly helperStringService: HelperStringService,
        private readonly configService: ConfigService,
        private readonly helperHashService: HelperHashService,
        private readonly helperDateService: HelperDateService,
        private readonly apiKeyRepository: ApiKeyRepository
    ) {
        this.env = this.configService.get<string>('app.env');
    }

    async findAll<T = ApiKeyDoc>(
        find?: Record<string, any>,
        options?: IDatabaseFindAllOptions
    ): Promise<T[]> {
        return this.apiKeyRepository.findAll<T>(find, options);
    }

    async findOneById(
        _id: string,
        options?: IDatabaseFindOneOptions
    ): Promise<ApiKeyDoc> {
        return this.apiKeyRepository.findOneById<ApiKeyDoc>(_id, options);
    }

    async findOne(
        find: Record<string, any>,
        options?: IDatabaseFindOneOptions
    ): Promise<ApiKeyDoc> {
        return this.apiKeyRepository.findOne<ApiKeyDoc>(find, options);
    }

    async findOneByKey(
        key: string,
        options?: IDatabaseFindOneOptions
    ): Promise<ApiKeyDoc> {
        return this.apiKeyRepository.findOne<ApiKeyDoc>({ key }, options);
    }

    async findOneByActiveKey(
        key: string,
        options?: IDatabaseFindOneOptions
    ): Promise<ApiKeyDoc> {
        return this.apiKeyRepository.findOne<ApiKeyDoc>(
            {
                key,
                isActive: true,
            },
            options
        );
    }

    async getTotal(
        find?: Record<string, any>,
        options?: IDatabaseGetTotalOptions
    ): Promise<number> {
        return this.apiKeyRepository.getTotal(find, options);
    }

    async create(
        { name, type, startDate, endDate }: ApiKeyCreateDto,
        options?: IDatabaseCreateOptions
    ): Promise<IApiKeyCreated> {
        const key = await this.createKey();
        const secret = await this.createSecret();
        const hash: string = await this.createHashApiKey(key, secret);

        const dto: ApiKeyEntity = new ApiKeyEntity();
        dto.name = name;
        dto.key = key;
        dto.hash = hash;
        dto.isActive = true;
        dto.type = type;

        if (startDate && endDate) {
            dto.startDate = this.helperDateService.startOfDay(startDate);
            dto.endDate = this.helperDateService.endOfDay(endDate);
        }

        const created: ApiKeyDoc =
            await this.apiKeyRepository.create<ApiKeyEntity>(dto, options);

        return { doc: created, secret };
    }

    async createRaw(
        { name, key, type, secret, startDate, endDate }: ApiKeyCreateRawDto,
        options?: IDatabaseCreateOptions
    ): Promise<IApiKeyCreated> {
        const hash: string = await this.createHashApiKey(key, secret);

        const dto: ApiKeyEntity = new ApiKeyEntity();
        dto.name = name;
        dto.key = key;
        dto.hash = hash;
        dto.isActive = true;
        dto.type = type;

        if (startDate && endDate) {
            dto.startDate = this.helperDateService.startOfDay(startDate);
            dto.endDate = this.helperDateService.endOfDay(endDate);
        }

        const created: ApiKeyDoc =
            await this.apiKeyRepository.create<ApiKeyEntity>(dto, options);

        return { doc: created, secret };
    }

    async active(
        repository: ApiKeyDoc,
        options?: IDatabaseSaveOptions
    ): Promise<ApiKeyDoc> {
        repository.isActive = true;

        return this.apiKeyRepository.save(repository, options);
    }

    async inactive(
        repository: ApiKeyDoc,
        options?: IDatabaseSaveOptions
    ): Promise<ApiKeyDoc> {
        repository.isActive = false;

        return this.apiKeyRepository.save(repository, options);
    }

    async update(
        repository: ApiKeyDoc,
        { name }: ApiKeyUpdateDto,
        options?: IDatabaseSaveOptions
    ): Promise<ApiKeyDoc> {
        repository.name = name;

        return this.apiKeyRepository.save(repository, options);
    }

    async updateDate(
        repository: ApiKeyDoc,
        { startDate, endDate }: ApiKeyUpdateDateDto,
        options?: IDatabaseSaveOptions
    ): Promise<ApiKeyDoc> {
        repository.startDate = this.helperDateService.startOfDay(startDate);
        repository.endDate = this.helperDateService.endOfDay(endDate);

        return this.apiKeyRepository.save(repository, options);
    }

    async reset(
        repository: ApiKeyDoc,
        secret: string,
        options?: IDatabaseSaveOptions
    ): Promise<ApiKeyDoc> {
        const hash: string = await this.createHashApiKey(
            repository.key,
            secret
        );

        repository.hash = hash;

        return this.apiKeyRepository.save(repository, options);
    }

    async delete(
        repository: ApiKeyDoc,
        options?: IDatabaseSaveOptions
    ): Promise<ApiKeyDoc> {
        return this.apiKeyRepository.softDelete(repository, options);
    }

    async validateHashApiKey(
        hashFromRequest: string,
        hash: string
    ): Promise<boolean> {
        return this.helperHashService.sha256Compare(hashFromRequest, hash);
    }

    async createKey(): Promise<string> {
        return this.helperStringService.random(25, {
            safe: false,
            upperCase: true,
            prefix: `${this.env}_`,
        });
    }

    async createSecret(): Promise<string> {
        return this.helperStringService.random(35, {
            safe: false,
            upperCase: true,
        });
    }

    async createHashApiKey(key: string, secret: string): Promise<string> {
        return this.helperHashService.sha256(`${key}:${secret}`);
    }

    async deleteMany(
        find: Record<string, any>,
        options?: IDatabaseManyOptions
    ): Promise<boolean> {
        return this.apiKeyRepository.deleteMany(find, options);
    }

    async inactiveManyByEndDate(
        options?: IDatabaseManyOptions
    ): Promise<boolean> {
        return this.apiKeyRepository.updateMany(
            {
                endDate: {
                    $lte: this.helperDateService.create(),
                },
                isActive: true,
            },
            {
                isActive: false,
            },
            options
        );
    }
}
