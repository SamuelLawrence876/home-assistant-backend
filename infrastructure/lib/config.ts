export const config = {
  stackName: 'home-assistant',
  deploymentRegion: 'us-east-1',

  domain: {
    root: 'samuel-lawrence.com',
    api: 'home-assistant-api',
    app: 'home-assistant',
    auth: 'home-assistant-auth',
  },
} as const;
