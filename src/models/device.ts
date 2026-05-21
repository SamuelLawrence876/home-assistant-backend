export type DeviceType = 'light' | 'thermostat' | 'lock' | 'sensor' | 'camera' | 'switch' | 'other';

export type DeviceStatus = 'online' | 'offline' | 'unknown';

export interface Device {
  pk: string;
  sk: string;
  householdId: string;
  deviceId: string;
  name: string;
  type: DeviceType;
  room?: string;
  status: DeviceStatus;
  state?: Record<string, unknown>;
  firmwareVersion?: string;
  lastSeenAt?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}
