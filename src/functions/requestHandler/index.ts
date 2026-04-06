import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2 } from 'aws-lambda';
import { getEnvironment } from './environment';

const jsonResponse = (statusCode: number, body: unknown): APIGatewayProxyStructuredResultV2 => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const handler = async (
  event: APIGatewayProxyEventV2,
): Promise<APIGatewayProxyStructuredResultV2> => {
  const { serviceName, stage } = getEnvironment();

  if (event.rawPath === '/health') {
    return jsonResponse(200, { status: 'healthy', service: serviceName, stage });
  }

  return jsonResponse(200, { service: serviceName, path: event.rawPath });
};
