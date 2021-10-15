import EventBusMeta from '../bus/EventBusMeta';

export function Event(): Function {
  return function (object: Function) {
    EventBusMeta.$().registerEventClass(object);
  };
}
