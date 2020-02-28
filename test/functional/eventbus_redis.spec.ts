import 'reflect-metadata';
import {suite, test, timeout} from 'mocha-typescript';
import {expect} from 'chai';
import {EventBus} from '../../src/bus/EventBus';
import {Event} from '../../src/decorator/Event';
import {subscribe} from '../../src/decorator/subscribe';

import {RedisReader} from '../../src/adapter/redis/RedisReader';
import {RedisWriter} from '../../src/adapter/redis/RedisWriter';
import {IRedisOptions} from '../../src/adapter/redis/IRedisOptions';
import {IMessage} from '../../src/adapter/IMessage';
import {IRedisMessage} from '../../src/adapter/redis/IRedisMessage';


@suite('functional/eventbus_redis')
class EventbusRedisSpec {

  static async before() {
    await EventBus.$().addConfiguration({
      name: 'default',
      adapter: 'redis',

      extra: {
        host: '127.0.0.1',
        port: 6379,
      }
    });
  }

  static async after() {
    // console.log('SHUTDOWN REDIS');
    await EventBus.$().shutdown();
  }


  @test
  async 'redis reader <-> writer communication'() {
    const channel = 'nodeId123';
    const topic = 'topic';

    const opts: IRedisOptions = {
      host: '127.0.0.1',
      port: 6379
    };

    const reader = new RedisReader(topic, channel, opts);
    const writer = new RedisWriter(opts);

    const messages: IRedisMessage[] = [];
    await Promise.all([reader.open(), writer.open()]);
    reader.subscribe((msg: IRedisMessage) => {
      messages.push(msg);
    });

    const msg = {
      test: 'okay',
      timestamp: (new Date().getTime())
    };

    // global publish
    await writer.publish({
      topic: topic,
      message: msg
    });

    // publish undefined channel
    await writer.publish({
      topic: topic,
      message: msg
    }, 'dummy');

    // publish defined channel
    await writer.publish({
      topic: topic,
      message: msg
    }, channel);

    await new Promise(resolve => setTimeout(resolve, 1000));
    await Promise.all([reader.close(), writer.close()]);
    expect(messages).to.have.length(2);
    expect(messages[0].topic).to.be.eq(topic);
    // expect(messages[0].channel).to.be.eq(channel);
    expect(messages[0].message).to.be.deep.eq(msg);

    // console.log('message', message);

    // await Promise.all([reader.close(),writer.close()]);

  }



  @test
  async 'throw error when event wasn\'t picked up'() {
    class ActionEvent6 {
      some2: string;
    }

    // default ttl is 1000
    let err: Error = null;
    let postResult = null;
    try {
      postResult = await EventBus.post(new ActionEvent6());
    } catch (err2) {
      err = err2;
    }
    expect(err.toString()).to.eq(new Error('ttl 1000 passed').toString());

    // change ttl to 500
    try {
      postResult = await EventBus.post(new ActionEvent6(), {ttl: 500});
    } catch (err2) {
      err = err2;
    }
    expect(err.toString()).to.eq(new Error('ttl 500 passed').toString());

    // if ttl set to 0 we don't throw error and we don't wait

    postResult = await EventBus.post(new ActionEvent6(), {ttl: 0});
    expect(postResult).to.deep.eq([null]);
  }


  @test
  async 'fire event'() {

    class ActionEvent5 {
      some2: string;
    }

    class QueueWorkerTest5 {
      done = false;

      @subscribe(ActionEvent5) doAction4(action: ActionEvent5) {
        // doing work
        this.done = true;
        return 'DONE';
      }
    }



    const instance = new QueueWorkerTest5();
    await EventBus.register(instance);

    const postResult = await EventBus.post(new ActionEvent5(), {ttl: 4000});
    // console.log(postResult);
    const result = postResult.shift().shift();
    expect(instance.done).to.be.true;
    expect(result).to.be.eq('DONE');


  }



  @test
  async 'broadcast event to multiple instances at the same time'() {

    // TODO fire m

    class ActionEvent7 {
      some2: string;
    }

    class QueueWorkerTest7 {

      constructor() {
        this.inc = QueueWorkerTest7.$inc++;
      }
      static $inc = 0;
      done = false;
      inc = 0;

      @subscribe(ActionEvent7)
      doAction7(action: ActionEvent7) {
        // doing work
        this.done = true;
        return 'DONE_' + this.inc;
      }
    }

    const instance = new QueueWorkerTest7();
    await EventBus.register(instance);

    const instance2 = new QueueWorkerTest7();
    await EventBus.register(instance2);

    const postResult = await EventBus.post(new ActionEvent7());
    // console.log(postResult);
    expect(postResult).to.deep.eq([['DONE_0', 'DONE_1']]);
    expect(instance.done).to.be.true;
    expect(instance2.done).to.be.true;

  }

  @test.skip
  async 'fire event to grouped process instances'() {

    // TODO fire m
    class ActionEvent8 {
      some2: string;
    }

    class QueueWorkerTest8 {

      constructor() {
        this.inc = QueueWorkerTest8.$inc++;
      }
      static $inc = 0;
      done = false;
      inc = 0;

      @subscribe(ActionEvent8, 'default', {group: 'doaction8'})
      doAction8(action: ActionEvent8) {
        this.done = true;
        return 'DONE_' + this.inc;
      }
    }

    const instance = new QueueWorkerTest8();
    await EventBus.register(instance);

    const instance2 = new QueueWorkerTest8();
    await EventBus.register(instance2);

    let postResult = await EventBus.post(new ActionEvent8());
    expect(instance.done).to.be.true;
    expect(instance2.done).to.be.false;
    expect(postResult).to.deep.eq([['DONE_0']]);

    instance.done = false;
    postResult = await EventBus.post(new ActionEvent8());
    expect(instance.done).to.be.false;
    expect(instance2.done).to.be.true;
    expect(postResult).to.deep.eq([['DONE_1']]);

    postResult = await EventBus.post(new ActionEvent8());
    expect(instance.done).to.be.true;
    expect(instance2.done).to.be.true;
    expect(postResult).to.deep.eq([['DONE_0']]);
  }


}
