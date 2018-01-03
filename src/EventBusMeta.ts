import * as _ from 'lodash'

import {IEventListenerDef} from "./IEventListenerDef";
import {ISubscriberInfo} from "./ISubscriberInfo";


export interface IEventDef {
  namespace: string
  clazz: Function
}

export default class EventBusMeta {

  private static self: EventBusMeta;

  private $events: IEventDef[] = [];

  private $types: IEventListenerDef[] = [];


  static $() {
    if (!this.self) {
      this.self = new EventBusMeta()
    }
    return this.self
  }


  public getClassForNamespace(ns: string): Function {
    let c = _.find(this.$events, {namespace: ns})
    if (c) {
      return c.clazz;
    }
    return null;
  }


  public getNamespacesForEvent(o: any): string[] {
    let ns: string[] = [];
    for (let $t of this.$events) {
      if (o instanceof $t.clazz) {
        ns.push($t.namespace)
      }
    }
    return _.uniq(ns)
  }


  public register(options: IEventListenerDef) {
    options.namespace = _.kebabCase(options.eventClass.name).replace(/\-/g, '_');
    this.$types.push(options);
    this.registerEventClass(options.eventClass);
  }


  public registerEventClass(clazz: any) {
    let ns = _.kebabCase(clazz.name).replace(/\-/g, '_');
    let e: IEventDef = {
      namespace: ns,
      clazz: clazz
    }

    let exists = _.find(this.$events, {namespace: ns})
    if (!exists) {
      this.$events.push(e)
    }
    return e;

  }

  public getSubscriberInfo(o: any): ISubscriberInfo[] {
    let list: ISubscriberInfo[] = [];
    for (let i = 0; i < this.$types.length; i++) {
      let $t = this.$types[i];
      if (o instanceof $t.target) {
        list.push({
          namespace: $t.namespace,
          method: $t.methodName,
          configuration: $t.configuration,
          configurationOptions: $t.configurationOptions
        })
      }
    }
    return list
  }


}
