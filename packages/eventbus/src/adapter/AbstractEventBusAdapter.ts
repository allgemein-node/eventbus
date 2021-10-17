import {IEventBusAdapter} from './IEventBusAdapter';
import {IReader} from './IReader';
import {IWriter} from './IWriter';
import {EventEmitter} from 'events';
import {IEventBusConfiguration} from '../bus/IEventBusConfiguration';
import {IPseudoObject} from '../bus/IPseudoObject';


export abstract class AbstractEventBusAdapter extends EventEmitter implements IEventBusAdapter {
  readonly clazz: Function;
  readonly name: string;
  readonly nodeId: string;
  readonly options: IEventBusConfiguration;


  protected _subscribed: boolean = false;

  protected reader: IReader;

  protected writer: IWriter;


  constructor(nodeId: string, name: string, clazz: Function, options: any) {
    super();
    this.options = options;
    this.nodeId = nodeId;
    this.name = name;
    this.clazz = clazz;
    this.getEmitter().setMaxListeners(10000);
  }


  getEmitter() {
    return this;
  }

  abstract publish(object: any): Promise<IPseudoObject>;

  abstract subscribe(fn: Function): void;

  unsubscribe() {
    this.getEmitter().removeAllListeners(this.eventID());
    this._subscribed = false;
  }

  isSubscribed(): boolean {
    return this._subscribed;
  }

  eventID() {
    return [this.nodeId, this.name].join('_');
  }


  shutdown() {
    return this.close();
  }


  close() {
    this.getEmitter().removeAllListeners();
    const close = [];
    if (this.reader) {
      close.push(this.reader);
    }
    if (this.writer) {
      close.push(this.writer);
    }
    if (close.length > 0) {
      return Promise.all(close.map(x => x.close()));
    }
    return null;

  }


  cleanup() {
    // this.
  }
}
