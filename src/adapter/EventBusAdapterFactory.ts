import * as _ from 'lodash';
import {DefaultEventBusAdapter} from './default/DefaultEventBusAdapter';
import {NsqdEventBusAdapter} from './nsq/NsqdEventBusAdapter';
import {IEventBusConfiguration} from '../bus/IEventBusConfiguration';
import {RedisEventBusAdapter} from './redis/RedisEventBusAdapter';


export class EventBusAdapterFactory {

  private static $self: EventBusAdapterFactory;

  private busTypes: {[k: string]: Function} = {};

  static $() {
    if (!this.$self) {
      this.$self = new EventBusAdapterFactory();
    }
    return this.$self;
  }

  private constructor() {
    this.register(NsqdEventBusAdapter);
    this.register(RedisEventBusAdapter);
  }

  register(clazz: Function) {
    this.busTypes[clazz['ADAPTER_NAME']] = clazz;
  }


  create(type: string | Function, nodeId: string, name: string, clazz: Function, options: IEventBusConfiguration) {
    if (_.isString(type)) {
      if (_.has(this.busTypes, type)) {
        const _type = this.busTypes[type];
        return Reflect.construct(_type, [nodeId, name, clazz, options]);
      } else {
        return new DefaultEventBusAdapter(nodeId, name, clazz, options);
      }

    } else {
      return Reflect.construct(type, [nodeId, name, clazz, options]);
    }
  }


}
