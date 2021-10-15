
import {ReaderConnectionConfigOptions} from 'nsqjs';

export interface INsqdReaderOptions extends ReaderConnectionConfigOptions {
  topic: string;
  channel: string;
}
