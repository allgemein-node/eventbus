import {IEventBusAdapter} from '../IEventBusAdapter';
import {EventEmitter} from 'events';
import {IEventBusConfiguration} from '../../bus/IEventBusConfiguration';
import {IPseudoObject} from '../../bus/IPseudoObject';
import {EmitterObject} from './EmitterObject';

const DEFAULT_MAX_LISTENER = 1000;



export class DefaultEventBusAdapter extends EventEmitter implements IEventBusAdapter {

  static ADAPTER_NAME = 'default';


  readonly nodeId: string;

  readonly name: string;

  readonly clazz: Function;

  readonly options: IEventBusConfiguration;


  constructor(nodeId: string, name: string, clazz: Function, options: IEventBusConfiguration) {
    super();
    this.nodeId = nodeId;
    this.name = name;
    this.options = options;
    this.clazz = clazz;

    if (options.extra) {
      this.setMaxListeners(options.extra.maxListener ? options.extra.maxListener : DEFAULT_MAX_LISTENER);
    } else {
      this.setMaxListeners(DEFAULT_MAX_LISTENER);
    }
  }


  private eventID() {
    return [this.nodeId, this.name].join('_');
  }


  private id(uuid: string): string {
    return [this.nodeId, this.name, uuid].join('-');
  }


  async publish(object: any): Promise<IPseudoObject> {
    return new EmitterObject(this, this.eventID(), object);
  }


  subscribe(fn: Function): void {
    this.on(this.eventID(), async (uuid: string, object: any) => {
      let res = null;
      let err = null;
      try {
        res = await fn(object);
      } catch (err2) {
        err = err2;
      }
      this.emit(this.eventID() + '_' + uuid + '_done', err, res);
    });
  }

  close() {
    this.removeAllListeners();
  }

}
