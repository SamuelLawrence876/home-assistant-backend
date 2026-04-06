import { getEnvironment } from './environment';

describe('getEnvironment', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns defaults when env vars are absent', () => {
    delete process.env.SERVICE_NAME;
    delete process.env.STAGE;

    const env = getEnvironment();

    expect(env.serviceName).toBe('serverless-aws-template');
    expect(env.stage).toBe('local');
  });

  it('returns values from process.env', () => {
    process.env.SERVICE_NAME = 'my-service';
    process.env.STAGE = 'dev';

    const env = getEnvironment();

    expect(env.serviceName).toBe('my-service');
    expect(env.stage).toBe('dev');
  });
});
