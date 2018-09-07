import {IMessage} from '../IMessage';

export interface INsqSubMessage extends IMessage{
  id: string,
  body: any,
  timestamp: number,
  timestamp_sub: number,
  receivedOn: number,
  lastTouched: number,
  touchCount: number
}
