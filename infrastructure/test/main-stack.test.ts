import { App } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { config } from '../lib/config';
import { HomeAssistantStack } from '../lib/main-stack';

const ACCOUNT = '123456789012';
const APP_FQDN = `${config.domain.app}.${config.domain.root}`;
const API_FQDN = `${config.domain.api}.${config.domain.root}`;

// Managed CloudFront response headers policy "SecurityHeadersPolicy".
const SECURITY_HEADERS_POLICY_ID = '67f7725c-6f97-4210-82d7-5512b31e9d03';

// HostedZone.fromLookup needs a concrete environment plus a cached answer; without the
// context entry the synth falls back to a dummy zone and reports missing context.
const app = new App({
  context: {
    [`hosted-zone:account=${ACCOUNT}:domainName=${config.domain.root}:region=${config.deploymentRegion}`]:
      {
        Id: '/hostedzone/ZTESTHOSTEDZONE',
        Name: `${config.domain.root}.`,
      },
  },
});

const stack = new HomeAssistantStack(app, config.stackName, {
  env: { account: ACCOUNT, region: config.deploymentRegion },
});

const template = Template.fromStack(stack);

describe('HomeAssistantStack', () => {
  describe('frontend', () => {
    it('publishes exactly one CloudFront distribution — the dashboard', () => {
      // Also guards the retired HaProxy: a second distribution here means it came back.
      template.resourceCountIs('AWS::CloudFront::Distribution', 1);
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({ Aliases: [APP_FQDN] }),
      });
    });

    it('sends security response headers to viewers', () => {
      template.hasResourceProperties('AWS::CloudFront::Distribution', {
        DistributionConfig: Match.objectLike({
          DefaultCacheBehavior: Match.objectLike({
            ResponseHeadersPolicyId: SECURITY_HEADERS_POLICY_ID,
            ViewerProtocolPolicy: 'redirect-to-https',
          }),
        }),
      });
    });

    it('does not publish the UI bundle — the ui repo owns bucket contents', () => {
      template.resourceCountIs('Custom::CDKBucketDeployment', 0);
    });

    it('claims DNS for the dashboard and the API, nothing else', () => {
      template.resourceCountIs('AWS::Route53::RecordSet', 2);
      template.hasResourceProperties('AWS::Route53::RecordSet', { Name: `${APP_FQDN}.` });
      template.hasResourceProperties('AWS::Route53::RecordSet', { Name: `${API_FQDN}.` });
    });
  });

  describe('auth', () => {
    it('keeps the user pool admin-create-only', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        AdminCreateUserConfig: Match.objectLike({ AllowAdminCreateUserOnly: true }),
      });
    });

    it('sends the hosted UI back to the dashboard', () => {
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        CallbackURLs: [`https://${APP_FQDN}/`],
        LogoutURLs: [`https://${APP_FQDN}/`],
      });
    });
  });

  describe('api', () => {
    it('leaves /health open and authorises everything else with the JWT authoriser', () => {
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'GET /health',
        AuthorizationType: 'NONE',
      });
      template.hasResourceProperties('AWS::ApiGatewayV2::Route', {
        RouteKey: 'ANY /{proxy+}',
        AuthorizationType: 'JWT',
      });
    });
  });

  describe('request handler', () => {
    it('runs on the pinned runtime with a dead letter queue', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `${config.stackName}-request-handler`,
        Runtime: 'nodejs22.x',
        Architectures: ['arm64'],
        DeadLetterConfig: Match.anyValue(),
      });
    });

    it('gets read-only access to the table and the bucket', () => {
      const policies = Object.entries(template.findResources('AWS::IAM::Policy'))
        .filter(([logicalId]) => logicalId.startsWith('RequestHandler'))
        .map(([, resource]) => resource.Properties.PolicyDocument);
      const granted = JSON.stringify(policies);

      expect(policies).not.toHaveLength(0);
      expect(granted).toMatch(/dynamodb:GetItem/);
      expect(granted).toMatch(/s3:GetObject/);
      expect(granted).not.toMatch(/dynamodb:(PutItem|UpdateItem|DeleteItem|BatchWriteItem)/);
      expect(granted).not.toMatch(/s3:(PutObject|DeleteObject|Abort)/);
    });
  });
});
