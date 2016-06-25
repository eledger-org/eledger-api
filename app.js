"use strict";

var _                 = require("underscore");
var express           = require("express");
var conf              = require("config");
var fs                = require("fs");
var Log               = require("node-android-logging");
var swaggerInit       = require("swagger-tools").initializeMiddleware;

var app               = express();

_.mixin({
  coalesce: function() {
    for (let i = 0; i < arguments.length; ++i) {
      let arg = arguments[i];

      if ((!_.isNaN(arg)) && (!_.isNull(arg)) && (!_.isUndefined(arg))) {
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
  let root = __dirname + "/node_modules/eledger-web";

  /* The default action is to send the index.html page and let Angular handle routing.
   *
   * The other actions include:
   * - Swagger API endpoint
   * - Static file endpoint
   */
  var defaultAction = function() {
    res.sendFile("index.html", {
      root: root
    });
  };

  /* The Swagger API endpoints all start with /api
   */
  if (req.path.startsWith("/api")) {
    /** I really don't want the browser to cache these api calls. **/
    res.setHeader("Cache-Control",  "no-cache");
    res.setHeader("Pragma",         "no-cache");
    res.setHeader("Expires",        0);
    res.setHeader("Last-Modified", (new Date()).toUTCString());

    /* Since we've established that this is not an angular endpoint, allow the next middleware to process.
     */
    next();
  } else {
    /* If the user is requesting one of the Angular routes, we'll send them the index.html file since Angular
     * handles it from there.
     *
     * In order to avoid hard coding the Angular routes into this program as well, we look to see if a static
     * file exists at the path they're requesting (within the root directory ./node_modules/eledger-web).
     *
     * If the file does exist at that path, they aren't requesting an API endpoint.
     * If no file exists at that path, they are requesting an Angular2 API endpoint.
     */
    fs.lstat(root + req.path, function(err, stats) {
      if (err) {
        defaultAction();
      } else {
        if (stats.isFile()) {
          res.sendFile(root + req.path);
        } else {
          defaultAction();
        }
      }
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

swaggerInit(require("./api/swagger/swagger.json"), function (swaggerTools) {
  app.listen(port);

  app.use(swaggerTools.swaggerMetadata());
  app.use(swaggerTools.swaggerValidator());
  app.use(swaggerTools.swaggerRouter({
    "controllers": "api/controllers"
  }));
  app.use(swaggerTools.swaggerUi());

  Log.I("Listening on port " + port);
});

