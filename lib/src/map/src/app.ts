import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import {
    DynamoDBClient,
    QueryCommand,
    QueryCommandInput,
    PutItemCommand,
    PutItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import crypto from "crypto";

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

interface postHeaders {
    [mapdata: string]: string | undefined;
}

interface patchHeaders {
    [mapdata: string]: string | undefined;
}

const cleanMapData = (mapData: mapData) => {
    let cleanedData: any = {};
    for (var key in mapData) {
        let obj = mapData[key];
        cleanedData[key] = obj.S;
    }
    return cleanedData;
};

const putOrUpdateItem = async (
    mapID: string,
    mapdata: string,
    userID: string
): Promise<APIGatewayProxyResultV2> => {
    const putItemData: PutItemCommandInput = {
        TableName: process.env.TABLE_NAME,
        Item: {
            mapID: { S: mapID },
            mapData: { S: mapdata },
            associatedUserID: { S: userID },
        },
    };

    // Run the command
    const putCommand = new PutItemCommand(putItemData);
    try {
        await client.send(putCommand);
        return {
            statusCode: 200,
            body: JSON.stringify({ mapID: mapID }),
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: JSON.stringify("Internal server error"),
        };
    }
};

const handlePost = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    // Extract data from request
    const userID = event.requestContext.authorizer?.jwt.claims.azp as string;
    const data = event.headers as postHeaders;
    if (data.mapdata === undefined) {
        return {
            statusCode: 400,
            body: JSON.stringify("mapdata not specified"),
        };
    }
    const mapID = crypto.randomBytes(20).toString("hex");
    return putOrUpdateItem(mapID, data.mapdata, userID);
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
        return { statusCode: 500, body: "Internal Server Error" };
    }
};

const handlePatch = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    // const params = ;
    if (event.pathParameters === undefined) {
        return { statusCode: 400, body: "mapID not specified" };
    }
    const mapID = event.pathParameters.mapid;
    if (mapID === undefined) {
        return { statusCode: 400, body: "mapID not specified" };
    }
    const userID = event.requestContext.authorizer?.jwt.claims.azp as string;
    const data = event.headers as patchHeaders;
    if (data.mapdata === undefined) {
        return {
            statusCode: 400,
            body: JSON.stringify("mapdata not specified"),
        };
    }
    return putOrUpdateItem(mapID, data.mapdata, userID);
};

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    console.log(event);
    console.log(event.requestContext.authorizer);

    const requestType = event.requestContext.http.method;
    let result: APIGatewayProxyResultV2;

    switch (requestType) {
        case "POST":
            result = await handlePost(event);
            break;
        case "GET":
            result = await handleGet(event);
            break;
        case "PATCH":
            result = await handlePatch(event);
            break;
        default:
            result = {
                statusCode: 405,
            };
    }

    return result;
};
