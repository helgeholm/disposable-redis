var assert = require("assert");
var fs = require("fs");
var net = require("net");
var spawn = require("child_process").spawn;
var disposableRedis = require("../index.js");
var redis = require("redis");

describe("disposable-redis", function() {
  it("will download and build redis if needed", function(next) {
    spawn("rm", ["-rf", ".redis"]).on("close", afterDeleted);
    function afterDeleted() {
      assert(!fs.existsSync(".redis"));
      disposableRedis.server(function(err, server) {
        assert(!err);
        assert(fs.existsSync(".redis/src/redis-server"));
        server.close(next);
      });
    }
  });

  it("can create a server", function(next) {
    disposableRedis.server(function(err, server) {
      assert(!err);
      assert(server.port);
      server.close(next);
    });
  });

  it("can create a server that works", function(next) {
    disposableRedis.server(function(err, server) {
      var client = redis.createClient(server.port, "127.0.0.1");
      client.set("herp", "derp", function(err) {
        assert(!err);
        client.quit();
        server.close(next);
      });
    });
  });
  
  it("properly shuts down the server on close", function(next) {
    disposableRedis.server(function(err, server) {
      server.close(function closed() {
        var connection = net.connect(server.port, function connected() {
          assert.fail("could still connect");
        });
        connection.on("error", function() {
          next();
        });
      });
    });
  });

  it("can create a server on a custom port", function(next) {
    var PORT = 6399;
    disposableRedis.server(PORT, function(err, server) {
      assert.equal(server.port, PORT);
      var client = redis.createClient(PORT, "127.0.0.1");
      client.set("herp", "derp", function(err) {
        server.close(next);
      });
    });
  });

  it("can create a working redis client", function(next) {
    disposableRedis.client(function(err, client) {
      client.client.set("herp", "derp", function(err) {
        client.close(next);
      });
    });
  });
});
