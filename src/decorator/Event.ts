import EventBusMeta from '../bus/EventBusMeta';

export function Event(): Function {
  return function (object: Function) {
    return EventBusMeta.$().registerEventClass(object);
  };
}
