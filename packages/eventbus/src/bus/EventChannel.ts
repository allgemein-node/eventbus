import {IEventBusAdapter} from '../adapter/IEventBusAdapter';
import {ISubscriber} from './ISubscriber';
import {assign, get} from 'lodash';
import {IEventPostOptions} from './IEventPostOptions';
import {K_TTL} from '../Constants';


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
    this.grouped = get(this.adapter.options, 'extra.group', null) != null;
  }


  getAdapter(): IEventBusAdapter {
    return this.adapter;
  }

  get size() {
    return this.subscriber.length;
  }


  private callSubscriber(o: ISubscriber, obj: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      try {
        // @ts-ignore
        const res = await o.object[o.method](obj);
        resolve(res);
      } catch (err) {
        reject(err);
      }
    });
  }


  private process(obj: any): Promise<any> {
    const prms: Promise<any>[] = [];
    // TODO check if not already this class by deserialization
    const targetClazz = Reflect.construct(this.adapter.clazz, []);
    assign(targetClazz, obj);
    if (this.subscriber.length > 0) {
      if (!this.grouped) {
        for (const iSubscriber of this.subscriber) {
          prms.push(this.callSubscriber(iSubscriber, targetClazz));
        }
      } else {
        // on grouped, rotate registered subscriber
        prms.push(this.callSubscriber(this.subscriber[this.next], targetClazz));
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
      throw new Error('method doesn\'t exists in subscriber object');
    }
    this.subscriber.push({
      nodeId: nodeId,
      object: subscriber,
      method: method
    });
    if (!this.adapter.isSubscribed()) {
      await this.adapter.subscribe(this.process.bind(this));
    }
  }


  unregister(subscriber: any) {
    for (let i = this.subscriber.length - 1; i >= 0; i--) {
      if (this.subscriber[i].object === subscriber) {
        this.subscriber.splice(i, 1);
      }
    }
  }


  post(o: any, opts?: IEventPostOptions): Promise<any> {
    const ttl: number = get(opts, K_TTL, 1000);
    try {
      return this.adapter.publish(o).then(x => x.waitForResult(ttl));
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
