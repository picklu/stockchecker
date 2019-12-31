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
var axios = require('axios');

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

const API_URL = "https://repeated-alpaca.glitch.me/v1/stock/{stock}/quote";

// source: https://stackoverflow.com/questions/52669596/promise-all-with-axios
function fetchData(url) {
  return axios.get(url)
    .then(function (response) {
      const data = response.data;
      return {
        stock: data.symbol,
        price: data.latestPrice
      };
    })
    .catch(function (error) {
      return { error: error };
    });
}

async function fetchAllData(URLs) {
  let networkRequestPromises = URLs.map(fetchData);
  return await axios
    .all(networkRequestPromises)
    .then(response => response)
    .catch(error => ({ error }))
}


module.exports = function (app) {
  app.route('/api/stock-prices')
    .get(async function (req, res) {
      const remoteIp = [].concat(req.ip || req.ips)[0];
      const stocks = [].concat(req.query.stock || []);
      const like = req.query.like;
      if (stocks.length === 1) {
        const url = API_URL.replace(/{stock}/, stocks[0]);
        const data = await fetchData(url);
        return res.json({ stockData: data });
      }
      else if (stocks.length === 2) {
        const urls = stocks.map(stock => API_URL.replace(/{stock}/, stock));
        const data = await fetchAllData(urls)
        return res.json({ stockData: data });
      }
      else {
        res.send('Empty stock!');
      }
    });
};
