import {IPseudoObject} from './IPseudoObject';
import {IEventBusAdapter} from '../adapter/IEventBusAdapter';
import {CryptUtils} from '@allgemein/base';
import {clearTimeout, setTimeout} from 'timers';

export abstract class AbstractPseudoObject<T extends IEventBusAdapter> implements IPseudoObject {


  eventID: string;
  uuid: string;
  object: any;
  adapter: T;
  error: Error = null;
  result: any = null;
  timer: any = null;


  constructor(adapter: T, eventID: string, object: any) {
    this.uuid = CryptUtils.shorthash(Date.now() + '');
    this.eventID = eventID;
    this.object = object;
    this.adapter = adapter;
    this.adapter.getEmitter().once(this.listenerEventName(), (err: Error, res: any) => {
      this.result = res;
      this.error = err;
      this.reset();
    });

  }


  waitForResult(ttl: number = 10000): Promise<any> {
    return new Promise(async (resolve, reject) => {

      if (ttl > 0) {
        this.timer = setTimeout(() => {
          this.reset();
          reject(new Error('ttl ' + ttl + ' passed'));
        }, ttl);
      }

      if (this.result) {
        this.reset();
        resolve(this.result);
      } else if (this.error) {
        this.reset();
        reject(this.error);
      } else {
        this.adapter.getEmitter().once(this.listenerEventName(), (err: Error, res: any) => {
          this.reset();
          if (err) {
            reject(err);
          } else {
            resolve(res);
          }
        });
      }
    });
  }


  listenerEventName(type: string = 'done') {
    return [this.eventID, this.uuid, type].join('_');
  }

  reset() {
    this.adapter.getEmitter().removeAllListeners(this.listenerEventName());
    clearTimeout(this.timer);
    this.object = null;
  }

}
