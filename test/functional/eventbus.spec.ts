import 'reflect-metadata';
import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';

import EventBusMeta from '../../src/bus/EventBusMeta';
import {EventBus} from '../../src/bus/EventBus';
import {Event} from '../../src/decorator/Event';
import {subscribe, unsubscribe} from '../../src/decorator/subscribe';


class ActionEvent1 {
  some: string;
}

class ActionEvent2 {
  some2: string;
}

class ActionEvent3 {
  some2: string;
}

class ActionEvent4 {
  some2: string;
}

class ActionEventManual1 {
  some: string;
}

class ActionEventManual2 {
  some2: string;
}

class ActionEventManual3 {
  some2: string;
}


@suite('functional/eventbus')
class EventbusSpec {


  static async after() {
    await EventBus.$().shutdown();
  }

  @test
  async 'simple event decorator'() {
    class ActionEventDef {
    }

    Event()(ActionEventDef);

    let ns = EventBusMeta.toNamespace(ActionEventDef);
    let clazzDef = EventBusMeta.$().findEvent(ns);
    expect(clazzDef.clazz).to.be.eq(ActionEventDef);

    ns = EventBusMeta.toNamespace('ActionEventDef');
    clazzDef = EventBusMeta.$().findEvent(ns);
    expect(clazzDef.clazz).to.be.eq(ActionEventDef);

    ns = EventBusMeta.toNamespace('action_event_def');
    clazzDef = EventBusMeta.$().findEvent(ns);
    expect(clazzDef.clazz).to.be.eq(ActionEventDef);

  }

  @test
  async 'simple decorator subscription'() {

    class QueueWorkerTest {
      @subscribe(ActionEvent1) doAction(action: ActionEvent1) {
      }
    }

    const actionEvent = new ActionEvent1();
    const eventData = EventBusMeta.$().getNamespacesForEvent(actionEvent);
    expect(eventData).to.have.length(1);
    expect(eventData[0]).to.eq('action_event_1');

    const instance = new QueueWorkerTest();
    const subscriberInfos = EventBusMeta.$().getSubscriberInfo(instance);
    expect(subscriberInfos).to.have.length(1);
    expect(subscriberInfos[0]).to.deep.eq({
      namespace: 'action_event_1',
      method: 'doAction',
      configuration: 'default',
      configurationOptions: null
    });

  }

  @test
  async 'simple decorator programmatic subscription'() {

    class QueueWorkerTestManuel {
      doAction(action: ActionEvent4) {
      }
    }

    const actionEvent = new ActionEvent4();
    const eventData = EventBusMeta.$().getNamespacesForEvent(actionEvent);
    expect(eventData).to.have.length(0);

    const instance = new QueueWorkerTestManuel();
    subscribe(ActionEvent4)(instance, 'doAction');

    let subscriberInfos = EventBusMeta.$().getSubscriberInfo(instance);
    expect(subscriberInfos).to.have.length(1);
    expect(subscriberInfos[0]).to.deep.eq({
      namespace: 'action_event_4',
      method: 'doAction',
      configuration: 'default',
      configurationOptions: null
    });

    unsubscribe(instance, ActionEvent4, 'doAction');

    subscriberInfos = EventBusMeta.$().getSubscriberInfo(instance);
    expect(subscriberInfos).to.have.length(0);

  }

  @test
  async 'simple decorator subscribtion with config'() {

    class QueueWorkerTest2 {
      @subscribe(ActionEvent2, 'nsq') doAction2(action: ActionEvent2) {
      }
    }

    const actionEvent = new ActionEvent2();
    const eventData = EventBusMeta.$().getNamespacesForEvent(actionEvent);
    expect(eventData).to.have.length(1);
    expect(eventData[0]).to.eq('action_event_2');

    const instance = new QueueWorkerTest2();
    const subscriberInfos = EventBusMeta.$().getSubscriberInfo(instance);
    expect(subscriberInfos).to.have.length(1);
    expect(subscriberInfos[0]).to.deep.eq({
      namespace: 'action_event_2',
      method: 'doAction2',
      configuration: 'nsq',
      configurationOptions: null
    });

  }

  @test
  async 'simple decorator subscribtion with config options'() {

    class QueueWorkerTest3 {
      @subscribe(ActionEvent3, 'nsq', {limit: 1000}) doAction3(action: ActionEvent3) {
      }
    }

    const actionEvent = new ActionEvent3();
    const eventData = EventBusMeta.$().getNamespacesForEvent(actionEvent);
    expect(eventData).to.have.length(1);
    expect(eventData[0]).to.eq('action_event_3');

    const instance = new QueueWorkerTest3();
    const subscriberInfos = EventBusMeta.$().getSubscriberInfo(instance);
    expect(subscriberInfos).to.have.length(1);
    expect(subscriberInfos[0]).to.deep.eq({
      namespace: 'action_event_3',
      method: 'doAction3',
      configuration: 'nsq',
      configurationOptions: {limit: 1000}
    });

  }

  @test
  async 'event fire with default adapter'() {
    class ActionEvent4 {
      some2: string;
    }

    class QueueWorkerTest4 {
      done: boolean = false;

      @subscribe(ActionEvent4) doAction4(action: ActionEvent4) {
        // doing work
        this.done = true;
        return 'DONE';
      }
    }

    const instance = new QueueWorkerTest4();
    await EventBus.register(instance);

    const postResult = await EventBus.post(new ActionEvent4());
    const result = postResult.shift().shift();
    expect(instance.done).to.be.true;
    expect(result).to.be.eq('DONE');


  }


  @test
  async 'suevent fire with default adapter'() {
    class ActionEvent4 {
      some2: string;
    }

    class QueueWorkerTest4 {
      done: boolean = false;

      @subscribe(ActionEvent4) doAction4(action: ActionEvent4) {
        // doing work
        this.done = true;
        return 'DONE';
      }
    }

    const instance = new QueueWorkerTest4();
    await EventBus.register(instance);

    const postResult = await EventBus.post(new ActionEvent4());
    const result = postResult.shift().shift();
    expect(instance.done).to.be.true;
    expect(result).to.be.eq('DONE');


  }


  @test
  async 'simple manual decorator subscription on programmatic attach'() {


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

    const actionEvent = Reflect.construct(EventBusMeta.$().findEvent(ns).clazz, []);
    const eventData = EventBusMeta.$().getNamespacesForEvent(actionEvent);
    expect(eventData).to.have.length(1);
    expect(eventData[0]).to.eq('action_event_manual_1');

    const instance = new QueueWorkerManualTest();
    const subscriberInfos = EventBusMeta.$().getSubscriberInfo(instance);
    expect(subscriberInfos).to.have.length(1);
    expect(subscriberInfos[0]).to.deep.eq({
      namespace: 'action_event_manual_1',
      method: 'doAction',
      configuration: 'default',
      configurationOptions: null
    });

  }


  @test
  async 'event fire with default adapter on programmatic attach'() {
    class ActionEventManual4 {
      some2: string;
    }

    class QueueWorkerManualTest4 {
      done: boolean = false;

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


    const instance = new QueueWorkerManualTest4();
    await EventBus.register(instance);

    const actionEvent = Reflect.construct(EventBusMeta.$().findEvent(ns).clazz, []);

    const postResult = await EventBus.post(actionEvent);
    const result = postResult.shift().shift();
    expect(instance.done).to.be.true;
    expect(result).to.be.eq('DONE');


  }

}
