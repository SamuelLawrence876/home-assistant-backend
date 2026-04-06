import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ServerlessStack } from '../lib/main-stack';

describe('ServerlessStack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new App();
    const stack = new ServerlessStack(app, 'serverless-starter-test');
    template = Template.fromStack(stack);
  });

  it('deploys a Lambda function with the correct runtime and architecture', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'nodejs20.x',
      Architectures: ['arm64'],
    });
  });

  it('sets the correct Lambda timeout and memory', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Timeout: 10,
      MemorySize: 256,
    });
  });

  it('creates a dead letter queue', () => {
    template.resourceCountIs('AWS::SQS::Queue', 1);
  });

  it('creates an HTTP API', () => {
    template.resourceCountIs('AWS::ApiGatewayV2::Api', 1);
  });

  it('creates two API routes', () => {
    template.resourceCountIs('AWS::ApiGatewayV2::Route', 2);
  });

  it('outputs the API URL', () => {
    template.hasOutput('ApiUrl', {});
  });

  it('matches snapshot', () => {
    expect(template.toJSON()).toMatchSnapshot();
  });
});
