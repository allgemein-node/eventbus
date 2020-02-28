import * as _ from 'lodash';

import {NsqdObject} from './NsqdObject';

import {INsqSubMessage} from './INsqSubMessage';
import {INsqPubMessage} from './INsqPubMessage';
import {INsqdReader} from './INsqdReader';
import {INsqdWriter} from './INsqdWriter';
import {AbstractEventBusAdapter} from '../AbstractEventBusAdapter';
import {Logger} from 'commons-base';
import {Serializer} from '../../utils/Serializer';
import {IPseudoObject} from '../../bus/IPseudoObject';


export class NsqdEventBusAdapter extends AbstractEventBusAdapter {


  constructor(nodeId: string, name: string, clazz: Function, options: any) {
    super(nodeId, name, clazz, options);

    this.loadDependencies();
    this.getEmitter().on('connect', this.connect.bind(this));
  }

  static ADAPTER_NAME = 'nsq';


  private static NsqdReader: Function;

  private static NsqdWriter: Function;


  _connecting: boolean = false;
  _ready: boolean = false;


  loadDependencies() {
    try {
      require('nsqjs');
      NsqdEventBusAdapter.NsqdReader = require('./NsqdReader').NsqdReader;
      NsqdEventBusAdapter.NsqdWriter = require('./NsqdWriter').NsqdWriter;
    } catch (err) {
      const msg = 'EventBus adapter nsqjs can\'t be loaded, because modul nsqjs is not installed. :(';
      Logger.warn(msg);
      throw new Error(msg);
    }
  }

  async connect() {
    if (!this._connecting) {
      this._connecting = true;
    } else {
      return;
    }
    const sub = await this.getSubscriber();
    const pub = await this.getPublisher();
    try {
      await Promise.all([sub.open(), pub.open()]);
    } catch (err) {
      Logger.error(err.message);
      throw err;
    }
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


  async getSubscriber(): Promise<INsqdReader> {
    if (this.reader) { return this.reader; }
    this.reader = Reflect.construct(NsqdEventBusAdapter.NsqdReader,
      [this.name, this.nodeId, this.options.extra.reader]);
    this.reader.on('message', this.onMessage.bind(this));
    return this.reader;
  }


  async getPublisher(): Promise<INsqdWriter> {
    if (this.writer) { return this.writer; }
    this.writer = Reflect.construct(NsqdEventBusAdapter.NsqdWriter,
      [this.options.extra.writer.host, this.options.extra.writer.port]);

    return this.writer;
  }


  onMessage(message: INsqSubMessage) {
    const data = message.body;
    if (_.has(data, 'status')) {
      if (data.status === 'work') {
        this.getEmitter().emit(this.eventID(), data.uuid, data);
      } else if (data.status === 'done') {
        this.getEmitter().emit([this.eventID(), data.uuid, 'done'].join('_'), data.error, data.result);
      }
    } else if (_.has(data, 'source')) {
    }
  }


  async publish(object: any): Promise<IPseudoObject> {
    await this.open();
    const obj = new NsqdObject(this, this.eventID(), object);
    await obj.fire();
    return obj;
  }


  async subscribe(fn: Function) {
    await this.open();
    this.getEmitter().on(this.eventID(), async (uuid: string, data: any) => {
      let res = null;
      let err = null;
      try {
        res = await fn(data.object);
      } catch (err2) {
        err = err2;
      }
      const writer = await this.getPublisher();
      const _msp = {
        source: this.nodeId,
        dest: data.source,
        status: 'done',
        uuid: uuid,
        event: data.event,
        result: res,
        error: err
      };

      const msg: INsqPubMessage = {
        topic: this.name,
        message: Serializer.serialize(_msp)
      };
      await writer.publish(msg);
    });
  }

}

