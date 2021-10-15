import {IWriter} from '../IWriter';
import {IMessage} from '../IMessage';


export interface IMqttWriter extends IWriter {
  publish(msg: IMessage): void;


}
