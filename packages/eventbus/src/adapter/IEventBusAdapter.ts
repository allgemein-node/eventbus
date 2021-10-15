import {IEventBusConfiguration} from '../bus/IEventBusConfiguration';
import {IPseudoObject} from '../bus/IPseudoObject';
import {EventEmitter} from 'events';

export interface IEventBusAdapter {

  readonly nodeId: string;

  readonly name: string;

  readonly clazz: Function;

  readonly options: IEventBusConfiguration;

  getEmitter(): EventEmitter;

  publish(object: any): Promise<IPseudoObject>;

  subscribe(fn: Function): void;

  unsubscribe(): void;

  isSubscribed(): boolean;

  close(): void;
}
