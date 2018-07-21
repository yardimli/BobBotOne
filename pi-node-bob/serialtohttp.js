var fs = require('fs'),
  out = fs.openSync('./out.log', 'a'),
  err = fs.openSync('./err.log', 'a')


var donerunning = false;

var serialport = require("serialport");
var http = require('http');
var qs = require("querystring");

const PORT = 8080;

console.log("starting serial to http");


var SerialPort = serialport; // localize object constructor
var portName = '/dev/ttyACM0';

var sp = new SerialPort(portName, {
//  parser: serialport.parsers.readline("\r"),
  baudRate: 115200
});

var SerialData = "";

sp.on("open", function () {
  console.log("comm port ready");
});

sp.on('data', function (data) {
  SerialData = SerialData + data;
//  console.log('Data: ' + data);
});

var server = http.createServer(function (req, res) {

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Request-Method', '*');
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method == 'GET') {
    var cmd = req.url;
    cmd = unescape(cmd);
    console.log("cmd : "+cmd);
    cmd = cmd.substring(1);

    if (cmd.substring(0, 1) == "D") {
      res.end(SerialData);
      SerialData = "";
    }

    if (cmd.substring(0, 1) == "C") {
      cmd = cmd.substring(1);
      console.log(cmd);
//      if (sp.isOpen()) {
      sp.write(cmd);
//      }
    }
    res.end(req.url);
  }
}).listen(PORT, function () {
  console.log("Arduino Gateway Server listening on:... http://localhost:%s", PORT);
});


(function wait() {
  if (!donerunning) setTimeout(wait, 1000);
})();