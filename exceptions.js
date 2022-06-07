export class ApiException {
    constructor(message) {
        this.message = message;
    }
}

export class UserException {
    constructor(message) {
        this.message = message;
    }
}

export class PoolException {
    constructor (query, message) {
        this.query = query;
        this.message = message;
    }
}