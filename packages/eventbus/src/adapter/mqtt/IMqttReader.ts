import {IReader} from '../IReader';
import {IMqttMessage} from './IMqttMessage';


export interface IMqttReader extends IReader {
  subscribe(callback: (msg: IMqttMessage) => void): void;
}
