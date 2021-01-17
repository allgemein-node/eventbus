import {IMessage} from '../IMessage';

export interface IMqttMessage extends IMessage {
  m: string;
  // //channel: string;
  // timestamp: number;
  // receiver?: string,
  // sender?: string,
  // /**
  //  * ms
  //  */
  // timestamp_sub: number;
}
