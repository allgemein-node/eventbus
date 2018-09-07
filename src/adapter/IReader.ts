import {EventEmitter} from 'events';
export interface IReader extends EventEmitter{
  open(): any;

  close(): void;
}
