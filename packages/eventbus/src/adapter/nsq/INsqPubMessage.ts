import {IMessage} from '../IMessage';

export interface INsqPubMessage extends IMessage{
  topic: string
  message: any
}
