import EventBusMeta from '../bus/EventBusMeta';
import {isFunction} from 'lodash';
import {ISubscribeOptions} from '../bus/ISubscribeOptions';

/**
 * Subscribe a method for listening for some class fired by eventbus
 *
 * ```
 * export class SomeClass {
 *
 *   @subscribe(GreatEvent)
 *   onEvent(event: GreatEvent){
 *     .. do great things ..
 *   }
 *
 * }
 * ```
 *
 * The function can be also used directly to register some event on the fly.
 *
 * ```
 * ...
 * const instance = new SomeClass();
 * subscribe(GreatEvent)(instance, 'myMethod');
 * unsubcribe(instance, GreatEvent 'myMethod');
 * ...
 * ```
 * @param options
 */
export function subscribe(options: ISubscribeOptions): Function;
export function subscribe(eventClass: Function, configuration?: string): Function;
// tslint:disable-next-line:unified-signatures
export function subscribe(eventClass: Function, configuration: string, configurationOptions?: any): Function;
export function subscribe(eventClass: Function | ISubscribeOptions, configuration: string = 'default',
                          configurationOptions: any = null): Function {
  return function (object: Function, methodName: string, value: any) {
    // can be used as annotation or directly for a special object
    const target = value && object.constructor ? object.constructor : object;
    if (isFunction(eventClass)) {
      EventBusMeta.$().register({
        type: 'subscribe',
        target: target,
        methodName: methodName,
        eventClass: eventClass,
        configuration: configuration,
        configurationOptions: configurationOptions
      });
    } else {
      const options: ISubscribeOptions = <ISubscribeOptions>eventClass;
      EventBusMeta.$().register({
        type: 'subscribe',
        target: target,
        methodName: methodName,
        eventClass: options.eventClass,
        configuration: options.configuration ? options.configuration : 'default',
        configurationOptions: options.configurationOptions ? options.configurationOptions : null
      });
    }
  };
}


export function unsubscribe(target: Function | any, eventClass: Function, method: string) {
  EventBusMeta.$().unregister(target, eventClass, method);
}
