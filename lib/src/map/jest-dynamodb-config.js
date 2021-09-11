const yaml = require("js-yaml");
const fs = require("fs");
const { CLOUDFORMATION_SCHEMA } = require("cloudformation-js-yaml-schema");

module.exports = async () => {
    const cf = yaml.safeLoad(
        // to get this, run (at root dir):
        // cdk synth > .\cdk.out\tmp.yaml
        fs.readFileSync("../../../cdk.out/tmp.yaml", "utf8"),
        {
            schema: CLOUDFORMATION_SCHEMA,
        }
    );
    var tables = [];
    Object.keys(cf.Resources).forEach((item) => {
        tables.push(cf.Resources[item]);
    });

    tables = tables
        .filter((r) => r.Type === "AWS::DynamoDB::Table")
        .map((r) => {
            let table = r.Properties;
            table.TableName = "test-table";
            delete table.TimeToLiveSpecification; // errors on dynamo-local
            return table;
        });
    return {
        tables,
        port: 8000,
    };
};
