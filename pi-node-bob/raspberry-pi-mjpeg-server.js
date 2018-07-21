#!/usr/bin/env node

var fs = require("fs"),
  os = require('os'),
  path = require('path'),
  http = require("http"),
  url = require("url"),
  util = require("util"),
  chokidar = require('chokidar'),
  PubSub = require("pubsub-js"),
  localIp = require('ip'),
  PiCamera = require('./camera.js'),
  program = require('commander'),
  pjson = require('./package.json');

var serialport = require("serialport");
var qs = require("querystring");

var SerialPort = serialport; // localize object constructor
var portName = '/dev/ttyACM0';

var sp = new SerialPort(portName, {
//  parser: serialport.parsers.readline("\r"),
  baudRate: 115200
});

var SerialData = [];
var SerialBuffer = "";

sp.on("open", function () {
  console.log("comm port ready");
});

sp.on('data', function (data) {
  var strdata = new Buffer.from(data).toString('ascii');
  SerialBuffer += strdata;

  var match = true;

  while (match) {
    var match = /\r|\n/.exec(SerialBuffer);
    if (match) {
      console.log(match.index + " " + (SerialBuffer.length - 1));

      NewLine = SerialBuffer.substring(0, match.index);
      SerialBuffer = SerialBuffer.substring(match.index + 2);

//      console.log(NewLine);

      if (SerialData.length > 0) {
        if (SerialData[SerialData.length - 1].data === NewLine) {
          SerialData[SerialData.length - 1].count = SerialData[SerialData.length - 1].count + 1;
        }
        else {
          SerialData.push({data: NewLine, count: 1});
        }
      }
      else {
        SerialData.push({data: NewLine, count: 1});
      }

    }
  }

//  console.log('Data: ' + data);
});


program
  .version(pjson.version)
  .description(pjson.description)
  .option('-p --port <n>', 'port number (default 8080)', parseInt)
  .option('-w --width <n>', 'image width (default 640)', parseInt)
  .option('-l --height <n>', 'image height (default 480)', parseInt)
  .option('-q --quality <n>', 'jpeg image quality from 0 to 100 (default 85)', parseInt)
  .option('-t --timeout <n>', 'timeout in milliseconds between frames (default 500)', parseInt)
  .option('-v --version', 'show version')
  .parse(process.argv);

program.on('--help', function () {
  console.log("Usage: " + pjson.name + " [OPTION]\n");
});

var port = program.port || 8080,
  width = program.width || 640,
  height = program.height || 480,
  timeout = program.timeout || 250,
  quality = program.quality || 75,
  tmpFolder = os.tmpdir(),
  tmpImage = pjson.name + '-image.jpg',
  localIpAddress = localIp.address(),
  boundaryID = "BOUNDARY";

/**
 * create a server to serve out the motion jpeg images
 */
var server = http.createServer(function (req, res) {

  var queryData = url.parse(req.url, true);

  const xpath = queryData.pathname, query = queryData.query;
  const method = req.method;

  console.log(`Request received on: ${xpath} + method: ${method} + query: ${JSON.stringify(query)}`);
//  console.log('query: ', query);

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }


  //classic web server
  //---------------------------------------
  if (xpath.indexOf("/webserver") !== -1) {
    var filePath = '.' + req.url;
    if (filePath === './webserver') filePath = './webserver/index.html';

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpg';
        break;
      case '.wav':
        contentType = 'audio/wav';
        break;
    }

    if (!fs.existsSync(filePath)) {
      fs.readFile('./404.html', function (error, content) {
        res.writeHead(200, {'Content-Type': contentType});
        res.end(content, 'utf-8');
      });
    }

    fs.readFile(filePath, function (error, content) {
      if (error) {
        if (error.code == 'ENOENT') {
          fs.readFile('./404.html', function (error, content) {
            res.writeHead(200, {'Content-Type': contentType});
            res.end(content, 'utf-8');
          });
        }
        else {
          res.writeHead(500);
          res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
          res.end();
        }
      }
      else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Expires': 'Mon, 10 Oct 1977 00:00:00 GMT',
          'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Request-Method': '*',
          'Access-Control-Allow-Methods': 'OPTIONS, GET',
          'Access-Control-Allow-Headers': '*'
        });
        res.end(content, 'utf-8');
      }
    });
  }
  //end classic static web server
  //---------------------------------------

  if (xpath === "/system.txt") {
    res.writeHead(200, {
      'Content-Type': 'text/html;charset=utf-8',
      'Expires': 'Mon, 10 Oct 1977 00:00:00 GMT',
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      'Pragma': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Request-Method': '*',
      'Access-Control-Allow-Methods': 'OPTIONS, GET',
      'Access-Control-Allow-Headers': '*'
    });

    res.write('system check');
    res.end();

  }

  // return a html page if the user accesses the server directly
  if (xpath === "/stream.html") {
    res.writeHead(200, {
      'Content-Type': 'text/html;charset=utf-8',
      'Expires': 'Mon, 10 Oct 1977 00:00:00 GMT',
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      'Pragma': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Request-Method': '*',
      'Access-Control-Allow-Methods': 'OPTIONS, GET',
      'Access-Control-Allow-Headers': '*'
    });

    res.write('<!doctype html>');
    res.write('<html>');
    res.write('<head><title>' + pjson.name + '</title><meta charset="utf-8" /></head>');
    res.write('<body>');
    res.write('<img src="image.jpg" />');
    res.write('</body>');
    res.write('</html>');
    res.end();
    return;
  }

  if (xpath === "/read_data") {
    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Expires': 'Mon, 10 Oct 1977 00:00:00 GMT',
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      'Pragma': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Request-Method': '*',
      'Access-Control-Allow-Methods': 'OPTIONS, GET',
      'Access-Control-Allow-Headers': '*'
    });

    res.end(JSON.stringify(SerialData));
    SerialData = [];
    return;
  }

  if (xpath === "/write_data") {

    sp.write(query.q);

    res.writeHead(200, {
      'Content-Type': 'text/html',
      'Expires': 'Mon, 10 Oct 1977 00:00:00 GMT',
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      'Pragma': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Request-Method': '*',
      'Access-Control-Allow-Methods': 'OPTIONS, GET',
      'Access-Control-Allow-Headers': '*'
    });

    res.end("wrote data");
    return;
  }

  if (xpath === "/health_check") {
    res.statusCode = 200;
    res.end();
    return;
  }

  // for image requests, return a HTTP multipart document (stream)
  if (xpath === "/video_stream.jpg") {

    res.writeHead(200, {
      'Content-Type': 'multipart/x-mixed-replace;boundary="' + boundaryID + '"',
      'Connection': 'keep-alive',
      'Expires': 'Mon, 10 Oct 1977 00:00:00 GMT',
      'Cache-Control': 'no-cache, no-store, max-age=0, must-revalidate',
      'Pragma': 'no-cache',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Request-Method': '*',
      'Access-Control-Allow-Methods': 'OPTIONS, GET',
      'Access-Control-Allow-Headers': '*'
    });


//
// send new frame to client
//
    var subscriber_token = PubSub.subscribe('MJPEG', function (msg, data) {

      //console.log('sending image');

      res.write('--' + boundaryID + '\r\n')
      res.write('Content-Type: image/jpeg\r\n');
      res.write('Content-Length: ' + data.length + '\r\n');
      res.write("\r\n");
      res.write(Buffer.from(data), 'binary');
      res.write("\r\n");
    });

//
// connection is closed when the browser terminates the request
//
    res.on('close', function () {
      console.log("Connection closed!");
      PubSub.unsubscribe(subscriber_token);
      res.end();
    });
  }
});

server.on('error', function (e) {
  if (e.code == 'EADDRINUSE') {
    console.log('port already in use');
  }
  else if (e.code == "EACCES") {
    console.log("Illegal port");
  }
  else {
    console.log("Unknown error");
  }
  process.exit(1);
});

// start the server
server.listen(port);
console.log(pjson.name + " started on port " + port);
console.log('Visit http://' + localIpAddress + ':' + port + ' to view your PI camera stream');
console.log('');


var tmpFile = path.resolve(path.join(tmpFolder, tmpImage));

// start watching the temp image for changes
var watcher = chokidar.watch(tmpFile, {
  persistent: true,
  usePolling: true,
  interval: 10,
});

// hook file change events and send the modified image to the browser
watcher.on('change', function (file) {

  //console.log('change >>> ', file);

  fs.readFile(file, function (err, imageData) {
    if (!err) {
      PubSub.publish('MJPEG', imageData);
    }
    else {
      console.log("MJPEG error:");
      console.log(err);
    }
  });
});

// setup the camera 
var camera = new PiCamera();

// start image capture
camera
  .nopreview()
  .baseFolder(tmpFolder)
  .thumb('0:0:0') // dont include thumbnail version
  .timeout(999999999) // never end
  .timelapse(timeout) // how often we should capture an image
  .width(width)
  .height(height)
  .quality(quality)
  .takePicture(tmpImage);
