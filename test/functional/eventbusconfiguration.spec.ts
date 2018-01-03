


import {suite, test, timeout} from "mocha-typescript";
import {expect} from "chai";
import subscribe from '../../src/decorator/subscribe';
import EventBusMeta from '../../src/EventBusMeta';
import {EventBus} from '../../src/EventBus';
import {EventBusConfiguration} from '../../src/EventBusConfiguration';
import {NsqdEventBusAdapter} from '../../src/adapter/nsq/NsqdEventBusAdapter';
import {DefaultEventBusAdapter} from '../../src/adapter/default/DefaultEventBusAdapter';


describe('', () => {
});



@suite('functional/eventbusconfiguration')
class EventbusconfigurationSpec {



  @test
  async 'has registered controller'() {
    EventBusConfiguration.register(DefaultEventBusAdapter);
    expect(Object.keys(EventBusConfiguration['adapters'])).to.deep.eq(['default']);
  }


}
