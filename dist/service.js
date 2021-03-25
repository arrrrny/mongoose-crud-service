"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const mongodb_1 = require("mongodb");
const mongoose_1 = require("mongoose");
const exceptions_1 = require("./exceptions");
class GenericMongooseCrudService {
    constructor(model) {
        this.events = new events_1.EventEmitter();
        this.eventsCreate = 'CREATED';
        this.eventsDelete = 'DELETED';
        this.eventsPatch = 'PATCH';
        if (model) {
            this.model = model;
        }
    }
    get db() {
        return this.db;
    }
    addSubdocument(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { options = {}, parentId, data = {}, subdocumentField, user } = params;
            const instance = yield this.updateById({
                _id: parentId,
                update: { $push: { [subdocumentField]: Object.assign(Object.assign({}, data), { createdAt: this.now(), createdBy: user }) } },
                user,
                options,
            });
            return instance[subdocumentField].pop();
        });
    }
    count(filter = {}) {
        filter.deleted = filter.deleted ? filter.deleted : { $ne: true };
        return this.model.countDocuments(filter).exec();
    }
    countSubdocuments(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { filter = {}, parentId, subdocumentField } = params;
            const matches = yield this.model.countDocuments({ _id: parentId, deleted: this.getDeletedDefaultFilter() }).exec();
            if (matches <= 0) {
                throw new exceptions_1.DocumentNotFoundException(this.model.modelName, parentId.toString());
            }
            if (filter.deleted === undefined) {
                filter.deleted = this.getDeletedDefaultFilter();
            }
            const transformedFilter = this.formatQueryForAggregation(filter, subdocumentField);
            const aggregration = yield this.model
                .aggregate([
                { $match: { _id: new mongoose_1.mongo.ObjectId(parentId) } },
                { $limit: 1 },
                { $unwind: `$${subdocumentField}` },
                { $match: transformedFilter },
                { $group: { _id: '$_id', [subdocumentField]: { $push: `$${subdocumentField}` } } },
                {
                    $project: {
                        count: { $size: `$${subdocumentField}` },
                    },
                },
            ])
                .exec();
            return aggregration.length > 0 ? aggregration.pop().count : 0;
        });
    }
    create(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { data = {}, options, user } = params;
            const instance = new this.model(Object.assign(Object.assign({}, data), { createdAt: this.now(), createdBy: user }));
            yield this.handleMongoError(() => instance.save(options));
            this.events.emit(this.eventsCreate, instance);
            return instance;
        });
    }
    get(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { filter = {}, projection } = params;
            const conditions = Object.assign({ deleted: this.getDeletedDefaultFilter() }, filter);
            const instance = yield this.model.findOne(conditions, projection).exec();
            if (!instance) {
                throw new exceptions_1.DocumentNotFoundException(this.model.modelName, JSON.stringify(conditions));
            }
            return instance;
        });
    }
    getById(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id, projection } = params;
            return this.get({ filter: { _id: new mongodb_1.ObjectId(_id) }, projection });
        });
    }
    getSubdocument(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { parentId, subdocumentField, filter = {} } = params;
            const conditions = Object.assign({ deleted: this.getDeletedDefaultFilter() }, filter);
            const instance = yield this.model
                .findOne({
                _id: new mongoose_1.mongo.ObjectId(parentId),
                [subdocumentField]: {
                    $elemMatch: conditions,
                },
            }, `${subdocumentField}.$`)
                .exec();
            if (!instance) {
                throw new exceptions_1.DocumentNotFoundException(this.model.modelName, parentId.toString());
            }
            return instance[subdocumentField].pop();
        });
    }
    getSubdocumentById(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { parentId, subdocumentField, subdocumentId } = params;
            return this.getSubdocument({ parentId, subdocumentField, filter: { _id: new mongodb_1.ObjectId(subdocumentId) } });
        });
    }
    hardDelete(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id, session } = params;
            const instance = yield this.model
                .findByIdAndDelete(_id)
                .session(session)
                .exec();
            this.events.emit(this.eventsDelete, instance);
            return instance;
        });
    }
    hardDeleteSubdocument(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { filter = {}, options, parentId, subdocumentField, user } = params;
            const subdocument = yield this.getSubdocument({ parentId, subdocumentField, filter });
            yield this.patchById({ _id: parentId, update: { $pull: { [subdocumentField]: { _id: subdocument._id } } }, user, options });
            return subdocument;
        });
    }
    hardDeleteSubdocumentById(params) {
        const { options, parentId, subdocumentField, subdocumentId, user } = params;
        return this.hardDeleteSubdocument({ parentId, subdocumentField, filter: { _id: subdocumentId }, user, options });
    }
    list(params = {}) {
        const { filter = {}, limit, projection, skip, sort = {} } = params;
        filter.deleted = filter.deleted !== undefined ? filter.deleted : this.getDeletedDefaultFilter();
        return this.model.find(filter, projection, { sort, skip, limit }).exec();
    }
    listAndCount(params = {}) {
        return __awaiter(this, void 0, void 0, function* () {
            const { filter = {} } = params;
            const [data, count] = yield Promise.all([this.list(params), this.count(filter)]);
            return { data, count };
        });
    }
    listSubdocuments(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { filter = {}, limit = this.getDefaultLimit(), parentId, skip = 0, sort = { _id: 1 }, subdocumentField } = params;
            if (filter.deleted === undefined) {
                filter.deleted = this.getDeletedDefaultFilter();
            }
            const transformedSort = this.formatQueryForAggregation(sort, subdocumentField);
            const transformedFilter = this.formatQueryForAggregation(filter, subdocumentField);
            const matches = yield this.model.countDocuments({ _id: parentId, deleted: this.getDeletedDefaultFilter() }).exec();
            if (matches <= 0) {
                throw new exceptions_1.DocumentNotFoundException(this.model.modelName, parentId.toString());
            }
            const expression = `$${subdocumentField}`;
            const aggregration = yield this.model
                .aggregate([
                { $match: { _id: parentId } },
                { $limit: 1 },
                { $unwind: expression },
                { $match: transformedFilter },
                { $group: { _id: '$_id', [subdocumentField]: { $push: expression } } },
                {
                    $project: {
                        [subdocumentField]: {
                            $slice: [expression, skip, limit],
                        },
                    },
                },
                { $sort: transformedSort },
            ])
                .exec();
            return aggregration.length > 0 ? aggregration.pop()[subdocumentField] : [];
        });
    }
    patch(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { filter = {}, options, update, user } = params;
            return this.update({ filter, update: { $set: update }, user, options });
        });
    }
    patchById(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id, options, update, user } = params;
            return this.patch({ filter: { _id: new mongodb_1.ObjectId(_id) }, update, user, options });
        });
    }
    patchSubdocument(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { filter = {}, options, parentId, subdocumentField, update, user } = params;
            const subdocument = yield this.getSubdocument({ parentId, subdocumentField, filter });
            if (!subdocument) {
                throw new exceptions_1.DocumentNotFoundException(subdocumentField, JSON.stringify(filter));
            }
            const finalConditions = { _id: new mongodb_1.ObjectId(parentId), [`${subdocumentField}._id`]: subdocument._id };
            const document = yield this.patch({
                filter: finalConditions,
                update: this.formatUpdateForSubdocuments(update, subdocumentField),
                user,
                options,
            });
            const subList = document[subdocumentField];
            return subList.id(subdocument._id);
        });
    }
    patchSubdocumentById(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { options, parentId, subdocumentField, subdocumentId, update, user } = params;
            return this.patchSubdocument({
                parentId,
                subdocumentField,
                filter: { _id: new mongodb_1.ObjectId(subdocumentId) },
                update,
                user,
                options,
            });
        });
    }
    softDelete(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id, options, user } = params;
            return this.patchById({ _id, update: { deleted: true, deletedAt: this.now(), deletedBy: user }, user, options });
        });
    }
    softDeleteSubdocument(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { parentId, subdocumentField, subdocumentId, user } = params;
            return this.patchSubdocumentById({
                parentId,
                subdocumentField,
                subdocumentId,
                update: { deleted: true, deletedAt: this.now(), deletedBy: user },
                user,
            });
        });
    }
    startSession(options) {
        return this.model.db.startSession(options);
    }
    update(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { filter = {}, options = {}, update, user } = params;
            update.$set = update.$set ? Object.assign(this.getDefaultUpdate(user), update.$set) : this.getDefaultUpdate(user);
            const conditions = Object.assign({ deleted: this.getDeletedDefaultFilter() }, filter);
            const instance = yield this.handleMongoError(() => __awaiter(this, void 0, void 0, function* () {
                return this.model
                    .findOneAndUpdate(conditions, update, Object.assign({ new: true }, options))
                    .session(options.session)
                    .exec();
            }));
            if (!instance) {
                throw new exceptions_1.DocumentNotFoundException(this.model.modelName, JSON.stringify(conditions));
            }
            this.events.emit(this.eventsPatch, instance);
            return instance;
        });
    }
    updateById(params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { _id, options, update, user } = params;
            return this.update({ filter: { _id: new mongodb_1.ObjectId(_id) }, update, user, options });
        });
    }
    withTransaction(fn, sessionOptions) {
        return __awaiter(this, void 0, void 0, function* () {
            const session = yield this.startSession(sessionOptions);
            let result;
            yield session.withTransaction((_session) => __awaiter(this, void 0, void 0, function* () {
                result = yield fn(_session);
                return result;
            }));
            return result;
        });
    }
    formatQueryForAggregation(input, field) {
        const result = {};
        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                result[`${field}.${key}`] = input[key];
            }
        }
        return result;
    }
    formatQueryForSubdocuments(input, field) {
        return Object.keys(input).reduce((result, key) => {
            result[`${field}.${key}`] = input[key];
            return result;
        }, {});
    }
    formatUpdateForSubdocuments(input, field) {
        const finalUpdate = {};
        for (const key in input) {
            if (input.hasOwnProperty(key)) {
                finalUpdate[`${field}.$.${key}`] = input[key];
            }
        }
        return finalUpdate;
    }
    getDefaultLimit() {
        return 2147483647;
    }
    getDefaultUpdate(user) {
        return {
            updatedAt: this.now(),
            updatedBy: user,
        };
    }
    getDeletedDefaultFilter() {
        return { $ne: true };
    }
    handleMongoError(callback) {
        try {
            return callback();
        }
        catch (error) {
            if (error.code === 11000) {
                throw new exceptions_1.DuplicateKeyException(error);
            }
            throw error;
        }
    }
    merge(doc, newDoc) {
        for (const key of Object.keys(newDoc)) {
            doc[key] = newDoc[key];
        }
        return doc;
    }
    now() {
        return new Date();
    }
}
exports.GenericMongooseCrudService = GenericMongooseCrudService;
//# sourceMappingURL=service.js.map