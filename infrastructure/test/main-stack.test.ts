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

  it('creates a dead letter queue for the Lambda', () => {
    template.resourceCountIs('AWS::SQS::Queue', 1);
  });

  it('creates a DynamoDB table with pay-per-request billing', () => {
    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
      PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true },
    });
  });

  it('creates an S3 bucket with encryption and public access blocked', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          { ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
      VersioningConfiguration: { Status: 'Enabled' },
    });
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
