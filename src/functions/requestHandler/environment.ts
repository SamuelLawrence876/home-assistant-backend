export interface Environment {
  serviceName: string;
  stage: string;
  tableName: string;
  bucketName: string;
}

export const getEnvironment = (): Environment => ({
  serviceName: process.env.SERVICE_NAME ?? 'home-assistant-backend',
  stage: process.env.STAGE ?? 'local',
  tableName: process.env.TABLE_NAME ?? 'devices-table',
  bucketName: process.env.BUCKET_NAME ?? '',
});
