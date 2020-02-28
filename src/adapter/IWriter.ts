import {EventEmitter} from 'events';
import {IMessage} from './IMessage';

export interface IWriter extends EventEmitter {
  open(): any;

  close(): void;

  publish(msg: IMessage): void;

}
