import 'reflect-metadata';
import {suite, test, timeout} from 'mocha-typescript';
import {expect} from 'chai';
import {EventBus} from '../../src/bus/EventBus';
import subscribe from '../../src/decorator/subscribe';
import {RedisReader} from '../../src/adapter/redis/RedisReader';
import {RedisWriter} from '../../src/adapter/redis/RedisWriter';



@suite('functional/eventbus_redis')
class Eventbus_redisSpec {

  static async before() {
    await EventBus.$().addConfiguration({
      name: 'default',
      adapter: 'redis',

      extra: {
        reader: {
          host: '127.0.0.1',
          port: 6379
        },
        writer: {
          host: '127.0.0.1',
          port: 6379
        }
      }
    });
  }

  static async after() {
    console.log('SHUTDOWN REDIS')
    await EventBus.$().shutdown();
  }

  @test
  async 'broadcast event to multiple instances at the same time'() {

    // TODO fire m

    class ActionEvent7 {
      some2: string;
    }

    class QueueWorkerTest7 {
      done: boolean = false;
      static $inc: number = 0;
      inc: number = 0;

      constructor() {
        this.inc = QueueWorkerTest7.$inc++;
      }

      @subscribe(ActionEvent7)
      doAction7(action: ActionEvent7) {
        console.log('action ' + this.inc);
        // doing work
        this.done = true;
        return 'DONE_' + this.inc;
      }
    }

    let instance = new QueueWorkerTest7();
    await EventBus.register(instance);

    let instance2 = new QueueWorkerTest7();
    await EventBus.register(instance2);

    let postResult = await EventBus.post(new ActionEvent7());
    console.log(postResult);
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
      done: boolean = false;
      static $inc: number = 0;
      inc: number = 0;

      constructor() {
        this.inc = QueueWorkerTest8.$inc++;
      }

      @subscribe(ActionEvent8, 'default', {group: 'doaction8'})
      doAction8(action: ActionEvent8) {
        this.done = true;
        return 'DONE_' + this.inc;
      }
    }

    let instance = new QueueWorkerTest8();
    await EventBus.register(instance);

    let instance2 = new QueueWorkerTest8();
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
      done: boolean = false;

      @subscribe(ActionEvent5) doAction4(action: ActionEvent5) {
        console.log(action);
        // doing work
        this.done = true;
        return 'DONE';
      }
    }

    let instance = new QueueWorkerTest5();
    await EventBus.register(instance);

    let postResult = await EventBus.post(new ActionEvent5());
    console.log(postResult);
    let result = postResult.shift().shift();
    expect(instance.done).to.be.true;
    expect(result).to.be.eq('DONE');


  }

  @test
  async 'reader writer com'() {
    let opts = {
      host: '127.0.0.1',
      port: 6379
    };
    let reader = new RedisReader('topic', 'channel', opts);
    let writer = new RedisWriter(opts);

    await Promise.all([reader.open(), writer.open()]);
    reader.on('message', async function (...args: any[]) {
      console.log('message', args);
    });
    await writer.publish({
      topic: 'channel',
      message: JSON.stringify({
        test: 'okay',
        timestamp: (new Date().getTime())
      })
    });


    await new Promise(resolve => setTimeout(resolve,1000));
    await Promise.all([reader.close(), writer.close()]);
    //await Promise.all([reader.close(),writer.close()]);

  }
}
