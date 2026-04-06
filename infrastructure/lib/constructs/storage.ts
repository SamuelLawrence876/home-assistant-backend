import { RemovalPolicy } from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket, BucketEncryption } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface StorageProps {
  namePrefix: string;
  isProd: boolean;
}

export class Storage extends Construct {
  public readonly bucket: Bucket;

  constructor(scope: Construct, id: string, props: StorageProps) {
    super(scope, id);

    const { namePrefix, isProd } = props;

    this.bucket = new Bucket(this, 'Bucket', {
      bucketName: `${namePrefix}-assets`,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
      versioned: isProd,
      enforceSSL: true,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      // Automatically empties bucket on destroy for ephemeral stacks
      autoDeleteObjects: !isProd,
    });
  }
}
