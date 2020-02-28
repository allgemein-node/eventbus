import * as nsqjs from 'nsqjs';

import {EventEmitter} from 'events';
import {INsqSubMessage} from './INsqSubMessage';
import {INsqdReader} from './INsqdReader';
import {Logger} from 'commons-base';
import {CONNECTION_ERROR, DISCARD, ERROR, MESSAGE, NSQD_CLOSED, READY} from './Constants';
import {Serializer} from '../../utils/Serializer';


export class NsqdReader extends EventEmitter implements INsqdReader {
  options: nsqjs.ReaderConnectionConfigOptions;

  reader: nsqjs.Reader;

  inc = 0;

  topic: string;

  channel: string;

  constructor(topic: string, channel: string, options: nsqjs.ReaderConnectionConfigOptions) {
    super();
    this.topic = topic;
    this.channel = channel;
    this.options = options;
  }


  async initialize(): Promise<any> {
    await this.open();
    return null;
  }


  open(): Promise<nsqjs.Reader> {
    return new Promise((resolve, reject) => {
      try {
        this.reader = new nsqjs.Reader(this.topic, this.channel, this.options);
        const binding = (err: Error) => {
          reject(err);
        };
        this.reader.once(ERROR, binding);
        this.reader.once(CONNECTION_ERROR, binding);
        this.reader.once(READY, () => {
          this.reader.removeListener(nsqjs.Reader.ERROR, binding);
          this.reader.removeListener(CONNECTION_ERROR, binding);
          this.reader.on(MESSAGE, this.onMessage.bind(this));
          this.reader.on(DISCARD, this.onDiscard.bind(this));
          this.reader.on(ERROR, this.onError.bind(this));
          resolve(this.reader);
        });
        this.reader.connect();
      } catch (err) {
        reject(err);
      }
    });
  }


  close(): Promise<{}> {
    const self = this;
    return new Promise((resolve, reject) => {
      self.reader.once(NSQD_CLOSED, () => {
        resolve();
      });
      self.reader.once(ERROR, (err: Error) => {
        reject(err);
      });
      self.reader.close();
    });
  }


  private onMessage(message: nsqjs.Message): void {
    try {
      this.inc++;
      const tm_str = message.timestamp.toString();
      const timestamp = parseInt(message.timestamp.toString().substr(0, tm_str.length - 6), 0);
      const timestamp_sub = parseInt(message.timestamp.toString().substr((tm_str.length - 6)), 0);


      const data: INsqSubMessage = {
        id: message.id,
        body: Serializer.deserialize(message.body.toString()),
        // body: message.body.toString(),
        timestamp: timestamp,
        timestamp_sub: timestamp_sub,
        receivedOn: message['receivedOn'],
        lastTouched: message['lastTouched'],
        touchCount: message['touchCount'],
        topic: null,
        message: null
      };

      this.emit('message', data);
      // message.touch();

      message.finish();
    } catch (err) {
      Logger.error(err.message);
      // TODO Throw error!
    }
  }


  private onDiscard(message: nsqjs.Message): void {
    this.emit('discard', message);
  }


  onError(err: Error): void {
    Logger.error(err.message);
  }


}
