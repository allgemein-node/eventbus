export class NoRedisConnectionError extends Error {

  constructor(msg?: string) {
    super(`no redis connection established${msg ? ' ' + msg : ''}`);
    Object.setPrototypeOf(this, Error.prototype);
  }
}
