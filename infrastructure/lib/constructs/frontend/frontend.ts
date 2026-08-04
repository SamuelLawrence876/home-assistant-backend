import { CfnOutput, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  HttpVersion,
  PriceClass,
  ResponseHeadersPolicy,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import { config } from '../../config';

/**
 * S3 + CloudFront for the Glasshouse dashboard.
 *
 * This construct owns the *infrastructure* only. Bucket contents belong to the ui repo
 * (SamuelLawrence876/home-assistant-ui, .github/workflows/deploy.yml), which syncs its own
 * build and invalidates this distribution. Deliberately no BucketDeployment here: it would
 * make `cdk deploy` a second publisher of the same bucket, republishing (and pruning against)
 * whatever stale bundle happened to be on the deployer's disk.
 */
export class Frontend extends Construct {
  public readonly bucket: Bucket;

  public readonly distribution: Distribution;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const fqdn = `${config.domain.app}.${config.domain.root}`;

    const hostedZone = HostedZone.fromLookup(this, 'HostedZone', {
      domainName: config.domain.root,
    });

    const certificate = new Certificate(this, 'Certificate', {
      domainName: fqdn,
      validation: CertificateValidation.fromDns(hostedZone),
    });

    this.bucket = new Bucket(this, 'Bucket', {
      bucketName: `${config.stackName}-frontend-${Stack.of(this).account}`,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    this.distribution = new Distribution(this, 'Distribution', {
      comment: `${config.stackName}-frontend`,
      domainNames: [fqdn],
      certificate,
      defaultRootObject: 'index.html',
      httpVersion: HttpVersion.HTTP2_AND_3,
      priceClass: PriceClass.PRICE_CLASS_ALL,
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      defaultBehavior: {
        origin: S3BucketOrigin.withOriginAccessControl(this.bucket),
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        // HSTS, nosniff, X-Frame-Options: SAMEORIGIN, strict-origin-when-cross-origin.
        // The managed policy sets no CSP, so the app's WebSocket to the Funnel host and its
        // calls to api.spotify.com keep working.
        responseHeadersPolicy: ResponseHeadersPolicy.SECURITY_HEADERS,
      },
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: Duration.seconds(0),
        },
      ],
    });

    new ARecord(this, 'AliasRecord', {
      zone: hostedZone,
      recordName: config.domain.app,
      target: RecordTarget.fromAlias(new CloudFrontTarget(this.distribution)),
    });

    new CfnOutput(scope, 'FrontendUrl', {
      value: `https://${fqdn}`,
      description: 'Frontend URL',
    });

    new CfnOutput(scope, 'FrontendBucketName', {
      value: this.bucket.bucketName,
      description: 'S3 bucket for frontend assets',
    });

    new CfnOutput(scope, 'FrontendDistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID (for cache invalidation)',
    });
  }
}
