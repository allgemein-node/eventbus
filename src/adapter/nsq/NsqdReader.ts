import * as nsqjs from 'nsqjs';

import {EventEmitter} from 'events';
import {INsqSubMessage} from './INsqSubMessage';
import {INsqdReader} from './INsqdReader';


const MESSAGE = 'message';
const DISCARD = 'discard';
const ERROR = 'error';
const CONNECTION_ERROR = 'connection_error';
const NSQD_CONNECTED = 'nsqd_connected';
const NSQD_CLOSED = 'nsqd_closed';


export class NsqdReader extends EventEmitter implements INsqdReader {
  options: nsqjs.ReaderConnectionConfigOptions;

  reader: nsqjs.Reader;

  inc: number = 0;

  topic: string;

  channel: string;

  constructor(topic: string, chanel: string, options: nsqjs.ReaderConnectionConfigOptions) {
    super();
    this.topic = topic;
    this.channel = chanel;
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
        let binding = (err: Error) => {
          reject(err);
        };
        this.reader.once(ERROR, binding);
        this.reader.once(CONNECTION_ERROR, binding);
        this.reader.once(NSQD_CONNECTED, () => {
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
    let self = this;
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

      let tm_str = message.timestamp.toString();
      let timestamp = parseInt(message.timestamp.toString().substr(0, tm_str.length - 6));
      let timestamp_sub = parseInt(message.timestamp.toString().substr((tm_str.length - 6)));


      let data: INsqSubMessage = {
        id: message.id,
        body: message.json(),
        timestamp: timestamp,
        timestamp_sub: timestamp_sub,
        receivedOn: message['receivedOn'],
        lastTouched: message['lastTouched'],
        touchCount: message['touchCount']
      };

      this.emit('message', data);
      //message.touch();

      message.finish();
    } catch (err) {
      // TODO Throw error!
    }
  }


  private onDiscard(message: nsqjs.Message): void {
    this.emit('discard', message);
  }


  onError(err: Error): void {
    /*
    TODO handle error
        if (err) {
          return Log.error(err.message);
        }
        */
  }


}
