import type { APIGatewayProxyStructuredResultV2 } from 'aws-lambda';

type JsonBody = Record<string, unknown> | unknown[] | string | number | boolean | null;

const json = (statusCode: number, body: JsonBody): APIGatewayProxyStructuredResultV2 => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export const ok = (body: JsonBody): APIGatewayProxyStructuredResultV2 => json(200, body);

export const created = (body: JsonBody): APIGatewayProxyStructuredResultV2 => json(201, body);

export const noContent = (): APIGatewayProxyStructuredResultV2 => ({ statusCode: 204 });

export const badRequest = (message: string, details?: JsonBody): APIGatewayProxyStructuredResultV2 =>
  json(400, { error: 'Bad Request', message, ...(details ? { details } : {}) });

export const unauthorised = (message = 'Unauthorised'): APIGatewayProxyStructuredResultV2 =>
  json(401, { error: 'Unauthorised', message });

export const forbidden = (message = 'Forbidden'): APIGatewayProxyStructuredResultV2 =>
  json(403, { error: 'Forbidden', message });

export const notFound = (message = 'Not found'): APIGatewayProxyStructuredResultV2 =>
  json(404, { error: 'Not Found', message });

export const conflict = (message: string): APIGatewayProxyStructuredResultV2 =>
  json(409, { error: 'Conflict', message });

export const unprocessable = (message: string, details?: JsonBody): APIGatewayProxyStructuredResultV2 =>
  json(422, { error: 'Unprocessable Entity', message, ...(details ? { details } : {}) });

export const tooManyRequests = (message = 'Too many requests'): APIGatewayProxyStructuredResultV2 =>
  json(429, { error: 'Too Many Requests', message });

export const internalError = (message = 'Internal server error'): APIGatewayProxyStructuredResultV2 =>
  json(500, { error: 'Internal Server Error', message });
