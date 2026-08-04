import { Duration } from 'aws-cdk-lib';
import { ITable } from 'aws-cdk-lib/aws-dynamodb';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { IBucket } from 'aws-cdk-lib/aws-s3';
import { Queue } from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';
import * as path from 'path';
import { config } from '../../config';

export interface RequestHandlerProps {
  table: ITable;
  bucket: IBucket;
}

export class RequestHandler extends Construct {
  public readonly fn: NodejsFunction;

  constructor(scope: Construct, id: string, props: RequestHandlerProps) {
    super(scope, id);

    const { table, bucket } = props;
    const functionName = `${config.stackName}-request-handler`;

    const dlq = new Queue(this, 'Dlq', {
      queueName: `${functionName}-dlq`,
      retentionPeriod: Duration.days(14),
    });

    this.fn = new NodejsFunction(this, 'Function', {
      functionName,
      runtime: Runtime.NODEJS_22_X,
      architecture: Architecture.ARM_64,
      entry: path.join(__dirname, '../../../../src/functions/requestHandler/index.ts'),
      handler: 'handler',
      timeout: Duration.seconds(10),
      memorySize: 256,
      environment: {
        SERVICE_NAME: functionName,
        TABLE_NAME: table.tableName,
        BUCKET_NAME: bucket.bucketName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
      },
      deadLetterQueue: dlq,
    });

    // Read-only: the handler only serves /health and data-service.ts only does Get/Query.
    // Widen per-route when a write path actually ships.
    table.grantReadData(this.fn);
    bucket.grantRead(this.fn);
  }
}
