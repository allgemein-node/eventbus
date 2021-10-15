import {EventEmitter} from 'events';
import {RedisClient} from 'redis';
import {IRedisOptions} from './IRedisOptions';
import {E_ERROR, E_READY} from './RedisConstants';
import {get} from 'lodash';


export abstract class AbstractRedisConnection extends EventEmitter {

  inc = 0;

  private client: RedisClient;

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
        this.client = await this.connect();
      } else {
        throw new Error('no client found');
      }
    }
    return this.client;
  }

  connect(): Promise<RedisClient> {
    if (this.ready) {
      return Promise.resolve(this.client);
    }

    this.ready = false;
    let tmp: (err: Error) => void = null;

    return new Promise((resolve, reject) => {
      tmp = (err: Error) => {
        err.message = err.message + ' (#connect)';
        reject(err);
      };
      const client = new RedisClient(this.options);
      client.once(E_ERROR, tmp);
      client.once(E_READY, () => {
        this.ready = true;
        client.removeListener(E_ERROR, tmp);
        if (get(this.options, 'unref', false)) {
          client.unref();
        }
        client.on(E_ERROR, this.onError.bind(this));
        resolve(client);
      });
    });
  }


  quit(): Promise<void> {
    if (!this.ready) {
      return Promise.resolve();
    }
    if (!this.client) {
      return Promise.resolve();
    }
    this.ready = false;
    return new Promise<void>((resolve, reject) => {
      this.client.quit((err, reply) => {
        this.client.end(false);
        this.client = null;
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }


  onError(err: Error) {
    // need restart!
    this.ready = false;
    if (this.client) {
      this.client.removeAllListeners();
    }
    this.client = null;

    err.message = err.message + ' (#onError ' + this.constructor.name + ')';
    console.error(err);
    // TODO check reopen?

  }

}
