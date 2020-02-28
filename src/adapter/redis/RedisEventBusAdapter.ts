import {IMessage} from '../IMessage';
import {AbstractEventBusAdapter} from '../AbstractEventBusAdapter';
import {RedisObject} from './RedisObject';
import * as _ from 'lodash';
import {IRedisReader} from './IRedisReader';
import {IRedisWriter} from './IRedisWriter';
import {Logger} from 'commons-base';
import {Serializer} from '../../utils/Serializer';
import {IPseudoObject} from '../../bus/IPseudoObject';


export class RedisEventBusAdapter extends AbstractEventBusAdapter {

  static ADAPTER_NAME = 'redis';


  private static Reader: Function;

  private static Writer: Function;

  reader: IRedisReader;

  writer: IRedisWriter;


  constructor(nodeId: string, name: string, clazz: Function, options: any) {
    super(nodeId, name, clazz, options);
    this.loadDependencies();
    this.getEmitter().on('connect', this.connect.bind(this));
  }


  _connecting: boolean = false;
  _ready: boolean = false;

  async connect() {
    if (!this._connecting) {
      this._connecting = true;
    } else {
      return;
    }
    const sub = await this.getSubscriber();
    await sub.open();
    this.getEmitter().emit('ready');
    this._ready = true;
  }

  async open() {
    if (!this._connecting) {
      this.getEmitter().emit('connect');
    }
    if (this._ready) {
      return null;
    }
    return new Promise((resolve, reject) => {
      this.getEmitter().once('ready', resolve);
    });
  }

  loadDependencies() {
    try {
      if (!RedisEventBusAdapter.Reader && !RedisEventBusAdapter.Writer) {
        require('redis');
        RedisEventBusAdapter.Reader = require('./RedisReader').RedisReader;
        RedisEventBusAdapter.Writer = require('./RedisWriter').RedisWriter;
      }
    } catch (err) {
      const msg = 'EventBus adapter redis can\'t be loaded, because modul redis is not installed. :(';
      Logger.warn(msg);
      throw new Error(msg);
    }
  }


  async getSubscriber(): Promise<IRedisReader> {
    if (this.reader) {
      return this.reader;
    }

    this.reader = Reflect.construct(RedisEventBusAdapter.Reader,
      [this.name, this.nodeId, this.options.extra]);
    try {
      this.reader.subscribe(this.onMessage.bind(this));
    } catch (err) {
      throw err;
    }
    return this.reader;
  }


  async getPublisher(): Promise<IRedisWriter> {
    if (this.writer) {
      return this.writer;
    }
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
    const data = message.message;
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
    await this.open();
    const obj = new RedisObject(this, this.eventID(), object);
    await obj.fire();
    return obj;
  }


  async subscribe(fn: Function): Promise<void> {
    await this.open();
    this.getEmitter().on(this.eventID(), async (uuid: string, data: any) => {
      let res = null;
      let err = null;
      try {
        res = await fn(data.object);
      } catch (err2) {
        err = err2;
      }
      const writer: IRedisWriter = await this.getPublisher();
      const _msp = {
        source: this.nodeId,
        dest: data.source,
        status: 'done',
        uuid: uuid,
        event: data.event,
        result: res,
        error: err
      };

      const msg: IMessage = {
        topic: this.name,
        message: Serializer.serialize(_msp)
      };
      await writer.publish(msg, data.source);
    });
  }

}
