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
  child_process = require('child_process'),
  serialport = require("serialport"),
  qs = require("querystring"),
  Adafruit_MotorHAT = require('./hat/Adafruit_MotorHAT/Adafruit_MotorHAT'),
  pjson = require('./package.json');

var ifaces = os.networkInterfaces();


var sleep = require('sleep');

var motor_hat = new Adafruit_MotorHAT(0x6f, 60);

var FrontLeft = motor_hat.getMotor(1);
var BackLeft = motor_hat.getMotor(2);

var FrontRight = motor_hat.getMotor(3);
var BackRight = motor_hat.getMotor(4);

var log_filename = './logs/serial-server.log';

var portName = "";
portName = '/dev/ttyACM0';
portName = '/dev/ttyUSB0';
var ArduinoPort;
var SerialData = [];
var SerialBuffer = "";

var robot_webserver_port = 80;
var localIpAddress = localIp.address();
var boundaryID = "BOUNDARY";

// var camera_port = 80;
// var camera_width = 820;
// var camera_height = 616;
// var camera_timeout = 30 * 1000;
// var camera_timelapse = 500;
// var camera_quality = 15;
// var camera_tmpFolder = os.tmpdir();
// var camera_tmpImage = pjson.name + '-image.jpg';

var dir = '/tmp/stream';
var tmpFile = path.resolve(path.join("/tmp/stream/", "bob-pic.jpg"));

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

fs.createReadStream('./camera-lense.jpg').pipe(fs.createWriteStream(tmpFile));


var DistanceArray = [];

var turnOffMotors = () => {
  motor_hat.getMotor(1).run(Adafruit_MotorHAT.RELEASE);
  motor_hat.getMotor(2).run(Adafruit_MotorHAT.RELEASE);
  motor_hat.getMotor(3).run(Adafruit_MotorHAT.RELEASE);
  motor_hat.getMotor(4).run(Adafruit_MotorHAT.RELEASE);
};

process.on('exit', (code) => {
  turnOffMotors();
  console.log('About to exit with code:', code);
});


function log_to_file(logstr) {
  fs.appendFile(log_filename, new Date().toString() + " " + logstr + "\r\n", function (err) {
    if (err) {
//      console.log(err);
    }
    else {
    }
  });
}

Object.keys(ifaces).forEach(function (ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function (iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    if (alias >= 1) {
      // this single interface has multiple ipv4 addresses
      console.log(ifname + ':' + alias, iface.address);
    }
    else {
      // this interface has only one ipv4 adress
      console.log(ifname, iface.address);
    }
    ++alias;
  });
});


log_to_file("===================================================================");
log_to_file("starting raspberry-pi-mjpeg-server.js");

for (var j = 0; j < 2; j++) {
  for (var i = 300; i < 420; i++) {
    motor_hat.getPWM().setPWM(1, 0, i);
    motor_hat.getPWM().setPWM(15, 0, i);
    sleep.usleep(10000);
  }

  motor_hat.getPWM().setPWM(1, 0, 0);
  sleep.usleep(10000);
  motor_hat.getPWM().setPWM(15, 0, 0);
  sleep.usleep(10000);
}

function requireUncached(module) {
  delete require.cache[require.resolve(module)];
  return require(module);
}

function resetPort() {
  if (ArduinoPort.isOpen) {
    console.log("Port is open ...closing");
    ArduinoPort.close();
  }
  setTimeout(openPort, 5000);
}

function openPort() {
  try {
    console.log("Opening port");
    serialport = requireUncached("serialport");
    ArduinoPort = new serialport(portName, {
      baudRate: 115200,
      dataBits: 8,
      stopBits: 1,
      parity: 'none',
    });

    ArduinoPort.on('close', function () {
      console.log('Arduino port closed');
      log_to_file("Arduino port closed");
    });

    ArduinoPort.on("open", function () {
      console.log("Arduino port open");
      log_to_file("Arduino port open");
    });

    ArduinoPort.on('data', function (data) {
      var strdata = new Buffer.from(data).toString('ascii');
      SerialBuffer += strdata;

      var match = true;

      while (match) {
        var match = /\r|\n/.exec(SerialBuffer);
        if (match) {
          // console.log(match.index + " " + (SerialBuffer.length - 1));

          NewLine = SerialBuffer.substring(0, match.index);
          SerialBuffer = SerialBuffer.substring(match.index + 2);

//      console.log(NewLine);
          log_to_file("serial input =>" + NewLine);

          SerialData.push({data: NewLine, count: 1});
          try {
            var datajson = JSON.parse(NewLine);
            var xDistance = parseInt(datajson["us"]);
            if (xDistance === 0) {
              xDistance = 200;
            }

            DistanceArray.push(xDistance);

            if (DistanceArray.length > 4) {
              DistanceArray.shift();
            }

            var DistanceSum = 0;
            for (var i = 0; i < DistanceArray.length; i++) {
              DistanceSum += DistanceArray[i];
            }

            datajson["us_avg"] = Math.round(DistanceSum / DistanceArray.length);

            if (Math.round(DistanceSum / DistanceArray.length) < 15) {
              console.log("us sensor stop motors");
              turnOffMotors();
            }
          } catch (e) {
            console.log(e);
          }

        }
      }

//  console.log('Data: ' + data);
    });


  } catch (ex) {
    console.log("ERROR opening port\n" + ex);
  }
}

openPort();

var StopEngines = true;

setInterval(function () {

  if (StopEngines) {
    motor_hat.getPWM().setPWM(15, 0, 0);
    motor_hat.getPWM().setPWM(1, 0, 0);

    FrontLeft.setSpeed(0);
    FrontLeft.run(Adafruit_MotorHAT.RELEASE);

    FrontRight.setSpeed(0);
    FrontRight.run(Adafruit_MotorHAT.RELEASE);

    BackLeft.setSpeed(0);
    BackLeft.run(Adafruit_MotorHAT.RELEASE);

    BackRight.setSpeed(0);
    BackRight.run(Adafruit_MotorHAT.RELEASE);
  }

  StopEngines = true;
}, 1000);


/**
 * create a server to serve out the motion jpeg images
 */
var server = http.createServer(function (req, res) {

  var queryData = url.parse(req.url, true);

  const xpath = queryData.pathname, query = queryData.query;
  const method = req.method;

  log_to_file("Request received on: " + xpath + " method: " + method + " query: " + JSON.stringify(query));
//  console.log('query: ', query);

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }


  var contentType = 'text/html';

  //classic web server
  //--------------------------------------------------------------------------------------------------------------
  if (xpath.indexOf("/webserver") !== -1) {
    var filePath = '.' + xpath; // req.url;
//    if (filePath === './webserver') filePath = './webserver/index.html';

    var extname = path.extname(xpath);
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
      case '.ttf':
        contentType = 'application/x-font-ttf';
        break;
      case '.otf':
        contentType = 'application/x-font-opentype';
        break;
      case '.woff':
        contentType = 'application/font-woff';
        break;
      case '.woff2':
        contentType = 'application/font-woff2';
        break;
      case '.eot':
        contentType = 'application/vnd.ms-fontobject';
        break;
      case '.svg':
        contentType = 'image/svg+xml';
        break;
    }

    if (!fs.existsSync(filePath) || (!fs.lstatSync(filePath).isFile())) {
      log_to_file(filePath + " doesnt exist.");
      fs.readFile('./404.html', function (error, content) {
        res.writeHead(200, {'Content-Type': contentType});
        res.end(content, 'utf-8');
      });
    }

    fs.readFile(filePath, function (error, content) {
      if (error) {
        if (error.code == 'ENOENT') {
          log_to_file(filePath + " doesnt exist (2).");
          fs.readFile('./404.html', function (error, content) {
            res.writeHead(200, {'Content-Type': contentType});
            res.end(content, 'utf-8');
          });
        }
        else {
          log_to_file(filePath + " doesnt exist (3).");
          res.writeHead(500);
          res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
          res.end();
        }
      }
      else {
        if (contentType === "text/html" || contentType === "text/javascript") {
          content = content.toString().replace(new RegExp("##MYIP##", 'g'), localIpAddress + ':' + robot_webserver_port);
        }

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
  //--------------------------------------------------------------------------------------------------------------

  //--------------------------------------------------------------------------------------------------------------
  else if (xpath === "/system.txt") {
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

  //--------------------------------------------------------------------------------------------------------------
  // return a html page if the user accesses the server directly
  else if (xpath === "/stream.html") {
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
    res.write('<img src="video_stream.jpg" />');
    res.write('</body>');
    res.write('</html>');
    res.end();
    return;
  }

  //--------------------------------------------------------------------------------------------------------------
  else if (xpath === "/serial_reset") {
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

    resetPort();

    res.end("Starting serial reset. ");
    return;
  }


  //--------------------------------------------------------------------------------------------------------------
  else if (xpath === "/kill_self") {
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

    res.end("Starting serial reset. ");

    console.log("reset_me");
    return;
  }

  //--------------------------------------------------------------------------------------------------------------
  else if (xpath === "/write_data") {
    ArduinoPort.flush(function (err, results) {});
    ArduinoPort.write(query.q);

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

  //--------------------------------------------------------------------------------------------------------------
  else if (xpath === "/read_data") {
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

  //--------------------------------------------------------------------------------------------------------------
  else if (xpath === "/controls") {
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

    if (query.operation === "servo") {
      StopEngines = false;
      if (query.pan_servo === "on") {
        motor_hat.getPWM().setPWM(15, 0, parseInt(query.pan_servo_pulse));
      }
      else if (query.pan_servo === "off") {
        motor_hat.getPWM().setPWM(15, 0, 0);
      }

      if (query.tilt_servo === "on") {
        motor_hat.getPWM().setPWM(1, 0, parseInt(query.tilt_servo_pulse));
      }
      else if (query.tilt_servo === "off") {

        motor_hat.getPWM().setPWM(1, 0, 0);
      }

      res.end(JSON.stringify({result: true, message: "servos updated"}));
      return;
    }

    if (query.operation === "motion") {
      StopEngines = false;

      if (query.FL === "on") {
        if (query.FL_dir === "bkw") FrontLeft.run(Adafruit_MotorHAT.BACKWARD);
        if (query.FL_dir === "fwd") FrontLeft.run(Adafruit_MotorHAT.FORWARD);
        FrontLeft.setSpeed(query.FL_speed);
      }
      else if (query.FL === "off") {
        FrontLeft.setSpeed(0);
        FrontLeft.run(Adafruit_MotorHAT.RELEASE);
      }

      if (query.FR === "on") {
        if (query.FR_dir === "bkw") FrontRight.run(Adafruit_MotorHAT.FORWARD);
        if (query.FR_dir === "fwd") FrontRight.run(Adafruit_MotorHAT.BACKWARD);
        FrontRight.setSpeed(query.FR_speed);
      }
      else if (query.FR === "off") {
        FrontRight.setSpeed(0);
        FrontRight.run(Adafruit_MotorHAT.RELEASE);
      }

      if (query.BL === "on") {
        if (query.BL_dir === "bkw") BackLeft.run(Adafruit_MotorHAT.FORWARD);
        if (query.BL_dir === "fwd") BackLeft.run(Adafruit_MotorHAT.BACKWARD);
        BackLeft.setSpeed(query.BL_speed);
      }
      else if (query.BL === "off") {
        BackLeft.setSpeed(0);
        BackLeft.run(Adafruit_MotorHAT.RELEASE);
      }

      if (query.BR === "on") {
        if (query.BR_dir === "bkw") BackRight.run(Adafruit_MotorHAT.BACKWARD);
        if (query.BR_dir === "fwd") BackRight.run(Adafruit_MotorHAT.FORWARD);
        BackRight.setSpeed(query.BR_speed);
      }
      else if (query.BR === "off") {
        BackRight.setSpeed(0);
        BackRight.run(Adafruit_MotorHAT.RELEASE);
      }

      res.end(JSON.stringify({result: true, message: "motors updated"}));
      return;
    }
  }

  //--------------------------------------------------------------------------------------------------------------
  else if (xpath === "/stop_camera") {

    child_process.exec('./stop_camera.sh',
      function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
          console.log('exec error: ' + error);
        }
      });

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

    res.end("stopped camera");
    return;
  }


  //--------------------------------------------------------------------------------------------------------------
  else if (xpath === "/start_camera") {

    child_process.exec('./start_camera.sh',
      function (error, stdout, stderr) {
        console.log('stdout: ' + stdout);
        console.log('stderr: ' + stderr);
        if (error !== null) {
          console.log('exec error: ' + error);
        }
      });

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

    res.end("started camera");
    return;
  }

  //--------------------------------------------------------------------------------------------------------------
  else if (xpath === "/health_check") {
    res.statusCode = 200;
    res.end();
    return;
  }

  //--------------------------------------------------------------------------------------------------------------
  // for image requests, return a HTTP multipart document (stream)
  else if (xpath === "/video_stream.jpg") {

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


    // send new frame to client
    var subscriber_token = PubSub.subscribe('MJPEG', function (msg, data) {

      //console.log('sending image');

      res.write('--' + boundaryID + '\r\n')
      res.write('Content-Type: image/jpeg\r\n');
      res.write('Content-Length: ' + data.length + '\r\n');
      res.write("\r\n");
      res.write(Buffer.from(data), 'binary');
      res.write("\r\n");
    });

    //--------------------------------------------------------------------------------------------------------------
    // connection is closed when the browser terminates the request
    res.on('close', function () {
      log_to_file("Connection closed!");
//      console.log("Connection closed!");
      PubSub.unsubscribe(subscriber_token);
      res.end();
    });
  }
  else {
    log_to_file(xpath + " doesnt exist (4).");
//    console.log(xpath + " doesnt exist.");
    fs.readFile('./404.html', function (error, content) {
      res.writeHead(200, {'Content-Type': contentType});
      res.end(content, 'utf-8');
    });
  }
});

//--------------------------------------------------------------------------------------------------------------
server.on('error', function (e) {
  if (e.code == 'EADDRINUSE') {
    console.log('http port already in use');
    log_to_file('http port already in use');
  }
  else if (e.code == "EACCES") {
    console.log("Illegal port");
    log_to_file('http Illegal port');
  }
  else {
    console.log("Unknown error");
    log_to_file('http Unknown error');
  }
  process.exit(1);
});


//--------------------------------------------------------------------------------------------------------------
// start the server
server.listen(robot_webserver_port);
console.log(pjson.name + " started on port " + robot_webserver_port);
console.log('Visit http://' + localIpAddress + ':' + robot_webserver_port + ' to view your PI camera stream');
console.log('');


//--------------------------------------------------------------------------------------------------------------
// start watching the temp image for changes
var watcher = chokidar.watch(tmpFile, {
  persistent: true,
  usePolling: true,
  interval: 10,
});


//--------------------------------------------------------------------------------------------------------------
// hook file change events and send the modified image to the browser
watcher.on('change', function (file) {

  //console.log('change >>> ', file);

  fs.createReadStream(file).pipe(fs.createWriteStream('./webserver/camera.jpg'));

  fs.readFile(file, function (err, imageData) {
    if (!err) {
      PubSub.publish('MJPEG', imageData);
    }
    else {
      log_to_file("MJPEG error:");
      log_to_file(err);
      console.log(err);
    }
  });
});



