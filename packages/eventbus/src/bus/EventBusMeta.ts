import * as _ from 'lodash';

import {IEventListenerDef} from './IEventListenerDef';
import {ISubscriberInfo} from './ISubscriberInfo';


export interface IEventDef {
  namespace: string;
  clazz: Function;
}

export default class EventBusMeta {

  private static self: EventBusMeta;

  private $events: IEventDef[] = [];

  private $types: IEventListenerDef[] = [];


  static $() {
    if (!this.self) {
      this.self = new EventBusMeta();
    }
    return this.self;
  }

  static toNamespace(clazz: Function | string) {
    let clazzName: string = null;
    if (!_.isString(clazz)) {
      clazzName = clazz.name;
    } else {
      clazzName = clazz;
    }
    return _.kebabCase(clazzName).replace(/\-/g, '_');
  }


  public getClassForNamespace(ns: string): Function {
    const c = _.find(this.$events, {namespace: ns});
    if (c) {
      return c.clazz;
    }
    return null;
  }


  public getNamespacesForEvent(o: any): string[] {
    const ns: string[] = [];
    for (const $t of this.$events) {
      if (o instanceof $t.clazz) {
        ns.push($t.namespace);
      }
    }
    return _.uniq(ns);
  }

  /**
   * Remove subscriber information
   *
   * @param target
   * @param eventClass
   * @param method
   */
  public unregister(target: Function | any, eventClass: Function, method: string) {
    const namespace = EventBusMeta.toNamespace(eventClass);
    _.remove(this.$types, x => x.namespace === namespace && x.methodName === method && x.target === target);
  }


  /**
   * Add subsriber information
   * @param options
   */
  public register(options: IEventListenerDef) {
    options.namespace = EventBusMeta.toNamespace(options.eventClass);
    const exists = this.$types.find(x =>
      x.namespace === options.namespace && x.methodName === options.methodName && x.target === options.target);
    if (!exists) {
      this.$types.push(options);
    }
    this.registerEventClass(options.eventClass);
  }


  public registerEventClass(clazz: any) {
    const ns = EventBusMeta.toNamespace(clazz);
    const e: IEventDef = {
      namespace: ns,
      clazz: clazz
    };

    const exists = _.find(this.$events, x => x.namespace === ns);
    if (!exists) {
      this.$events.push(e);
    }
    return e;
  }


  findEvent(name: string) {
    return _.find(this.$events, e => e.namespace === name || e.clazz.name === name);
  }


  /**
   * Return subsriber informations for class of object o or driectly for object o
   * @param o
   */
  public getSubscriberInfo(o: any): ISubscriberInfo[] {
    const list: ISubscriberInfo[] = [];
    for (let i = 0; i < this.$types.length; i++) {
      const $t = this.$types[i];
      if ((_.isFunction($t.target) && o instanceof $t.target) || $t.target === o) {
        list.push({
          namespace: $t.namespace,
          method: $t.methodName,
          configuration: $t.configuration,
          configurationOptions: $t.configurationOptions
        });
      }
    }
    return list;
  }


}
