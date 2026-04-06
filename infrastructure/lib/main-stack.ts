import { CfnOutput, Duration, Stack, StackProps } from 'aws-cdk-lib';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ServerlessStackProps extends StackProps {
  // Passed from bin/app.ts when deploying an ephemeral branch environment.
  // Omit for a production deploy.
  stage?: string;
}

export class ServerlessStack extends Stack {
  constructor(scope: Construct, id: string, props?: ServerlessStackProps) {
    super(scope, id, props);

    const stage = props?.stage ?? 'production';

    const deadLetterQueue = new Queue(this, 'RequestHandlerDlq', {
      retentionPeriod: Duration.days(14),
    });

    const requestHandler = new NodejsFunction(this, 'RequestHandler', {
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      entry: path.join(__dirname, '../../src/functions/requestHandler/index.ts'),
      handler: 'handler',
      timeout: Duration.seconds(10),
      memorySize: 256,
      environment: {
        SERVICE_NAME: id,
        STAGE: stage,
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
      deadLetterQueue,
    });

    const api = new HttpApi(this, 'Api', {
      apiName: `${id}-api`,
    });

    api.addRoutes({
      path: '/health',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('HealthIntegration', requestHandler),
    });

    api.addRoutes({
      path: '/{proxy+}',
      methods: [HttpMethod.ANY],
      integration: new HttpLambdaIntegration('ProxyIntegration', requestHandler),
    });

    new CfnOutput(this, 'ApiUrl', {
      value: api.url ?? '',
      description: 'HTTP API endpoint URL',
    });
  }
}
