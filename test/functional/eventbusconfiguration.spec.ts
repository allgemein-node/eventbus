import {suite, test} from 'mocha-typescript';
import {expect} from 'chai';
import {EventBusConfiguration} from '../../src/bus/EventBusConfiguration';
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
