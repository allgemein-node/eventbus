import {serialize, deserialize} from 'bson';
import {isBuffer} from 'lodash';

export class Serializer {

  static serialize(data: any) {
    // return JSON.stringify(data);
    const buffer = serialize(data);
    // @ts-ignore
    return buffer.toString('base64');
  }

  static deserialize(data: any) {
    if (!isBuffer(data)) {
      data = Buffer.from(data, 'base64');
    }
    // return JSON.parse(data);
    return deserialize(data);
  }
}
