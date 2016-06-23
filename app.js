"use strict";

var _                 = require("underscore");
var app               = require("express")();
var conf              = require("config");
var Log               = require("node-android-logging");
var SwaggerExpress    = require("swagger-express-mw");

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

var config = {
  appRoot: __dirname // required config
};

SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) {
    Log.E(err);

    throw err;
  }

  // install middleware
  swaggerExpress.register(app);

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
  app.listen(port);

  Log.I("Listening on port " + port);
});
