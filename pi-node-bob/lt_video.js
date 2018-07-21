var localtunnel = require('localtunnel');

var tunnel = localtunnel(8080, {host: 'http://codeplay.me', subdomain: 'video'}, function (err, tunnel) {
  console.log(tunnel.url);
});

tunnel.on('request', function(info) {
  console.log(new Date().toString(), info.method, info.path);
});

tunnel.on('close', function () {
  console.log("video tunnel is closed");
  // tunnels are closed
});