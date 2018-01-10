import {EventEmitter} from 'events';
import {IPseudoObject} from '../../bus/IPseudoObject';
import {CryptUtils} from '../../utils/CryptUtils';
import {clearTimeout, setTimeout} from 'timers';
import Timer = NodeJS.Timer;


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
