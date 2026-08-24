declare module 'http-cookie-agent/http' {
  import { Agent as HttpAgent, AgentOptions as HttpAgentOptions } from 'http';
  import { Agent as HttpsAgent } from 'https';

  export interface CookieAgentOptions extends HttpAgentOptions {
    cookies: { jar: unknown };
  }

  export class HttpCookieAgent extends HttpAgent {
    constructor(options?: Partial<CookieAgentOptions>);
  }

  export class HttpsCookieAgent extends HttpsAgent {
    constructor(options?: Partial<CookieAgentOptions>);
  }
}
