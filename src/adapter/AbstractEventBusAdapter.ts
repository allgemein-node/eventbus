import {IEventBusAdapter} from './IEventBusAdapter';
import {IEventBusConfiguration, IPseudoObject} from '..';
import {IReader} from './IReader';
import {IWriter} from './IWriter';
import {EventEmitter} from 'events';


export abstract class AbstractEventBusAdapter implements IEventBusAdapter{
  readonly clazz: Function;
  readonly name: string;
  readonly nodeId: string;
  readonly options: IEventBusConfiguration;
  private emitter: EventEmitter = new EventEmitter();


  protected reader: IReader;

  protected writer: IWriter;


  constructor(nodeId: string, name: string, clazz: Function, options: any) {
    this.options = options;
    this.nodeId = nodeId;
    this.name = name;
    this.clazz = clazz;
    this.emitter.setMaxListeners(1000);
  }


  getEmitter() {
    return this.emitter;
  }

  publish(object: any): Promise<IPseudoObject> {
    return undefined;
  }

  subscribe(fn: Function): void {
  }


  eventID() {
    return [this.nodeId, this.name].join('_');
  }


  async shutdown() {
    await Promise.all([this.writer.close(), this.reader.close()]);
  }


  async close() {
    await Promise.all([this.writer.close(), this.reader.close()]);
  }

}
