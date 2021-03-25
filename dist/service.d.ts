/// <reference types="node" />
import { EventEmitter } from 'events';
import { Db, SessionOptions, WithTransactionCallback } from 'mongodb';
import { ClientSession, Model } from 'mongoose';
import { HintedFilter, IAddSubdocumentParams, ICountSubdocumentsParams, ICreateParams, IDynamicObject, IGetByIdParams, IGetParams, IGetSubDocumentByIdParams, IGetSubDocumentParams, IHardDeleteParams, IHardDeleteSubdocumentByIdParams, IHardDeleteSubdocumentParams, IListParams, IListSubdocuments, IPatchByIdParams, IPatchParams, IPatchSubdocumentByIdParams, IPatchSubdocumentParams, ISoftDeleteParams, ISoftDeleteSubdocumentParams, IUpdateByIdParams, IUpdateParams, ModelType as MongoosModel, SubmodelType } from './interfaces';
export declare class GenericMongooseCrudService<ModelType extends object = object, DocumentType extends MongoosModel<ModelType> = MongoosModel<ModelType>, UserType extends object = object> {
    get db(): Db;
    readonly events: EventEmitter;
    protected readonly eventsCreate: string;
    protected readonly eventsDelete: string;
    protected readonly eventsPatch: string;
    protected readonly model: Model<DocumentType>;
    constructor(model?: Model<DocumentType>);
    addSubdocument<SubdocumentType extends object>(params: IAddSubdocumentParams<ModelType, SubdocumentType, UserType>): Promise<SubmodelType<SubdocumentType>>;
    count(filter?: HintedFilter<ModelType>): Promise<number>;
    countSubdocuments<SubdocumentType extends object>(params: ICountSubdocumentsParams<ModelType, SubdocumentType>): Promise<number>;
    create(params: ICreateParams<ModelType, UserType>): Promise<DocumentType>;
    get(params: IGetParams<ModelType>): Promise<DocumentType>;
    getById(params: IGetByIdParams<ModelType>): Promise<DocumentType>;
    getSubdocument<SubdocumentType extends object>(params: IGetSubDocumentParams<ModelType, SubdocumentType>): Promise<SubmodelType<SubdocumentType>>;
    getSubdocumentById<SubdocumentType extends object>(params: IGetSubDocumentByIdParams<ModelType>): Promise<SubmodelType<SubdocumentType>>;
    hardDelete(params: IHardDeleteParams): Promise<DocumentType>;
    hardDeleteSubdocument<SubdocumentType extends object>(params: IHardDeleteSubdocumentParams<ModelType, SubdocumentType, UserType>): Promise<SubmodelType<SubdocumentType>>;
    hardDeleteSubdocumentById<SubdocumentType extends object>(params: IHardDeleteSubdocumentByIdParams<ModelType, UserType>): Promise<SubmodelType<SubdocumentType>>;
    list(params?: IListParams<ModelType>): Promise<Array<DocumentType>>;
    listAndCount(params?: IListParams<ModelType>): Promise<{
        count: number;
        data: Array<DocumentType>;
    }>;
    listSubdocuments<SubdocumentType extends object>(params: IListSubdocuments<ModelType, SubdocumentType>): Promise<Array<SubmodelType<SubdocumentType>>>;
    patch(params: IPatchParams<ModelType, UserType>): Promise<DocumentType>;
    patchById(params: IPatchByIdParams<ModelType, UserType>): Promise<DocumentType>;
    patchSubdocument<SubdocumentType extends object>(params: IPatchSubdocumentParams<ModelType, SubdocumentType, UserType>): Promise<SubmodelType<SubdocumentType>>;
    patchSubdocumentById<SubdocumentType extends object>(params: IPatchSubdocumentByIdParams<ModelType, SubdocumentType, UserType>): Promise<SubmodelType<SubdocumentType>>;
    softDelete(params: ISoftDeleteParams<UserType>): Promise<DocumentType>;
    softDeleteSubdocument<SubdocumentType extends object>(params: ISoftDeleteSubdocumentParams<ModelType, UserType>): Promise<SubmodelType<SubdocumentType>>;
    startSession(options?: SessionOptions): Promise<ClientSession>;
    update(params: IUpdateParams<ModelType, UserType>): Promise<DocumentType>;
    updateById(params: IUpdateByIdParams<ModelType, UserType>): Promise<DocumentType>;
    withTransaction<T = any>(fn: WithTransactionCallback<T>, sessionOptions?: SessionOptions): Promise<T>;
    protected formatQueryForAggregation(input: IDynamicObject, field: string): IDynamicObject;
    protected formatQueryForSubdocuments(input: IDynamicObject, field: string): IDynamicObject;
    protected formatUpdateForSubdocuments(input: IDynamicObject, field: string): IDynamicObject;
    protected getDefaultLimit(): number;
    protected getDefaultUpdate(user?: UserType): IDynamicObject;
    protected getDeletedDefaultFilter(): {
        $ne: true;
    };
    protected handleMongoError(callback: Function): any;
    protected merge<Input = object>(doc: Input, newDoc: Partial<Input>): Input;
    protected now(): Date;
}
