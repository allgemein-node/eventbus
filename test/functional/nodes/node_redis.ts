import {EventBus} from '../../../src';

class TestEvent {
  id: number;

  constructor(id: number = -1) {
    this.id = id;
  }
}

(async function () {
  const LOG_EVENT = true;//
  await EventBus.$().addConfiguration({
    name: 'default',
    adapter: 'redis',

    extra: {
      host: '127.0.0.1',
      port: 6379,
    }
  });

  let timeout = 3000;


  let inc = 0;
  console.log('startup finished');
  let t = setTimeout(async () => {
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
    } else if (m == 'fire') {
      let id = inc++;
      console.log('fire test event '+id);
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

