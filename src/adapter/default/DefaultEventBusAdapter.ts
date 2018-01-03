import {IEventBusAdapter} from '../IEventBusAdapter';
import {EventEmitter} from 'events';
import {IEventBusConfiguration} from '../../bus/IEventBusConfiguration';
import {IPseudoObject} from '../../bus/IPseudoObject';
import {CryptUtils} from '../../utils/CryptUtils';
import {setTimeout, clearTimeout} from 'timers';
import Timer = NodeJS.Timer;

const DEFAULT_MAX_LISTENER = 1000;


export class EmitterObject implements IPseudoObject {

  id: string;
  uuid: string;
  object: any;
  emitter: EventEmitter;
  error: Error = null;
  result: any = null;


  constructor(emitter: EventEmitter, id: string, object: any) {
    this.uuid = CryptUtils.shorthash(Date.now() + '');
    this.id = id;
    this.object = object;
    this.emitter = emitter;
    this.emitter.once(this.id + '_' + this.uuid + '_done', (err: Error, res: any) => {
      this.result = res;
      this.error = err;
      this.emitter.removeAllListeners(this.id + '_' + this.uuid + '_done');
    });
    this.emitter.emit(this.id, this.uuid, this.object);
  }


  waitForResult(ttl: number = 10000): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let timer: Timer = null;

      if (ttl > 0) {
        timer = setTimeout(() => {
          this.emitter.removeAllListeners(this.id + '_' + this.uuid + '_done');
          reject(new Error('ttl ' + ttl + ' passed'));
        }, ttl);
      }

      if (this.result) {
        clearTimeout(timer);
        resolve(this.result);
      } else if (this.error) {
        clearTimeout(timer);
        reject(this.error);
      } else {
        this.emitter.once(this.id + '_' + this.uuid + '_done', (err: Error, res: any) => {
          clearTimeout(timer);
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      }
    });
  }
}

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
