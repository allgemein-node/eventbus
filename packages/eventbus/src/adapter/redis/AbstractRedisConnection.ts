import {EventEmitter} from 'events';
import {createClient, RedisClientType} from 'redis';
import {IRedisOptions} from './IRedisOptions';
import {get} from 'lodash';


export abstract class AbstractRedisConnection extends EventEmitter {

  inc = 0;

  private client: RedisClientType;

  options: IRedisOptions;

  ready: boolean = false;

  errored: boolean = false;

  constructor(options: IRedisOptions) {
    super();
    this.options = options;
  }

  isOpened() {
    return this.ready;
  }

  async getClient(connect: boolean = true) {
    if (!this.client) {
      if (connect) {
        this.client = (await this.connect()) as RedisClientType;
      } else {
        throw new Error('No redis client found.');
      }
    }
    return this.client;
  }

  async connect() {
    if (this.ready) {
      return Promise.resolve(this.client);
    }

    this.ready = false;
    // let tmp: (err: Error) => void = null;
    // return new Promise((resolve, reject) => {
    //   tmp = (err: Error) => {
    //     err.message = err.message + ' (#connect)';
    //     reject(err);
    //   };
    //   const client = new RedisClient(this.options);
    //   client.once(E_ERROR, tmp);
    //   client.once(E_READY, () => {
    //     this.ready = true;
    //     client.removeListener(E_ERROR, tmp);
    //     if (get(this.options, 'unref', false)) {
    //       client.unref();
    //     }
    //     client.on(E_ERROR, this.onError.bind(this));
    //     resolve(client);
    //   });
    // });
    let url = this.options.url;
    if (!url) {
      // redis://alice:foobared@awesome.redis.server:6380
      let host = '';
      if (this.options.host) {
        host += this.options.host;
      } else {
        host += 'localhost';
      }

      if (this.options.port) {
        host += ':' + this.options.port;
      } else {
        host += ':6379';
      }

      let user = '';
      if (this.options.username && this.options.password) {
        user += this.options.username + ':' + this.options.password;
      }

      if (user) {
        url = 'redis://' + user + '@' + host;
      } else {
        url = 'redis://' + host;
      }

      this.options.url = url;
    }

    // console.log(this.constructor.name + ' connect ' + this.inc + ' ' + this.options.url);
    const client = createClient(this.options);
    try {
      await client.connect();
      this.ready = true;
      if (get(this.options, 'unref', false)) {
        client.unref();
      }
      // console.log(this.constructor.name + ' connected ' + this.inc + ' ' + this.options.url);
    } catch (err) {
      this.ready = false;
      // if (this.client) {
      //   this.client.removeAllListeners();
      // }
      this.client = null;
      err.message = err.message + ' (#onError ' + this.constructor.name + ')';
      throw err;
    }
    return client;
  }


  async quit(): Promise<void> {
    // console.log(this.constructor.name + ' close');
    if (!this.ready) {
      return Promise.resolve();
    }
    if (!this.client) {
      return Promise.resolve();
    }
    this.ready = false;

    const c = (this.client as RedisClientType);
    await c.quit();
    this.client = null;
  }


}
