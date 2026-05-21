import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiGateway } from './constructs/api/api-gateway';
import { Auth } from './constructs/auth/auth';
import { RequestHandler } from './constructs/lambda/request-handler';
import { Database } from './constructs/data/database';
import { Storage } from './constructs/data/storage';
import { Frontend } from './constructs/frontend/frontend';

export type StackType = 'prod' | 'ephemeral';

export interface HomeAssistantStackProps extends StackProps {
  stackType: StackType;
  stage: string;
}

export class HomeAssistantStack extends Stack {
  constructor(scope: Construct, id: string, props: HomeAssistantStackProps) {
    super(scope, id, props);

    const { stackType, stage } = props;
    const isProd = stackType === 'prod';

    const database = new Database(this, 'Database', { stage });
    const storage = new Storage(this, 'Storage', { stage });

    const requestHandler = new RequestHandler(this, 'RequestHandler', {
      stage,
      table: database.table,
      bucket: storage.bucket,
    });

    if (isProd) {
      const auth = new Auth(this, 'Auth', { stage });
      new Frontend(this, 'Frontend', { stage });
      new ApiGateway(this, 'Api', {
        handler: requestHandler.fn,
        stage,
        isProd: true,
        authorizer: auth.authorizer,
      });
    } else {
      new ApiGateway(this, 'Api', {
        handler: requestHandler.fn,
        stage,
        isProd: false,
      });
    }
  }
}
