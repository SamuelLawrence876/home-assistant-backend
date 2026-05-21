import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import 'aws-sdk-client-mock-jest';
import { getDevice, listDevicesByHousehold } from './data-service';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('data-service', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  describe('getDevice', () => {
    it('returns the device when found', async () => {
      const device = {
        pk: 'household#h1',
        sk: 'device#d1',
        householdId: 'h1',
        deviceId: 'd1',
        name: 'Living Room Lamp',
        type: 'light',
        status: 'online',
      };
      ddbMock.on(GetCommand).resolves({ Item: device });

      const result = await getDevice('h1', 'd1');

      expect(result).toEqual(device);
      expect(ddbMock).toHaveReceivedCommandWith(GetCommand, {
        Key: { pk: 'household#h1', sk: 'device#d1' },
      });
    });

    it('returns undefined when device is not found', async () => {
      ddbMock.on(GetCommand).resolves({ Item: undefined });

      const result = await getDevice('missing', 'missing');

      expect(result).toBeUndefined();
    });

    it('propagates DynamoDB errors', async () => {
      ddbMock.on(GetCommand).rejects(new Error('DynamoDB unavailable'));

      await expect(getDevice('h1', 'd1')).rejects.toThrow('DynamoDB unavailable');
    });
  });

  describe('listDevicesByHousehold', () => {
    it('returns devices for the household', async () => {
      const devices = [
        {
          pk: 'household#h1',
          sk: 'device#d1',
          householdId: 'h1',
          deviceId: 'd1',
          name: 'Front Door Lock',
          type: 'lock',
          status: 'online',
        },
        {
          pk: 'household#h1',
          sk: 'device#d2',
          householdId: 'h1',
          deviceId: 'd2',
          name: 'Hallway Thermostat',
          type: 'thermostat',
          status: 'online',
        },
      ];

      ddbMock
        .on(QueryCommand, {
          ExpressionAttributeValues: { ':pk': 'household#h1', ':devicePrefix': 'device#' },
        })
        .resolves({ Items: devices });

      const result = await listDevicesByHousehold('h1');

      expect(result).toEqual(devices);
    });

    it('returns an empty array when no devices match', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: undefined });

      const result = await listDevicesByHousehold('unknown');

      expect(result).toEqual([]);
    });
  });
});
