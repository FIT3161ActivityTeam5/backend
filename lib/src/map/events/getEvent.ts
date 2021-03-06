import { APIGatewayProxyEventV2 } from "aws-lambda";

export default function get_event(items: {
    mapId?: string;
    jwtSubject?: string;
    isList?: boolean;
    definePathParameters?: boolean;
    hasAuthorizer?: boolean;
}): APIGatewayProxyEventV2 {
    return {
        version: "2.0",
        routeKey: "GET /map/{mapid}",
        rawPath: items.isList || false ? "list" : "/map/1234",
        rawQueryString: "asd=potato",
        headers: {
            accept: "*/*",
            authorization:
                "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ikd1Smk0Zjk4cjJjMzdlUDZmakthWCJ9.eyJpc3MiOiJodHRwczovL2Rldi12YWs4MWI1OS51cy5hdXRoMC5jb20vIiwic3ViIjoiMWlmY3dSVUpUdE5lV1dZSHVaM2theUU4QVJ5d210S0lAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vcXF2d25samF0ZS5leGVjdXRlLWFwaS5hcC1zb3V0aGVhc3QtMi5hbWF6b25hd3MuY29tIiwiaWF0IjoxNjMwNTQ2NzQ5LCJleHAiOjE2MzA2MzMxNDksImF6cCI6IjFpZmN3UlVKVHROZVdXWUh1WjNrYXlFOEFSeXdtdEtJIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.OicrCegssyRcdzi75c3N029TI-OO8rgPDLVJ50Za21b1y547Iel_c04gaLMdfHwc_Euum4c3RzEAG3z-yOUtiIyiWfphWVFBlegZbo9BTYH5gft4Rwypiwm2KOLC701WAYEZ-vQLHMDnMrB7z-evQ1a6EfqMYTOlxP-PgYsHJGLEmLK35M50XJr0-W8wq6QJMBQhW-pgd7x36v_VzvdYPLpuYhi6YW1PiSFAdiBL82yZ50_wuHUUayFdB_c6xbdYn2_i3SeKAuoMxsiKj1Je_7HqQCl0DlrEEGLgP2NNU2Pvp7LjJCX6-_GRWj0GW3V_NOIMdWjKfLGkxNvpjw5Q1Q",
            "content-length": "0",
            "content-type": "application/json",
            host: "qqvwnljate.execute-api.ap-southeast-2.amazonaws.com",
            "user-agent": "insomnia/2021.4.1",
            "x-amzn-trace-id": "Root=1-612459cb-3708751968cf1f707277b293",
            "x-forwarded-for": "180.150.62.116",
            "x-forwarded-port": "443",
            "x-forwarded-proto": "https",
        },
        queryStringParameters: {
            asd: "potato",
        },
        requestContext: {
            accountId: "670960088768",
            apiId: "qqvwnljate",
            authorizer:
                items.hasAuthorizer || items.jwtSubject
                    ? {
                          jwt: {
                              claims: {
                                  sub: items.jwtSubject || "",
                              },
                              scopes: ["post"],
                          },
                      }
                    : undefined,
            domainName: "qqvwnljate.execute-api.ap-southeast-2.amazonaws.com",
            domainPrefix: "qqvwnljate",
            http: {
                method: "GET",
                path: "/map/1234",
                protocol: "HTTP/1.1",
                sourceIp: "180.150.62.116",
                userAgent: "insomnia/2021.4.1",
            },
            requestId: "EjL35jiAywMEPCw=",
            routeKey: "GET /map/{mapid}",
            stage: "$default",
            time: "24/Aug/2021:02:30:35 +0000",
            timeEpoch: 1629772235920,
        },
        pathParameters:
            items.definePathParameters || items.mapId
                ? {
                      mapid: items.mapId,
                  }
                : undefined,
        isBase64Encoded: false,
    };
}
