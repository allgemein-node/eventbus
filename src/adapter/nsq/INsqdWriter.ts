import {INsqPubMessage} from './INsqPubMessage';
import {IWriter} from '../IWriter';

export interface INsqdWriter extends IWriter{

  publish(msg: INsqPubMessage):void;

}
