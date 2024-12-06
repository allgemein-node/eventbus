import * as _ from 'lodash';
import 'reflect-metadata';
import {suite, test} from '@testdeck/mocha';
import {expect} from 'chai';
import {EventBus} from '../../src/bus/EventBus';
import {subscribe} from '../../src/decorator/subscribe';

import {TestHelper} from './TestHelper';
import {SpawnHandle} from './SpawnHandle';
import {RedisEventBusAdapter} from '../../src/adapter/redis/RedisEventBusAdapter';
import {DEFAULT_REDIS_CONF} from './config';

const LOG_EVENT = TestHelper.logEnable(false);


class TestEvent {
  id: number;

  constructor(id: number = -1) {
    this.id = id;
  }
}


class TestEventHandler {
  id: number;

  constructor(id: number = 0) {
    this.id = id;
  }


  collect: any[] = [];

  @subscribe(TestEvent)
  on(e: TestEvent) {
    this.collect.push([this.id, e.id]);
  }

  wait() {
    let max = 100;
    const prev = this.collect.length;
    return new Promise((resolve, reject) => {
      const i = setInterval(() => {
        if (0 > max--) {
          clearInterval(i);
          reject(new Error('wait abort'));
        }
        if (this.collect.length !== prev) {
          clearInterval(i);
          resolve(null);
        }
      }, 50);
    });
  }
}

@suite('functional/eventbus_redis_combinations')
class EventbusRedisSpec {

  static async before() {
    EventBus.registerAdapter(RedisEventBusAdapter);
    EventBus.$().addConfiguration(DEFAULT_REDIS_CONF);
  }

  static async after() {
    // console.log('SHUTDOWN REDIS');
    await EventBus.$().shutdown();
  }


  @test
  async 'check eventbus on/off register'() {
    const h1 = new TestEventHandler();
    await EventBus.register(h1);
    let e = new TestEvent(1);
    EventBus.postAndForget(e);
    await h1.wait();
    e = new TestEvent(2);
    EventBus.postAndForget(e);
    await h1.wait();
    expect(h1.collect).to.have.length(2);
    await EventBus.unregister(h1);

    EventBus.postAndForget(new TestEvent(3));
    await TestHelper.wait(100);
    expect(h1.collect).to.have.length(2);
    await EventBus.register(h1);
    EventBus.postAndForget(new TestEvent(4));
    await h1.wait();
    expect(h1.collect).to.have.length(3);
    await EventBus.unregister(h1);
  }


  @test
  async 'check eventbus spawned reg/unreg'() {
    const p = SpawnHandle.do(__dirname + '/nodes/node_redis.ts', '--require', 'ts-node/register').start(LOG_EVENT);
    await p.started;

    const h1 = new TestEventHandler(0);
    await EventBus.register(h1);
    p.process.send('fire');
    await h1.wait();
    await EventBus.unregister(h1);
    expect(h1.collect).to.have.length(1);
    expect(_.last(h1.collect)).to.deep.eq([0, 0]);

    p.process.send('fire');
    await TestHelper.wait(100);
    await EventBus.register(h1);

    p.process.send('fire');
    await h1.wait();
    await EventBus.unregister(h1);
    expect(h1.collect).to.have.length(2);
    expect(_.last(h1.collect)).to.deep.eq([0, 2]);

    p.shutdown();
    await p.done;
  }


  @test
  async 'check eventbus spawned reg/unreg new'() {

    const p = SpawnHandle.do(__dirname + '/nodes/node_redis.ts', '--require', 'ts-node/register').start(LOG_EVENT);
    await p.started;

    const h1 = new TestEventHandler(0);
    await EventBus.register(h1);

    p.process.send('fire');
    await h1.wait();

    expect(h1.collect).to.have.length(1);
    expect(_.last(h1.collect)).to.deep.eq([0, 0]);

    await EventBus.unregister(h1);

    p.process.send('fire');
    await TestHelper.wait(100);

    const h2 = new TestEventHandler(1);
    await EventBus.register(h2);

    p.process.send('fire');
    await h2.wait();

    expect(h2.collect).to.have.length(1);
    expect(_.last(h2.collect)).to.deep.eq([1, 2]);

    await EventBus.unregister(h2);

    p.shutdown();
    await p.done;
  }

}
