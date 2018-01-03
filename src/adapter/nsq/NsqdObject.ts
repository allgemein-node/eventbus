import {INSQPubMessage} from './INSQPubMessage';
import {EventEmitter} from 'events';
import {IPseudoObject} from '../../IPseudoObject';
import {CryptUtils} from '../../utils/CryptUtils';
import Timer = NodeJS.Timer;
import {NsqdEventBusAdapter} from './NsqdEventBusAdapter';



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
    })

  }

  async fire() {
    let sub = await this.adapter.getSubscriber();
    let writer = await this.adapter.getPublisher();

    let _msp = {
      source: this.adapter.nodeId,
      uuid: this.uuid,
      status: 'work',
      event: this.id,
      object: this.object
    };

    let msg: INSQPubMessage = {
      topic: this.adapter.name,
      message: JSON.stringify(_msp)
    };

    await writer.publish(msg);
  }


  waitForResult(ttl: number = 10000): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let timer:Timer = null;

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
            reject(err)
          } else {
            resolve(res)
          }
        });
      }
    })
  }
}
