import type { APIGatewayProxyEventV2, APIGatewayProxyStructuredResultV2, Context } from 'aws-lambda';
import { logger as rootLogger } from '../../utils/logger';
import { internalError, notFound, ok } from '../../utils/response';
import { getEnvironment } from './environment';

export const handler = async (
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyStructuredResultV2> => {
  const { serviceName, stage } = getEnvironment();
  const log = rootLogger.withLambdaContext(context).child({ path: event.rawPath });

  log.info('request received');

  try {
    if (event.rawPath === '/health') {
      log.debug('health check');
      return ok({ status: 'healthy', service: serviceName, stage });
    }

    log.warn('unmatched route', { rawPath: event.rawPath });
    return notFound(`No route for ${event.rawPath}`);
  } catch (err) {
    log.error('unhandled error', err instanceof Error ? err : new Error(String(err)));
    return internalError();
  }
};
