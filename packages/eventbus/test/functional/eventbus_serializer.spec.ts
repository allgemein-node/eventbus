import {suite, test} from '@testdeck/mocha';
import {Serializer} from '../../src/utils/Serializer';
import {expect} from 'chai';


@suite('functional/eventbus-serializer')
class EventbusSpec {

  @test
  async 'serialize object'() {
    const obj = {hallo: 'welt'};
    const serialized = Serializer.serialize(obj);
    const unserialized = Serializer.deserialize(serialized);
    expect(obj).to.deep.equal(unserialized);
  }

}
