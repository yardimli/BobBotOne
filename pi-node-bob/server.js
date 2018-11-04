var fs = require('fs');
var child_process = require('child_process');
var http = require('http');

var Bob_Settings = require('./bob_settings');

var video_tunnel;
var test_video_interval;
var serial_tunnel;

var killVideoTunnel_timeout;
var startVideoTunnel_timeout;

var startSerialControl_timeout;
var killSerialControl_timeout;

var StartVideoTesting = false;

// /opt/nodejs/bin/lt --host http://codeplay.me -p 80 subdomain video
// /opt/nodejs/bin/lt --host http://codeplay.me -p 8080 subdomain 8080


var log_filename = './logs/server.log';

function log_to_file(logstr) {
  fs.appendFile(log_filename, new Date().toString() + " " + logstr + "\r\n", function (err) {
    if (err) {
    }
    else {
    }
  });
}

log_to_file("===================================================================");
log_to_file("starting server.js");


function startVideoTunnel() {
  clearTimeout(startVideoTunnel_timeout);
  log_to_file("starting " + Bob_Settings.ServerSubDomain + ".codeplay.me tunnel in 10 sec");

  startVideoTunnel_timeout = setTimeout(function () {
    console.log("starting " + Bob_Settings.ServerSubDomain + ".codeplay.me tunnel now.");
    log_to_file("starting " + Bob_Settings.ServerSubDomain + ".codeplay.me tunnel now.");

    video_tunnel = child_process.fork('./lt_video.js', [], {silent: true});

    video_tunnel.stdout.on('data', function (data) {
      log_to_file(Bob_Settings.ServerSubDomain + ".codeplay.me tunnel =>" + data);
    });

    video_tunnel.stderr.on('data', function (data) {
      console.log(Bob_Settings.ServerSubDomain + ".codeplay.me tunnel error =>" + data);
      log_to_file(Bob_Settings.ServerSubDomain + ".codeplay.me tunnel error =>" + data);
    });

    StartVideoTesting = true;
  }, 1000 * 10);
}

function killVideoTunnel() {
  clearTimeout(killVideoTunnel_timeout);
  log_to_file("killing " + Bob_Settings.ServerSubDomain + ".codeplay.me tunnel in 5 sec.");
  killVideoTunnel_timeout = setTimeout(function () {
    console.log("killing " + Bob_Settings.ServerSubDomain + ".codeplay.me tunnel now.");
    log_to_file("killing " + Bob_Settings.ServerSubDomain + ".codeplay.me tunnel now.");

    video_tunnel.kill();

    startVideoTunnel();
  }, 1000 * 5);
}


function startSerialControl() {
  log_to_file("starting serial/server control in 5 sec");
  clearTimeout(startSerialControl_timeout);

  startSerialControl_timeout = setTimeout(function () {
    console.log("starting serial/server tunnel now.");
    log_to_file("starting serial/server tunnel now.");

    serial_tunnel = child_process.fork('./raspberry-pi-mjpeg-server.js', ['-w', '820', '-l', '616', '-q', '15'], {silent: true});

    serial_tunnel.stdout.on('data', function (data) {
      log_to_file("serial/server tunnel =>" + data);
    });

    serial_tunnel.stderr.on('data', function (data) {
      console.log("serial/server tunnel error =>" + data);
      log_to_file("serial/server tunnel error =>" + data);
    });

    killSerialControl();
  }, 1000 * 5);
}


function killSerialControl() {
  log_to_file("killing serial/server control in 15 min.");
  clearTimeout(killSerialControl_timeout);
  killSerialControl_timeout = setTimeout(function () {
    console.log("killing serial/server control now.");
    log_to_file("killing serial/server control now.");

    serial_tunnel.kill();

    startSerialControl();
  }, 1000 * 60 * 15);
}


function CheckWebReach() {
  let data = "";
  let test_video_req;
  if (StartVideoTesting) {
    log_to_file("testing " + Bob_Settings.ServerSubDomain + ".codeplay.me reachablity.");
    test_video_req = http.get("http://" + Bob_Settings.ServerSubDomain + ".codeplay.me/webserver/status.html", function (res) {

//      console.log("statusCode: ", res.statusCode); // <======= Here's the status code
//      console.log("headers: ", res.headers);

      if (res.statusCode !== 200) {
        console.log("non 200 status code. BAD.");
        log_to_file("non 200 status code. BAD.");
        killVideoTunnel();
      }

      res.on('data', function (chunk) {
        data += chunk;
      });

      res.on('end', function () {
        if (data === "system check") {
          log_to_file(Bob_Settings.ServerSubDomain + ".codeplay.me reachability test GOOD.")
        }
        else {
          console.log("cant reach myself at " + Bob_Settings.ServerSubDomain + ".codeplay.me, restarting service ");
          log_to_file("cant reach myself at " + Bob_Settings.ServerSubDomain + ".codeplay.me, restarting service ");
          killVideoTunnel();
        }
      });

    });

    test_video_req.on("error", function (error) {
      console.log(error.status);
      console.log("http request error. cant reach myself at " + Bob_Settings.ServerSubDomain + ".codeplay.me, restarting service ");

      log_to_file(error.status);
      log_to_file("http request error. cant reach myself at " + Bob_Settings.ServerSubDomain + ".codeplay.me, restarting service ");
      killVideoTunnel();
    });

    test_video_req.setTimeout(15000, function () {
      console.log("15 sec timeout. cant reach myself at " + Bob_Settings.ServerSubDomain + ".codeplay.me, restarting service ");
      log_to_file("15 sec timeout. cant reach myself at " + Bob_Settings.ServerSubDomain + ".codeplay.me, restarting service ");
      killVideoTunnel();
    });
  }

}

test_video_interval = setInterval(function () { CheckWebReach(); }, 1000 * 45);

setTimeout(function () { startVideoTunnel(); }, 5000);

startSerialControl();

var done_running = false;

process.on('SIGINT', function () {
  log_to_file("racefully shutting down from SIGINT (Ctrl-C)");
  console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");
  // some other closing procedures go here

  serial_tunnel.kill();
  video_tunnel.kill();
  process.exit(1);
});

(function wait() {
  if (!done_running) setTimeout(wait, 1000);
})();