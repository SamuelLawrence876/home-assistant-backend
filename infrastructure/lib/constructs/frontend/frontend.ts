import { CfnOutput, Duration, RemovalPolicy, Stack } from 'aws-cdk-lib';
import {
  AllowedMethods,
  CachePolicy,
  Distribution,
  HttpVersion,
  PriceClass,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as path from 'path';
import { config } from '../../config';

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

    // Uploads ui/dist to S3 and invalidates CloudFront on every deploy.
    // The dist directory must exist at synth time — run `npm run build` in ui/ first.
    new BucketDeployment(this, 'DeployFrontend', {
      sources: [Source.asset(path.join(__dirname, '../../../../../ui/dist'))],
      destinationBucket: this.bucket,
      distribution: this.distribution,
      distributionPaths: ['/*'],
      prune: true,
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
