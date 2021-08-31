import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
    DynamoDBClient,
    QueryCommand,
    QueryCommandInput,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({});

interface mapData {
    [mapID: string]: {
        S: string;
    };
    associatedUserID: {
        S: string;
    };
}

interface cleanMapData {
    [mapID: string]: string;
    associatedUserID: string;
}

const cleanMapData = (mapData: mapData) => {
    let cleanedData: any = {};
    for (var key in mapData) {
        let obj = mapData[key];
        cleanedData[key] = obj.S;
    }
    return cleanedData;
};

const handlePost = (event: APIGatewayProxyEventV2): APIGatewayProxyResultV2 => {
    return { statusCode: 200, body: "Hello from postt" };
};

const handleGet = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    // Extracting the map ID from the GET request
    const params = event.pathParameters;
    if (!params) {
        return { statusCode: 400, body: "No map ID" };
    }
    const mapID = params.mapid;
    if (!mapID) {
        return { statusCode: 400, body: "No map ID" };
    }

    // Setting up the DynamoDB query
    const queryParams: QueryCommandInput = {
        TableName: process.env.TABLE_NAME,
        KeyConditionExpression: "mapID = :s",
        ExpressionAttributeValues: {
            ":s": {
                S: mapID,
            },
        },
    };
    const queryCommand = new QueryCommand(queryParams);

    // Run the query
    try {
        const data = await client.send(queryCommand);
        if (!data.Items) {
            throw "No items found";
        }
        const res: mapData | {} = cleanMapData(data.Items[0] as mapData);
        if (Object.keys(res).length === 0) {
            return { statusCode: 404, body: "Map not found" };
        }
        return {
            statusCode: 200,
            body: JSON.stringify(res),
        };
    } catch (error) {
        console.log(error);
    }

    return { statusCode: 500, body: "Internal Server Error" };
};

const handlePatch = (
    event: APIGatewayProxyEventV2
): APIGatewayProxyResultV2 => {
    return { statusCode: 200, body: "Hello from patch" };
};

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    console.log(event);

    const requestType = event.requestContext.http.method;
    let result: APIGatewayProxyResultV2;

    switch (requestType) {
        case "POST":
            result = handlePost(event);
            break;
        case "GET":
            result = await handleGet(event);
            break;
        case "PATCH":
            result = handlePatch(event);
            break;
        default:
            result = {
                statusCode: 405,
            };
    }

    return result;
};
