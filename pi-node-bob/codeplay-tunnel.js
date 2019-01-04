var fs = require('fs');
var child_process = require('child_process');
var http = require('http');

var Bob_Settings = require('./bob_settings');

var video_tunnel;
var test_video_interval;
var StartVideoTesting = false;

var log_filename = './logs/codeplay-tunnel.log';

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

log_to_file("===================================================================");
log_to_file("starting codeplay tunnel");


function startTunnel() {
  log_to_file("starting " + Bob_Settings.ServerSubDomain + ".codeplay.me tunnel");

  video_tunnel = child_process.fork('./codeplay-tunnel-service.js', [], {silent: true});

  video_tunnel.stdout.on('data', function (data) {
    log_to_file(Bob_Settings.ServerSubDomain + ".codeplay.me on std_out =>" + data);
  });

  video_tunnel.stderr.on('data', function (data) {
    log_to_file(Bob_Settings.ServerSubDomain + ".codeplay.me on std_error =>" + data);
  });

  video_tunnel.on('close', function () {
    startTunnel();
  });

  StartVideoTesting = true;
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
        log_to_file("non 200 status code. BAD.");
        video_tunnel.kill();
      }

      res.on('data', function (chunk) {
        data += chunk;
      });

      res.on('end', function () {
        if (data === "system check") {
          log_to_file(Bob_Settings.ServerSubDomain + ".codeplay.me reachability test GOOD.")
        }
        else {
          log_to_file("cant reach myself at " + Bob_Settings.ServerSubDomain + ".codeplay.me, restarting service ");
          video_tunnel.kill();
        }
      });

    });

    test_video_req.on("error", function (error) {
      log_to_file(error.status);
      log_to_file("http request error. cant reach myself at " + Bob_Settings.ServerSubDomain + ".codeplay.me, restarting service ");
      video_tunnel.kill();
    });

    test_video_req.setTimeout(15000, function () {
      log_to_file("15 sec timeout. cant reach myself at " + Bob_Settings.ServerSubDomain + ".codeplay.me, restarting service ");
      video_tunnel.kill();
    });
  }

}



//delay start for 20 sec
setTimeout(function () {
  test_video_interval = setInterval(function () { CheckWebReach(); }, 1000 * 45);
  startTunnel();
},20000);


var done_running = false;

process.on('SIGINT', function () {
  log_to_file("racefully shutting down from SIGINT (Ctrl-C)");

  video_tunnel.kill();
  process.exit(1);
});

(function wait() {
  if (!done_running) setTimeout(wait, 1000);
})();