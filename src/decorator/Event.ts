import 'reflect-metadata';
import EventBusMeta from '../bus/EventBusMeta';


export default function Event(): Function {
  return function (object: Function) {
    return EventBusMeta.$().registerEventClass(object);
  };
}
