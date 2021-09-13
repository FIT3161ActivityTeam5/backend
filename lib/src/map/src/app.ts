import {
    APIGatewayProxyEventV2,
    APIGatewayProxyStructuredResultV2,
} from "aws-lambda";
import {
    DynamoDBClient,
    QueryCommand,
    QueryCommandInput,
    PutItemCommand,
    PutItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { randomBytes } from "crypto";

const client = new DynamoDBClient({});

// I wrapped the client functions because it helps with mocking those calls in tests
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

/**
 * Takes dynamoDB item output and cleans it up
 * @param mapData Uncleaned dynamoDB output
 * @returns Cleaned JSON
 */
const cleanMapData = (mapData: mapData) => {
    let cleanedData: any = {};
    for (var key in mapData) {
        let obj = mapData[key];
        cleanedData[key] = obj.S;
    }
    return cleanedData;
};

/**
 * Inserts/updates items in dynamoDB. Used in POST and PATCH requests.
 * @param mapID The unique map ID
 * @param mapdata The user's map data
 * @param userID The user ID (the subject from jwt)
 * @returns Lambda result indicating success or failure
 */
const putOrUpdateItem = async (
    mapID: string,
    mapdata: string,
    userID: string
): Promise<APIGatewayProxyStructuredResultV2> => {
    // Set up the dynamoDB API call
    const putItemData: PutItemCommandInput = {
        TableName: process.env.TABLE_NAME,
        Item: {
            mapID: { S: mapID },
            mapData: { S: mapdata },
            associatedUserID: { S: userID },
        },
    };

    // Call the API and handle errors / success
    const putCommand = new PutItemCommand(putItemData);
    try {
        await withDynamoClientPutItemSend(putCommand);
        return {
            statusCode: 200,
            body: JSON.stringify({ mapID: mapID }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify("Internal server error (own)"),
        };
    }
};

/**
 * Base handler for POST requests. Will validate needed parameters and call
 * `putOrUpdateItem()` if validation succeeds.
 * @param event The lambda proxy event passed from API Gateway
 * @returns Lambda proxy result indicating success or failure
 */
const handlePost = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
    // Extract & validate JWT subject to use as user ID
    if (
        event.requestContext.authorizer === undefined ||
        event.requestContext.authorizer.jwt.claims.sub === undefined
    ) {
        return { statusCode: 400, body: JSON.stringify("No user ID") };
    }
    const userID = event.requestContext.authorizer.jwt.claims.sub as string;
    const data = event.headers as postHeaders;

    // Validate mapdata and map ID
    if (data.mapdata === undefined) {
        return {
            statusCode: 400,
            body: JSON.stringify("mapdata not specified"),
        };
    }
    const mapID = randomBytes(20).toString("hex");
    return putOrUpdateItem(mapID, data.mapdata, userID);
};

/**
 * Handles dynamoDB queries for GET requests. Because the `/list` route needs
 * to query on a secondary index, we require the name of the query parameter to
 * use as an index to look up the DB.
 * @param queryParamName One of `"mapID"` or `"associatedUserId"`. This is
 * the name of the index we perform lookups on in the DB.
 * @param queryParamValue The actual value of the previous parameter
 * @returns Lambda proxy result indicating success or failure
 */
const handleGetQuery = async (
    queryParamName: "mapID" | "associatedUserID",
    queryParamValue: string
): Promise<APIGatewayProxyStructuredResultV2> => {
    const isListQuery = queryParamName === "associatedUserID";
    // Setting up the DynamoDB query
    const queryParams: QueryCommandInput = {
        TableName: process.env.TABLE_NAME,
        IndexName: isListQuery ? process.env.INDEX_NAME : undefined,
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
        const data = await withDynamoClientQueryItemSend(queryCommand);
        if (!data.Items || data.Items.length === 0) {
            return {
                statusCode: isListQuery ? 200 : 404,
                body: JSON.stringify([]),
            };
        }
        const res: mapData[] = [];
        for (let i = 0; i < data.Items.length; i++) {
            res.push(cleanMapData(data.Items[i] as mapData));
        }
        return {
            statusCode: 200,
            body: JSON.stringify(res),
        };
    } catch (error) {
        if (error === "No items found") {
            return {
                statusCode: isListQuery ? 200 : 404,
                body: JSON.stringify([]),
            };
        }
        console.error(error);
        return {
            statusCode: 500,
            body: JSON.stringify("Internal server error (own)"),
        };
    }
};

/**
 * Base handler for all GET requests. Works out if the request is for
 * `/map/{mapid}` or `/map/list`, validates needed parameters and calls the
 * query function.
 * @param event The lambda proxy event passed from API Gateway
 * @returns Lambda proxy result indicating success or failure
 */
const handleGet = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
    if (event.rawPath.includes("list")) {
        // Extract & validate JWT subject to use as user ID
        if (
            event.requestContext.authorizer === undefined ||
            event.requestContext.authorizer.jwt.claims.sub === undefined
        ) {
            return { statusCode: 400, body: JSON.stringify("No user ID") };
        }
        const userID = event.requestContext.authorizer.jwt.claims.sub as string;
        return handleGetQuery("associatedUserID", userID);
    } else {
        // Extracting the map ID from the GET request
        const params = event.pathParameters;
        if (!params) {
            return { statusCode: 400, body: JSON.stringify("No map ID") };
        }
        const mapID = params.mapid;
        if (!mapID) {
            return { statusCode: 400, body: JSON.stringify("No map ID") };
        }
        return handleGetQuery("mapID", mapID);
    }
};

/**
 * Base handler for all PATCH requests. We first validate all needed parameters,
 * and then query the database to make sure the user is not trying to PATCH a map
 * that doesn't exist. After this, we call the function to update the specified map.
 * @param event The lambda proxy event passed from API Gateway
 * @returns Lambda proxy result indicating success or failure
 */
const handlePatch = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
    // Validate map ID
    if (event.pathParameters === undefined) {
        return { statusCode: 400, body: JSON.stringify("mapID not specified") };
    }
    const mapID = event.pathParameters.mapid;
    if (mapID === undefined) {
        return { statusCode: 400, body: JSON.stringify("mapID not specified") };
    }
    // Extract & validate JWT subject to use as user ID
    if (
        event.requestContext.authorizer === undefined ||
        event.requestContext.authorizer.jwt.claims.sub === undefined
    ) {
        return { statusCode: 400, body: JSON.stringify("No user ID") };
    }
    const userID = event.requestContext.authorizer.jwt.claims.sub as string;
    // Validate map data
    const data = event.headers as patchHeaders;
    if (data.mapdata === undefined) {
        return {
            statusCode: 400,
            body: JSON.stringify("mapdata not specified"),
        };
    }
    // Query database to make sure user is not PATCHing a nonexistent map
    const res = await withDynamoClientQueryItemSend(
        new QueryCommand({
            TableName: process.env.TABLE_NAME,
            KeyConditionExpression: "mapID = :s",
            ExpressionAttributeValues: {
                ":s": {
                    S: mapID,
                },
            },
        })
    );
    if (res.Count === 0) {
        return {
            statusCode: 400,
            body: JSON.stringify("A map with specified mapid does not exist"),
        };
    }

    return putOrUpdateItem(mapID, data.mapdata, userID);
};

/**
 * Base handler for the Lambda function. Determines the HTTP method and calls
 * the respective functions.
 * @param event The lambda proxy event passed from API Gateway
 * @returns Lambda proxy result indicating success or failure
 */
export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
    console.log(event);
    console.log(event.requestContext.authorizer);

    const requestType = event.requestContext.http.method;
    let result: APIGatewayProxyStructuredResultV2;

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
