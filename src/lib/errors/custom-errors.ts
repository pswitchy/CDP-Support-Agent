export class CDPError extends Error {
    constructor(message: string, public code: string) {
      super(message);
      this.name = 'CDPError';
    }
  }
  
  export class InvalidQueryError extends CDPError {
    constructor(message: string) {
      super(message, 'INVALID_QUERY');
    }
  }
  
  export class NonCDPQueryError extends CDPError {
    constructor() {
      super('This question is not related to CDP platforms. Please ask CDP-related questions only.', 'NON_CDP_QUERY');
    }
  }