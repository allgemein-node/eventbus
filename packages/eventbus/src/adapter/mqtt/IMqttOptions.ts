import {IClientOptions} from 'mqtt';

export interface IMqttOptions extends IClientOptions {

  url: string;

  disconnect?: {
    force?: boolean;
    options?: any;
  };
}
