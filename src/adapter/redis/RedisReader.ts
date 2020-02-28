import {IReader} from '../IReader';
import {EventEmitter} from 'events';
import {RedisClient} from 'redis';
import * as _ from 'lodash';
import {IMessage} from '../IMessage';
import {E_PMESSAGE} from './RedisConstants';
import {IRedisOptions} from './IRedisOptions';
import {IRedisMessage} from './IRedisMessage';
import {Serializer} from '../../utils/Serializer';


export class RedisReader extends EventEmitter implements IReader {

  inc = 0;

  client: RedisClient;

  options: IRedisOptions;

  topic = 'any';

  /**
   * identifies the instance (nodeId)
   */

  channel: string;

  ready = false;


  constructor(topic: string, channel: string, options: IRedisOptions) {
    super();
    this.channel = channel;
    this.topic = topic;
    const _options = _.clone(options);
    this.options = options['reader'] ? _.merge(_options, _options['reader']) : _options;
  }


  async close(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.client.punsubscribe();
      } catch (e) {
      }
      this.client.quit((err, reply) => {
        this.ready = false;
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   Subscriber Events
   If a client has subscriptions active, it may emit these events:

   "message" (channel, message)
   Client will emit message for every message received that matches an active subscription. Listeners are passed the channel name as channel and the message as message.

   "pmessage" (pattern, channel, message)
   Client will emit pmessage for every message received that matches an active subscription pattern. Listeners are passed the original pattern used with PSUBSCRIBE as pattern, the sending channel name as channel, and the message as message.

   "message_buffer" (channel, message)
   This is the same as the message event with the exception, that it is always going to emit a buffer. If you listen to the message event at the same time as the message_buffer, it is always going to emit a string.

   "pmessage_buffer" (pattern, channel, message)
   This is the same as the pmessage event with the exception, that it is always going to emit a buffer. If you listen to the pmessage event at the same time as the pmessage_buffer, it is always going to emit a string.

   "subscribe" (channel, count)
   Client will emit subscribe in response to a SUBSCRIBE command.
   Listeners are passed the channel name as channel and the new count
   of subscriptions for this client as count.

   "psubscribe" (pattern, count)
   Client will emit psubscribe in response to a PSUBSCRIBE command.
   Listeners are passed the original pattern as pattern, and the new
   count of subscriptions for this client as count.

   "unsubscribe" (channel, count)
   Client will emit unsubscribe in response to a UNSUBSCRIBE command. Listeners are passed the channel name as channel and the new count of subscriptions for this client as count. When count is 0, this client has left subscriber mode and no more subscriber events will be emitted.

   "punsubscribe" (pattern, count)
   Client will emit punsubscribe in response to a PUNSUBSCRIBE command. Listeners are passed the channel name as channel and the new count of subscriptions for this client as count. When count is 0, this client has left subscriber mode and no more subscriber events will be emitted.
   */
  open(): any {
    if (this.ready) {
      return this.channel;
    }
    return new Promise((resolve, reject) => {
      this.client = new RedisClient(this.options);
      this.client.psubscribe(this.topic + '::*', (err, channel) => {
        if (err) {
          reject(err);
        } else {
          this.client.on(E_PMESSAGE, this.onPMessage.bind(this));
          this.ready = true;
          resolve(channel);
        }
      });

    });
  }

  subscribe(callback: (msg: IRedisMessage) => void) {
    this.on('message', callback);
  }


  private onPMessage(pattern: string, channel: string, message: string | any): void {
    try {
      message = Serializer.deserialize(message);
    } catch (e) {
      console.log(e);
    }

    try {
      const [topic, receiver] = channel.split('::');
      if (receiver !== '__any__') {
        if (this.channel !== receiver) {
          // not for me
          return;
        }
      }

      this.inc++;

      const tm_str = (new Date()).getTime() + '';
      const timestamp = parseInt(tm_str.toString().substr(0, tm_str.length - 3), 0);
      const timestamp_sub = parseInt(tm_str.toString().substr((tm_str.length - 3)), 0);


      const data: IRedisMessage = {
        // receiver: this.channel,
        // sender: message.sender,
        timestamp: timestamp,
        timestamp_sub: timestamp_sub,
        topic: topic,
        message: message
      };

      this.emit('message', data);
    } catch (err) {
      // TODO Throw error!
    }
  }


  // /*
  //   private onMessage(topic: string, message: string | any): void {
  //     try {
  //       message = JSON.parse(message);
  //     } catch (e) {
  //     }
  //
  //     try {
  //       if (message.receiver && message.receiver !== this.channel) {
  //         // not for me
  //         return;
  //       }
  //
  //       this.inc++;
  //
  //       let tm_str = (new Date()).getTime() + '';
  //       let timestamp = parseInt(tm_str.toString().substr(0, tm_str.length - 3));
  //       let timestamp_sub = parseInt(tm_str.toString().substr((tm_str.length - 3)));
  //
  //
  //       let data: IRedisMessage = {
  //         receiver: this.channel,
  //         sender: message.sender,
  //         timestamp: timestamp,
  //         timestamp_sub: timestamp_sub,
  //         topic: topic,
  //         message: message
  //       };
  //
  //       this.emit('message', data);
  //     } catch (err) {
  //       // TODO Throw error!
  //     }
  //   }
  // */

  private onDiscard(message: IMessage): void {
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
