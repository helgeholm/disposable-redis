var async = require("async");
var fs = require("fs");
var http = require("http");
var net = require("net");
var spawn = require("child_process").spawn;
var redis = require("redis");

module.exports = {
  server: redisServer,
  client: redisClient
};

var DEFAULT_REDIS_PORT = 6380;

function redisServer(port, next) {
  if (next === undefined) {
    // optional parameter port omitted; reorder params
    next = port;
    port = undefined;
  }
  port = port || DEFAULT_REDIS_PORT;

  function installLocalRedis(next) {
    if (fs.existsSync(__dirname + "/.redis"))
      return next();

    function cleanupTempDir(next) {
      if (fs.existsSync(__dirname + "/redis-2.6.12"))
        return next();
      spawn("rm", ["-rf", __dirname + "/redis-2.6.12"])
        .on("exit", function() { next(); });
    }

    function actualInstall(next) {
      var unzipper = spawn("tar", ["xz"], { cwd: __dirname });
      var request = http.get(
        "http://redis.googlecode.com/files/redis-2.6.12.tar.gz",
        function(response) {
          response.pipe(unzipper.stdin);
          unzipper.on("exit", function unzipDone() {
            var builder = spawn("make", [], { cwd: __dirname + "/redis-2.6.12" });
            builder.stdout.on("data", function(){});
            builder.on("exit", function() { next(); });
          });
        });
    }

    function renameDir(next) {
      fs.rename(__dirname + "/redis-2.6.12",
                __dirname + "/.redis",
                next);
    }
    
    async.series([
      cleanupTempDir,
      actualInstall,
      renameDir
    ], next);
  };

  installLocalRedis(function(err) {
    if (err) return next(err);
    var localRedis = spawn(".redis/src/redis-server",
                           ["--port", port],
                           { cwd: __dirname });
    var retObj = {
      port: port,
      close: function shutdownServer(next) {
        localRedis.kill("SIGKILL");
        localRedis.on(
          "exit",
          function(_code, _signal) {
            next && next();
          });
        localRedis = null;
      }
    };

    var timeout = Date.now() + 10000;
    function tryConnect() {
      net.connect(port)
        .on('connect', function() {
          next(null, retObj);
        })
        .on('error', function() {
          setTimeout(tryConnect, 100);
        });
    }
    tryConnect();
  });
}

function redisClient(port, next) {
  if (next === undefined) {
    // optional parameter port omitted; reorder params
    next = port;
    port = undefined;
  }

  function serverRunning(err, server) {
    if (err) return next(err);
    var client = redis.createClient(server.port, "127.0.0.1");
    next(null, {
      client: client,
      close: function shutdown(next) {
        client.quit();
        server.close(next);
        client = null;
        server = null;
      }
    });
  }

  redisServer(port, serverRunning);
}
