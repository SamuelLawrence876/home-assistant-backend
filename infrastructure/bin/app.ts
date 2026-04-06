#!/usr/bin/env node
import { App, Tags } from 'aws-cdk-lib';
import { ServerlessStack } from '../lib/main-stack';

const app = new App();

const stackName = (app.node.tryGetContext('stackName') as string | undefined) ?? 'serverless-starter';

// When -c stage=<value> is supplied (e.g. from a branch deploy) the stack is
// named <stackName>-<stage> so each branch gets its own isolated set of
// resources.  Without a stage the base name is used (production deploy).
const stage = app.node.tryGetContext('stage') as string | undefined;
const stackId = stage ? `${stackName}-${stage}` : stackName;

const stack = new ServerlessStack(app, stackId, {
  stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'eu-west-1',
  },
});

Tags.of(stack).add('Project', stackName);
Tags.of(stack).add('Stage', stage ?? 'production');
Tags.of(stack).add('ManagedBy', 'aws-cdk');
