#!/usr/bin/env node
import { App, Tags } from 'aws-cdk-lib';
import { ServerlessStack } from '../lib/main-stack';

const app = new App();

const baseName = (app.node.tryGetContext('stackName') as string | undefined) ?? 'serverless-starter';

// When deploying an ephemeral branch environment, pass -c stage=<ticket-or-pr-id>
// This produces a uniquely named stack per branch: e.g. serverless-starter-proj-123
const stage = app.node.tryGetContext('stage') as string | undefined;
const stackId = stage ? `${baseName}-${stage}` : baseName;

const stack = new ServerlessStack(app, stackId, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'eu-west-1',
  },
});

Tags.of(stack).add('Project', baseName);
Tags.of(stack).add('Stage', stage ?? 'stable');
Tags.of(stack).add('ManagedBy', 'aws-cdk');
