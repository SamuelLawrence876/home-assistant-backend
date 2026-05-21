export interface Environment {
  serviceName: string;
  tableName: string;
  bucketName: string;
}

export const getEnvironment = (): Environment => ({
  serviceName: process.env.SERVICE_NAME ?? 'home-assistant-backend',
  tableName: process.env.TABLE_NAME ?? 'home-assistant-devices',
  bucketName: process.env.BUCKET_NAME ?? '',
});
