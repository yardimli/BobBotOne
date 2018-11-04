var localtunnel = require('localtunnel');
var fs = require('fs');

var Bob_Settings = require('./bob_settings');
var log_filename = './logs/lt_video.log';


function log_to_file(logstr) {
  fs.appendFile(log_filename, new Date().toString() + " " + logstr + "\r\n", function (err) {
    if (err) {
    }
    else {
    }
  });
}


log_to_file("===================================================================");
log_to_file("starting lt_video.js");

var tunnel = localtunnel(8080, {host: 'http://codeplay.me', subdomain: Bob_Settings.ServerSubDomain}, function (err, tunnel) {
  console.log(tunnel.url);
  log_to_file(tunnel.url);
});

tunnel.on('request', function (info) {
  log_to_file(info.method + " " + info.path);
//  console.log(new Date().toString(), info.method, info.path);
});

tunnel.on('close', function () {
  console.log("video tunnel is closed");
  log_to_file("video tunnel is closed");
  // tunnels are closed
});