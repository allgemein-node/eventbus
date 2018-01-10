import {EventEmitter} from 'events';
export interface INsqdReader extends EventEmitter{
  open(): any;

  close(): void;
}
