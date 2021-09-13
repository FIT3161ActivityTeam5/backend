# FIT3162 Group 5 Backend

<img align=right src="img/diagram-crop.png" width=20%>

[![Node.js CI](https://github.com/FIT3161ActivityTeam5/backend/actions/workflows/node.js.yml/badge.svg)](https://github.com/FIT3161ActivityTeam5/backend/actions/workflows/node.js.yml)

This is our backend application for Thrive, developed using TypeScript and the AWS CDK.

## Deploying

-   Clone the repo
-   Run `npm install`
-   `cd` to `lib/src/map` and run `npm install`
-   Install the AWS CDK if you haven't already: `npm install -g aws-cdk`
    -   Ensure your AWS credentials are set at `~/.aws`
    -   You may also need to bootstrap your AWS environment - more details [here](https://docs.aws.amazon.com/cdk/latest/guide/bootstrapping.html)
-   `cd` back to the main directory and run `./cdk.ps1 deploy`
    -   This will compile all the Lambda functions and deploy the stack to your AWS account

## Testing

Tests exist for the `map` Lambda function, located at `lib/src/map`. These tests are located at `lib/src/map/tests/unit` and provide 100% line, branch and function coverage for the Lambda function (`app.ts`). They can be run with `npm run test`, or `npm run testcov` to generate test coverage data.

<br>
<br>
<p align="center">
  <img src="img/coverage.jpg" />
  <img src="img/tests.jpg" />
</p>
