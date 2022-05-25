import AWS from 'aws-sdk';
import createError from 'http-errors';
import validator  from '@middy/validator';
import commonMiddleware from '../libs/commonMiddleware';
import schema from './../libs/schemas/getAuctionSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function getAuctions(event, context) {
  let auctions;
  const { status } = event.queryStringParameters;

  try {
    /* const result = await dynamodb.scan({
      TableName: process.env.AUCTIONS_TABLE_NAME
    }).promise(); */
    const result = await dynamodb.query({
      TableName: process.env.AUCTIONS_TABLE_NAME,
      IndexName: 'statusAndEndDate',
      KeyConditionExpression: '#status = :status',
      ExpressionAttributeNames: {
        '#status': 'status',
      },
      ExpressionAttributeValues: {
        ':status': status,
      }
    }).promise();

    auctions = result.Items;
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 200,
    body: JSON.stringify(auctions),
  };
}

export const handler = commonMiddleware(getAuctions).use(validator({inputSchema: schema}));