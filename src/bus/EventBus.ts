import * as _ from 'lodash';
import EventBusMeta from "./EventBusMeta";
import {EventChannel} from "./EventChannel";
import {EventBusConfiguration} from "./EventBusConfiguration";
import {IEventBusConfiguration} from "./IEventBusConfiguration";
import {CryptUtils} from '../utils/CryptUtils';
import {DefaultEventBusAdapter} from "../adapter/default/DefaultEventBusAdapter";


const DEFAULT_OPTIONS: IEventBusConfiguration = {
  name: 'default',
  adapter: DefaultEventBusAdapter,
  extra: {
    maxListener: 1000
  }
};


EventBusConfiguration.register(DefaultEventBusAdapter);



export class EventBus {

  private static self: EventBus = null;

  private configurations: { [k: string]: EventBusConfiguration } = {};

  private readonly nodeId: string;

  private inc: number = 0;

  private channels: { [k: string]: EventChannel } = {};


  constructor() {
    this.nodeId = CryptUtils.shorthash(Date.now() + CryptUtils.random(8))
    this.addConfiguration(DEFAULT_OPTIONS);
  }


  addConfiguration(cfg: IEventBusConfiguration): EventBusConfiguration {
    let cfgImpl = new EventBusConfiguration(this, cfg);
    this.configurations[cfgImpl.name] = cfgImpl;
    return cfgImpl;
  }


  static $() {
    if (!this.self) {
      this.self = new EventBus()
    }
    return this.self;
  }


  static get namespaces() {
    return Object.keys(this.$().channels)
  }


  private getConfiguration(name: string = 'default') {
    if (!this.configurations[name]) {
      throw new Error('no configuration for adapter ' + name);
    }
    return this.configurations[name];
  }


  private async getOrCreateChannel(name: string, configName?: string, configOpts?: any) {
    if (!this.channels[name]) {
      let config = this.getConfiguration(configName);
      let clazz = EventBusMeta.$().getClassForNamespace(name);
      let channel = new EventChannel(this.nodeId, name, config.createAdapter(this.nodeId, name, clazz, configOpts));
      this.channels[name] = channel;
    }
    return this.channels[name];
  }


  static async register(o: any) {
    // support multiple subsriber in one class
    let infos = EventBusMeta.$().getSubscriberInfo(o);
    if (_.isEmpty(infos)) {
      throw new Error('registration went wrong')
    }

    for (let info of infos) {
      let channel = await this.$().getOrCreateChannel(info.namespace, info.configuration, info.configurationOptions);
      channel.register(o, info.method, this.$().nodeId);
    }
  }


  static async unregister(o: any) {
    let infos = EventBusMeta.$().getSubscriberInfo(o);
    if (_.isEmpty(infos)) {
      throw new Error('registration went wrong')
    }

    for (let info of infos) {
      let channel = await this.$().getOrCreateChannel(info.namespace);
      channel.unregister(o);
      if (channel.size == 0) {
        channel = this.$().channels[info.namespace];
        await channel.close();
        delete this.$().channels[info.namespace]
      }
    }
  }


  private static postOnChannel(namespace: string, o: any, options?: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      let channel = await this.$().getOrCreateChannel(namespace,
        options && options.configuration ? options.configuration : 'default',
        options && options.configurationOptions ? options.configurationOptions : null);
      try {
        let res = await channel.post(o, options);
        resolve(res)
      } catch (e) {
        reject(e)
      }
    })
  }


  static post(o: any, options?: any): Promise<any> {
    // TODO check is supported type?
    let self = this;
    let info = EventBusMeta.$().getNamespacesForEvent(o);
    if (_.isEmpty(info)) {
      let eventDef = EventBusMeta.$().registerEventClass(o.constructor);
      info = [eventDef.namespace]
    }

    if (info.length) {
      self.$().inc++
    }

    let promises: Promise<any>[] = [];
    for (let _namespace of info) {
      promises.push(self.postOnChannel(_namespace, o, options))
    }
    return Promise.all(promises)
  }

  async shutdown(){
    for(let c in this.channels){
      let channel = this.channels[c];
      await channel.close();
    }
  }

  static postAndForget(o: any, options?: any): Promise<any> {
    options = options || {}
    _.set(options, 'ttl', 0);
    return this.post(o, options);
  }

}
