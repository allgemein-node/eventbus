import * as _ from 'lodash';
import * as BSON from 'bson';

export class Serializer {

  static serialize(data: any) {
    // return JSON.stringify(data);
    const buffer = BSON.serialize(data);
    return buffer.toString('base64');
  }

  static deserialize(data: any) {
    if (!_.isBuffer(data)) {
      data = Buffer.from(data, 'base64');
    }
    // return JSON.parse(data);
    return BSON.deserialize(data);
  }
}
