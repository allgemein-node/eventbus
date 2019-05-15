import "reflect-metadata";
import EventBusMeta from "../bus/EventBusMeta";
import {isFunction} from "lodash";
import {ISubscribeOptions} from "../bus/ISubscribeOptions";


export function subscribe( options: ISubscribeOptions) : Function;
export function subscribe( eventClass:Function,configuration?:string) : Function;
export function subscribe( eventClass:Function,configuration:string,configurationOptions?:any) : Function;
export function subscribe( eventClass:Function | ISubscribeOptions, configuration:string = 'default', configurationOptions:any = null) : Function{
  return function(object:Function, methodName:string){
    if(isFunction(eventClass)){
      EventBusMeta.$().register({
        type:'subscribe',
        target:object.constructor,
        methodName:methodName,
        eventClass:eventClass,
        configuration:configuration,
        configurationOptions:configurationOptions
      });
    }else{
      let options:ISubscribeOptions = <ISubscribeOptions>eventClass;
      EventBusMeta.$().register({
        type:'subscribe',
        target:object.constructor,
        methodName:methodName,
        eventClass:options.eventClass,
        configuration:options.configuration ? options.configuration : 'default',
        configurationOptions:options.configurationOptions ? options.configurationOptions : null
      });
    }
  }
}
