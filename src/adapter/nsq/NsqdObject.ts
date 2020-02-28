import {EventEmitter} from 'events';
import {IPseudoObject} from '../../bus/IPseudoObject';
import {CryptUtils} from 'commons-base/libs/utils/CryptUtils';

import {NsqdEventBusAdapter} from './NsqdEventBusAdapter';
import {INsqPubMessage} from './INsqPubMessage';
import Timer = NodeJS.Timer;
import {Serializer} from '../../utils/Serializer';


export class NsqdObject implements IPseudoObject {

  id: string;
  uuid: string;
  object: any;
  adapter: NsqdEventBusAdapter;
  emitter: EventEmitter;
  error: Error = null;
  result: any = null;

  constructor(adapter2: NsqdEventBusAdapter, eventID: string, object: any) {
    this.uuid = CryptUtils.shorthash(Date.now() + '');

    this.id = eventID;
    this.object = object;
    this.adapter = adapter2;
    this.emitter = this.adapter.getEmitter();
    this.emitter.once(this.id + '_' + this.uuid + '_done', (err: Error, res: any) => {
      this.result = res;
      this.error = err;
      // TODO maybe we need results from multiple nodes? We should collect node number and subscriptions! Currently we need one or none ...
      this.emitter.removeAllListeners(this.id + '_' + this.uuid + '_done');
    });

  }

  async fire() {
    const writer = await this.adapter.getPublisher();

    const _msp = {
      source: this.adapter.nodeId,
      uuid: this.uuid,
      status: 'work',
      event: this.id,
      object: this.object
    };

    const msg: INsqPubMessage = {
      topic: this.adapter.name,
      message: Serializer.serialize(_msp)
      // message: _msp
    };


    await writer.publish(msg);
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
