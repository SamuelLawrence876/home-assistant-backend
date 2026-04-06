# serverless-aws-template

A production-ready AWS serverless starter template using **AWS CDK v2**, **TypeScript**, and **GitHub Actions**.

## What's included

- **Lambda function** with typed API Gateway v2 event handling
- **HTTP API** (API Gateway v2) wired to the Lambda
- **Dead letter queue** for failed invocations
- **CDK v2 stack** with `NodejsFunction` (esbuild bundling, ARM64)
- **GitHub Actions** CI/CD — lint/test on PRs, deploy on merge to `main` or version tags
- **Jest** unit and infrastructure tests
- **ESLint + Prettier** with Airbnb TypeScript rules
- **Husky + lint-staged** pre-commit hooks

## Getting started

### 1. Fork / use as template

Click **Use this template** on GitHub, then clone your new repo.

### 2. Rename the stack

Update the `name` field in `package.json` and the `stackName` default in `infrastructure/bin/app.ts`.

### 3. Install dependencies

```bash
npm install
```

### 4. Run tests

```bash
npm test              # unit tests
npm run test:infra    # CDK snapshot tests
```

### 5. Deploy

Ensure your AWS credentials are configured, then:

```bash
npx cdk bootstrap     # first time only
npx cdk deploy
```

## Project structure

```
├── infrastructure/
│   ├── bin/app.ts          # CDK entry point
│   ├── lib/main-stack.ts   # Stack definition
│   └── test/               # CDK snapshot tests
├── src/
│   └── functions/
│       └── requestHandler/ # Lambda handler + tests
├── .github/workflows/      # GitHub Actions CI/CD
└── cdk.json
```

## CI/CD

### GitHub Actions workflows

| Workflow | Trigger | Action |
|---|---|---|
| `ci.yml` | Push to any branch (except `main`), PRs | Lint, type-check, unit tests, infra tests |
| `deploy.yml` | Push to `main` | Deploy to **dev** environment |
| `deploy.yml` | Push tag `v*` | Deploy to **production** environment |

### Required GitHub secrets

The deploy workflow uses AWS OIDC for credential-free authentication:

| Secret | Description |
|---|---|
| `AWS_DEPLOY_ROLE_ARN` | IAM role ARN with CDK deploy permissions (per environment) |

Set these under **Settings → Environments → Secrets** for each environment (`dev`, `production`).

## Adding a new Lambda function

1. Create a new folder under `src/functions/`
2. Export a `handler` function
3. Add a `NodejsFunction` in `infrastructure/lib/main-stack.ts`
4. Wire it to an API route or event source

## Environment variables

The Lambda reads environment variables through `src/functions/requestHandler/environment.ts`. Add new variables there and pass them via the CDK stack `environment` prop.
