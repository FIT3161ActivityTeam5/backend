import * as app from "../../src/app";
import getEvent from "../../events/getEvent";
import postEvent from "../../events/postEvent";
import patchEvent from "../../events/patchEvent";
import {
    DynamoDBClient,
    GetItemCommand,
    PutItemCommand,
} from "@aws-sdk/client-dynamodb";

const SUPRESS_LOGS = true;

const testJwtSubject = "testJWTSubjectValue";
const testMapId = "an test ID";
const testUserId = "testUserId";
const testMapData = "sample map data";

const defaultSpyReturnValue = Promise.resolve({
    $metadata: {},
    Items: [
        {
            mapID: {
                S: testMapId,
            },
            associatedUserID: {
                S: testUserId,
            },
            mapData: {
                S: testMapData,
            },
        },
    ],
});

const isTest = process.env.JEST_WORKER_ID;
process.env.TABLE_NAME = "test-table";
process.env.INDEX_NAME = "userIDIndex";

const ddb = new DynamoDBClient({
    ...(isTest && {
        endpoint: "http://127.0.0.1:8000",
        sslEnabled: false,
        tls: false,
        region: "ap-southeast-1",
        credentials: {
            accessKeyId: "fakeMyKeyId",
            secretAccessKey: "fakeSecretAccessKey",
        },
    }),
});

describe("Test GET /map/{mapid}", () => {
    afterEach(() => {
        jest.restoreAllMocks();
        if (SUPRESS_LOGS)
            jest.spyOn(console, "log").mockImplementation(jest.fn());
    });

    test("Handles empty path parameters and no mapid", async () => {});

    test.each([false, true])(
        "Handles empty path parameters and no mapid",
        async (val) => {
            const spy = jest.spyOn(app, "withDynamoClientQueryItemSend");
            const event = getEvent({ definePathParameters: val });
            const data = await app.handler(event);

            expect(spy).not.toBeCalled();
            expect(data.statusCode).toEqual(400);
            expect(JSON.parse(data.body || "")).toEqual("No map ID");
        }
    );

    test("Handles normal lookup", async () => {
        const event = getEvent({ mapId: testMapId });
        const spy = jest
            .spyOn(app, "withDynamoClientQueryItemSend")
            .mockReturnValue(defaultSpyReturnValue);
        const data = await app.handler(event);
        const spyCallArg = spy.mock.calls[0][0];
        expect(spyCallArg).toMatchObject({
            input: {
                ExpressionAttributeValues: { ":s": { S: testMapId } },
            },
        });
        expect(data.statusCode).toEqual(200);
        expect(JSON.parse(data.body || "")[0]).toEqual({
            mapID: testMapId,
            associatedUserID: testUserId,
            mapData: testMapData,
        });
    });
    test("Handles empty error response from dynamoDB", async () => {
        const event = getEvent({
            mapId: "an invalid map id",
        });
        const spy = jest
            .spyOn(app, "withDynamoClientQueryItemSend")
            .mockRejectedValue("No items found");

        const data = await app.handler(event);
        const spyCallArg = spy.mock.calls[0][0];
        expect(spyCallArg).not.toMatchObject({
            input: {
                ExpressionAttributeValues: { ":s": { S: testMapId } },
            },
        });

        expect(data.statusCode).toEqual(404);
        expect(JSON.parse(data.body || "")).toEqual([]);
    });
    test("Handles empty response from dynamoDB", async () => {
        const event = getEvent({
            mapId: "an invalid map id",
        });
        const spy = jest
            .spyOn(app, "withDynamoClientQueryItemSend")
            .mockImplementation(async (input) => await ddb.send(input));

        const data = await app.handler(event);
        const spyCallArg = spy.mock.calls[0][0];
        expect(spyCallArg).not.toMatchObject({
            input: {
                ExpressionAttributeValues: { ":s": { S: testMapId } },
            },
        });

        expect(data.statusCode).toEqual(404);
        expect(JSON.parse(data.body || "")).toEqual([]);
    });
});

describe("Test GET /map/list", () => {
    afterEach(() => {
        jest.restoreAllMocks();
        if (SUPRESS_LOGS)
            jest.spyOn(console, "log").mockImplementation(jest.fn());
    });

    test("Handles no items found", async () => {
        const event = getEvent({ jwtSubject: testJwtSubject, isList: true });
        const spy = jest
            .spyOn(app, "withDynamoClientQueryItemSend")
            .mockRejectedValue("No items found");
        const data = await app.handler(event);

        const spyCallArg = spy.mock.calls[0][0];
        expect(spyCallArg).toMatchObject({
            input: {
                ExpressionAttributeValues: { ":s": { S: testJwtSubject } },
            },
        });
        expect(data.statusCode).toEqual(404);
        expect(JSON.parse(data.body || "")).toEqual([]);
    });

    test("Handles one map returned", async () => {
        const event = getEvent({ jwtSubject: testJwtSubject, isList: true });
        const spy = jest
            .spyOn(app, "withDynamoClientQueryItemSend")
            .mockReturnValue(defaultSpyReturnValue);
        const data = await app.handler(event);

        const spyCallArg = spy.mock.calls[0][0];
        expect(spyCallArg).toMatchObject({
            input: {
                ExpressionAttributeValues: { ":s": { S: testJwtSubject } },
            },
        });
        expect(data.statusCode).toEqual(200);
        expect(JSON.parse(data.body || "")[0]).toEqual({
            mapID: testMapId,
            associatedUserID: testUserId,
            mapData: testMapData,
        });
    });

    test("Handles two maps returned", async () => {
        const event = getEvent({ jwtSubject: testJwtSubject, isList: true });
        const spy = jest
            .spyOn(app, "withDynamoClientQueryItemSend")
            .mockReturnValue(
                Promise.resolve({
                    $metadata: {},
                    Items: [
                        {
                            mapID: {
                                S: testMapId,
                            },
                            associatedUserID: {
                                S: testUserId,
                            },
                            mapData: {
                                S: testMapData,
                            },
                        },
                        {
                            mapID: {
                                S: testMapId + "2",
                            },
                            associatedUserID: {
                                S: testUserId + "2",
                            },
                            mapData: {
                                S: testMapData + "2",
                            },
                        },
                    ],
                })
            );
        const data = await app.handler(event);

        const spyCallArg = spy.mock.calls[0][0];
        expect(spyCallArg).toMatchObject({
            input: {
                ExpressionAttributeValues: { ":s": { S: testJwtSubject } },
            },
        });
        expect(data.statusCode).toEqual(200);
        expect(JSON.parse(data.body || "")).toHaveLength(2);
    });
});

describe("Test POST /map", () => {
    afterEach(() => {
        jest.restoreAllMocks();
        if (SUPRESS_LOGS)
            jest.spyOn(console, "log").mockImplementation(jest.fn());
    });
    test("Handles empty mapdata", async () => {
        const spy = jest.spyOn(app, "withDynamoClientPutItemSend");
        const event = postEvent({});
        const data = await app.handler(event);

        expect(spy).not.toBeCalled();
        expect(data.statusCode).toEqual(400);
        expect(JSON.parse(data.body || "")).toEqual("mapdata not specified");
    });

    test("Inserts correctly on POST", async () => {
        jest.spyOn(app, "withDynamoClientPutItemSend").mockImplementation(
            async (input) => await ddb.send(input)
        );
        const data = await app.handler(
            postEvent({
                mapData: "arbitrary map data",
                userId: "testUserId",
            })
        );

        // Look up table and verify item was inserted correctly
        expect(data.statusCode).toEqual(200);
        const res = await ddb.send(
            new GetItemCommand({
                TableName: "test-table",
                Key: {
                    mapID: { S: JSON.parse(data.body || "").mapID },
                },
            })
        );
        expect(res.Item).toEqual({
            mapID: { S: JSON.parse(data.body || "").mapID },
            associatedUserID: { S: "testUserId" },
            mapData: { S: "arbitrary map data" },
        });
    });
});

describe("Test PATCH /map/{mapid}", () => {
    afterEach(() => {
        jest.restoreAllMocks();
        if (SUPRESS_LOGS)
            jest.spyOn(console, "log").mockImplementation(jest.fn());
    });

    test.each([false, true])("Handles no map id", async (val) => {
        const spy = jest.spyOn(app, "withDynamoClientPutItemSend");
        const event = patchEvent({ definePathParameters: val });
        const data = await app.handler(event);

        expect(spy).not.toBeCalled();
        expect(data.statusCode).toEqual(400);
        expect(JSON.parse(data.body || "")).toEqual("mapID not specified");
    });

    test("Handles empty mapdata", async () => {
        const spy = jest.spyOn(app, "withDynamoClientPutItemSend");
        const event = patchEvent({ mapId: "test" });
        const data = await app.handler(event);

        expect(spy).not.toBeCalled();
        expect(data.statusCode).toEqual(400);
        expect(JSON.parse(data.body || "")).toEqual("mapdata not specified");
    });

    test("Denies PATCH when no map with specified mapid exists", async () => {
        const spy = jest.spyOn(app, "withDynamoClientPutItemSend");
        jest.spyOn(app, "withDynamoClientQueryItemSend").mockImplementation(
            async (input) => await ddb.send(input)
        );
        // The dynamoDB mock can't reset after each test run so we have to make
        // sure we're passing in a unique mapId to ensure it's not found in the DB.
        const event = patchEvent({
            mapData: "testMapData",
            userId: "testUserId",
            mapId: "12345-unique-asdasdasdasd",
        });
        const data = await app.handler(event);

        expect(spy).not.toBeCalled();
        expect(data.statusCode).toEqual(400);
        expect(JSON.parse(data.body || "")).toEqual(
            "A map with specified mapid does not exist"
        );
    });

    test("Allows PATCH when specified mapId already exists in DB", async () => {
        const spy = jest
            .spyOn(app, "withDynamoClientPutItemSend")
            .mockImplementation(async (input) => await ddb.send(input));
        jest.spyOn(app, "withDynamoClientQueryItemSend").mockImplementation(
            async (input) => await ddb.send(input)
        );
        ddb.send(
            new PutItemCommand({
                TableName: "test-table",
                Item: {
                    mapID: { S: "someMapId" },
                    associatedUserID: { S: "someUserId" },
                    mapData: { S: "mapData" },
                },
            })
        );
        const event = patchEvent({
            mapData: "newMapData",
            userId: "someUserId",
            mapId: "someMapId",
        });
        const data = await app.handler(event);

        expect(data.statusCode).toEqual(200);
        expect(spy).toBeCalledTimes(1);
        const res = await ddb.send(
            new GetItemCommand({
                TableName: "test-table",
                Key: {
                    mapID: { S: JSON.parse(data.body || "").mapID },
                },
            })
        );
        expect(res.Item).toEqual({
            mapID: { S: JSON.parse(data.body || "").mapID },
            associatedUserID: { S: "someUserId" },
            mapData: { S: "newMapData" },
        });
    });
});

describe("Miscellaneous tests", () => {
    test.each(["HEAD", "PUT", "DELETE", "CONNECT", "TRACE", "OPTIONS"])(
        "Handles unsupported HTTP method %s",
        async (method) => {
            let event = getEvent({});
            event.requestContext.http.method = method;
            const data = await app.handler(event);
            expect(data.statusCode).toEqual(405);
        }
    );
});
