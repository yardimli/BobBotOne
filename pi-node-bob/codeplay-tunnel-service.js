var localtunnel = require('localtunnel');
var fs = require('fs');

var Bob_Settings = require('./bob_settings');
var log_filename = './logs/codeplay-tunnel-service.log';

// /opt/nodejs/bin/lt --host http://codeplay.me -p 80 subdomain video
// /opt/nodejs/bin/lt --host http://codeplay.me -p 8080 subdomain 8080

var DebugOutput = true;

function log_to_file(logstr) {
  if (DebugOutput) {
    console.log(new Date().toISOString() + " " + logstr);
  }

  fs.appendFile(log_filename, new Date().toISOString() + " " + logstr + "\r\n", function (err) {
    if (err) {
    }
    else {
    }
  });
}



log_to_file("==========================");
log_to_file("starting codeplay tunnel service");

var tunnel = localtunnel(80, {host: 'http://codeplay.me', subdomain: Bob_Settings.ServerSubDomain}, function (err, tunnel) {
  log_to_file(tunnel.url);
});

tunnel.on('request', function (info) {
  log_to_file(info.method + " " + info.path);
});

tunnel.on('close', function () {
  log_to_file("video tunnel is closed");
});