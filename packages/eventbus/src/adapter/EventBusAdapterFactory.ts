import * as _ from 'lodash';
import {DefaultEventBusAdapter} from './default/DefaultEventBusAdapter';
import {IEventBusConfiguration} from '../bus/IEventBusConfiguration';
import {K_ADAPTER_NAME} from '../Constants';

/**
 *
 * Initialization
 *
 */
export class EventBusAdapterFactory {

  private static $self: EventBusAdapterFactory;

  private busTypes: { [k: string]: Function } = {};

  static $() {
    if (!this.$self) {
      this.$self = new EventBusAdapterFactory();
    }
    return this.$self;
  }

  // private constructor() {
  //   this.register(NsqdEventBusAdapter);
  //   this.register(RedisEventBusAdapter);
  //   this.register(MqttEventBusAdapter);
  // }

  register(clazz: Function, name?: string) {
    if (!name) {
      name = _.get(clazz, K_ADAPTER_NAME, null);
    }

    if (!name) {
      throw new Error('no name given for the adapter class');
    }
    this.busTypes[name] = clazz;

  }

  unregister(cls: string | Function) {

    for (const k of _.keys(this.busTypes)) {
      if (_.isString(cls)) {
        if (k === cls) {
          delete this.busTypes[k];
          break;
        }
      } else if (_.isFunction(cls)) {
        if (this.busTypes[k] === cls) {
          delete this.busTypes[k];
        }
      }
    }
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
