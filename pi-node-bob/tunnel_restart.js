var fs = require('fs'),
  out = fs.openSync('./out.log', 'a'),
  err = fs.openSync('./err.log', 'a'),
  v_out = fs.openSync('./v_out.log', 'a'),
  v_err = fs.openSync('./v_err.log', 'a');
var child_process = require('child_process');

var x_tunnel;

// /opt/nodejs/bin/lt --host http://codeplay.me -p 80 subdomain video
// /opt/nodejs/bin/lt --host http://codeplay.me -p 8080 subdomain 8080

function startTunnel() {
  console.log("starting video tunnel in 10 sec");
  setTimeout(function () {
    console.log("starting video tunnel now.");

    x_tunnel = child_process.execFile('node', ['-r','/home/ubuntu/localtunnel-server/node_modules/esm','localtunnel-server/bin/server.js','--port','80'], function(err, stdout, stderr) {
      // Node.js will invoke this callback when the
      console.log("out:" + stdout + " err:"+stderr);
    });

    x_tunnel.stdout.on('data', function (data) {
      console.log("x tunnel =>" + data);
    });

    killTunnel();
  }, 1000 * 2);
}

function killTunnel() {
  console.log("killing video tunnel in 60 min.");
  setTimeout(function () {
    console.log("killing video tunnel now.");

    x_tunnel.kill();

    startTunnel();
  }, 1000 * 60 * 60);
}


setTimeout(function () {
  startTunnel();
}, 1000);


var done_running = false;

(function wait() {
  if (!done_running) setTimeout(wait, 1000);
})();