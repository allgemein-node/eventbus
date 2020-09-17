import {IReader} from '../IReader';
import * as _ from 'lodash';
import {Serializer} from '../../utils/Serializer';
import {AbstractMqttConnection} from './AbstractMqttConnection';
import {IMqttOptions} from './IMqttOptions';
import {IMqttMessage} from './IMqttMessage';


export class MqttReader extends AbstractMqttConnection implements IReader {


  topic = 'any';

  /**
   * identifies the instance (nodeId)
   */

  channel: string;

  redisChannel: string;


  constructor(topic: string, channel: string, options: IMqttOptions) {
    super(options);
    // this.channel = channel;
    // this.topic = topic;
    // const _options = _.clone(options);
    // this.options = options['reader'] ? _.merge(_options, _options['reader']) : _options;
  }


  async close(): Promise<void> {
    const client = await this.getClient(false);
    return new Promise<void>(async (resolve, reject) => {
      // try {
      //   client.punsubscribe();
      // } catch (e) {
      // }
      //
      // try {
      //   await this.quit();
      //   resolve();
      // } catch (e) {
      //   reject(e);
      // }
    });
  }

  async open() {
    if (this.ready) {
      return this.channel;
    }

    const client = await this.getClient();
    return new Promise((resolve, reject) => {
      // client.psubscribe(this.topic + '::*', (err, channel) => {
      //   if (err) {
      //     err.message = err.message + ' (#open / subscribe)';
      //     console.error(err);
      //     reject(err);
      //   } else {
      //     client.on(E_PMESSAGE, this.onPMessage.bind(this));
      //     this.ready = true;
      //     this.redisChannel = channel;
      //     resolve(channel);
      //   }
      // });
    });
  }


  subscribe(callback: (msg: IMqttMessage) => void) {
    // this.on('message', callback);
  }




}
