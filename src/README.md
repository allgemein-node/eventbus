
# node-commons-eventbus

## Usage

```typescript
import 'reflect-metadata'
import {EventBus} from 'commons-eventbus'

// Definition of the exchange object type
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

## Supported adapter

* default (Eventemitter)
* nsq

## Configuration

TODO

Example configuration for nsq:

```typescript
import {EventBus} from 'commons-eventbus'

let eventBusSettings = {
  name: 'default',
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
