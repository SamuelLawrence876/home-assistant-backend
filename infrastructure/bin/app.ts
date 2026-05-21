#!/usr/bin/env node
import { App, Tags } from 'aws-cdk-lib';
import { config } from '../lib/config';
import { HomeAssistantStack } from '../lib/main-stack';

const app = new App();

const stack = new HomeAssistantStack(app, config.stackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT ?? process.env.AWS_ACCOUNT_ID,
    region: config.deploymentRegion,
  },
});

Tags.of(stack).add('Project', config.stackName);
Tags.of(stack).add('ManagedBy', 'aws-cdk');
