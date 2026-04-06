import { CfnOutput } from 'aws-cdk-lib';
import { HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface ApiGatewayProps {
  handler: IFunction;
}

export class ApiGateway extends Construct {
  public readonly api: HttpApi;

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    this.api = new HttpApi(this, 'HttpApi', {
      apiName: `${scope.node.id}-api`,
    });

    this.api.addRoutes({
      path: '/health',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('HealthIntegration', props.handler),
    });

    this.api.addRoutes({
      path: '/{proxy+}',
      methods: [HttpMethod.ANY],
      integration: new HttpLambdaIntegration('ProxyIntegration', props.handler),
    });

    new CfnOutput(scope, 'ApiUrl', {
      value: this.api.url ?? '',
      description: 'HTTP API endpoint URL',
    });
  }
}
