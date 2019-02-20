import * as _ from 'lodash'
import {IEventBusAdapter} from "../adapter/IEventBusAdapter";
import {ISubscriber} from "./ISubscriber";


export class EventChannel {

  private remote: boolean = true;

  private inc: number = 0;

  private readonly nodeId: string;

  private readonly name: string;

  private grouped: boolean = false;

  private next: number = 0;

  private subscriber: ISubscriber[] = [];

  private adapter: IEventBusAdapter;


  constructor(nodeId: string, name: string, adapter: IEventBusAdapter) {
    this.nodeId = nodeId;
    this.name = name;
    this.adapter = adapter;
    this.grouped = _.get(this.adapter.options, 'extra.group', null) != null;
  }


  get size() {
    return this.subscriber.length
  }


  private create(o: { object: any, method: string }, obj: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        let res = await o.object[o.method](obj);
        resolve(res)
      } catch (err) {
        reject(err)
      }
    })
  }


  private process(obj: any): Promise<any> {
    let self = this;
    let prms: Promise<any>[] = [];
    let _obj = Reflect.construct(this.adapter.clazz, []);
    _.assign(_obj, obj);
    if (this.subscriber.length > 0) {
      if (!this.grouped) {
        for (let entry of this.subscriber) {
          prms.push(self.create(entry, _obj))
        }
      } else {
        prms.push(self.create(this.subscriber[this.next], _obj))
        this.next++;
        if (this.next >= this.subscriber.length) {
          this.next = 0;
        }
      }
    }
    return Promise.all(prms);
  }


  private id(uuid: string): string {
    return [this.nodeId, this.name, uuid].join('-');
  }


  async register(subscriber: any, method: string, nodeId: string) {
    if (!subscriber[method]) {
      throw new Error('method doesn\'t exists in subscriber object')
    }
    this.subscriber.push({
      nodeId: nodeId,
      object: subscriber,
      method: method
    })
    if (this.subscriber.length === 1) {
      await this.adapter.subscribe(this.process.bind(this));
    }
  }


  unregister(subscriber: any) {
    for (let i = this.subscriber.length - 1; i >= 0; i--) {
      if (this.subscriber[i].object === subscriber) {
        this.subscriber.splice(i, 1)
      }
    }
  }


  async post(o: any, opts?: any): Promise<any> {
    let ttl: number = _.get(opts, 'ttl', 1000);
    try {
      let pseudoResult = await this.adapter.publish(o);
      if (ttl) {
        return pseudoResult.waitForResult(ttl);
      } else {
        return null;
      }
    } catch (err) {
      if (ttl) {
        throw err;
      } else {
        return null;
      }
    }
  }


  async close() {
    this.subscriber = [];
    await this.adapter.close();
  }

}
