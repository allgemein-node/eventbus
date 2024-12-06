import {IReader} from '../IReader';
import {C_ANY, C_SEP, E_PMESSAGE} from './RedisConstants';
import {IRedisOptions} from './IRedisOptions';
import {IRedisMessage} from './IRedisMessage';
import {Serializer} from '../../utils/Serializer';
import {AbstractRedisConnection} from './AbstractRedisConnection';
import {clone, merge} from 'lodash';


export class RedisReader extends AbstractRedisConnection implements IReader {


  topic = 'any';

  /**
   * identifies the instance (nodeId)
   */

  channel: string;

  redisChannel: string;


  constructor(topic: string, channel: string, options: IRedisOptions) {
    super(options);
    this.channel = channel;
    this.topic = topic;
    const _options = clone(options);
    // @ts-ignore
    this.options = options['reader'] ? merge(_options, _options['reader']) : _options;
  }


  async close(): Promise<void> {
    const client = await this.getClient(false);
    let error = null;
    try {
      await client.pUnsubscribe();
    } catch (err) {
      error = err;
    } finally {
      await this.quit();
    }

    if (error) {
      throw error;
    }

    // return new Promise<void>((resolve, reject) => {
    //   try {
    //
    //     resolve();
    //   } catch (e) {
    //     reject(e);
    //   }
    // }).finally(() => this.quit());
  }

  /**
   Subscriber Events

   If a client has subscriptions active, it may emit these events:

   "message" (channel, message)
   Client will emit message for every message received that matches an active subscription.
   Listeners are passed the channel name as channel and the message as message.

   "pmessage" (pattern, channel, message)
   Client will emit pmessage for every message received that matches an active subscription pattern.
   Listeners are passed the original pattern used with PSUBSCRIBE as pattern, the sending channel name as channel,
   and the message as message.

   "message_buffer" (channel, message)
   This is the same as the message event with the exception, that it is always going to emit a buffer.
   If you listen to the message event at the same time as the message_buffer, it is always going to emit a string.

   "pmessage_buffer" (pattern, channel, message)
   This is the same as the pmessage event with the exception, that it is always going to emit a buffer.
   If you listen to the pmessage event at the same time as the pmessage_buffer, it is always going to emit a string.

   "subscribe" (channel, count)
   Client will emit subscribe in response to a SUBSCRIBE command.
   Listeners are passed the channel name as channel and the new count
   of subscriptions for this client as count.

   "psubscribe" (pattern, count)
   Client will emit psubscribe in response to a PSUBSCRIBE command.
   Listeners are passed the original pattern as pattern, and the new
   count of subscriptions for this client as count.

   "unsubscribe" (channel, count)
   Client will emit unsubscribe in response to a UNSUBSCRIBE command. Listeners are passed the channel name as channel and
   the new count of subscriptions for this client as count. When count is 0, this client has left subscriber mode and
   no more subscriber events will be emitted.

   "punsubscribe" (pattern, count)
   Client will emit punsubscribe in response to a PUNSUBSCRIBE command. Listeners are passed the channel name as channel and
   the new count of subscriptions for this client as count. When count is 0, this client has left subscriber mode and
   no more subscriber events will be emitted.
   */
  async open() {
    if (this.ready) {
      return this.ready;
    }

    this.ready = false;
    const client = await this.getClient();
    try {
      this.ready = true;
      // console.log('reader client open');
      const pattern = this.topic + '::*';
      client.pSubscribe(pattern, (message: string, channel: string) => {
        // client.on(E_PMESSAGE, this.onPMessage.bind(this));
        this.redisChannel = channel;
        this.onPMessage(pattern, channel, message);
      });
    } catch (err) {
      err.message = err.message + ' (#open / subscribe)';
      console.error(err);
      throw err;
    }
    return this.ready;
    // return new Promise((resolve, reject) => {
    //   client.psubscribe(this.topic + '::*', (err, channel) => {
    //     if (err) {
    //       err.message = err.message + ' (#open / subscribe)';
    //       console.error(err);
    //       reject(err);
    //     } else {
    //       client.on(E_PMESSAGE, this.onPMessage.bind(this));
    //       this.ready = true;
    //       this.redisChannel = channel;
    //       resolve(channel);
    //     }
    //   });
    // });
  }


  subscribe(callback: (msg: IRedisMessage) => void) {
    this.on('message', callback);
  }


  private onPMessage(pattern: string, channel: string, message: string | any): void {
    try {
      message = Serializer.deserialize(message);
    } catch (e) {
      console.error(e);
    }

    try {
      const [topic, receiver] = channel.split(C_SEP);
      if (receiver !== C_ANY) {
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
        timestamp: timestamp,
        timestamp_sub: timestamp_sub,
        topic: topic,
        message: message
      };

      this.emit('message', data);
    } catch (err) {
      console.error(err);
    }
  }


}
