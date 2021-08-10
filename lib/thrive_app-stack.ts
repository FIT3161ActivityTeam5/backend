import * as cdk from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigw from "@aws-cdk/aws-apigatewayv2";
import * as apigw_integrations from "@aws-cdk/aws-apigatewayv2-integrations";
import * as apigw_auth from "@aws-cdk/aws-apigatewayv2-authorizers";
import * as iam from "@aws-cdk/aws-iam";
import { ServicePrincipal, PolicyStatement, Effect } from "@aws-cdk/aws-iam";

export class ThriveAppStack extends cdk.Stack {
    constructor(app: cdk.App, id: string) {
        super(app, id);

        const testFunction = new lambda.Function(this, "TestFunction", {
            code: new lambda.AssetCode("lib/src/test-function"),
            handler: "src/app.handler",
            runtime: lambda.Runtime.NODEJS_12_X,
            environment: {
                TABLE_NAME: "something",
            },
        });

        const auth0IntegrationRole = new iam.Role(this, "auth0integrationCDK", {
            assumedBy: new iam.CompositePrincipal(
                new ServicePrincipal("lambda.amazonaws.com"),
                new ServicePrincipal("apigateway.amazonaws.com")
            ),
        });

        auth0IntegrationRole.addToPolicy(
            new PolicyStatement({
                effect: Effect.ALLOW,
                actions: [
                    "lambda:InvokeFunction",
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources: ["*"],
            })
        );

        const authorizer = new lambda.Function(this, "AuthorizationFunction", {
            code: new lambda.AssetCode("lib/src/custom-authorizer"),
            handler: "index.handler",
            runtime: lambda.Runtime.NODEJS_10_X,
            role: auth0IntegrationRole,
            environment: {
                TOKEN_ISSUER: "https://dev-vak81b59.us.auth0.com/",
                JWKS_URI:
                    "https://dev-vak81b59.us.auth0.com/.well-known/jwks.json",
                AUDIENCE: `https://qqvwnljate.execute-api.ap-southeast-2.amazonaws.com`,
            },
        });

        const api = new apigw.HttpApi(this, "ThriveApi", {
            defaultAuthorizer: new apigw_auth.HttpLambdaAuthorizer({
                authorizerName: "auth0",
                handler: authorizer,
                responseTypes: [apigw_auth.HttpLambdaResponseType.IAM],
                resultsCacheTtl: cdk.Duration.minutes(5),
            }),
        });

        api.addRoutes({
            integration: new apigw_integrations.LambdaProxyIntegration({
                handler: testFunction,
                payloadFormatVersion: apigw.PayloadFormatVersion.VERSION_2_0,
            }),
            path: "/test",
            methods: [apigw.HttpMethod.GET],
        });
    }
}

const app = new cdk.App();
new ThriveAppStack(app, "ThriveAppStack");
app.synth();
