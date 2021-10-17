export interface ISubscriber {

  nodeId: string;

  object: Function;

  method: string;

  filter?: (result: any) => boolean;


}
