import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { ServerlessStack } from '../lib/main-stack';

describe('ServerlessStack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new App();
    const stack = new ServerlessStack(app, 'serverless-starter-test', {
      stage: 'test',
      env: {
        account: '123456789012',
        region: 'eu-west-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('Lambda', () => {
    it('deploys with the correct runtime and architecture', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: 'test-request-handler',
        Runtime: 'nodejs20.x',
        Architectures: ['arm64'],
        Timeout: 10,
        MemorySize: 256,
      });
    });
  });

  describe('SQS', () => {
    it('creates a dead letter queue named after the stage', () => {
      template.hasResourceProperties('AWS::SQS::Queue', {
        QueueName: 'test-request-handler-dlq',
      });
    });
  });

  describe('DynamoDB', () => {
    it('creates a table named after the stage', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'test-items',
        BillingMode: 'PAY_PER_REQUEST',
      });
    });

    it('disables PITR for non-production stages', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: false },
      });
    });
  });

  describe('S3', () => {
    it('creates a bucket named after the stage', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'test-assets',
      });
    });

    it('blocks all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });

  describe('API Gateway', () => {
    it('creates an HTTP API named after the stage', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Api', {
        Name: 'test-api',
      });
    });

    it('creates two routes', () => {
      template.resourceCountIs('AWS::ApiGatewayV2::Route', 2);
    });

    it('outputs the API URL', () => {
      template.hasOutput('ApiUrl', {});
    });
  });

  it('matches snapshot', () => {
    expect(template.toJSON()).toMatchSnapshot();
  });
});
