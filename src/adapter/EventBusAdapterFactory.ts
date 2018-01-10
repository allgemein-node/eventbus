import * as _ from 'lodash';
import {DefaultEventBusAdapter} from './default/DefaultEventBusAdapter';
import {NsqdEventBusAdapter} from './nsq/NsqdEventBusAdapter';
import {IEventBusConfiguration} from '../bus/IEventBusConfiguration';


export class EventBusAdapterFactory {

  create(type: string | Function,nodeId: string, name: string, clazz: Function, options: IEventBusConfiguration) {
    if(_.isString(type)){
      switch (type) {
        case 'nsq':
          return new NsqdEventBusAdapter(nodeId,name,clazz,options);
        default:
          return new DefaultEventBusAdapter(nodeId,name,clazz,options);
      }

    }else{
      let _obj = Reflect.construct(type, [nodeId,name,clazz,options]);
      return _obj;
    }
  }


}
