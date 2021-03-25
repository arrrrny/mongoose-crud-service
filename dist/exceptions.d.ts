import { MongoError } from 'mongodb';
export declare class DuplicateKeyException {
    static readonly code = "DUPLICATE_KEY";
    readonly code: any;
    readonly collection: number | string;
    readonly index: string;
    readonly key: object;
    readonly message: any;
    readonly statusCode: number;
    constructor(mongoError: MongoError);
}
export declare class DocumentNotFoundException {
    static readonly code = "DOCUMENT_NOT_FOUND";
    static readonly message = "The requested document was not found";
    readonly code = "DOCUMENT_NOT_FOUND";
    readonly message: any;
    readonly resourceId: number | string;
    readonly resourceType: string;
    constructor(resourceType: string, resourceId: number | string);
}
