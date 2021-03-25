"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DuplicateKeyException {
    constructor(mongoError) {
        const [collection, index, key] = mongoError.errmsg.match(/collection: (.+) index: (.+) dup key: (.+)/).splice(1);
        this.message = mongoError.errmsg;
        this.code = DuplicateKeyException.code;
        this.collection = collection;
        this.index = index;
        this.key = key && typeof key !== 'object' ? JSON.parse(key) : key;
    }
}
exports.DuplicateKeyException = DuplicateKeyException;
DuplicateKeyException.code = 'DUPLICATE_KEY';
class DocumentNotFoundException {
    constructor(resourceType, resourceId) {
        this.code = DocumentNotFoundException.code;
        this.message = DocumentNotFoundException.message;
        this.code = DocumentNotFoundException.code;
        this.message = DocumentNotFoundException.message;
        this.resourceId = resourceId;
        this.resourceType = resourceType;
    }
}
exports.DocumentNotFoundException = DocumentNotFoundException;
DocumentNotFoundException.code = 'DOCUMENT_NOT_FOUND';
DocumentNotFoundException.message = 'The requested document was not found';
//# sourceMappingURL=exceptions.js.map