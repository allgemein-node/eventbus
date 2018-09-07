

import 'reflect-metadata'
import {suite, test, timeout} from "mocha-typescript";
import {expect} from "chai";
import subscribe from '../../src/decorator/subscribe';
import EventBusMeta from '../../src/bus/EventBusMeta';
import {EventBus} from '../../src/bus/EventBus';


describe('', () => {
});


class ActionEvent1 {
  some: string
}

class ActionEvent2 {
  some2: string
}

class ActionEvent3 {
  some2: string
}


@suite('functional/eventbus')
class EventbusSpec {



  @test
  async 'simple decorator subscription'() {

    class QueueWorkerTest {
      @subscribe(ActionEvent1) doAction(action: ActionEvent1) {}
    }

    let actionEvent = new ActionEvent1()
    let eventData = EventBusMeta.$().getNamespacesForEvent(actionEvent);
    expect(eventData).to.have.length(1);
    expect(eventData[0]).to.eq('action_event_1');

    let instance = new QueueWorkerTest();
    let subscriberInfos = EventBusMeta.$().getSubscriberInfo(instance);
    expect(subscriberInfos).to.have.length(1);
    expect(subscriberInfos[0]).to.deep.eq({
      namespace: 'action_event_1',
      method: 'doAction',
      configuration: 'default',
      configurationOptions: null
    });

  }


  @test
  async 'simple decorator subscribtion with config'() {

    class QueueWorkerTest2 {
      @subscribe(ActionEvent2, 'nsq') doAction2(action: ActionEvent2) {}
    }

    let actionEvent = new ActionEvent2()
    let eventData = EventBusMeta.$().getNamespacesForEvent(actionEvent);
    expect(eventData).to.have.length(1);
    expect(eventData[0]).to.eq('action_event_2');

    let instance = new QueueWorkerTest2();
    let subscriberInfos = EventBusMeta.$().getSubscriberInfo(instance);
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
      @subscribe(ActionEvent3, 'nsq', {limit:1000}) doAction3(action: ActionEvent3) {}
    }

    let actionEvent = new ActionEvent3()
    let eventData = EventBusMeta.$().getNamespacesForEvent(actionEvent);
    expect(eventData).to.have.length(1);
    expect(eventData[0]).to.eq('action_event_3');

    let instance = new QueueWorkerTest3();
    let subscriberInfos = EventBusMeta.$().getSubscriberInfo(instance);
    expect(subscriberInfos).to.have.length(1);
    expect(subscriberInfos[0]).to.deep.eq({
      namespace: 'action_event_3',
      method: 'doAction3',
      configuration: 'nsq',
      configurationOptions: {limit:1000}
    });

  }

  @test
  async 'event fire with default adapter'() {
    class ActionEvent4 {
      some2: string
    }

    class QueueWorkerTest4 {
      done:boolean = false;

      @subscribe(ActionEvent4) doAction4(action: ActionEvent4) {
        // doing work
        this.done = true;
        return 'DONE';
      }
    }

    let instance = new QueueWorkerTest4();
    await EventBus.register(instance);

    let postResult = await EventBus.post(new ActionEvent4());
    let result = postResult.shift().shift();
    expect(instance.done).to.be.true;
    expect(result).to.be.eq('DONE');



  }

  static async after() {
    await EventBus.$().shutdown();
  }


}
