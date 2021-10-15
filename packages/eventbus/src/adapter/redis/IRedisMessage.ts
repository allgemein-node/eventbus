import {IMessage} from '../IMessage';

export interface IRedisMessage extends IMessage {
  // channel: string;
  timestamp: number;
  receiver?: string;
  sender?: string;
  /**
   * ms
   */
  timestamp_sub: number;
}
