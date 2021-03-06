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
    DeleteItemCommandInput,
    DeleteItemCommand,
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

export const withDynamoClientDeleteItemSend = async (
    input: DeleteItemCommand
) => {
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

// Helper validation functions
const validateUserID = (event: APIGatewayProxyEventV2) => {
    if (
        event.requestContext.authorizer === undefined ||
        event.requestContext.authorizer.jwt.claims.sub === undefined
    ) {
        return false;
    }
    return event.requestContext.authorizer.jwt.claims.sub as string;
};

const validateMapID = (event: APIGatewayProxyEventV2) => {
    if (
        event.pathParameters === undefined ||
        event.pathParameters.mapid === undefined
    ) {
        return false;
    }
    return event.pathParameters.mapid;
};

// Simple wrapper for APIGW Proxy response
const response = (
    statusCode: number,
    body?: any
): APIGatewayProxyStructuredResultV2 => {
    return {
        statusCode: statusCode,
        body: JSON.stringify(body),
    };
};

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
        return response(200, { mapID: mapID });
    } catch (error) {
        console.error(error);
        return response(500, "Internal server error (own)");
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
    const userID = validateUserID(event);
    if (!userID) {
        return response(400, "No user ID");
    }
    const data = event.headers as postHeaders;
    // Validate mapdata
    if (data.mapdata === undefined) {
        return response(400, "mapdata not specified");
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
            return response(isListQuery ? 200 : 404, []);
        }
        const res: mapData[] = [];
        for (let i = 0; i < data.Items.length; i++) {
            res.push(cleanMapData(data.Items[i] as mapData));
        }
        return response(200, res);
    } catch (error) {
        if (error === "No items found") {
            return response(isListQuery ? 200 : 404, []);
        }
        console.error(error);
        return response(500, "Internal server error (own)");
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
        const userID = validateUserID(event);
        if (!userID) {
            return response(400, "No user ID");
        }
        return handleGetQuery("associatedUserID", userID);
    } else {
        // Extracting the map ID from the GET request
        const mapID = validateMapID(event);
        if (!mapID) {
            return response(400, "No map ID");
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
    const mapID = validateMapID(event);
    if (!mapID) {
        return response(400, "No map ID");
    }
    // Extract & validate JWT subject to use as user ID
    const userID = validateUserID(event);
    if (!userID) {
        return response(400, "No user ID");
    }
    // Validate map data
    const data = event.headers as patchHeaders;
    if (data.mapdata === undefined) {
        return response(400, "mapdata not specified");
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
        return response(400, "A map with specified mapid does not exist");
    }
    return putOrUpdateItem(mapID, data.mapdata, userID);
};

/**
 * Base handler for DELETE requests. We first validate parameters and then
 * attempt to delete the item. For ease of downstream we differentiate
 * responses based on whether the delete operation did anything. Additionally,
 * we have checks to make sure the user is only allowed to delete their own
 * maps.
 * @param event The lambda proxy event passed from API Gateway
 * @returns Lambda result with status code. The status code is 200 if an item
 * was deleted. We return 404 if a) the user attempts to delete a map that does
 * not belong to them or b) if the user has referenced a nonexistent map ID.
 */
const handleDelete = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyStructuredResultV2> => {
    // Validate map ID
    const mapID = validateMapID(event);
    if (!mapID) {
        return response(400, "No map ID");
    }
    // Validate user ID from JWT auth
    const userID = validateUserID(event);
    if (!userID) {
        return response(400, "No user ID");
    }

    // Build parameters
    const deleteParams: DeleteItemCommandInput = {
        TableName: process.env.TABLE_NAME,
        Key: {
            mapID: {
                S: mapID,
            },
        },
        // The user should not be able to delete maps that do not belong to them
        // This will also cause the operation to error out if the map ID
        // belongs to someone else. This is intended behaviour
        ConditionExpression: "associatedUserID = :s",
        ExpressionAttributeValues: {
            ":s": {
                S: userID,
            },
        },
    };
    const deleteCommand = new DeleteItemCommand(deleteParams);
    try {
        await withDynamoClientDeleteItemSend(deleteCommand);
        return response(200);
    } catch (error) {
        // e.name doesn't play nice with Jest
        // @ts-ignore
        if (error.name === "ConditionalCheckFailedException") {
            return response(404);
        }
        console.error(error);
        return response(500, "Internal server error (own)");
    }
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
        case "DELETE":
            result = await handleDelete(event);
            break;
        default:
            result = {
                statusCode: 405,
            };
    }
    return result;
};
