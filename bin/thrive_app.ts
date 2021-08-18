#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { ThriveAppStack } from '../lib/infrastructure/thrive_app-stack';

const app = new cdk.App();
new ThriveAppStack(app, 'ThriveAppStack');
