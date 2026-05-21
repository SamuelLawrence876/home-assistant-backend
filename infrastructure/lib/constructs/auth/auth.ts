import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { HttpJwtAuthorizer } from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import {
  AccountRecovery,
  OAuthScope,
  UserPool,
  UserPoolClient,
  UserPoolDomain,
  UserPoolEmail,
} from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { config } from '../../config';

export class Auth extends Construct {
  public readonly userPool: UserPool;

  public readonly userPoolClient: UserPoolClient;

  public readonly authorizer: HttpJwtAuthorizer;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.userPool = new UserPool(this, 'UserPool', {
      userPoolName: `${config.stackName}-user-pool`,
      selfSignUpEnabled: true,
      signInAliases: { email: true },
      autoVerify: { email: true },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      email: UserPoolEmail.withCognito(),
      passwordPolicy: {
        minLength: 12,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
        tempPasswordValidity: Duration.days(7),
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const cognitoDomain: UserPoolDomain = this.userPool.addDomain('HostedDomain', {
      cognitoDomain: { domainPrefix: config.domain.auth },
    });

    this.userPoolClient = this.userPool.addClient('WebClient', {
      userPoolClientName: `${config.stackName}-web-client`,
      authFlows: { userSrp: true },
      oAuth: {
        scopes: [OAuthScope.OPENID, OAuthScope.EMAIL, OAuthScope.PROFILE],
        callbackUrls: [cognitoDomain.baseUrl()],
        logoutUrls: [cognitoDomain.baseUrl()],
      },
      accessTokenValidity: Duration.hours(1),
      idTokenValidity: Duration.hours(1),
      refreshTokenValidity: Duration.days(30),
    });

    this.authorizer = new HttpJwtAuthorizer('JwtAuthorizer', this.userPool.userPoolProviderUrl, {
      authorizerName: `${config.stackName}-jwt-authorizer`,
      jwtAudience: [this.userPoolClient.userPoolClientId],
    });
  }
}
