export class BadRequestError extends Error {
    statusCode: number;
    constructor(message: string) {
      super(message);
      this.statusCode = 400;
      this.name = 'BadRequestError';
    }
  }
  
  export class NotFoundError extends Error {
    statusCode: number;
    constructor(message: string) {
      super(message);
      this.statusCode = 404;
      this.name = 'NotFoundError';
    }
  }

  export class ForbiddenError extends Error {
    statusCode: number;
    constructor(message: string) {
      super(message);
      this.statusCode = 403;
      this.name = 'ForbiddenError';
    }
  }