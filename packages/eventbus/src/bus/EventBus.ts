import EventBusMeta from './EventBusMeta';
import {EventChannel} from './EventChannel';
import {EventBusConfiguration} from './EventBusConfiguration';
import {IEventBusConfiguration} from './IEventBusConfiguration';
import {CryptUtils} from '@allgemein/base/utils/CryptUtils';
import {EventBusAdapterFactory} from '../adapter/EventBusAdapterFactory';
import {isEmpty, set, values} from 'lodash';
import {K_TTL} from '../Constants';


const DEFAULT_OPTIONS: IEventBusConfiguration = {
  name: 'default',
  adapter: 'default',
  extra: {
    maxListener: 1000
  }
};

export class EventBus {


  constructor() {
    this.nodeId = CryptUtils.shorthash(Date.now() + CryptUtils.random(8));
    this.addConfiguration(DEFAULT_OPTIONS);
  }


  static get namespaces() {
    return Object.keys(this.$().channels);
  }

  private static self: EventBus = null;

  private configurations: { [k: string]: EventBusConfiguration } = {};

  private readonly nodeId: string;

  private inc: number = 0;

  private channels: { [k: string]: EventChannel } = {};


  static $() {
    if (!this.self) {
      this.self = new EventBus();
    }
    return this.self;
  }


  static async register(o: any) {
    // support multiple subsriber in one class
    const infos = EventBusMeta.$().getSubscriberInfo(o);
    if (isEmpty(infos)) {
      throw new Error('registration went wrong');
    }

    for (const info of infos) {
      const channel = await this.$().getOrCreateChannel(info.namespace, info.configuration, info.configurationOptions);
      await channel.register(o, info.method, this.$().nodeId);
    }
  }


  static async unregister(o: any) {
    const infos = EventBusMeta.$().getSubscriberInfo(o);
    if (!isEmpty(infos)) {
      for (const info of infos) {
        let channel = await this.$().getOrCreateChannel(info.namespace);
        channel.unregister(o);
        if (channel.size === 0) {
          channel = this.$().channels[info.namespace];
          await channel.close();
          delete this.$().channels[info.namespace];
        }
      }
    }
  }

  private static postOnChannel(namespace: string, o: any, options?: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      const channel = await this.$().getOrCreateChannel(namespace,
        options && options.configuration ? options.configuration : 'default',
        options && options.configurationOptions ? options.configurationOptions : null);
      try {
        const res = await channel.post(o, options);
        resolve(res);
      } catch (e) {
        reject(e);
      }
    });
  }


  static post(o: any, options?: any): Promise<any[]> {
    // TODO check is supported type?
    let info = EventBusMeta.$().getNamespacesForEvent(o);
    if (isEmpty(info)) {
      const eventDef = EventBusMeta.$().registerEventClass(o.constructor);
      info = [eventDef.namespace];
    }

    if (info.length) {
      this.$().inc++;
    }

    const promises: Promise<any>[] = [];
    for (const _namespace of info) {
      promises.push(this.postOnChannel(_namespace, o, options));
    }
    return Promise.all(promises);
  }


  static postAndForget(o: any, options?: any): Promise<any> {
    options = options || {};
    set(options, K_TTL, 0);
    return this.post(o, options);
  }


  /**
   * cls must inherit the AbstractEventBusAdapter class
   *
   * @param cls
   * @param name
   */
  static registerAdapter(cls: Function, name?: string) {
    EventBusAdapterFactory.$().register(cls);

  }

  static unregisterAdapter(name_or_cls: Function | string) {
    EventBusAdapterFactory.$().unregister(name_or_cls);
  }

  addConfiguration(cfg: IEventBusConfiguration): EventBusConfiguration {
    const cfgImpl = new EventBusConfiguration(this, cfg);
    this.configurations[cfgImpl.name] = cfgImpl;
    return cfgImpl;
  }


  private getConfiguration(name: string = 'default') {
    if (!this.configurations[name]) {
      throw new Error('no configuration for adapter ' + name);
    }
    return this.configurations[name];
  }


  getChannel(name: string) {
    if (!this.channels[name]) {
      return null;
    }
    return this.channels[name];
  }

  private async getOrCreateChannel(name: string, configName?: string, configOpts?: any) {
    if (!this.channels[name]) {
      const config = this.getConfiguration(configName);
      const clazz = EventBusMeta.$().getClassForNamespace(name);
      const adapter = config.createAdapter(this.nodeId, name, clazz, configOpts);
      const channel = new EventChannel(this.nodeId, name, adapter);
      this.channels[name] = channel;
    }
    return this.channels[name];
  }

  async shutdown() {
    await Promise.all(values(this.channels).map(c => c.close()));
    EventBus.self = null;
  }

}
