import {IEventBusConfiguration, IPseudoObject} from '../';

export interface IEventBusAdapter {

  readonly nodeId: string;

  readonly name: string;

  readonly clazz: Function;

  readonly options: IEventBusConfiguration;




  publish(object: any): Promise<IPseudoObject>;

  subscribe(fn: Function): void;

  close(): void;
}
