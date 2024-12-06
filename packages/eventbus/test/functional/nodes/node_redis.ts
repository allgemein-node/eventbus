import {EventBus} from '../../../src/bus/EventBus';
import {RedisEventBusAdapter} from '../../../src/adapter/redis/RedisEventBusAdapter';
import {DEFAULT_REDIS_CONF} from '../config';

class TestEvent {
  id: number;

  constructor(id: number = -1) {
    this.id = id;
  }
}

(async function () {
  EventBus.registerAdapter(RedisEventBusAdapter);
  EventBus.$().addConfiguration(DEFAULT_REDIS_CONF);

  const timeout = 5000;

  let inc = 0;
  console.log('startup finished');
  const t = setTimeout(async () => {
    await EventBus.$().shutdown();
  }, timeout);

  let running = true;
  process.on(<any>'message', async (m: string) => {
    if (m === 'shutdown') {
      console.log('shutdown node');
      running = false;
      clearTimeout(t);
      await EventBus.$().shutdown();
      process.exit(0);
    } else if (m === 'fire') {
      const id = inc++;
      console.log('fire test event ' + id);
      EventBus.postAndForget(new TestEvent(id));
    }
  });
  process.on('exit', async () => {
    if (running) {
      running = false;
      clearTimeout(t);
      await EventBus.$().shutdown();
    }
  });


})();

