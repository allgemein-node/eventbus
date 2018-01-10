import * as _ from 'lodash';
import {EventEmitter} from 'events';
import {IEventBusAdapter} from '../IEventBusAdapter';

import {NsqdObject} from './NsqdObject';

import {IEventBusConfiguration, IPseudoObject} from '../../';
import {INsqSubMessage} from './INsqSubMessage';
import {INsqPubMessage} from './INsqPubMessage';
import {INsqdReader} from './INsqdReader';
import {INsqdWriter} from './INsqdWriter';




export class NsqdEventBusAdapter implements IEventBusAdapter {

  static ADAPTER_NAME = 'nsq';

  readonly nodeId: string;

  readonly name: string;

  readonly clazz: Function;

  readonly options: IEventBusConfiguration;

  private emitter: EventEmitter = new EventEmitter();



  private reader: INsqdReader = null;

  private writer: INsqdWriter = null;

  private static NsqdReader:Function;

  private static NsqdWriter:Function;


  constructor(nodeId: string, name: string, clazz: Function, options: any) {
    this.options = options;
    this.nodeId = nodeId;
    this.name = name;
    this.clazz = clazz;
    this.emitter.setMaxListeners(1000);

    this.loadDependencies();
  }


  loadDependencies() {
    try {
      require('nsqjs');
      NsqdEventBusAdapter.NsqdReader = require('./NsqdReader').NsqdReader;
      NsqdEventBusAdapter.NsqdWriter = require('./NsqdWriter').NsqdWriter;
    } catch (err) {
      let msg = 'EventBus adapter nsqjs can\'t be loaded, because modul nsqjs is not installed. :(';
      console.error(msg);
      throw new Error(msg);
    }
  }

  getEmitter() {
    return this.emitter;
  }

  async getSubscriber(): Promise<INsqdReader> {
    if (this.reader) return this.reader;
    this.reader = Reflect.construct(NsqdEventBusAdapter.NsqdReader, [this.name, this.nodeId, this.options.extra.reader]);
    try {
      this.reader.on('message', this.onMessage.bind(this));
      await this.reader.open();
    } catch (err) {
      throw err;
    }
    return this.reader;
  }


  async getPublisher(): Promise<INsqdWriter> {
    if (this.writer) return this.writer;
    this.writer = Reflect.construct(NsqdEventBusAdapter.NsqdWriter,[this.options.extra.writer.host, this.options.extra.writer.port]);
    try {
      await this.writer.open();
    } catch (err) {
      throw err;
    }
    return this.writer;
  }


  onMessage(message: INsqSubMessage) {
    let data = message.body;
    if (_.has(data, 'status')) {
      if (data.status === 'work') {
        this.emitter.emit(this.eventID(), data.uuid, data);
      } else if (data.status === 'done') {
        this.emitter.emit([this.eventID(), data.uuid, 'done'].join('_'), data.error, data.result);
      }
    } else if (_.has(data, 'source')) {
    }
  }


  private eventID() {
    return [this.nodeId, this.name].join('_');
  }


  async shutdown() {
    await Promise.all([this.writer.close(), this.reader.close()]);
  }


  async publish(object: any): Promise<IPseudoObject> {
    let obj = new NsqdObject(this, this.eventID(), object);
    await obj.fire();
    return obj;
  }


  async subscribe(fn: Function) {
    await this.getSubscriber();
    this.emitter.on(this.eventID(), async (uuid: string, data: any) => {
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

      let msg: INsqPubMessage = {
        topic: this.name,
        message: JSON.stringify(_msp)
      };
      await writer.publish(msg);
    });
  }

  async close() {
    await Promise.all([this.writer.close(), this.reader.close()]);
  }
}

