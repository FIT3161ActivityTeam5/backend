import * as cdk from "@aws-cdk/core";
import * as dynamodb from "@aws-cdk/aws-dynamodb";

export default function ThriveTables(stack: cdk.Stack) {
    const defaultRemovalPolicy = cdk.RemovalPolicy.DESTROY;

    const mapDataTable = new dynamodb.Table(stack, "ThriveMapDataTable", {
        partitionKey: {
            name: "mapID",
            type: dynamodb.AttributeType.STRING,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: defaultRemovalPolicy,
    });
    mapDataTable.addGlobalSecondaryIndex({
        indexName: "userIDIndex",
        partitionKey: {
            name: "associatedUserID",
            type: dynamodb.AttributeType.STRING
        }
    })

    return { mapDataTable };
}
