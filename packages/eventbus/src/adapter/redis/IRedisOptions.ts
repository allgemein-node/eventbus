import {RedisClientOptions} from 'redis';

export interface IRedisOptions extends RedisClientOptions {

  host: string;

  port: number;

  unref?: boolean;

}
