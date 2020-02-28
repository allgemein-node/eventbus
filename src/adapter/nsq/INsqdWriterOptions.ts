import {ConnectionConfigOptions} from 'nsqjs';

export interface INsqdWriterOptions extends ConnectionConfigOptions {
  host: string;
  port: number;
  messageExtractor: Function;
}
