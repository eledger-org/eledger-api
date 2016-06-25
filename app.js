"use strict";

var _                 = require("underscore");
var express           = require("express");
var conf              = require("config");
var Log               = require("node-android-logging");

/* app for static files (eledger-web) and swaggerApp for swagger api routes */
var app               = express();

_.mixin({
  coalesce: function() {
    for (let i = 0; i < arguments.length; ++i) {
      let arg = arguments[i];

      if ((!_.isNaN(arg)) && (!_.isNull(arg)) && (!_.isUndefined(arg))) {
        Log.I(arg);
        return arguments[i];
      }
    }
  }
});

module.exports = app; // for testing

/* Access and error logs */
app.use(require("morgan")("combined"));

/* */
app.all("/*", function(req, res, next) {
  if (req.path.startsWith("/api")) {
    next();
  } else {
    res.sendFile("index.html", {
      root: __dirname + "/node_modules/eledger-web"
    });
  }
});

/* Select a port */
var port;

if (conf.has("port")) {
  port = conf.get("port");
}

/**
 * Order prefers:
 * - process.env.PORT
 * - config/**.json#port
 * - 4443
 */
port = process.env.PORT || port || 4443;

require("swagger-express-middleware")(__dirname + "/api/swagger/swagger.json", app, function(err, mw) {
  if (err) {
    Log.E(err);

    throw err;
  }

  app.use(
      mw.metadata(),
      mw.CORS(),
      mw.files(),
      mw.parseRequest(),
      mw.validateRequest(),
      mw.mock()
      );

  app.listen(port);

  Log.I("Listening on port " + port);
});

