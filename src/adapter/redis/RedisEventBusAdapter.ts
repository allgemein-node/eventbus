import {IPseudoObject} from '../..';
import {IReader} from '../IReader';
import {IWriter} from '../IWriter';
import {IMessage} from '../IMessage';
import {AbstractEventBusAdapter} from '../AbstractEventBusAdapter';
import {RedisObject} from './RedisObject';
import {INsqPubMessage} from '../nsq/INsqPubMessage';
import * as _ from 'lodash';


export class RedisEventBusAdapter extends AbstractEventBusAdapter {

  static ADAPTER_NAME = 'redis';



  private static Reader: Function;

  private static Writer: Function;


  constructor(nodeId: string, name: string, clazz: Function, options: any) {
    super(nodeId, name, clazz, options);
    this.loadDependencies();
  }


  loadDependencies() {
    try {
      require('redis');
      RedisEventBusAdapter.Reader = require('./RedisReader').RedisReader;
      RedisEventBusAdapter.Writer = require('./RedisWriter').RedisWriter;

    } catch (err) {
      let msg = 'EventBus adapter redis can\'t be loaded, because modul redis is not installed. :(';
      console.error(msg);
      throw new Error(msg);
    }
  }


  async getSubscriber(): Promise<IReader> {
    if (this.reader) return this.reader;
    this.reader = Reflect.construct(RedisEventBusAdapter.Reader,
      [this.name, this.nodeId, this.options.extra]);
    try {
      this.reader.on('message', this.onMessage.bind(this));
      await this.reader.open();
    } catch (err) {
      throw err;
    }
    return this.reader;
  }


  async getPublisher(): Promise<IWriter> {
    if (this.writer) return this.writer;
    this.writer = Reflect.construct(RedisEventBusAdapter.Writer,
      [this.options.extra]);
    try {
      await this.writer.open();
    } catch (err) {
      throw err;
    }
    return this.writer;
  }

  onMessage(message: IMessage) {
    let data = message.body;
    if (_.has(data, 'status')) {
      if (data.status === 'work') {
        this.getEmitter().emit(this.eventID(), data.uuid, data);
      } else if (data.status === 'done') {
        this.getEmitter().emit(
          [this.eventID(), data.uuid, 'done'].join('_'), data.error, data.result);
      }
    } else if (_.has(data, 'source')) {
    }
  }


  async publish(object: any): Promise<IPseudoObject> {
    let obj = new RedisObject(this, this.eventID(), object);
    await obj.fire();
    return obj;
  }

  async subscribe(fn: Function): Promise<void> {
    await this.getSubscriber();
    this.getEmitter().on(this.eventID(), async (uuid: string, data: any) => {
      let res = null;
      let err = null;
      try {
        res = await fn(data.object);
      } catch (err2) {
        err = err2;
      }
      let writer = await this.getPublisher();
      let _msp = {
        source: this.nodeId,
        dest: data.source,
        status: 'done',
        uuid: uuid,
        event: data.event,
        result: res,
        error: err
      };

      let msg: IMessage = {
        topic: this.name,
        message: JSON.stringify(_msp)
      };
      await writer.publish(msg);
    });

  }

}
