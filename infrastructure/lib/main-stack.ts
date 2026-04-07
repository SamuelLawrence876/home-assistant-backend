import { Stack, StackProps } from 'aws-cdk-lib';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { config } from './config';
import { ApiGateway } from './constructs/api/api-gateway';
import { Auth } from './constructs/auth/auth';
import { RequestHandler } from './constructs/lambda/request-handler';
import { Database } from './constructs/data/database';
import { Storage } from './constructs/data/storage';
import { Frontend } from './constructs/frontend/frontend';

export type StackType = 'prod' | 'dev' | 'ephemeral';

export interface ServerlessStackProps extends StackProps {
  stackType: StackType;
  stage: string;
}

export class ServerlessStack extends Stack {
  constructor(scope: Construct, id: string, props: ServerlessStackProps) {
    super(scope, id, props);

    const { stackType, stage } = props;
    const isProd = stackType === 'prod';

    const database = new Database(this, 'Database', { stage, isProd });
    const storage = new Storage(this, 'Storage', { stage, isProd });

    const requestHandler = new RequestHandler(this, 'RequestHandler', {
      stage,
      table: database.table,
      bucket: storage.bucket,
    });

    const { api } = new ApiGateway(this, 'Api', { handler: requestHandler.fn, stage, isProd });

    if (stackType === 'ephemeral') {
      const issuerUrl = StringParameter.valueForStringParameter(this, config.ssm.cognitoIssuerUrl);
      const clientId = StringParameter.valueForStringParameter(this, config.ssm.cognitoClientId);
      const authorizer = new HttpJwtAuthorizer('JwtAuthorizer', issuerUrl, {
        jwtAudience: [clientId],
      });
      api.addDefaultAuthorizer(authorizer);
    } else {
      const auth = new Auth(this, 'Auth', { stage, isProd });
      api.addDefaultAuthorizer(auth.authorizer);
      new Frontend(this, 'Frontend', { stage, isProd });
    }
  }
}
