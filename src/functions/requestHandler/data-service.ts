import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import type { Device } from '../../models';
import { getEnvironment } from './environment';

const ddbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const getDevice = async (
  householdId: string,
  deviceId: string,
): Promise<Device | undefined> => {
  const { tableName } = getEnvironment();
  const result = await ddbClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk: `household#${householdId}`, sk: `device#${deviceId}` },
    }),
  );

  return result.Item as Device | undefined;
};

export const listDevicesByHousehold = async (householdId: string): Promise<Device[]> => {
  const { tableName } = getEnvironment();
  const result = await ddbClient.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: '#pk = :pk AND begins_with(#sk, :devicePrefix)',
      ExpressionAttributeNames: { '#pk': 'pk', '#sk': 'sk' },
      ExpressionAttributeValues: {
        ':pk': `household#${householdId}`,
        ':devicePrefix': 'device#',
      },
    }),
  );

  return (result.Items ?? []) as Device[];
};
