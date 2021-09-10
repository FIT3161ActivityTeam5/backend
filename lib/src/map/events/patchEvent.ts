import { APIGatewayProxyEventV2 } from "aws-lambda";

export default function patchEvent(items: {
    mapData?: string;
    userId?: string;
    mapid?: string;
}): APIGatewayProxyEventV2 {
    return {
        version: "2.0",
        routeKey: "PATCH /map/{mapid}",
        rawPath: "/map/1234",
        rawQueryString: "",
        headers: {
            accept: "*/*",
            authorization:
                "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ikd1Smk0Zjk4cjJjMzdlUDZmakthWCJ9.eyJpc3MiOiJodHRwczovL2Rldi12YWs4MWI1OS51cy5hdXRoMC5jb20vIiwic3ViIjoiMWlmY3dSVUpUdE5lV1dZSHVaM2theUU4QVJ5d210S0lAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vcXF2d25samF0ZS5leGVjdXRlLWFwaS5hcC1zb3V0aGVhc3QtMi5hbWF6b25hd3MuY29tIiwiaWF0IjoxNjMxMjU4NTM3LCJleHAiOjE2MzEzNDQ5MzcsImF6cCI6IjFpZmN3UlVKVHROZVdXWUh1WjNrYXlFOEFSeXdtdEtJIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.g5CRWQQg2NCnluBzchgpfTnBA3-uMYVLSyC4_ZN5aHTl0oC-LOoOh9s2Md7DLmmciZTX7DqfmljHm0JIoY0S6mHvAPoKCFZiE261yRCKWm5XpuVeGDs8-4AgiCik1WBG-rY7Y2mvGzEnsi0WKKAShm_gYdRozgfyPU-OFPE2a20LbFCow6ChIDZMI8EcXiLkmEOhPdU2_AkTE4n4UMlfdhxa6ZTjlB_C6ndXNgaxRXudvDhCF77gNgyt2Tt9FCrEd26C4Zq5EQ0ACu9cgC7Yolsc6TJCiWNh51CvaaXLAGMq_pRLM084BbbfzQXdPf01Ahhg6vubRt857YMuO5XcsQ",
            "content-length": "0",
            "content-type": "application/json",
            host: "qqvwnljate.execute-api.ap-southeast-2.amazonaws.com",
            mapdata: items.mapData,
            "user-agent": "insomnia/2021.5.2",
            "x-amzn-trace-id": "Root=1-613b08ca-7244e7eb653533863cd32442",
            "x-forwarded-for": "180.150.62.116",
            "x-forwarded-port": "443",
            "x-forwarded-proto": "https",
        },
        requestContext: {
            accountId: "670960088768",
            apiId: "qqvwnljate",
            authorizer: {
                jwt: {
                    claims: {
                        sub: items.userId || "",
                    },
                    scopes: ["patch"],
                },
            },
            domainName: "qqvwnljate.execute-api.ap-southeast-2.amazonaws.com",
            domainPrefix: "qqvwnljate",
            http: {
                method: "PATCH",
                path: "/map/1234",
                protocol: "HTTP/1.1",
                sourceIp: "180.150.62.116",
                userAgent: "insomnia/2021.5.2",
            },
            requestId: "Fb5PviPQSwMEJJw=",
            routeKey: "PATCH /map/{mapid}",
            stage: "$default",
            time: "10/Sep/2021:07:27:06 +0000",
            timeEpoch: 1631258826937,
        },
        pathParameters: {
            mapid: items.mapid,
        },
        isBase64Encoded: false,
    };
}
