require("dotenv").config({ silent: true });

import * as lambda from "aws-lambda";
import * as jwksClient from "jwks-rsa";
import * as jwt from "jsonwebtoken";
// const jwksClient = require('jwks-rsa');
import * as util from "util";

const getPolicyDocument = (effect: string, resource: string) => {
    const policyDocument = {
        Version: "2012-10-17", // default version
        Statement: [
            {
                Action: "execute-api:Invoke", // default action
                Effect: effect,
                Resource: resource,
            },
        ],
    };
    return policyDocument;
};

// extract and return the Bearer Token from the Lambda event parameters
const getToken = (params: lambda.APIGatewayTokenAuthorizerEvent) => {
    // if (!params.type || params.type !== 'TOKEN') {
    //     throw new Error('Expected "event.type" parameter to have value "TOKEN"');
    // }

    const tokenString = params.authorizationToken;
    if (!tokenString) {
        throw new Error(
            'Expected "event.authorizationToken" parameter to be set'
        );
    }

    const match = tokenString.match(/^Bearer (.*)$/);
    if (!match || match.length < 2) {
        throw new Error(
            `Invalid Authorization token - ${tokenString} does not match "Bearer .*"`
        );
    }
    return match[1];
};

const jwtOptions = {
    audience: process.env.AUDIENCE,
    issuer: process.env.TOKEN_ISSUER,
};

module.exports.authenticate = (
    params: lambda.APIGatewayTokenAuthorizerEvent
) => {
    console.log(params);
    const token = getToken(params);

    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header || !decoded.header.kid) {
        throw new Error("invalid token");
    }

    const getSigningKey = util.promisify(client.getSigningKey);
    return getSigningKey(decoded.header.kid)
        .then((key: jwksClient.Jwk) => {
            const signingKey = key.publicKey || key.rsaPublicKey;
            return jwt.verify(token, signingKey as jwt.Secret, jwtOptions);
        })
        .then((decoded: any) => ({
            principalId: decoded.sub,
            policyDocument: getPolicyDocument("Allow", params.methodArn),
            context: { scope: decoded.scope },
        }));
};

const client = jwksClient({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10, // Default value
    jwksUri: process.env.JWKS_URI ?? "",
});
