// process.env.NODE_DEBUG = 'redis';


import {RedisEventBusAdapter} from '../../src';
import 'reflect-metadata';
import {suite, test, timeout} from '@testdeck/mocha';
import {expect} from 'chai';
import {EventBus} from '../../src/bus/EventBus';
import {subscribe} from '../../src/decorator/subscribe';
import {spawn} from 'child_process';
import {RedisReader} from '../../src/adapter/redis/RedisReader';
import {RedisWriter} from '../../src/adapter/redis/RedisWriter';
import {IRedisOptions} from '../../src/adapter/redis/IRedisOptions';
import {IRedisMessage} from '../../src/adapter/redis/IRedisMessage';
import {TestHelper} from './TestHelper';
import {last, range} from 'lodash';
import {CryptUtils} from '@allgemein/base';


@suite('functional/eventbus_redis') @timeout(60000)
class EventbusRedisSpec {


  static async before() {
    EventBus.registerAdapter(RedisEventBusAdapter);
    await EventBus.$().addConfiguration({
      name: 'default',
      adapter: 'redis',
      extra: {
        host: '127.0.0.1',
        port: 6379,
        unref: true
      }
    });
  }


  static async after() {
    try {
      await EventBus.$().shutdown();
    } catch (e) {
      console.error(e);
    }

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
    // tslint:disable-next-line:no-shadowed-variable
    reader.subscribe((msg: IRedisMessage) => {
      messages.push(msg);
    });

    let inc = 0;
    const msg: any[] = [];
    msg[inc++] = {
      test: 'okay-1',
      timestamp: (new Date().getTime())
    };

    // global publish
    await writer.publish({
      topic: topic,
      message: msg[inc - 1]
    });

    msg[inc++] = {
      test: 'okay-2',
      timestamp: (new Date().getTime())
    };

    // publish undefined channel
    await writer.publish({
      topic: topic,
      message: msg[inc - 1]
    }, 'dummy');

    msg[inc++] = {
      test: 'okay-3',
      timestamp: (new Date().getTime())
    };

    // publish defined channel
    await writer.publish({
      topic: topic,
      message: msg[inc - 1]
    }, channel);

    await new Promise(resolve => setTimeout(resolve, 1000));
    await Promise.all([reader.close(), writer.close()]);
    expect(messages).to.have.length(2);
    expect(messages[0].topic).to.be.eq(topic);
    expect(messages[0].message).to.be.deep.eq(msg[0]);
    expect(messages[1].message).to.be.deep.eq(msg[2]);
  }


  /**
   *

   // server doesn't exists at
   // - startup
   // - interrupted during connection
   // - not replying

   */

  /**
   * Try simulate errors like:
   *
   * [2020.03.22 07:11:25.226]  [ERROR]  worker | uncaughtException
   * Error: Redis connection to 127.0.0.1:7000 failed - connect ECONNREFUSED 127.0.0.1:7000
   * at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1106:14)
   */
  @test
  async 'redis reader <-> writer communication - abort cause not present'() {
    const channel = 'nodeId123';
    const topic = 'topic';

    const opts: IRedisOptions = {
      host: '127.0.0.1',
      port: 6381,
      retry_strategy: function (options) {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          return new Error('The server refused the connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
      }
    };

    const reader = new RedisReader(topic, channel, opts);
    const writer = new RedisWriter(opts);

    let error = null;
    const messages: IRedisMessage[] = [];
    try {
      await Promise.all([
        reader.open(),
        writer.open()]
      );
    } catch (e) {
      console.error(e);
      error = e;
    }

    expect(error.message).to.be.eq('Redis connection in broken state: retry aborted. (#connect)');

    reader.subscribe((msg: IRedisMessage) => {
      messages.push(msg);
    });


    const msg = {
      test: 'okay',
      timestamp: (new Date().getTime())
    };

    try {
      // global publish
      await writer.publish({
        topic: topic,
        message: msg
      });
    } catch (e) {
      console.error(e);
    }

    try {
      await Promise.all([reader.close(), writer.close()]);
    } catch (e) {
      console.error(e);
    }
  }


  /**
   * Try simulate errors like:
   *
   * [2020.03.22 07:11:25.226]  [ERROR]  worker | uncaughtException
   * Error: Redis connection to 127.0.0.1:7000 failed - connect ECONNREFUSED 127.0.0.1:7000
   * at TCPConnectWrap.afterConnect [as oncomplete] (net.js:1106:14)
   */
  @test.pending
  async 'redis reader <-> writer communication abort during run'() {
    const channel = 'nodeId123';
    const topic = 'topic';


    const opts: IRedisOptions = {
      host: '127.0.0.1',
      port: 6380,
      unref: true
    };

    const reader = new RedisReader(topic, channel, opts);
    const writer = new RedisWriter(opts);

    const messages: IRedisMessage[] = [];
    try {
      await Promise.all([
        reader.open(),
        writer.open()]
      );
    } catch (e) {
      console.error(e);
    }

    reader.subscribe((msg: IRedisMessage) => {
      messages.push(msg);
    });

    const file = __dirname + '/../../../../deployments/testing/docker-compose.yml';

    setTimeout(() => {
      // child_process.exec()
      spawn('/usr/local/bin/docker-compose', ['-f', file, 'stop', 'redis_abort'], {stdio: ['inherit', 'inherit', 'inherit']});
      // const client = new RedisClient(opts);
      // client.on(E_ERROR, (err) => {
      //   console.error(err);
      // });
      // client.on(E_READY, () => {
      //   client.shutdown();
      // });
    }, 500);

    // const client = new RedisClient(opts);
    // client.shutdown();

    const msg = {
      test: 'okay',
      timestamp: (new Date().getTime())
    };

    const success: any[] = [];
    const errors: any[] = [];
    for (let i = 0; i < 30; i++) {
      console.log(i);
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
      try {
        // global publish
        await writer.publish({
          topic: topic,
          message: msg
        });
        success.push(i);
      } catch (e) {
        e.message = e.message + '(' + i + ')';
        console.error(e);
        errors.push(e);
      }
    }

    console.log('success=' + success.length + ' errors=' + errors.length);

    try {
      await Promise.all([reader.close(), writer.close()]);
    } catch (e) {
      console.error(e);
    }

    spawn('/usr/local/bin/docker-compose', ['-f', file, 'start', 'redis_abort'], {stdio: ['inherit', 'inherit', 'inherit']});

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
      await TestHelper.wait(1000);
    } catch (err2) {
      err = err2;
    }
    expect(err.toString()).to.eq(new Error('ttl 1000 passed').toString());

    // // change ttl to 500
    // try {
    //   postResult = await EventBus.post(new ActionEvent6(), {ttl: 500});
    // } catch (err2) {
    //   err = err2;
    // }
    // expect(err.toString()).to.eq(new Error('ttl 500 passed').toString());
    // postResult = await EventBus.post(new ActionEvent6(), {ttl: 0});
    // expect(postResult).to.deep.eq([null]);
  }


  @test
  async 'fire and catch an event'() {
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

    const previous = EventBus.namespaces.length;
    const instance = new QueueWorkerTest5();
    await EventBus.register(instance);
    const namespaces = EventBus.namespaces;
    const channel = EventBus.$().getChannel(last(namespaces));
    const eventNames1 = channel.getAdapter().getEmitter().eventNames();
    const postResult = await EventBus.post(new ActionEvent5(), {ttl: 4000});
    const eventNames2 = channel.getAdapter().getEmitter().eventNames();
    const result = postResult.shift().shift();
    await EventBus.unregister(instance);

    expect(eventNames1).to.be.include.members(['connect']);
    expect(eventNames2).to.have.length.gte(2);

    expect(instance.done).to.be.true;
    expect(result).to.be.eq('DONE');

    expect(EventBus.namespaces).to.have.length(namespaces.length - 1);
    expect(EventBus.namespaces).to.have.length(previous);
    const eventNames3 = channel.getAdapter().getEmitter().eventNames();
    expect(eventNames3).to.have.length(0);
  }

  @test
  async 'fire and catch multiple event'() {
    class MultiActionEvent {
      some: string;
    }

    const catched: any[] = [];

    class QueueWorkerTest6 {
      done = false;

      @subscribe(MultiActionEvent) doAction4(action: MultiActionEvent) {
        // doing work
        catched.push(action);
        this.done = true;
        return 'DONE';
      }
    }

    const instance = new QueueWorkerTest6();
    await EventBus.register(instance);
    const namespaces = EventBus.namespaces;
    const eventName = last(namespaces);
    const channel = EventBus.$().getChannel(eventName);
    let i = 0;
    for (const x of range(0, 200)) {
      const c = new MultiActionEvent();
      c.some = 'test-' + CryptUtils.shorthash(new Date().getTime() + '-' + x).repeat(20);
      EventBus.post(c, {ttl: 4000});
      i += 1;
    }

    await TestHelper.waitFor(() => catched.length >= 200);

    const listnerAfter = channel.getAdapter().getEmitter().listenerCount(eventName);
    await EventBus.unregister(instance);
    const eventNames2 = channel.getAdapter().getEmitter().eventNames();

    expect(i).to.be.eq(200);
    expect(listnerAfter).to.be.eq(0);
    expect(catched).to.have.length(i);
    expect(eventNames2).to.have.length(0);

  }

  @test
  async 'broadcast event to multiple instances at the same time'() {
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
    await EventBus.unregister(instance2);
    await EventBus.unregister(instance);
    expect(postResult).to.deep.eq([['DONE_0', 'DONE_1']]);
    expect(instance.done).to.be.true;
    expect(instance2.done).to.be.true;
  }


  @test.pending
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

  @test.pending
  async 'serialization of classes'() {


  }
}
