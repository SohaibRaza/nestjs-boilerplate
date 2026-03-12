import { EnumFileExtension } from '@common/file/enums/file.enum';

/**
 * Represents an uploaded file from fastify-multer.
 * Compatible with Express.Multer.File shape for backward compatibility.
 */
export interface IFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    size: number;
    destination?: string;
    filename?: string;
    path?: string;
    buffer?: Buffer;
    stream?: NodeJS.ReadableStream;
}

export interface IFileUploadSingle {
    field: string;
    fileSize: number;
}

export interface IFileUploadMultiple extends IFileUploadSingle {
    maxFiles: number;
}

export type IFileUploadMultipleField = Omit<IFileUploadMultiple, 'fileSize'>;

export type IFileUploadMultipleFieldOptions = Pick<
    IFileUploadSingle,
    'fileSize'
>;

export type IFileInput = IFile | IFile[];

export interface IFileRandomFilenameOptions {
    path?: string;
    prefix?: string;
    extension: EnumFileExtension;
    randomLength?: number;
}
