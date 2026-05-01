import pino from 'pino';

export function buildLoggerOptions(env: NodeJS.ProcessEnv = process.env): pino.LoggerOptions {
  const useDevTransport = env.NODE_ENV !== 'production' && env.NODE_ENV !== 'test';
  return {
    level: env.LOG_LEVEL ?? (env.NODE_ENV === 'test' ? 'silent' : 'info'),
    ...(useDevTransport && {
      transport: { target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' } },
    }),
  };
}

const logger = pino(buildLoggerOptions());

export default logger;
