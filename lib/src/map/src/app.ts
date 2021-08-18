import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

const handlePost = (event: APIGatewayProxyEventV2): APIGatewayProxyResultV2 => {
    return { statusCode: 200, body: "Hello from post" };
};
const handleGet = (event: APIGatewayProxyEventV2): APIGatewayProxyResultV2 => {
    return { statusCode: 200, body: "Hello from get" };
};
const handlePatch = (
    event: APIGatewayProxyEventV2
): APIGatewayProxyResultV2 => {
    return { statusCode: 200, body: "Hello from patch" };
};

export const handler = async (
    event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
    console.log(event.requestContext.authorizer);

    const requestType = event.requestContext.http.method;
    let result: APIGatewayProxyResultV2;

    switch (requestType) {
        case "POST":
            result = handlePost(event);
            break;
        case "GET":
            result = handleGet(event);
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
    // const queries = JSON.stringify(event.queryStringParameters);
    // return {
    //     statusCode: 200,
    //     body: `Queries: ${queries}`,
    // };
};
