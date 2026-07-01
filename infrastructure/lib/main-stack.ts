import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiGateway } from './constructs/api/api-gateway';
import { Auth } from './constructs/auth/auth';
import { RequestHandler } from './constructs/lambda/request-handler';
import { Database } from './constructs/data/database';
import { Storage } from './constructs/data/storage';
import { Frontend } from './constructs/frontend/frontend';

export class HomeAssistantStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const database = new Database(this, 'Database');
    const storage = new Storage(this, 'Storage');

    const requestHandler = new RequestHandler(this, 'RequestHandler', {
      table: database.table,
      bucket: storage.bucket,
    });

    const auth = new Auth(this, 'Auth');
    new Frontend(this, 'Frontend');
    // HaProxy (ha.samuel-lawrence.com CloudFront -> Tailscale Funnel) retired 2026-07-01:
    // the Glasshouse UI now hits the Funnel (sam.taile7763b.ts.net) directly, so this
    // per-request-billed CloudFront proxy (~$14/mo) is no longer needed.
    new ApiGateway(this, 'Api', {
      handler: requestHandler.fn,
      authorizer: auth.authorizer,
    });
  }
}
