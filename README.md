
# @allgemein/eventbus


[![Build Status](https://travis-ci.org/allgemein-node/eventbus.svg?branch=master)](https://travis-ci.org/allgemein-node/eventbus)
[![codecov](https://codecov.io/gh/allgemein-node/eventbus/branch/master/graph/badge.svg)](https://codecov.io/gh/allgemein-node/eventbus)
[![Dependency Status](https://david-dm.org/allgemein-node/eventbus.svg)](https://david-dm.org/allgemein-node/eventbus)


## Usage

```typescript
import 'reflect-metadata'
import {Event,EventBus,subscribe} from '@allgemein/eventbus'

// Definition of the exchange object type
@Event()
class MySuggestion {
    content:string;
    constructor(content:string){
      this.content = content;
    }
}

// subscribe to listening for the explicit object type
class WillListenOnEvent {

  @subscribe(MySuggestion)
  letstalk(data:MySuggestion){
    console.log(data.content);
  }
}

let instance = new WillListenOnEvent()
EventBus.register(instance);


let suggestion = new MySuggestion('blabla');
EventBus.post(suggestion);

// That's it

```

Use without annotations:

```typescript
import 'reflect-metadata'
import {Event, subscribe, EventBus, EventBusMeta} from '@allgemein/eventbus'

// Definition of the exchange object type
class MySuggestion {
    content:string;
    constructor(content:string){
      this.content = content;
    }
}

// subscribe to listening for the explicit object type
class WillListenOnEvent {

  letstalk(data:MySuggestion){
    console.log(data.content);
  }
}

EventBusMeta.$().register({
  type: 'subscribe',
  target: WillListenOnEvent,
  eventClass: MySuggestion,
  methodName: 'letstalk',
  configuration: 'default',
  configurationOptions: null
});

let instance = new WillListenOnEvent()
EventBus.register(instance);

let suggestion = new MySuggestion('blabla');
EventBus.post(suggestion);
```


## Supported adapter

* default (Eventemitter)
* nsq
* redis

## Configuration

TODO

Example configuration for nsq:

```typescript
import {EventBus} from '@allgemein/eventbus'

let eventBusSettings = {
  name: 'default_nsq',
  adapter: 'nsq',
  extra: {
    reader: {
      nsqdTCPAddresses:['localhost:4150'],
      maxInFlight: 100,
      messageTimeout: 30000
    },
    writer:{
      host: '127.0.0.1',
      port: 4150
    }
  }
}

EventBus.$().addConfiguration(eventBusSettings);

```

Example configuration for redis:

```typescript
import {EventBus} from '@allgemein/eventbus'

let eventBusSettings = {
  name: 'default_redis',
  adapter: 'redis',
  extra: {
    host: '127.0.0.1',
    port: 6379
  }
}

EventBus.$().addConfiguration(eventBusSettings);

```
