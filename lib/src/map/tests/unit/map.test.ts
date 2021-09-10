import * as app from "../../src/app";
import getEvent from "../../events/getEvent";
import postEvent from "../../events/postEvent";

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

describe("Test GET /map/{mapid}", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

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
    test("Handles empty response from dynamoDB", async () => {
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
});

describe("Test GET /map/list", () => {
    afterEach(() => {
        jest.restoreAllMocks();
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
    test("Handles empty mapdata", async () => {
        const spy = jest.spyOn(app, "withDynamoClientPutItemSend");
        const event = postEvent();
        const data = await app.handler(event);

        expect(spy).not.toBeCalled();
        expect(data.statusCode).toEqual(400);
        expect(JSON.parse(data.body || "")).toEqual("mapdata not specified");
    });
});
