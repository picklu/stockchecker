/*
*
*
*       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
*       -----[Keep the tests in the same order!]-----
*       (if additional are added, keep them at the very end!)
*/

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function () {

  suite('GET /api/stock-prices => stockData object', function () {

    test('1 stock', function (done) {
      chai.request(server)
        .get('/api/stock-prices')
        .send({ stock: 'goog' })
        .then(function (res) {
          assert.equal(res.status, 200);
          console.log(res)
          // assert.property(res.body, 'stockData');
          //complete this one too

          done();
        })
        .catch(function (error) {
          console.log(error);
        });
    });

    test('1 stock with like', function (done) {

    });

    test('1 stock with like again (ensure likes arent double counted)', function (done) {

    });

    test('2 stocks', function (done) {

    });

    test('2 stocks with like', function (done) {

    });

  });

});
