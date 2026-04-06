#!/usr/bin/env node
import { App, Tags } from 'aws-cdk-lib';
import { ServerlessStack } from '../lib/main-stack';

const app = new App();

const stackName = (app.node.tryGetContext('stackName') as string | undefined) ?? 'serverless-starter';

const stack = new ServerlessStack(app, stackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'eu-west-1',
  },
});

Tags.of(stack).add('Project', stackName);
Tags.of(stack).add('ManagedBy', 'aws-cdk');
