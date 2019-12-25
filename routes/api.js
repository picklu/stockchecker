/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');

var CONNECTION_STRING = process.env.DB_LOCAL || process.env.DB;
const DB_NAME = process.env.DB_NAME;

// aync:await in mongodb
var client;

async function closeDBConnection() {
  if (client) {
    await client.close();
    client = undefined;
  }
  return;
}

// connect to the database
async function connectDB() {
  if (DB_TYPE === 'mongodb-memory-server') {
    if (!memoryServer) {
      memoryServer = new MongoMemoryServer();
      CONNECTION_STRING = await memoryServer.getConnectionString();
    }
  }
  let result;
  if (!client) {
    try {
      client = await MongoClient.connect(CONNECTION_STRING, { useUnifiedTopology: true });
      result = { db: client.db(DB_NAME) };
    }
    catch (error) {
      result = { error: error };
    }
    finally {
      return result;
    }
  }
  return { error: 'Previous connection was not closed!' };
}

// insert data to the database
async function insertData(project, data) {
  const dbConn = await connectDB();
  if (dbConn.error) {
    return { error: dbConn.error };
  }
  const db = dbConn.db;
  const collection = db.collection(project);
  let result;
  try {
    result = await collection.insertOne(data);
  }
  catch (error) {
    result = { error: error };
  }
  finally {
    await closeDBConnection();
    return result;
  }
}

// update issue in the database
async function updateData(project, id, data) {
  const dbConn = await connectDB();
  if (dbConn.error) {
    return { error: dbConn.error };
  }
  const db = dbConn.db;
  const collection = db.collection(project);
  let result;
  try {
    result = await collection.updateOne({ _id: id }, { $set: data });
  }
  catch (error) {
    result = { error: error };
  }
  finally {
    await closeDBConnection();
    return result;
  }
}

// get issue from the database
async function getData(project, data) {
  const dbConn = await connectDB();
  if (dbConn.error) {
    return { error: dbConn.error };
  }
  const db = dbConn.db;
  const collection = db.collection(project);
  let result;
  try {
    result = await collection.find(data).toArray();
  }
  catch (error) {
    result = { error: error };
  }
  finally {
    await closeDBConnection();
    return result;
  }
}

// delete issue in the database
async function deleteData(project, id) {
  const dbConn = await connectDB();
  if (dbConn.error) {
    return { error: dbConn.error };
  }
  const db = dbConn.db;
  const collection = db.collection(project);
  let result;
  try {
    result = await collection.findOneAndDelete({ _id: id });
  }
  catch (error) {
    result = { error: error };
  }
  finally {
    await closeDBConnection();
    return result;
  }
}
// end of mongodb functions

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res) {

    });

};
