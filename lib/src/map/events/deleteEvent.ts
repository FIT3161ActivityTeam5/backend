export default function deleteEvent(items: {
    userId?: string;
    mapId?: string;
    definePathParameters?: boolean;
    hasAuthorizer?: boolean;
}) {
    return {
        version: "2.0",
        routeKey: "DELETE /map/{mapid}",
        rawPath: "/map/cbc77da0cd36037f7a357b13f4d50129edf2937b",
        rawQueryString: "",
        headers: {
            accept: "*/*",
            authorization:
                "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ikd1Smk0Zjk4cjJjMzdlUDZmakthWCJ9.eyJpc3MiOiJodHRwczovL2Rldi12YWs4MWI1OS51cy5hdXRoMC5jb20vIiwic3ViIjoiMWlmY3dSVUpUdE5lV1dZSHVaM2theUU4QVJ5d210S0lAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vcXF2d25samF0ZS5leGVjdXRlLWFwaS5hcC1zb3V0aGVhc3QtMi5hbWF6b25hd3MuY29tIiwiaWF0IjoxNjMxNTgwODUzLCJleHAiOjE2MzE2NjcyNTMsImF6cCI6IjFpZmN3UlVKVHROZVdXWUh1WjNrYXlFOEFSeXdtdEtJIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.iZeaWoSqOoqFB-3g3x7lgJOOAx9UK6wS4BL01Aa1AkGsxRnhU27x48EhYEOFc48WZ3RNw1KKLk2uI53pfAp6RdtGjGZmMNyCcXzYqFcROP9sQwa9wyF9IbQeVoo27KRBh0SmBZ9mHrmBfHQSMgyMuncxPFeSk8Rz2GScELY7rKZKUAoPCts9i5PwgsPYLoIas62bVjRvX_R8KPXi5mMl-eC3RWhPpccpTDZf3bZiM7djNnZabaRBq7VmUUkkOjoe69gAQDjiUibTxMFQ7k2ucBpdoR-VURDKdx_NieItnskol22TBrjCj6AjeJjCUx0ADkS0y6zBf7ILDRVNBa8TGA",
            "content-length": "0",
            "content-type": "application/json",
            host: "qqvwnljate.execute-api.ap-southeast-2.amazonaws.com",
            "user-agent": "insomnia/2021.5.2",
            "x-amzn-trace-id": "Root=1-613fff8c-463e148e49f004185f122b4b",
            "x-forwarded-for": "180.150.62.116",
            "x-forwarded-port": "443",
            "x-forwarded-proto": "https",
        },
        requestContext: {
            accountId: "670960088768",
            apiId: "qqvwnljate",
            authorizer:
                items.hasAuthorizer || items.userId
                    ? {
                          jwt: {
                              claims: {
                                  sub: items.userId || "",
                              },
                              scopes: ["post"],
                          },
                      }
                    : undefined,
            domainName: "qqvwnljate.execute-api.ap-southeast-2.amazonaws.com",
            domainPrefix: "qqvwnljate",
            http: {
                method: "DELETE",
                path: "/map/cbc77da0cd36037f7a357b13f4d50129edf2937b",
                protocol: "HTTP/1.1",
                sourceIp: "180.150.62.116",
                userAgent: "insomnia/2021.5.2",
            },
            requestId: "FoTd7jdfSwMEMFQ=",
            routeKey: "DELETE /map/{mapid}",
            stage: "$default",
            time: "14/Sep/2021:01:49:00 +0000",
            timeEpoch: 1631584140161,
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
