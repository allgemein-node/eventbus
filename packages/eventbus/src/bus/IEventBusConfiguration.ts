export interface IEventBusConfiguration {
  name: string;
  adapter: Function | string;
  extra?: any;
}
