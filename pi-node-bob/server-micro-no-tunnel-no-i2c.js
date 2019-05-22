var fs = require('fs');
var child_process = require('child_process');
var http = require('http');

var Bob_Settings = require('./bob_settings');

var test_video_interval;
var serial_tunnel;

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
log_to_file("starting server-micro.js");


function startSerialControl() {
  log_to_file("starting serial/server control in 5 sec");
  clearTimeout(startSerialControl_timeout);

  startSerialControl_timeout = setTimeout(function () {
    console.log("starting serial server now. ");
    log_to_file("starting serial server now. "); //Bob_Settings.ServerSubDomain

    serial_tunnel = child_process.fork('./micro-bob-no-camera-no-i2c.js', [], {silent: true});

    serial_tunnel.stdout.on('data', function (data) {
      log_to_file("serial/server tunnel =>" + data);

      var strdata = new Buffer.from(data).toString('ascii')
      if (strdata.indexOf("reset_me") !== -1) {
        console.log("self killing serial server control now. ");
        log_to_file("self killing serial server control now. ");

        serial_tunnel.kill();
        startSerialControl();
      }
    });

    serial_tunnel.stderr.on('data', function (data) {
      console.log("serial/server tunnel error =>" + data);
      log_to_file("serial/server tunnel error =>" + data);
    });

    killSerialControl();
  }, 1000 * 5);
}


function killSerialControl() {
  log_to_file("killing serial server control in 150 min. ");
  console.log("killing serial server control in 150 min. ");
  clearTimeout(killSerialControl_timeout);
  killSerialControl_timeout = setTimeout(function () {
    console.log("killing serial server control now. ");
    log_to_file("killing serial server control now. ");

    serial_tunnel.kill();

    startSerialControl();
  }, 1000 * 60 * 150);
}


//delay start for 2 sec
setTimeout(function () {
  startSerialControl();
}, 2000);

var done_running = false;

process.on('SIGINT', function () {
  log_to_file("racefully shutting down from SIGINT (Ctrl-C)");
  console.log("\nGracefully shutting down from SIGINT (Ctrl-C)");
  // some other closing procedures go here

  serial_tunnel.kill();
  process.exit(1);
});

(function wait() {
  if (!done_running) setTimeout(wait, 1000);
})();