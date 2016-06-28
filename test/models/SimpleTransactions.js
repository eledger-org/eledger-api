/* eslint-env mocha */

var assert            = require("chai").assert;
var Log               = require("node-android-logging");
var SimpleTransactions = require("../../models/SimpleTransactions");

describe("select()", function() {
  it("should return a result set", function(done) {
    SimpleTransactions.select().then(function(result) {
      assert.isAtLeast(result.length, 0);

      done();
    }).catch(function(rejection) {
      setTimeout(function() {
        Log.E(rejection);

        assert.isUndefined(rejection);
      });
    });
  });
});

