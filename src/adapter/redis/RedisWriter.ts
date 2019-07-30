import {RedisClient} from 'redis';
import {EventEmitter} from 'events';
import {IReader} from '../IReader';
import * as _ from 'lodash';
import {IMessage} from '../IMessage';
import {C_ANY, E_PSUBSCRIBE} from './RedisConstants';
import {IRedisOptions} from './IRedisOptions';
import {Serializer} from '../../utils/Serializer';


export class RedisWriter extends EventEmitter implements IReader {

  client: RedisClient;

  options: IRedisOptions;

  constructor(options: IRedisOptions) {
    super();
    const _options = _.clone(options);
    this.options = options['writer'] ? _.merge(_options, _options['writer']) : _options;
  }

  async close(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.client.quit((err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }


  open(): any {
    this.client = new RedisClient(this.options);
    this.client.on(E_PSUBSCRIBE, function (...args: any[]) {
      console.log('subscribe', args);
    });

  }


  publish(message: IMessage, channel: string = C_ANY) {
    return new Promise((resolve, reject) => {

      if (!_.isString(message.message)) {
        message.message = Serializer.serialize(message.message);
      }

      this.client.publish(message.topic + '::' + channel, message.message, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });

  }
}
