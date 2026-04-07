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

| Workflow     | Trigger                            | What happens                                                                                   |
| ------------ | ---------------------------------- | ---------------------------------------------------------------------------------------------- |
| `ci.yml`     | Push to any branch, any PR         | Lint, type-check, unit tests, infra tests                                                      |
| `pr.yml`     | PR opened / updated against `main` | Deploy **ephemeral stack** named `serverless-starter-{stage}` and post the URL as a PR comment |
| `pr.yml`     | PR closed (merged or abandoned)    | **Destroy** the ephemeral stack automatically                                                  |
| `deploy.yml` | Push to `main` or tag `v*`         | Deploy **production stack** (`serverless-starter`, no stage suffix)                            |

### Ephemeral environments

Every PR against `main` gets its own isolated AWS stack so you can test changes end-to-end before merging.

**How the stage name is derived from the branch name:**

| Branch                        | Derived stage                             |
| ----------------------------- | ----------------------------------------- |
| `feature/ABC-123-my-feature`  | `abc-123` (ticket ID extracted)           |
| `fix/update-handler`          | `fix-update-handler` (sanitised slug)     |
| `dependabot/npm_and_yarn/...` | `dependabot-npm-and` (slug, max 20 chars) |

The CDK stack is named `<STACK_BASE_NAME>-<stage>` (e.g. `serverless-starter-abc-123`).

This is equivalent to passing `-c stage=abc-123` to the CDK CLI directly:

```bash
npx cdk deploy serverless-starter-abc-123 --require-approval never -c stage=abc-123
```

To destroy a stack manually:

```bash
npx cdk destroy serverless-starter-abc-123 --force -c stage=abc-123
```

### Required GitHub secrets

Workflows use AWS OIDC — no long-lived access keys stored in GitHub.

Create three **GitHub Environments** (`ephemeral`, `production`) and add this secret to each:

| Secret                | Description                                         |
| --------------------- | --------------------------------------------------- |
| `AWS_DEPLOY_ROLE_ARN` | ARN of the IAM role GitHub Actions assumes via OIDC |

**Settings → Environments → [environment name] → Secrets**

The IAM role trust policy should allow `token.actions.githubusercontent.com` as the OIDC provider. See the [AWS docs](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html) for setup.

## Adding a new Lambda function

1. Create a new folder under `src/functions/`
2. Export a `handler` function
3. Add a `NodejsFunction` in `infrastructure/lib/main-stack.ts`
4. Wire it to an API route or event source

## Environment variables

The Lambda reads environment variables through `src/functions/requestHandler/environment.ts`. Add new variables there and pass them via the CDK stack `environment` prop.
