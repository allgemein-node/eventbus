import * as _ from 'lodash';
import {EventEmitter} from 'events';
import {IMqttOptions} from './IMqttOptions';
import {connect, MqttClient} from 'mqtt';

// import {E_ERROR, E_READY} from './MqttConstants';


export abstract class AbstractMqttConnection extends EventEmitter {

  inc = 0;

  options: IMqttOptions;

  ready: boolean = false;

  client: MqttClient;

  constructor(options: IMqttOptions) {
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
      const client = connect(this.options.url, this.options);
      client.on(E_ERROR, tmp);
      client.on(E_CONNECT, () => {
        client.removeListener(E_ERROR, tmp);
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
    const disconnectOpts = _.get(this.options, 'disconnect', {force: true, options: {}});
    return new Promise<void>((resolve, reject) => {
      this.client.end(disconnectOpts.force, disconnectOpts.options, () => {
        resolve();
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
