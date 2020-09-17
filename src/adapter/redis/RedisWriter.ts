import * as _ from 'lodash';
import {IMessage} from '../IMessage';
import {C_ANY, E_PSUBSCRIBE} from './RedisConstants';
import {IRedisOptions} from './IRedisOptions';
import {Serializer} from '../../utils/Serializer';
import {AbstractRedisConnection} from './AbstractRedisConnection';
import {IWriter} from '../IWriter';


export class RedisWriter extends AbstractRedisConnection implements IWriter {


  constructor(options: IRedisOptions) {
    super(options);
    const _options = _.clone(options);
    this.options = options['writer'] ? _.merge(_options, _options['writer']) : _options;
  }


  async open() {
    const client = await this.getClient();
    client.on(E_PSUBSCRIBE, function (...args: any[]) {
      console.log('subscribe', args);
    });
  }


  async publish(message: IMessage, channel: string = C_ANY) {
    if (!_.isString(message.message)) {
      message.message = Serializer.serialize(message.message);
    }

    const client = await this.getClient();
    return new Promise((resolve, reject) => {
      client.publish(message.topic + '::' + channel, message.message, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }


  async close(): Promise<void> {
    await this.quit();
  }
}
