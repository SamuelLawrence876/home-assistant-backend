# home-assistant-backend

Backend service for **Home Assistant** — an AWS serverless API for managing smart-home devices, automations, and telemetry. Built with **AWS CDK v2**, **TypeScript**, and **GitHub Actions**.

## What's included

- **Lambda function** with typed API Gateway v2 event handling for device commands (Node.js 22, ARM64)
- **HTTP API** (API Gateway v2) with custom domain
- **Cognito user pool** with hosted UI and JWT authorisation (production only)
- **DynamoDB table** (`devices`) with PAY_PER_REQUEST billing
- **S3 bucket** for device snapshots, firmware images, and event recordings
- **CloudFront + S3** frontend distribution for the Home Assistant web UI (production only)
- **Dead letter queue** for failed Lambda invocations
- **CDK v2 stack** with `NodejsFunction` (esbuild bundling)
- **GitHub Actions** CI/CD — lint/test on PRs, single prod deploy on merge to `main`
- **Ephemeral PR stacks** — isolated API-only environment per PR, torn down on close
- **Jest** unit tests with AWS SDK mocking
- **ESLint 9 (flat config) + Prettier** + TypeScript

Every resource is configured with `RemovalPolicy.DESTROY` and `autoDeleteObjects: true` — the whole stack can be torn down without manual cleanup.

## Stack types

Two stack types only:

| Type        | Use                | Contents                                               | Auth |
| ----------- | ------------------ | ------------------------------------------------------ | ---- |
| `prod`      | Production deploy  | API + Lambda + DB + Storage + Cognito + Frontend (CDN) | JWT  |
| `ephemeral` | Per-PR preview env | API + Lambda + DB + Storage (no Cognito, no Frontend)  | None |

Ephemeral stacks are intentionally minimal — they exist for smoke-testing API changes on a PR. They expose `https://{stage}-home-assistant-api.samuel-lawrence.com` with no authentication.

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
npx cdk deploy        # deploys the prod stack
```

## Project structure

```
├── infrastructure/
│   ├── bin/app.ts                       # CDK entry point — resolves stack type and stage
│   └── lib/
│       ├── config.ts                    # Stack name, region, domain
│       ├── main-stack.ts                # HomeAssistantStack definition
│       └── constructs/
│           ├── api/api-gateway.ts       # HTTP API v2, custom domain, optional JWT authoriser
│           ├── auth/auth.ts             # Cognito user pool + hosted UI (prod only)
│           ├── data/database.ts         # DynamoDB devices table
│           ├── data/storage.ts          # S3 bucket for device media
│           ├── frontend/frontend.ts     # CloudFront + S3 + custom domain (prod only)
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

### GitHub Actions workflows

| Workflow     | Trigger                            | What happens                                                                               |
| ------------ | ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `ci.yml`     | Push to any branch, PR to `main`   | Lint, type-check, unit tests                                                               |
| `pr.yml`     | PR opened / updated against `main` | Deploy **ephemeral stack** named `home-assistant-{stage}` and post the URL as a PR comment |
| `pr.yml`     | PR closed (merged or abandoned)    | **Destroy** the ephemeral stack automatically                                              |
| `deploy.yml` | Push to `main`                     | Deploy production stack and run acceptance tests                                           |

### Ephemeral environments

Every PR against `main` gets its own isolated AWS stack so you can smoke-test API changes end-to-end before merging.

**How the stage name is derived from the branch name:**

| Branch                        | Derived stage                             |
| ----------------------------- | ----------------------------------------- |
| `feature/ABC-123-my-feature`  | `abc-123` (ticket ID extracted)           |
| `fix/update-handler`          | `fix-update-handler` (sanitised slug)     |
| `dependabot/npm_and_yarn/...` | `dependabot-npm-and` (slug, max 20 chars) |

The CDK stack is named `<stackName>-<stage>` (e.g. `home-assistant-abc-123`).

To deploy or destroy an ephemeral stack manually:

```bash
npx cdk deploy home-assistant-abc-123 --require-approval never -c stackType=ephemeral -c stage=abc-123
npx cdk destroy home-assistant-abc-123 --force -c stackType=ephemeral -c stage=abc-123
```

### Required GitHub secrets and environments

Workflows use AWS OIDC — no long-lived access keys are stored in GitHub.

Create two **GitHub Environments** (`ephemeral`, `production`) and add this secret to each:

| Secret                | Description                                         |
| --------------------- | --------------------------------------------------- |
| `AWS_DEPLOY_ROLE_ARN` | ARN of the IAM role GitHub Actions assumes via OIDC |

**Settings → Environments → [environment name] → Secrets**

The IAM role trust policy must allow `token.actions.githubusercontent.com` as the OIDC provider. See the [AWS docs](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html) for setup.

## Adding a new Lambda function

1. Create a new folder under `src/functions/` (e.g. `deviceEventProcessor/`)
2. Export a `handler` function
3. Add a `NodejsFunction` construct in `infrastructure/lib/constructs/lambda/`
4. Instantiate it in `infrastructure/lib/main-stack.ts` and wire it to an API route or event source

## Environment variables

The Lambda reads environment variables through `src/functions/requestHandler/environment.ts`. Add new variables there and pass them via the construct's `environment` prop in CDK.
