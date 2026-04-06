import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiGateway } from './constructs/api-gateway';
import { Database } from './constructs/database';
import { RequestHandler } from './constructs/request-handler';
import { Storage } from './constructs/storage';

export interface ServerlessStackProps extends StackProps {
  stage?: string;
}

export class ServerlessStack extends Stack {
  constructor(scope: Construct, id: string, props?: ServerlessStackProps) {
    super(scope, id, props);

    const stage = props?.stage ?? 'production';
    const isProd = stage === 'production';

    const database = new Database(this, 'Database', { stage, isProd });
    const storage = new Storage(this, 'Storage', { stage, isProd });

    const requestHandler = new RequestHandler(this, 'RequestHandler', {
      stage,
      table: database.table,
      bucket: storage.bucket,
    });

    new ApiGateway(this, 'Api', { handler: requestHandler.fn, stage });
  }
}
