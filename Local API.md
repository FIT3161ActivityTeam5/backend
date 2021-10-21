This is just a rough outline of the steps I took / tools I installed to be able to invoke Lambda functions locally.

## Step 1 - Docker

Install docker. Simple enough (WSL issues notwithstanding 😠).

## Step 2 - SAM CLI (Preview)

We need to install the AWS SAM CLI, but it **must** be the preview version. This is the only version that works with the AWS CDK. [Here's](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-cdk-getting-started.html) the link to the download page for the SAM preview CLI. Download and install. Verify it's working with `sam-beta-cdk --version`

## Step 3 - Running the thing

Now all our tools are installed, we can run our lambda functions locally.

_TODO: test functions which make API calls to AWS services. Add results here._

### Local lambda Invocation

In every Lambda function folder in the backend repo, there will be an `event.json` file under `events/`. This is the "input" to our lambda function, and we need to reference this file when locally invoking the function.

Here's an example command for invoking the `MapFunction` with the sample event (run from the project root):

```
sam-beta-cdk local invoke ThriveAppStack/MapFunction --event .\lib\src\map\events\event.json
```

And here's the output of that command:

```
START RequestId: f13a63cb-5cba-44dd-b562-0615e7c26934 Version: $LATEST
    authorization: 'Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ikd1Smk0Zjk4cjJjMzdlUDZmakthWCJ9.eyJpc3MiOiJodHRwczovL2Rldi12YWs4MWI1OS51cy5hdXRoMC5jb20vIiwic3ViIjoiMWlmY3dSVUpUdE5lV1dZSHVaM2theUU4QVJ5d210S0lAY2xpZW50cyIsImF1ZCI6Imh0dHBzOi8vcXF2d25samF0ZS5leGVjdXRlLWFwaS5hcC1zb3V0aGVhc3QtMi5hbWF6b25hd3MuY29tIiwiaWF0IjoxNjI5MjM5NDkyLCJleHAiOjE2MjkzMjU4OTIsImF6cCI6IjFpZmN3UlVKVHROZVdXWUh1WjNrYXlFOEFSeXdtdEtJIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.E_3qP1l_Q_yDgVtcn0-Iu8sKUO7hb08mC1oYlKApM3tCD4FoFhFl8CNuKX3cpTdpq5YnrKBhYltBXgr5AlFd71RVMgsn54zLTgCxjMze3Z6EPmgBsb13MnNiSpArS_gNKj8w27-bR-lD6Lr3hyVw4zuZM9-JWz2Qcr1TrXhBgOdNG139KYJ_Fm_sIgoOk9OLIZADG2350} isBase64Encoded: false5767:45 +0000',.ap-southeast-2.amazonaws.com',Z06Xyaq3PAWhd8aIcMJ3dq4sx5dsh7BFu7mmQI3N2YklSNf3Or8WGp67S-Y6HxEc5Zscjig',
END RequestId: f13a63cb-5cba-44dd-b562-0615e7c26934
REPORT RequestId: f13a63cb-5cba-44dd-b562-0615e7c26934  Init Duration: 0.10 ms  Duration: 107.80 ms     Billed Duration: 200 ms Memory Size: 128 MB     Max Memory Used: 128 MB
{"statusCode":200,"body":"Queries: {\"asd\":\"potato\"}"}
```

The bottom line is the interesting bit - the output of the function. This is the response that you would receive if you made an API request to the `/map` route.

aaand that's it!

### Local API

_TODO_
