import {ISubscribeOptions} from './ISubscribeOptions';

export interface IEventListenerDef extends ISubscribeOptions {
  type: string;

  namespace?: string;

  target: Function | any;

  methodName: string;
}
