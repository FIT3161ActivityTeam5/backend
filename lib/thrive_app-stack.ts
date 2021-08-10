import * as cdk from "@aws-cdk/core";
import * as apigw from "@aws-cdk/aws-apigatewayv2";
import * as apigw_auth from "@aws-cdk/aws-apigatewayv2-authorizers";
import * as apigw_integrations from "@aws-cdk/aws-apigatewayv2-integrations";
import * as lambda from "@aws-cdk/aws-lambda";

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

        // I'm not adding the authorizer as a default here because I need the
        // endpoint of the API for the jwtAudience
        const api = new apigw.HttpApi(this, "ThriveApi");

        // This is the authorizer that links up wth Auth0
        const defaultJWTAuthorizer = new apigw_auth.HttpJwtAuthorizer({
            jwtAudience: [api.apiEndpoint],
            jwtIssuer: "https://dev-vak81b59.us.auth0.com/",
            authorizerName: "auth0JWTAuthorizer",
        });

        api.addRoutes({
            integration: new apigw_integrations.LambdaProxyIntegration({
                handler: testFunction,
                payloadFormatVersion: apigw.PayloadFormatVersion.VERSION_2_0,
            }),
            path: "/test",
            methods: [apigw.HttpMethod.GET],
            authorizer: defaultJWTAuthorizer,
        });
    }
}

const app = new cdk.App();
new ThriveAppStack(app, "ThriveAppStack");
app.synth();
