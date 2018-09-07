import * as _ from 'lodash';


import {IEventBusConfiguration} from './IEventBusConfiguration';
import {IEventBusAdapter} from '../adapter/IEventBusAdapter';
import {EventBus} from './EventBus';
import {EventBusAdapterFactory} from '../adapter/EventBusAdapterFactory';


export class EventBusConfiguration {

  // private static adapters: { [key: string]: Function } = {};

  private readonly configuration: IEventBusConfiguration;

  private readonly _name: string;

  private static factory: EventBusAdapterFactory = EventBusAdapterFactory.$();

  private adapter: string | Function;

  private bus: EventBus;


  constructor(bus: EventBus, cfg: IEventBusConfiguration) {
    this.configuration = cfg;
    if (_.isString(cfg.adapter)) {
      this.adapter = cfg.adapter;
    } else {
      this.adapter = <Function>this.configuration.adapter;
    }
    this._name = cfg.name;
    this.bus = bus;

  }


  get name() {
    return this._name;
  }

  /*
  static register(adapterClass: Function) {
    let name = adapterClass['ADAPTER_NAME'];
    if (_.isString(name)) {
      this.adapters[name] = adapterClass;
    } else {
      throw new Error('can\'t register as adapter ' + adapterClass);
    }
  }

  /*
    static createObjectByType<T>(obj: Function, ...args: any[]): T {
      let _obj: T = Reflect.construct(obj, args);
      return _obj;
    }
  */

  createAdapter(nodeId: string, name: string, clazz: Function, opts?: any): IEventBusAdapter {
    let cfg = _.clone(this.configuration);
    if (opts) {
      if (cfg.extra) {
        cfg.extra = _.merge(cfg.extra, opts);
      } else {
        cfg.extra = opts;
      }
    }

    let grouped = <string>_.get(opts, 'group');
    if (grouped) {
      // if group all have same nodeId!
      nodeId = grouped;
    }

    return EventBusConfiguration.factory.create(this.adapter, nodeId, name, clazz, cfg);
  }

}
