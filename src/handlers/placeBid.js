import AWS from 'aws-sdk';
import createError from 'http-errors';
import commonMiddleware from '../libs/commonMiddleware';
import {getAuctionById} from './getAuction';
import validator from '@middy/validator';
import placeBidSchema from '../libs/schemas/placeBidSchema';


const dynamodb = new AWS.DynamoDB.DocumentClient();

async function placeBid(event, context) {
  let updatedAuction;
  const { id } = event.pathParameters;
  const { email } = event.requestContext.authorizer;
  const { amount } = event.body;
  const auction = await getAuctionById(id);

  if(email === auction.seller){
    throw new createError.Forbidden(`You can't bid on  your own auction.`);
  }

  if(email === auction.highestBid.seller){
    throw new createError.Forbidden(`You are already the highest bidder.`);
  }

  if(!auction){
    throw new createError.NotFound(`Unable to find auction for ${id}`);
  }

  if(auction.status !== 'OPEN'){
    throw new createError.Forbidden(`You can't bid ${id} auction.`);
  }

  if(amount <= auction.highestBid.amount){
    throw new createError.Forbidden(`Your bid must be highest than ${auction.highestBid.amount}`);
  }
  const params = {
    TableName: process.env.AUCTIONS_TABLE_NAME,
    Key: {id},
    UpdateExpression: 'set highestBid.amount = :amount, highestBid.bidder = :bidder',
    ExpressionAttributeValues: {
      ':amount': amount,
      ':bidder': email,
    },
    ReturnValues: 'ALL_NEW'
  };

  try {
    const result = await dynamodb.update(params).promise();
    updatedAuction = result.Attributes;
  } catch (error) {
    console.log(error);
    throw new createError.InternalServerError(error);
  }

  return {
    statusCode: 201,
    body: JSON.stringify(updatedAuction),
  };
}

export const handler = commonMiddleware(placeBid).use(validator({inputSchema: placeBidSchema}));