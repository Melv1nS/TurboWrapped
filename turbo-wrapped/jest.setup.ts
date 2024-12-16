import '@testing-library/jest-dom';
import { TextEncoder, TextDecoder } from 'util';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Mock fetch globally
global.fetch = jest.fn(() => 
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

// Mock Request globally
global.Request = class Request {
  constructor(url: string) {
    return new URL(url);
  }
} as any;

// Mock Response globally
global.Response = class Response {
  constructor(body: any, init?: ResponseInit) {
    return {
      json: () => Promise.resolve(body),
      ...init
    } as any;
  }
} as any;