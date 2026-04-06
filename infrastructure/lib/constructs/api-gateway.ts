import { CfnOutput } from 'aws-cdk-lib';
import { DomainName, HttpApi, HttpMethod } from 'aws-cdk-lib/aws-apigatewayv2';
import { HttpLambdaIntegration } from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { IFunction } from 'aws-cdk-lib/aws-lambda';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { ApiGatewayv2DomainProperties } from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface CustomDomainConfig {
  /** Root domain managed in Route 53, e.g. "samuel-lawrence.com" */
  rootDomain: string;
  /** Subdomain to attach, e.g. "api" → api.samuel-lawrence.com */
  subdomain: string;
}

export interface ApiGatewayProps {
  handler: IFunction;
  namePrefix: string;
  customDomain?: CustomDomainConfig;
}

export class ApiGateway extends Construct {
  public readonly api: HttpApi;

  constructor(scope: Construct, id: string, props: ApiGatewayProps) {
    super(scope, id);

    const { handler, namePrefix, customDomain } = props;

    let defaultDomainMapping: { domainName: DomainName } | undefined;

    if (customDomain) {
      const fqdn = `${customDomain.subdomain}.${customDomain.rootDomain}`;

      // Looks up the hosted zone by root domain name.
      // Requires the hosted zone to already exist in this AWS account.
      const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
        domainName: customDomain.rootDomain,
      });

      const certificate = new Certificate(this, 'Certificate', {
        domainName: fqdn,
        validation: CertificateValidation.fromDns(hostedZone),
      });

      const apiDomain = new DomainName(this, 'DomainName', {
        domainName: fqdn,
        certificate,
      });

      new ARecord(this, 'AliasRecord', {
        zone: hostedZone,
        recordName: customDomain.subdomain,
        target: RecordTarget.fromAlias(
          new ApiGatewayv2DomainProperties(
            apiDomain.regionalDomainName,
            apiDomain.regionalHostedZoneId,
          ),
        ),
      });

      defaultDomainMapping = { domainName: apiDomain };

      new CfnOutput(scope, 'CustomDomainUrl', {
        value: `https://${fqdn}`,
        description: 'Custom domain URL',
      });
    }

    this.api = new HttpApi(this, 'HttpApi', {
      apiName: `${namePrefix}-api`,
      ...(defaultDomainMapping ? { defaultDomainMapping } : {}),
    });

    this.api.addRoutes({
      path: '/health',
      methods: [HttpMethod.GET],
      integration: new HttpLambdaIntegration('HealthIntegration', handler),
    });

    this.api.addRoutes({
      path: '/{proxy+}',
      methods: [HttpMethod.ANY],
      integration: new HttpLambdaIntegration('ProxyIntegration', handler),
    });

    new CfnOutput(scope, 'ApiUrl', {
      value: this.api.url ?? '',
      description: 'HTTP API endpoint URL',
    });
  }
}
