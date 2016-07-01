/**
 * @module App
 *
 * @description
 * App serves as the entry point for starting the application.
 */

"use strict";

var conf              = require("config");
var Log               = require("node-android-logging");

if (conf.has("loglevel")) {
  Log.setDefaults();
  Log.enableStderr(conf.get("loglevel"));
}

var express           = require("express")();
var fs                = require("fs");
var Mysqlc            = require("./Mysqlc");
var DbUpgrade         = require("./DbUpgrade");
var swaggerInit       = require("swagger-tools").initializeMiddleware;

// Mixes in _.coalesce
require("./util/coalesce");

module.exports = express; // for testing

/* Access and error logs */
if (process.env.APACHE_LOGS !== undefined) {
  express.use(require("morgan")("combined"));
}

/* */
express.all("/*", function(req, res, next) {
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
  } else if (req.path.startsWith("/static-stored-files")) {
    res.sendFile(__dirname + req.path);
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

/*
 * Prepare DB
 */
try {
  Mysqlc.connect();
  DbUpgrade.initializeModels();
  DbUpgrade.setupQueries();
  DbUpgrade.upgrade().then(function() {
    DbUpgrade.finalizeModels();
  }).catch(function(rejection) {
    setTimeout(function() {
      if (rejection !== undefined && rejection.stack !== undefined) {
        throw rejection;
      } else {
        Log.E(rejection);

        throw new Error(rejection);
      }
    });
  });
} catch (ex) {
  Log.E(ex);

  process.exit(1);
}

var sourceFile = "./api/swagger/index.json";

swaggerInit(require(sourceFile), function (swaggerTools) {
  express.listen(port);

  express.use(swaggerTools.swaggerMetadata());
  express.use(swaggerTools.swaggerValidator());
  express.use(swaggerTools.swaggerRouter({
    "controllers": "api/controllers"
  }));
  express.use(swaggerTools.swaggerUi());

  Log.I("Listening on port " + port);
});

