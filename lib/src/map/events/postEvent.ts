import { APIGatewayProxyEventV2 } from "aws-lambda";

export default function postEvent(mapData?: string): APIGatewayProxyEventV2 {
    return {
        version: "2.0",
        routeKey: "POST /map",
        rawPath: "/map",
        rawQueryString: "",
        headers: {
            accept: "*/*",
            authorization:
                "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ikd1Smk0Zjk4cjJjMzdlUDZmakthWCJ9.eyJpc3MiOiJodHRwczovL2Rldi12YWs4MWI1OS51cy5hdXRoMC5jb20vIiwic3ViIjoiMWlmY3dSVUpUdE5lV1dZSHVaM2theUU4QVJ5d210S0lAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vcXF2d25samF0ZS5leGVjdXRlLWFwaS5hcC1zb3V0aGVhc3QtMi5hbWF6b25hd3MuY29tIiwiaWF0IjoxNjMxMTYwOTI0LCJleHAiOjE2MzEyNDczMjQsImF6cCI6IjFpZmN3UlVKVHROZVdXWUh1WjNrYXlFOEFSeXdtdEtJIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.e7lFH3U0u6y7r3Wt9IhXxs_oJmNswjdfInqr-YSeWqRZuWMqS9LVM3i2OL9k-iQusCo9AQViGymNaDBJZGqaOek9it6TucJ5p9aleaXKA96PqGbwa_v0M3PLgW9yjD4vw7QmBFT7zfwkXWhJ_gpJiGr9XRcL8s8Z-lTC4Em09281CPLo23ayioDdCHkD4ON4NLsdWRQ5dPaHUTDfZP37dR1t9FMonAp55AAk_v_X7TleF-sr1hv9erH4VvM9GjRvgqI-__xw9frOwu_OSAqoV85AR5F1aov7R7PGevQPnm7zC2xZmqyMGMqPJxxkaUIn7oa9KZLWjwe99BUR6TJ4NA",
            "content-length": "0",
            "content-type": "application/json",
            host: "qqvwnljate.execute-api.ap-southeast-2.amazonaws.com",
            mapdata: mapData,
            "user-agent": "insomnia/2021.5.2",
            "x-amzn-trace-id": "Root=1-61398c38-5b63f0cf53d78c973839dfd8",
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
                        sub: "1ifcwRUJTtNeWWYHuZ3kayE8ARywmtKI@clients",
                    },
                    scopes: [],
                },
            },
            domainName: "qqvwnljate.execute-api.ap-southeast-2.amazonaws.com",
            domainPrefix: "qqvwnljate",
            http: {
                method: "POST",
                path: "/map",
                protocol: "HTTP/1.1",
                sourceIp: "180.150.62.116",
                userAgent: "insomnia/2021.5.2",
            },
            requestId: "FYLY7hLASwMEPww=",
            routeKey: "POST /map",
            stage: "$default",
            time: "09/Sep/2021:04:23:20 +0000",
            timeEpoch: 1631161400978,
        },
        isBase64Encoded: false,
    };
}
