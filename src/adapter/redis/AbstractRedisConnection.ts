import * as _ from 'lodash';
import {EventEmitter} from 'events';
import {RedisClient} from 'redis';
import {IRedisOptions} from './IRedisOptions';
import {E_ERROR, E_READY} from './RedisConstants';


export abstract class AbstractRedisConnection extends EventEmitter {

  inc = 0;

  private client: RedisClient;

  options: IRedisOptions;

  ready: boolean = false;

  constructor(options: IRedisOptions) {
    super();
    this.options = options;
  }

  isOpened() {
    return this.ready;
  }

  getClient(connect: boolean = true) {
    if (connect) {
      return this.connect();
    }
    if (this.client) {
      return this.client;
    }
    throw new Error('no client found');
  }

  async connect() {
    if (this.ready) {
      return this.client;
    }

    this.ready = false;
    let tmp: (err: Error) => void = null;

    this.client = await new Promise((resolve, reject) => {
      tmp = (err: Error) => {
        err.message = err.message + ' (#connect)';
        reject(err);
      };
      const client = new RedisClient(this.options);
      client.on(E_ERROR, tmp);
      client.on(E_READY, () => {
        client.removeListener(E_ERROR, tmp);
        if (_.get(this.options, 'unref', false)) {
          client.unref();
        }
        client.on(E_ERROR, this.onError.bind(this));
        resolve(client);
      });
    });
    this.ready = true;
    return this.client;
  }


  async quit(): Promise<void> {
    if (!this.ready) {
      return;
    }
    this.ready = false;
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


  onError(err: Error) {
    // need restart!
    this.ready = false;
    this.client = null;
    err.message = err.message + ' (#onError ' + this.constructor.name + ')';
    console.error(err);
    // TODO check reopen?

  }

}
