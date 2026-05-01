import { buildLoggerOptions } from '../logger';

describe('buildLoggerOptions', () => {
  it('includes pino-pretty transport in development', () => {
    const opts = buildLoggerOptions({ NODE_ENV: 'development' } as NodeJS.ProcessEnv);
    expect(opts.transport).toEqual({
      target: 'pino-pretty',
      options: { colorize: true, ignore: 'pid,hostname' },
    });
    expect(opts.level).toBe('info');
  });

  it('omits transport and silences level in test', () => {
    const opts = buildLoggerOptions({ NODE_ENV: 'test' } as NodeJS.ProcessEnv);
    expect(opts.transport).toBeUndefined();
    expect(opts.level).toBe('silent');
  });

  it('omits transport in production with default info level', () => {
    const opts = buildLoggerOptions({ NODE_ENV: 'production' } as NodeJS.ProcessEnv);
    expect(opts.transport).toBeUndefined();
    expect(opts.level).toBe('info');
  });

  it('respects LOG_LEVEL override across envs', () => {
    expect(
      buildLoggerOptions({ NODE_ENV: 'production', LOG_LEVEL: 'debug' } as NodeJS.ProcessEnv).level,
    ).toBe('debug');
    expect(
      buildLoggerOptions({ NODE_ENV: 'test', LOG_LEVEL: 'warn' } as NodeJS.ProcessEnv).level,
    ).toBe('warn');
  });
});

describe('logger module init', () => {
  const origEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = origEnv;
    jest.resetModules();
  });

  it('initializes in development without throwing — confirms pino-pretty is installed', () => {
    process.env.NODE_ENV = 'development';
    expect(() => {
      jest.isolateModules(() => {
        require('../logger');
      });
    }).not.toThrow();
  });
});
