import {EventEmitter} from 'events';
import {INsqPubMessage} from './INsqPubMessage';

export interface INsqdWriter extends EventEmitter{
  open(): any;

  close(): void;

  publish(msg: INsqPubMessage):void;

}
