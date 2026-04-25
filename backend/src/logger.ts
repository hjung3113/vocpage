import pino from 'pino';

const usePretty = process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  ...(usePretty && {
    transport: { target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' } },
  }),
});

export default logger;
