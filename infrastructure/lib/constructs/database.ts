import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface DatabaseProps {
  namePrefix: string;
  isProd: boolean;
}

export class Database extends Construct {
  public readonly table: Table;

  constructor(scope: Construct, id: string, props: DatabaseProps) {
    super(scope, id);

    const { namePrefix, isProd } = props;

    this.table = new Table(this, 'Table', {
      tableName: `${namePrefix}-items`,
      partitionKey: { name: 'pk', type: AttributeType.STRING },
      sortKey: { name: 'sk', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: isProd,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
    });
  }
}
