import { CfnOutput, Duration } from 'aws-cdk-lib';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  HttpVersion,
  OriginProtocolPolicy,
  OriginRequestPolicy,
  PriceClass,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { HttpOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';
import { config } from '../../config';

export class HaProxy extends Construct {
  public readonly distribution: Distribution;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const fqdn = `${config.domain.ha}.${config.domain.root}`;

    const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
      domainName: config.domain.root,
    });

    const certificate = new Certificate(this, 'Certificate', {
      domainName: fqdn,
      validation: CertificateValidation.fromDns(hostedZone),
    });

    this.distribution = new Distribution(this, 'Distribution', {
      comment: `${config.stackName}-ha-proxy`,
      domainNames: [fqdn],
      certificate,
      httpVersion: HttpVersion.HTTP2_AND_3,
      priceClass: PriceClass.PRICE_CLASS_ALL,
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultBehavior: {
        // Origin = Tailscale Funnel hostname. CloudFront uses this for SNI + Host,
        // so Tailscale's edge sees the right name and serves its *.ts.net cert.
        origin: new HttpOrigin(config.tailscale.funnelHost, {
          protocolPolicy: OriginProtocolPolicy.HTTPS_ONLY,
          httpsPort: 443,
          readTimeout: Duration.seconds(60),
          keepaliveTimeout: Duration.seconds(60),
        }),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        // Allow all methods so REST writes + WebSocket upgrades work.
        allowedMethods: AllowedMethods.ALLOW_ALL,
        // HA content is dynamic + authenticated; never cache.
        cachePolicy: CachePolicy.CACHING_DISABLED,
        // Forward everything except Host (so origin keeps sam.taile7763b.ts.net).
        originRequestPolicy: OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER,
      },
    });

    new ARecord(this, 'AliasRecord', {
      zone: hostedZone,
      recordName: config.domain.ha,
      target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
    });

    new CfnOutput(scope, 'HaProxyUrl', {
      value: `https://${fqdn}`,
      description: 'Home Assistant URL (CloudFront → Tailscale Funnel)',
    });

    new CfnOutput(scope, 'HaProxyDistributionId', {
      value: this.distribution.distributionId,
      description: 'HA proxy CloudFront distribution ID',
    });
  }
}
