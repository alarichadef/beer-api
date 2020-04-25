const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: "AKIA6BXNIGA7ZEJZJOER", // aws access id here
  secretAccessKey: "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", // aws secret access key here
  apiVersion: '2006-03-01',
  region: 'eu-west-3'
});

module.exports = s3;