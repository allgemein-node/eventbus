import {RedisEventBusAdapter} from './RedisEventBusAdapter';
import {IMessage} from '../IMessage';
import {Serializer} from '../../utils/Serializer';
import {AbstractPseudoObject} from '../../bus/AbstractPseudoObject';


export class RedisObject extends AbstractPseudoObject<RedisEventBusAdapter> {

  constructor(adapter2: RedisEventBusAdapter, eventID: string, object: any) {
    super(adapter2, eventID, object);
  }

  async fire() {
    // await this.adapter.getSubscriber();

    const _msp = {
      source: this.adapter.nodeId,
      uuid: this.uuid,
      status: 'work',
      event: this.eventID,
      object: this.object
    };

    const msg: IMessage = {
      topic: this.adapter.name,
      message: Serializer.serialize(_msp)
    };
    const writer = await this.adapter.getPublisher();
    await writer.publish(msg);
  }


}
