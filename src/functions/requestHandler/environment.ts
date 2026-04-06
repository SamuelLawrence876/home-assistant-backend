export interface Environment {
  serviceName: string;
  stage: string;
}

export const getEnvironment = (): Environment => ({
  serviceName: process.env.SERVICE_NAME ?? 'serverless-aws-template',
  stage: process.env.STAGE ?? 'local',
});
