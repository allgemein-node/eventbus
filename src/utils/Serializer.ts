import * as BSON from 'bson';

export class Serializer {

  static serialize(data: any) {
    // return JSON.stringify(data);
    return BSON.serialize(data);
  }

  static deserialize(data: any) {
    // return JSON.parse(data);
    return BSON.deserialize(data);
  }
}
