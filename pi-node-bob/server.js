var fs = require('fs'),
  out = fs.openSync('./out.log', 'a'),
  err = fs.openSync('./err.log', 'a'),
  v_out = fs.openSync('./v_out.log', 'a'),
  v_err = fs.openSync('./v_err.log', 'a');
var child_process = require('child_process');
var http = require('http');

var video_tunnel;
var test_video_interval;
var serial_tunnel;

StartVideoTesting = false;

// /opt/nodejs/bin/lt --host http://codeplay.me -p 80 subdomain video
// /opt/nodejs/bin/lt --host http://codeplay.me -p 8080 subdomain 8080

function startVideoTunnel() {
  console.log("starting video.codeplay.me tunnel in 10 sec");
  setTimeout(function () {
    console.log("starting video.codeplay.me tunnel now.");

    video_tunnel = child_process.fork('./lt_video.js', [], {silent: true});

    video_tunnel.stdout.on('data', function (data) {
      console.log("video.codeplay.me tunnel =>" + data);
    });

    video_tunnel.stderr.on('data', function (data) {
      console.log("video.codeplay.me tunnel error =>" + data);
    });

    StartVideoTesting = true;
  }, 1000 * 10);
}

function CheckWebReach() {
  let data = "";
  let test_video_req;
  if (StartVideoTesting) {
    console.log("testing video.codeplay.me reachablity.");
    test_video_req = http.get("http://video.codeplay.me/webserver/status.html", function (res) {

//      console.log("statusCode: ", res.statusCode); // <======= Here's the status code
//      console.log("headers: ", res.headers);

      if (res.statusCode !== 200) {
        console.log("non 200 status code. BAD.");
        killVideoTunnel();
      }

      res.on('data', function (chunk) {
        data += chunk;
      });

      res.on('end', function () {
        if (data === "system check") {
          console.log("video.codeplay.me reachability test GOOD.")
        }
        else {
          console.log("cant reach myself at video.codeplay.me, restarting service ");
          killVideoTunnel();
        }
      });

    });

    test_video_req.on("error", function (error) {
      console.log(error.status);
      console.log("http request error. cant reach myself at video.codeplay.me, restarting service ");
      killVideoTunnel();
    });

    test_video_req.setTimeout(20000, function () {
      console.log("10 sec timeout. cant reach myself at video.codeplay.me, restarting service ");
      killVideoTunnel();
    });
  }

}

function killVideoTunnel() {
  console.log("killing video.codeplay.me tunnel in 5 sec.");
  setTimeout(function () {
    console.log("killing video.codeplay.me tunnel now.");

    video_tunnel.kill();

    startVideoTunnel();
  }, 1000 * 5);
}


function startSerialControl() {
  console.log("starting serial/server control in 5 sec");
  setTimeout(function () {
    console.log("starting serial/server tunnel now.");

    serial_tunnel = child_process.fork('./raspberry-pi-mjpeg-server.js', ['-w', '820', '-l', '616', '-q', '10'], {silent: true});

    serial_tunnel.stdout.on('data', function (data) {
      console.log("serial/server tunnel =>" + data);
    });

    serial_tunnel.stderr.on('data', function (data) {
      console.log("serial/server tunnel error =>" + data);
    });

    killSerialControl();
  }, 1000 * 5);
}


function killSerialControl() {
  console.log("killing serial/server control in 45 min.");
  setTimeout(function () {
    console.log("killing serial/server control now.");

    serial_tunnel.kill();

    startSerialControl();
  }, 1000 * 60 * 45);
}

test_video_interval = setInterval(function () { CheckWebReach(); }, 1000 * 30);

setTimeout(function () { startVideoTunnel(); }, 5000);

startSerialControl();

var done_running = false;

(function wait() {
  if (!done_running) setTimeout(wait, 1000);
})();