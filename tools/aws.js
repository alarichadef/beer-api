const AWS = require("aws-sdk");
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY, // aws access id here
  secretAccessKey: process.env.AWS_SECRET, // aws secret access key here
  apiVersion: '2006-03-01',
  region: 'eu-west-3'
});

module.exports = s3;