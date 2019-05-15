import 'reflect-metadata';
import {suite, test, timeout} from 'mocha-typescript';
import {expect} from 'chai';
import {Event} from '../../src/decorator/Event';
import {subscribe} from '../../src/decorator/subscribe';

import EventBusMeta from '../../src/bus/EventBusMeta';
import {EventBus} from '../../src/bus/EventBus';


class ActionEventManual1 {
  some: string;
}

class ActionEventManual2 {
  some2: string;
}

class ActionEventManual3 {
  some2: string;
}


@suite('functional/eventbus_manual')
class Eventbus_manualSpec {


  static async after() {
    await EventBus.$().shutdown();
  }


  @test
  async 'simple manual decorator subscription'() {


    class QueueWorkerManualTest {
      doAction(action: ActionEventManual1) {
      }
    }

    EventBusMeta.$().register({
      type: 'subscribe',
      target: QueueWorkerManualTest,
      eventClass: ActionEventManual1,
      methodName: 'doAction',
      configuration: 'default',
      configurationOptions: null
    });

    const ns = EventBusMeta.toNamespace(ActionEventManual1);

    let actionEvent = Reflect.construct(EventBusMeta.$().findEvent(ns).clazz,[]);
    let eventData = EventBusMeta.$().getNamespacesForEvent(actionEvent);
    expect(eventData).to.have.length(1);
    expect(eventData[0]).to.eq('action_event_manual_1');

    let instance = new QueueWorkerManualTest();
    let subscriberInfos = EventBusMeta.$().getSubscriberInfo(instance);
    expect(subscriberInfos).to.have.length(1);
    expect(subscriberInfos[0]).to.deep.eq({
      namespace: 'action_event_manual_1',
      method: 'doAction',
      configuration: 'default',
      configurationOptions: null
    });

  }



  @test
  async 'event fire with default adapter'() {
    class ActionEventManual4 {
      some2: string
    }

    class QueueWorkerManualTest4 {
      done:boolean = false;

      doAction4(action: ActionEventManual4) {
        // doing work
        this.done = true;
        return 'DONE';
      }
    }


    EventBusMeta.$().register({
      type: 'subscribe',
      target: QueueWorkerManualTest4,
      eventClass: ActionEventManual4,
      methodName: 'doAction4',
      configuration: 'default',
      configurationOptions: null
    });

    const ns = EventBusMeta.toNamespace(ActionEventManual4);


    let instance = new QueueWorkerManualTest4();
    await EventBus.register(instance);

    let actionEvent = Reflect.construct(EventBusMeta.$().findEvent(ns).clazz,[]);

    let postResult = await EventBus.post(actionEvent);
    let result = postResult.shift().shift();
    expect(instance.done).to.be.true;
    expect(result).to.be.eq('DONE');



  }

}
