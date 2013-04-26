# disposable-redis

Will conjure a redis server for you to use and discard.

Intended to be used by automated tests that depend on a redis server.

When first called, will download and compile redis.  Subsequent calls will use
the existing redis.

## Quick Examples

```javascript
// gimme a server
disposableRedis.server(function(err, server) {
  console.log("server running on port", server.port);
  server.close();
});
```

```javascript
// I don't really care about the server, just gimme a node-redis client over it
disposableRedis.server(function(err, result) {
  result.client.set("key", "value");
  result.close();
});
```

<a name="download" />
## Download

For [Node.js](http://nodejs.org/), use [npm](http://npmjs.org/):

    npm install disposable-redis

## Documentation

* [server](#server)
* [client](#client)

<a name="server" />
### server (callback)
### server (port, callback)

Will assure a server is running, and callback with a server object:

```javascript
{
  port: <integer: server port>
  close: <function(callback) - shutdown server. callback param is optional>
}
```

__Arguments__

* port - default=6380. Run the server on this port.
* callback(err, server) - Called after server is operational or an error has occured. `err` is `null` if no error occured.

<a name="client" />
### client (callback)
### client (port, callback)

Will assure a server is running, connect a `node-redis` client, and callback with a client object:

```javascript
{
  client: <connected node-redis client object>
  close: <function(callback) - shutdown server. callback param is optional>
}
```

__Arguments__

* port - default=6380. Run the server on this port.
* callback(err, server) - Called after client object is operational or an error has occured. `err` is `null` if no error occured.
