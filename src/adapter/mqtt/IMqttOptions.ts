export interface IMqttOptions {

  url: string;

  disconnect?: {
    force?: boolean;
    options?: any;
  };
}
