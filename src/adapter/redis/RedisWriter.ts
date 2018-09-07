import {ClientOpts, RedisClient} from 'redis';
import {EventEmitter} from 'events';
import {IReader} from '../IReader';
import * as _ from 'lodash';
import {IMessage} from '../IMessage';
import {E_MESSAGE, E_SUBSCRIBE} from './RedisConstants';

export class RedisWriter extends EventEmitter implements IReader {

  client: RedisClient;

  options: ClientOpts;

  constructor(options: any) {
    super();
    let _options = _.clone(options);
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
    this.client.on(E_SUBSCRIBE, function (...args:any[]){
      console.log('subscribe',args);
    });

    console.log('open writer');
  }

  publish(message: IMessage) {
    console.log('writer.publish',message);
    return new Promise((resolve, reject) => {
      this.client.publish(message.topic, message.message,(err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      })
    })

  }
}
