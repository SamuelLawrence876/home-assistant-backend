import { Duration } from 'aws-cdk-lib';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as path from 'path';

export interface RequestHandlerProps {
  namePrefix: string;
  stage: string;
  table: ITable;
  bucket: IBucket;
}

export class RequestHandler extends Construct {
  public readonly fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: RequestHandlerProps) {
    super(scope, id);

    const { namePrefix, stage, table, bucket } = props;

    const dlq = new Queue(this, 'Dlq', {
      queueName: `${namePrefix}-request-handler-dlq`,
      retentionPeriod: Duration.days(14),
    });

    this.fn = new NodejsFunction(this, 'Function', {
      functionName: `${namePrefix}-request-handler`,
      runtime: Runtime.NODEJS_20_X,
      architecture: Architecture.ARM_64,
      entry: path.join(__dirname, '../../../../src/functions/requestHandler/index.ts'),
      handler: 'handler',
      timeout: Duration.seconds(10),
      memorySize: 256,
      environment: {
        SERVICE_NAME: `${namePrefix}-request-handler`,
        STAGE: stage,
        TABLE_NAME: table.tableName,
        BUCKET_NAME: bucket.bucketName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
      deadLetterQueue: dlq,
    });

    table.grantReadWriteData(this.fn);
    bucket.grantReadWrite(this.fn);
  }
}
