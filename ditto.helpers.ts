export interface CounterDocument {
    id: number;
    _id: number;
    value: number;
    isDeleted?: boolean;
  }
  
 export const mockCounterDocument = {
    id: 1111,
    _id: 1111,
    value: 0,
    isDeleted: false,
  };
  
 export const COLLECTION_NAME = 'counter';