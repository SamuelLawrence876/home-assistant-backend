import { Logger } from './logger';

const makeLogger = () => new Logger({ service: 'test-svc', stage: 'test' });

describe('Logger', () => {
  let logSpy: jest.SpyInstance;
  let infoSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    infoSpy = jest.spyOn(console, 'info').mockImplementation(() => {});
    warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  const lastRecord = (spy: jest.SpyInstance) => JSON.parse(spy.mock.calls[0][0] as string);

  describe('structured output', () => {
    it('writes a valid JSON record with required fields', () => {
      makeLogger().info('hello world');

      const record = lastRecord(infoSpy);

      expect(record).toMatchObject({
        level: 'info',
        message: 'hello world',
        service: 'test-svc',
        stage: 'test',
      });
      expect(record.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('routes debug to console.log', () => {
      makeLogger().debug('dbg');
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(infoSpy).not.toHaveBeenCalled();
    });

    it('routes warn to console.warn', () => {
      makeLogger().warn('uh oh');
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('routes error to console.error', () => {
      makeLogger().error('boom');
      expect(errorSpy).toHaveBeenCalledTimes(1);
    });

    it('merges extra fields into the record', () => {
      makeLogger().info('with extras', { correlationId: 'abc-123', userId: 42 });

      const record = lastRecord(infoSpy);

      expect(record.correlationId).toBe('abc-123');
      expect(record.userId).toBe(42);
    });
  });

  describe('log level filtering', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterAll(() => {
      process.env = originalEnv;
    });

    it('suppresses messages below the configured level', () => {
      process.env.LOG_LEVEL = 'warn';
      const log = makeLogger();

      log.debug('suppressed debug');
      log.info('suppressed info');
      log.warn('visible warn');

      expect(logSpy).not.toHaveBeenCalled();
      expect(infoSpy).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledTimes(1);
    });

    it('defaults to info when LOG_LEVEL is unset', () => {
      delete process.env.LOG_LEVEL;
      const log = makeLogger();

      log.debug('suppressed');
      log.info('visible');

      expect(logSpy).not.toHaveBeenCalled();
      expect(infoSpy).toHaveBeenCalledTimes(1);
    });

    it('falls back to info for unknown LOG_LEVEL values', () => {
      process.env.LOG_LEVEL = 'verbose';
      const log = makeLogger();

      log.info('still works');

      expect(infoSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('error serialisation', () => {
    it('expands Error objects into structured fields', () => {
      makeLogger().error('something failed', new Error('bad things'));

      const record = lastRecord(errorSpy);

      expect(record.errorName).toBe('Error');
      expect(record.errorMessage).toBe('bad things');
      expect(record.stack).toContain('Error: bad things');
    });

    it('accepts plain objects as extra context', () => {
      makeLogger().error('failed', { code: 'TIMEOUT', retries: 3 });

      const record = lastRecord(errorSpy);

      expect(record.code).toBe('TIMEOUT');
      expect(record.retries).toBe(3);
    });

    it('merges extra fields alongside Error details', () => {
      makeLogger().error('failed', new Error('oops'), { traceId: 'xyz' });

      const record = lastRecord(errorSpy);

      expect(record.errorMessage).toBe('oops');
      expect(record.traceId).toBe('xyz');
    });
  });

  describe('child logger', () => {
    it('inherits parent service and stage', () => {
      const child = makeLogger().child({ requestId: 'req-1' });
      child.info('from child');

      const record = lastRecord(infoSpy);

      expect(record.service).toBe('test-svc');
      expect(record.stage).toBe('test');
      expect(record.requestId).toBe('req-1');
    });

    it('does not mutate the parent logger context', () => {
      const parent = makeLogger();
      parent.child({ secret: 'hidden' });
      parent.info('parent message');

      const record = lastRecord(infoSpy);

      expect(record.secret).toBeUndefined();
    });

    it('child context is merged with per-call extras', () => {
      const child = makeLogger().child({ requestId: 'req-2' });
      child.info('message', { itemId: 99 });

      const record = lastRecord(infoSpy);

      expect(record.requestId).toBe('req-2');
      expect(record.itemId).toBe(99);
    });
  });

  describe('withLambdaContext', () => {
    it('attaches requestId and functionName', () => {
      const log = makeLogger().withLambdaContext({
        awsRequestId: 'lambda-req-abc',
        functionName: 'my-function',
      });

      log.info('invoked');

      const record = lastRecord(infoSpy);

      expect(record.requestId).toBe('lambda-req-abc');
      expect(record.functionName).toBe('my-function');
    });
  });
});
