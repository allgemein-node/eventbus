import {IWriter} from '../IWriter';
import {IMessage} from '../IMessage';


export interface IRedisWriter extends IWriter {
  publish(msg: IMessage, channel?: string): void;
}
