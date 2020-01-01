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
const COLLECTION = 'stockeeper';

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

// insert/update issue in the database
async function updateData(stock, ip, like) {
  const query = { stock };
  const update = like
    ? { $set: { stock: stock }, $addToSet: { ips: ip } }
    : { $set: { stock: stock } };
  const dbConn = await connectDB();
  if (dbConn.error) {
    return { error: dbConn.error };
  }
  const db = dbConn.db;
  const collection = db.collection(COLLECTION);
  let result;
  try {
    result = await collection.findOneAndUpdate(
      query, 
      update, 
      { upsert: true, returnOriginal: false }
    );
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
async function getData(stock) {
  const dbConn = await connectDB();
  if (dbConn.error) {
    return { error: dbConn.error };
  }
  const db = dbConn.db;
  const collection = db.collection(COLLECTION);
  let result;
  try {
    result = await collection.findOne({ stock });
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
      const like = req.query.like === undefined ? false : req.query.like;
      if (stocks.length === 1) {
        const url = API_URL.replace(/{stock}/, stocks[0]);
        const data = await fetchData(url);
        if (data.stock) {
          const result = await updateData(data.stock, remoteIp, like);
          if (result) {
            const likes = result.value && result.value.ips ? result.value.ips.length : 0;
            data.likes = likes;
            return res.json({ stockData: data });
          }
          else {
            return res.json({ error: 'something went wrong!' });
          }
        }
        else {
          return res.json({ error: 'invalid stock!' });
        }
      }
      else if (stocks.length === 2) {
        const urls = stocks.map(stock => API_URL.replace(/{stock}/, stock));
        const data = await fetchAllData(urls);
        const [dataFirst, dataSecond] = data;

        // for first stock
        if (dataFirst.stock) {
          const resultOne = await updateData(dataFirst.stock, remoteIp, like);
          if (resultOne) {
            const likes = resultOne.value && resultOne.value.ips ? resultOne.value.ips.length : 0;
            dataFirst.rel_likes = likes;
          }
        }

        // for second stock
        if (dataSecond.stock) {
          const resultTwo = await updateData(dataSecond.stock, remoteIp, like);
          if (resultTwo) {
            const likes = resultTwo.value && resultTwo.value.ips ? resultTwo.value.ips.length : 0;
            dataSecond.rel_likes = likes;
          }
        }

        dataFirst.rel_likes = dataFirst.rel_likes - dataSecond.rel_likes;
        dataSecond.rel_likes = dataSecond.rel_likes - dataFirst.rel_likes;

        res.json({ stockData: [dataFirst, dataSecond] });

      }
      else {
        res.send('Empty stock!');
      }
    });
};
