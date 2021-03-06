import * as cdk from "@aws-cdk/core";
import * as apigw from "@aws-cdk/aws-apigatewayv2";
import * as apigw_auth from "@aws-cdk/aws-apigatewayv2-authorizers";
import * as apigw_integrations from "@aws-cdk/aws-apigatewayv2-integrations";
import * as lambda from "@aws-cdk/aws-lambda";
import ThriveTables from "./dynamo-tables";

export class ThriveAppStack extends cdk.Stack {
    constructor(app: cdk.App, id: string) {
        super(app, id);

        // Setup the dynamoDB table
        const gsiName = "userIDIndex";
        const tables = ThriveTables(this, gsiName);
        const mapTable = tables.mapDataTable;

        // This is the function that will handle map data
        const mapFunction = new lambda.Function(this, "MapFunction", {
            code: new lambda.AssetCode("lib/src/map"),
            handler: "out/app.handler",
            runtime: lambda.Runtime.NODEJS_14_X,
            environment: {
                TABLE_NAME: mapTable.tableName,
                INDEX_NAME: gsiName,
            },
            timeout: cdk.Duration.seconds(30),
            memorySize: 1024,
            architecture: lambda.Architecture.ARM_64,
        });
        mapTable.grantReadWriteData(mapFunction);

        // I'm not adding the authorizer as a default here because I need the
        // endpoint of the API for the jwtAudience
        const api = new apigw.HttpApi(this, "ThriveApi");

        // This is the authorizer that links up wth Auth0
        // ik im hardcoding the audience but idc
        const defaultJWTAuthorizer = new apigw_auth.HttpJwtAuthorizer({
            jwtAudience: [api.apiEndpoint, "W3HvRAyTSMN9U0AXjv3BsqThfDHMbpc1"],
            jwtIssuer: "https://dev-vak81b59.us.auth0.com/",
            authorizerName: "auth0JWTAuthorizer",
        });

        // POST route for adding a new map
        api.addRoutes({
            integration: new apigw_integrations.LambdaProxyIntegration({
                handler: mapFunction,
                payloadFormatVersion: apigw.PayloadFormatVersion.VERSION_2_0,
            }),
            path: "/map",
            methods: [apigw.HttpMethod.POST],
            authorizer: defaultJWTAuthorizer,
        });

        // Route for either retrieving a map (GET) or updating it by its ID (PATCH)
        api.addRoutes({
            integration: new apigw_integrations.LambdaProxyIntegration({
                handler: mapFunction,
                payloadFormatVersion: apigw.PayloadFormatVersion.VERSION_2_0,
            }),
            path: "/map/{mapid}",
            methods: [
                apigw.HttpMethod.GET,
                apigw.HttpMethod.PATCH,
                apigw.HttpMethod.DELETE,
            ],
            authorizer: defaultJWTAuthorizer,
        });

        // Route for listing all maps associated with that user
        // (user is inferred via JWT)
        api.addRoutes({
            integration: new apigw_integrations.LambdaProxyIntegration({
                handler: mapFunction,
                payloadFormatVersion: apigw.PayloadFormatVersion.VERSION_2_0,
            }),
            path: "/map/list",
            methods: [apigw.HttpMethod.GET],
            authorizer: defaultJWTAuthorizer,
        });
    }
}

const app = new cdk.App();
new ThriveAppStack(app, "ThriveAppStack");
app.synth();
