#!/usr/bin/env node
import { App, Tags } from 'aws-cdk-lib';
import { ServerlessStack } from '../lib/main-stack';

const app = new App();

const stackName =
  (app.node.tryGetContext('stackName') as string | undefined) ?? 'serverless-starter';

// When -c stage=<value> is passed the stack is named <stackName>-<stage> and
// all resources are prefixed with that stage (e.g. "abc-123-items").
// Without a stage context the base name is used — that is the production deploy.
const stage = app.node.tryGetContext('stage') as string | undefined;
const stackId = stage ? `${stackName}-${stage}` : stackName;

const stack = new ServerlessStack(app, stackId, {
  stage,
  // Custom domain is wired up only for production (no -c stage flag).
  // Change subdomain or rootDomain to match your setup.
  customDomain: stage
    ? undefined
    : {
        rootDomain: 'samuel-lawrence.com',
        subdomain: 'api',
      },
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'eu-west-1',
  },
});

Tags.of(stack).add('Project', stackName);
Tags.of(stack).add('Stage', stage ?? 'production');
Tags.of(stack).add('ManagedBy', 'aws-cdk');
