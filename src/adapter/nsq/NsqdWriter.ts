import * as nsqjs from 'nsqjs';
import {ConnectionConfigOptions} from 'nsqjs';

import {EventEmitter} from 'events';
import {INsqdWriter} from './INsqdWriter';
import {INsqPubMessage} from './INsqPubMessage';
import {ERROR, READY} from './Constants';


export class NsqdWriter extends EventEmitter implements INsqdWriter {

  writer: nsqjs.Writer;

  options: ConnectionConfigOptions;

  host: string;

  port: number;

  ready: boolean = false;

  constructor(host: string, port: number, options?: ConnectionConfigOptions) {
    super();
    this.host = host;
    this.port = port;
    this.options = options;
  }

  isOpened(): boolean {
    return this.ready;
  }

  open(): Promise<nsqjs.Writer> {
    return new Promise((resolve, reject) => {
      try {
        this.writer = new nsqjs.Writer(this.host, this.port, this.options);
        const binding = (err: Error) => {
          reject(err);
        };
        this.writer.once(ERROR, binding);
        this.writer.once(READY, () => {
          this.writer.removeListener(ERROR, binding);
          resolve(this.writer);
        });
        this.writer.connect();
        this.ready = true;
      } catch (err) {
        reject(err);
      }
    });
  }


  close(): Promise<{}> {
    this.ready = false;
    const self = this;
    return new Promise((resolve, reject) => {
      self.writer.once(nsqjs.Writer.CLOSED, (err: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
      this.writer.close();
    });
  }

  publish(message: INsqPubMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      this.writer.publish(message.topic, message.message, (err: Error) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

}
