import {IRedisMessage} from './IRedisMessage';
import {IReader} from '../IReader';


export interface IRedisReader extends IReader {
  subscribe(callback: (msg: IRedisMessage) => void): void;
}
