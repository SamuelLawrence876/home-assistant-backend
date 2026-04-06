import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { handler } from './index';

const buildEvent = (path: string): APIGatewayProxyEventV2 =>
  ({
    rawPath: path,
    version: '2.0',
    routeKey: '$default',
    requestContext: {} as APIGatewayProxyEventV2['requestContext'],
    headers: {},
    isBase64Encoded: false,
    rawQueryString: '',
  } as APIGatewayProxyEventV2);

describe('requestHandler', () => {
  beforeEach(() => {
    process.env.SERVICE_NAME = 'test-service';
    process.env.STAGE = 'test';
  });

  it('returns a 200 health response for /health', async () => {
    const result = await handler(buildEvent('/health'));
    const body = JSON.parse(result.body as string);

    expect(result.statusCode).toBe(200);
    expect(body.status).toBe('healthy');
    expect(body.service).toBe('test-service');
    expect(body.stage).toBe('test');
  });

  it('returns a 200 response for any other path', async () => {
    const result = await handler(buildEvent('/api/items'));
    const body = JSON.parse(result.body as string);

    expect(result.statusCode).toBe(200);
    expect(body.service).toBe('test-service');
    expect(body.path).toBe('/api/items');
  });
});
