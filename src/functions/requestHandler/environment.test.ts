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
    delete process.env.TABLE_NAME;
    delete process.env.BUCKET_NAME;

    const env = getEnvironment();

    expect(env.serviceName).toBe('home-assistant-backend');
    expect(env.tableName).toBe('home-assistant-devices');
    expect(env.bucketName).toBe('');
  });

  it('returns values from process.env', () => {
    process.env.SERVICE_NAME = 'my-service';
    process.env.TABLE_NAME = 'prod-table';
    process.env.BUCKET_NAME = 'my-bucket';

    const env = getEnvironment();

    expect(env.serviceName).toBe('my-service');
    expect(env.tableName).toBe('prod-table');
    expect(env.bucketName).toBe('my-bucket');
  });
});
