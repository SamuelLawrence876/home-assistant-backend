export const config = {
  stackName: 'serverless-starter',
  deploymentRegion: 'us-east-1',

  domain: {
    root: 'samuel-lawrence.com',
    api: 'example-api',
    app: 'example-app',
    auth: 'example-auth',
  },

  ssm: {
    cognitoIssuerUrl: '/serverless-starter/dev/cognito/issuer-url',
    cognitoClientId: '/serverless-starter/dev/cognito/client-id',
  },
} as const;
