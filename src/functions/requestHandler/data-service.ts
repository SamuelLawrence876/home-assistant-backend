import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export interface Item {
  pk: string;
  sk: string;
  [key: string]: unknown;
}

export const getItem = async (pk: string, sk: string): Promise<Item | undefined> => {
  const result = await ddbClient.send(
    new GetCommand({
      TableName: process.env.TABLE_NAME ?? 'items-table',
      Key: { pk, sk },
    }),
  );

  return result.Item as Item | undefined;
};

export const queryByPartitionKey = async (pk: string): Promise<Item[]> => {
  const result = await ddbClient.send(
    new QueryCommand({
      TableName: process.env.TABLE_NAME ?? 'items-table',
      KeyConditionExpression: '#pk = :pk',
      ExpressionAttributeNames: { '#pk': 'pk' },
      ExpressionAttributeValues: { ':pk': pk },
    }),
  );

  return (result.Items ?? []) as Item[];
};
