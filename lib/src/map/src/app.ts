import {
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import {
    DynamoDBClient,
    QueryCommand,
    QueryCommandInput,
    QueryCommandOutput,
    PutItemCommand,
    PutItemCommandInput,
    PutItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import crypto from "crypto";

const client = new DynamoDBClient({});

export const withDynamoClientPutItemSend = async (input: PutItemCommand) => {
    return client.send(input);
};

export const withDynamoClientQueryItemSend = async (input: QueryCommand) => {
    return client.send(input);
};

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
): Promise<APIGatewayProxyStructuredResultV2> => {
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
        await withDynamoClientPutItemSend(putCommand);
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
): Promise<APIGatewayProxyStructuredResultV2> => {
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

const handleGetQuery = async (
    queryParamName: "mapID" | "associatedUserID",
    queryParamValue: string
): Promise<APIGatewayProxyStructuredResultV2> => {
    // Setting up the DynamoDB query
    const queryParams: QueryCommandInput = {
        TableName: process.env.TABLE_NAME,
        IndexName:
            queryParamName === "associatedUserID"
                ? process.env.INDEX_NAME
                : undefined,
        KeyConditionExpression: queryParamName + " = :s",
        ExpressionAttributeValues: {
            ":s": {
                S: queryParamValue,
            },
        },
    };
    const queryCommand = new QueryCommand(queryParams);

    // Run the query
    try {
        console.log("before");
        console.log(process.env.TABLE_NAME);
        const data = await withDynamoClientQueryItemSend(queryCommand);
        console.log("after");
        if (!data.Items || data.Items.length === 0) {
            throw "No items found";
        }

        const res: mapData[] = [];
        console.log(data.Items[0]);
        for (let i = 0; i < data.Items.length; i++) {
            res.push(cleanMapData(data.Items[i] as mapData));
        }
        if (Object.keys(res).length === 0) {
            return { statusCode: 404, body: "Map not found" };
        }
        return {
            statusCode: 200,
            body: JSON.stringify(res),
        };
    } catch (error) {
        if (error === "No items found") {
            return { statusCode: 200, body: JSON.stringify([]) };
        }
        console.log(error);
        return { statusCode: 500, body: "Internal Server Error (own)" };
    }
};

const handleGet = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
    if (event.rawPath.includes("list")) {
        return handleGetQuery(
            "associatedUserID",
            event.requestContext.authorizer?.jwt.claims.sub as string
        );
    } else {
        // Extracting the map ID from the GET request
        const params = event.pathParameters;
        if (!params) {
            return { statusCode: 400, body: "No map ID" };
        }
        const mapID = params.mapid;
        if (!mapID) {
            return { statusCode: 400, body: "No map ID" };
        }
        return handleGetQuery("mapID", mapID);
    }
};

const handlePatch = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
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
): Promise<APIGatewayProxyStructuredResultV2> => {
    console.log(event);
    console.log(event.requestContext.authorizer);

    const requestType = event.requestContext.http.method;
    let result;

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
