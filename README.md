# home-assistant-backend

Backend service for **Home Assistant** — an AWS serverless API for managing smart-home devices, automations, and telemetry. Built with **AWS CDK v2**, **TypeScript**, and **GitHub Actions**.

## What's included

- **Lambda function** (`home-assistant-request-handler`) with typed API Gateway v2 event handling for device commands (Node.js 22, ARM64)
- **HTTP API** (API Gateway v2) at `home-assistant-api.samuel-lawrence.com` with JWT auth on everything except `/health`
- **Cognito user pool** with hosted UI at `home-assistant-auth.auth.us-east-1.amazoncognito.com`
- **DynamoDB table** (`home-assistant-devices`) with PAY_PER_REQUEST billing
- **S3 bucket** (`home-assistant-storage`) for device snapshots, firmware, recordings
- **CloudFront + S3** frontend distribution at `home-assistant.samuel-lawrence.com`
- **Dead letter queue** for failed Lambda invocations
- **CDK v2 stack** with `NodejsFunction` (esbuild bundling)
- **GitHub Actions** CI/CD — lint/test on PRs, single deploy on merge to `main`
- **Jest** unit tests with AWS SDK mocking
- **ESLint 9 (flat config) + Prettier** + TypeScript

Every resource uses `RemovalPolicy.DESTROY` and `autoDeleteObjects: true` — the whole stack can be torn down with `cdk destroy` without manual cleanup.

## Getting started

### 1. Install dependencies

```bash
npm install
```

Requires Node.js 22+.

### 2. Run tests

```bash
npm test
```

### 3. Deploy

Ensure your AWS credentials are configured, then:

```bash
npx cdk bootstrap     # first time only
npx cdk deploy
```

## Project structure

```
├── infrastructure/
│   ├── bin/app.ts                       # CDK entry point
│   └── lib/
│       ├── config.ts                    # Stack name, region, domain
│       ├── main-stack.ts                # HomeAssistantStack definition
│       └── constructs/
│           ├── api/api-gateway.ts       # HTTP API v2, custom domain, JWT authoriser
│           ├── auth/auth.ts             # Cognito user pool + hosted UI
│           ├── data/database.ts         # DynamoDB devices table
│           ├── data/storage.ts          # S3 bucket for device media
│           ├── frontend/frontend.ts     # CloudFront + S3 + custom domain
│           └── lambda/request-handler.ts# NodejsFunction, DLQ, env vars, IAM grants
├── src/
│   ├── functions/
│   │   └── requestHandler/             # Lambda handler, environment, data service + tests
│   ├── models/                         # Shared TypeScript types (Device, API)
│   └── utils/logger.ts                 # Structured JSON logger
├── .github/workflows/                  # GitHub Actions CI/CD
├── eslint.config.mjs                   # ESLint flat config
└── cdk.json
```

## CI/CD

| Workflow     | Trigger                          | What happens                              |
| ------------ | -------------------------------- | ----------------------------------------- |
| `ci.yml`     | Push to any branch, PR to `main` | Lint, type-check, unit tests              |
| `deploy.yml` | Push to `main`                   | Deploy the stack and run acceptance tests |

Workflows use AWS OIDC — no long-lived access keys. The `production` GitHub Environment must have an `AWS_DEPLOY_ROLE_ARN` secret pointing at an IAM role with a trust policy allowing `token.actions.githubusercontent.com` for this repo.

## Adding a new Lambda function

1. Create a new folder under `src/functions/` (e.g. `deviceEventProcessor/`)
2. Export a `handler` function
3. Add a `NodejsFunction` construct in `infrastructure/lib/constructs/lambda/`
4. Instantiate it in `infrastructure/lib/main-stack.ts` and wire it to an API route or event source

## Environment variables

The Lambda reads environment variables through `src/functions/requestHandler/environment.ts`. Add new variables there and pass them via the construct's `environment` prop in CDK.
