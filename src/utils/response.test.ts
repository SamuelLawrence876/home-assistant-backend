import {
  ok,
  created,
  noContent,
  badRequest,
  unauthorised,
  forbidden,
  notFound,
  conflict,
  unprocessable,
  tooManyRequests,
  internalError,
} from './response';

const parseBody = (body: string | undefined) => JSON.parse(body ?? '{}');

describe('response helpers', () => {
  it.each([
    ['ok', ok({ id: 1 }), 200],
    ['created', created({ id: 2 }), 201],
    ['noContent', noContent(), 204],
    ['badRequest', badRequest('invalid'), 400],
    ['unauthorised', unauthorised(), 401],
    ['forbidden', forbidden(), 403],
    ['notFound', notFound(), 404],
    ['conflict', conflict('already exists'), 409],
    ['unprocessable', unprocessable('validation failed'), 422],
    ['tooManyRequests', tooManyRequests(), 429],
    ['internalError', internalError(), 500],
  ])('%s returns status %d', (_name, result, expectedStatus) => {
    expect(result.statusCode).toBe(expectedStatus);
  });

  it('sets Content-Type header for JSON responses', () => {
    expect(ok({}).headers?.['Content-Type']).toBe('application/json');
  });

  it('noContent has no body', () => {
    expect(noContent().body).toBeUndefined();
  });

  it('ok serialises body to JSON', () => {
    const result = ok({ message: 'hello', count: 3 });
    expect(parseBody(result.body as string)).toEqual({ message: 'hello', count: 3 });
  });

  it('badRequest includes message and optional details', () => {
    const result = badRequest('name is required', { field: 'name' });
    const body = parseBody(result.body as string);

    expect(body.error).toBe('Bad Request');
    expect(body.message).toBe('name is required');
    expect(body.details).toEqual({ field: 'name' });
  });

  it('badRequest omits details when not provided', () => {
    const body = parseBody(badRequest('oops').body as string);
    expect(body.details).toBeUndefined();
  });

  it('notFound uses default message', () => {
    const body = parseBody(notFound().body as string);
    expect(body.message).toBe('Not found');
  });

  it('notFound uses custom message', () => {
    const body = parseBody(notFound('user not found').body as string);
    expect(body.message).toBe('user not found');
  });
});
