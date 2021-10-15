import {AbstractPseudoObject} from '../../bus/AbstractPseudoObject';
import {DefaultEventBusAdapter} from './DefaultEventBusAdapter';


export class EmitterObject extends AbstractPseudoObject<DefaultEventBusAdapter> {

  constructor(adapter2: DefaultEventBusAdapter, eventID: string, object: any) {
    super(adapter2, eventID, object);
    this.adapter.getEmitter().emit(this.eventID, this.uuid, this.object);
  }

}
