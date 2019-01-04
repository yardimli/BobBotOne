var hostname = "/";
if (location.hostname === "localhost" || location.hostname === "local.elosoft.tw" || location.hostname === "127.0.0.1") {
  // $("#stream_container").attr("src", "http://192.168.1.125:8080/video_stream.jpg?time=1&pDelay=120000");
  hostname = "http://192.168.1.125:8080/";
}
else {
  // $("#stream_container").attr("src", "/video_stream.jpg?time=1&pDelay=120000");
  hostname = "/";
}

var backgroundCheck;
var LastStatusCheck = null;
var BigPictureTimeout = null;
var StatusTimeout = [];
var LastBigPicture = "";

var LastLeftSpeed = 0;
var LastRightSpeed = 0;
var SendMotorsOffSignal = 0;


var front_left_revs_array = [];
var front_right_revs_array = [];
var rear_left_revs_array = [];
var rear_right_revs_array = [];

var runtime_count_array = [];
var floor_sensor_left_array = [];
var floor_sensor_right_array = [];
var distance_sensor_array = [];


var CameraStopTimeout;
function checkTime(i) {
  if (i < 10) {
    i = "0" + i
  }
  return i;
}

var imageNr = 0; // Serial number of current image
var finished = new Array(); // References to img objects which have finished downloading
var paused = false;
var img;
var canvas;
var context;

var StatusType = 0;
var StatusRow = 0;
var CameraRunning = false;


function grayscale(input, output) {
  //Get the context for the loaded image
  var inputContext = input.getContext("2d");
  //get the image data;
  var imageData = inputContext.getImageData(0, 0, input.width, input.height);
  //Get the CanvasPixelArray
  var data = imageData.data;

  //Get length of all pixels in image each pixel made up of 4 elements for each pixel, one for Red, Green, Blue and Alpha
  var arraylength = input.width * input.height * 4;
  //Go through each pixel from bottom right to top left and alter to its gray equiv

  //Common formula for converting to grayscale.
  //gray = 0.3*R + 0.59*G + 0.11*B
  for (var i = arraylength - 1; i > 0; i -= 4) {
    //R= i-3, G = i-2 and B = i-1
    //Get our gray shade using the formula
    var gray = 0.3 * data[i - 3] + 0.59 * data[i - 2] + 0.11 * data[i - 1];
    //Set our 3 RGB channels to the computed gray.
    data[i - 3] = gray;
    data[i - 2] = gray;
    data[i - 1] = gray;

  }

  //get the output context
  var outputContext = output.getContext("2d");

  //Display the output image
  outputContext.putImageData(imageData, 0, 0);
}


// Two layers are always present (except at the very beginning), to avoid flicker
setInterval(function () {

  if (CameraRunning) {
    var img = document.getElementById('stream_container');

//  console.log(img.width+" "+img.height);

    if (img.height > 0) {

      canvas.width = img.width;
      canvas.height = img.height;

      context.drawImage(img, 0, 0, img.width, img.height);

      var imageData = context.getImageData(0, 0, img.width, img.height);
      var sobelData = Sobel(imageData);
      var sobelImageData = sobelData.toImageData();
      context.putImageData(sobelImageData, 0, 0);
    }
  }

//  grayscale(canvas, canvas);
}, 1000);


function imageOnclick() { // Clicking on the image will pause the stream
  paused = !paused;
}

function resolveToPoint(rad, diameter) {
  var r = diameter / 2;
  return {mX: r * Math.cos(rad), mY: r * Math.sin(rad)};
}


function GetTime() {
  var today = new Date();
  var h = today.getHours();
  var m = today.getMinutes();
  var s = today.getSeconds();
  m = checkTime(m);
  s = checkTime(s);
  return h + ":" + m + ":" + s;
}


function startCamera() {
  let UrlToGet = hostname + "start_camera";

  if (!CameraRunning) {
    CameraRunning = true;
    $.get(UrlToGet, function (data, status) {
      console.log("Data: " + data + "    -- Status: " + status);

      if (location.hostname === "localhost" || location.hostname === "local.elosoft.tw" || location.hostname === "127.0.0.1") {
        $("#stream_container").attr("src", "http://192.168.1.125:8080/video_stream.jpg?time=1&pDelay=120000");
      }
      else {
        $("#stream_container").attr("src", "/video_stream.jpg?time=1&pDelay=120000");
      }
    });
  }


  clearTimeout(CameraStopTimeout);

  CameraStopTimeout = setTimeout(function () {
    let UrlToGet = hostname + "stop_camera";
    $.get(UrlToGet, function (data, status) {
      CameraRunning = false;
      console.log("Data: " + data + "    -- Status: " + status);
    });
  }, 10000);

}

function GetStatus() {

  if (StatusType == 0) {
    StatusType = 1;
  }
  else {
    StatusType = 0;
  }

  if (StatusType == 1) {
    var QData = "<Get_Data,0,0,msg>";
    var UrlToGet = hostname + "write_data?q=" + QData;
    $.get(UrlToGet, function (data, status) {
      //console.log("Data: " + data + "    -- Status: " + status);
    });
  }

  if (StatusType == 0) {
    var UrlToGet = hostname + "read_data";
    var data = {};

    $.ajax({
      url: UrlToGet,
      data: data,
      success: function (data, status) {
        if (status == "success" && data.length > 0) {
          //console.log("Status: " + status);
//        console.log(data);


          $.each(data, function (key, value) {
            key = key + 0;
            StatusRow++;
            if (StatusRow > 2) {
              StatusRow = 0;
            }

            try {
              var datajson = JSON.parse(value.data);
              if (parseInt(datajson["us"]) < 10) {
                datajson["us"] = 200;
              }

              $("#runtime_count").html(datajson["c"]);
              datajson["c"] = parseInt(datajson["c"]);
              datajson["c"] = datajson["c"] % 2;

              front_left_revs_array.push(datajson["fle"]);
              front_right_revs_array.push(datajson["fre"]);
              rear_left_revs_array.push(datajson["ble"]);
              rear_right_revs_array.push(datajson["bre"]);

              runtime_count_array.push(datajson["c"]);
              floor_sensor_left_array.push(datajson["lh"]);
              floor_sensor_right_array.push(datajson["rh"]);
              distance_sensor_array.push(datajson["us"]);

              if (front_left_revs_array.length > 12) {
                front_left_revs_array.shift();
              }
              if (front_right_revs_array.length > 12) {
                front_right_revs_array.shift();
              }
              if (rear_left_revs_array.length > 12) {
                rear_left_revs_array.shift();
              }
              if (rear_right_revs_array.length > 12) {
                rear_right_revs_array.shift();
              }
              if (runtime_count_array.length > 12) {
                runtime_count_array.shift();
              }
              if (floor_sensor_left_array.length > 12) {
                floor_sensor_left_array.shift();
              }
              if (floor_sensor_right_array.length > 12) {
                floor_sensor_right_array.shift();
              }
              if (distance_sensor_array.length > 12) {
                distance_sensor_array.shift();
              }

              $("#front_left_revs_array").html(front_left_revs_array.join());
              $("#front_right_revs_array").html(front_right_revs_array.join());
              $("#rear_left_revs_array").html(rear_left_revs_array.join());
              $("#rear_right_revs_array").html(rear_right_revs_array.join());
              $("#runtime_count_array").html(runtime_count_array.join());
              $("#floor_sensor_left_array").html(floor_sensor_left_array.join());
              $("#floor_sensor_right_array").html(floor_sensor_right_array.join());
              $("#distance_sensor_array").html(distance_sensor_array.join());

              $("#front_left_revs").html(datajson["fle"]);
              $("#front_right_revs").html(datajson["fre"]);
              $("#rear_left_revs").html(datajson["ble"]);
              $("#rear_right_revs").html(datajson["bre"]);

              $("#floor_sensor_left").html(datajson["lh"]);
              $("#floor_sensor_right").html(datajson["rh"]);

              $("#distance_sensor").html(datajson["us"]);

              $('#front_left_revs_array').peity('bar', {
                height: 25,
                fill: ['rgba(255,255,255,0.85)'],
                width: 65,
                padding: 0.2
              });

              $('#front_right_revs_array').peity('bar', {
                height: 25,
                fill: ['rgba(255,255,255,0.85)'],
                width: 65,
                padding: 0.2
              });

              $('#rear_left_revs_array').peity('bar', {
                height: 25,
                fill: ['rgba(255,255,255,0.85)'],
                width: 65,
                padding: 0.2
              });

              $('#rear_right_revs_array').peity('bar', {
                height: 25,
                fill: ['rgba(255,255,255,0.85)'],
                width: 65,
                padding: 0.2
              });

              $('#runtime_count_array').peity('bar', {
                height: 10,
                fill: ['rgba(255,255,255,0.85)'],
                width: 65,
                padding: 0.2
              });


              $('#floor_sensor_left_array').peity('bar', {
                height: 10,
                fill: ['rgba(255,255,255,0.85)'],
                width: 65,
                padding: 0.2
              });

              $('#floor_sensor_right_array').peity('bar', {
                height: 10,
                fill: ['rgba(255,255,255,0.85)'],
                width: 65,
                padding: 0.2
              });

              $('#distance_sensor_array').peity('bar', {
                height: 30,
                fill: ['rgba(255,255,255,0.85)'],
                width: 65,
                padding: 0.2
              });

            } catch (e) {
              console.log(e);
            }
          });
        }

        LastStatusCheck = data;
      },
      dataType: "json"
    });
  }
}

$(document).ready(function () {
  canvas = document.getElementById("image_process_canvas");
  context = canvas.getContext("2d");

  var head_joystick_control_div = nipplejs.create({
    zone: document.getElementById('head_joystick_control_div'),
    size: 200,
    color: 'blue'
  });
  head_joystick_control_div.on('start end', function (evt, data) {
    if (evt.type === "end") {
      var QData = "operation=servo&pan_servo=off&tilt_servo=off";
      var UrlToGet = hostname + "controls?" + QData;

      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  head_joystick_control_div.on('hidden', function (evt, data) {
    var QData = "operation=servo&pan_servo=off&tilt_servo=off";
    var UrlToGet = hostname + "controls?" + QData;

    $.get(UrlToGet, function (data, status) {
      console.log("Data: " + data + "    -- Status: " + status);
    });
  });

  var LastHeadTiltPositon = 0;
  var HeadTiltPosition = 0;

  var LastHeadPanPositon = 0;
  var HeadPanPosition = 0;
  var ServoCommanTimer = 0;

  head_joystick_control_div.on('move', function (evt, data) {

    if (typeof data.angle.radian !== "undefined") {
      var QData = "";
      var XYSpeed = resolveToPoint(data.angle.radian, data.distance * 2);

      if (XYSpeed.mX > 0) {
        HeadTiltPosition = 460 - (XYSpeed.mX * 2);
      }

      if (XYSpeed.mX < 0) {
        HeadTiltPosition = 460 - (XYSpeed.mX * 2);
      }

      if (XYSpeed.mY > 0) {
        HeadPanPosition = 420 + (XYSpeed.mY * 1);
      }

      if (XYSpeed.mY < 0) {
        HeadPanPosition = 420 + (XYSpeed.mY * 1);
      }

      HeadPanPosition = Math.round(HeadPanPosition);
      HeadTiltPosition = Math.round(HeadTiltPosition);

      if (HeadPanPosition !== LastHeadPanPositon || HeadTiltPosition !== LastHeadTiltPositon) {
        LastHeadPanPositon = HeadPanPosition;
        LastHeadTiltPositon = HeadTiltPosition;

        clearTimeout(ServoCommanTimer);

        ServoCommanTimer = setTimeout(function () {

          var QData = "operation=servo&pan_servo=on&pan_servo_pulse=" + LastHeadPanPositon + "&tilt_servo=on&tilt_servo_pulse=" + LastHeadTiltPositon;

          startCamera();
          var UrlToGet = hostname + "controls?" + QData;
          console.log(UrlToGet);
          $.get(UrlToGet, function (data, status) {
            console.log("Data: " + data + "    -- Status: " + status);

            var UrlToGet = hostname + "write_data?q=<Set_Face,1,18,>";
            $.get(UrlToGet, function (data, status) {
              console.log("Data: " + data + "    -- Status: " + status);
            });
          });
        }, 50);
      }

    }

  });


  var motor_joystick_control_div = nipplejs.create({
    zone: document.getElementById('motor_joystick_control_div'),
    size: 200,
    color: 'red'
  });

  motor_joystick_control_div.on('hidden', function (evt, data) {
    var QData = "operation=motion&FL=off&FR=off&BL=off&BR=off";
    var UrlToGet = hostname + "controls?" + QData;

    $.get(UrlToGet, function (data, status) {
      console.log("Data: " + data + "    -- Status: " + status);
    });
  });


  motor_joystick_control_div.on('start end', function (evt, data) {
//    console.log(evt);
//    console.log(data);

    if (evt.type === "end") {
      var QData = "operation=motion&FL=off&FR=off&BL=off&BR=off";
      var UrlToGet = hostname + "controls?" + QData;

      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);

        var UrlToGet = hostname + "write_data?q=<Set_Face,1,3,>";
        $.get(UrlToGet, function (data, status) {
          console.log("Data: " + data + "    -- Status: " + status);
        });

      });
    }
    else {
      var UrlToGet = hostname + "write_data?q=<Set_Face,1,6,>";
      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }

  });

  motor_joystick_control_div.on('move', function (evt, data) {
//    console.log(evt);
//    console.log(data);

    //90 to 0 == forward to right
    //270 to 360 == reverse to right
    //180 to 270 == left to reverse
    //180 to 90 == left to forward

    if (typeof data.angle.radian !== "undefined") {
      var QData = "";
      var XYSpeed = resolveToPoint(data.angle.radian, data.distance * 2);
//      console.log(data.angle.radian);
//      console.log(resolveToPoint(data.angle.radian, 100));
//      console.log(data.distance);

      var RobotSpeed = 0;

      var Left_Direction = "fwd";
      var Right_Direction = "fwd";
      var Left_Speed = 0;
      var Right_Speed = 0;


      //run engines in full reverse
      if (XYSpeed.mY < 10 & XYSpeed.mY > -10) {

        if (data.distance > 80 && data.distance <= 100) {
          RobotSpeed = 164;
        }
        if (data.distance > 60 && data.distance <= 80) {
          RobotSpeed = 128;
        }
        if (data.distance > 40 && data.distance <= 60) {
          RobotSpeed = 96;
        }
        if (data.distance > 20 && data.distance <= 40) {
          RobotSpeed = 64;
        }
        if (data.distance > 5 && data.distance <= 20) {
          RobotSpeed = 32;
        }

        if (XYSpeed.mX > 5) {
          Left_Direction = "fwd";
          Right_Direction = "bkw";
          Left_Speed = RobotSpeed;
          Right_Speed = RobotSpeed;
        }
        else if (XYSpeed.mX < 5) {
          Left_Direction = "bkw";
          Right_Direction = "fwd";
          Left_Speed = RobotSpeed;
          Right_Speed = RobotSpeed;
        }


      }
      else {
        if (data.distance > 75 && data.distance <= 100) {
          RobotSpeed = 128;
        }
        if (data.distance > 50 && data.distance <= 75) {
          RobotSpeed = 96;
        }
        if (data.distance > 25 && data.distance <= 50) {
          RobotSpeed = 64;
        }
        if (data.distance > 5 && data.distance <= 25) {
          RobotSpeed = 32;
        }

        var XValue = XYSpeed.mX;
        if (XValue < 0) {
          XValue = XValue * (-1);
        }

        XValue = Math.round((50 - XValue) / 50);

        if (XYSpeed.mY < 0) {
          Left_Direction = "bkw";
          Right_Direction = "bkw";
          Left_Speed = RobotSpeed;
          Right_Speed = RobotSpeed;

          if (XYSpeed.mX > 5) Right_Speed = Math.round(Right_Speed * XValue);
          if (XYSpeed.mX < -5) Left_Speed = Math.round(Left_Speed * XValue);
        }

        if (XYSpeed.mY > 0) {
          Left_Direction = "fwd";
          Right_Direction = "fwd";
          Left_Speed = RobotSpeed;
          Right_Speed = RobotSpeed;

          if (XYSpeed.mX > 5) Right_Speed = Math.round(Right_Speed * XValue);
          if (XYSpeed.mX < -5) Left_Speed = Math.round(Left_Speed * XValue);
        }

        if (Right_Speed > 128) {
          Right_Speed = 128;
        }
        if (Left_Speed > 128) {
          Left_Speed = 128;
        }
      }

      if (Left_Speed !== LastLeftSpeed || Right_Speed !== LastRightSpeed) {
        LastLeftSpeed = Left_Speed;
        LastRightSpeed = Right_Speed;

        var QData = "operation=motion&FL=on&FL_dir=" + Left_Direction + "&FL_speed=" + Left_Speed + "&FR=on&FR_dir=" + Right_Direction + "&FR_speed=" + Right_Speed + "&BL=on&BL_dir=" + Left_Direction + "&BL_speed=" + Left_Speed + "&BR=on&BR_dir=" + Right_Direction + "&BR_speed=" + Right_Speed + "";

        startCamera();
        var UrlToGet = hostname + "controls?" + QData;
        $.get(UrlToGet, function (data, status) {
          console.log("Data: " + data + "    -- Status: " + status);

          if (Left_Direction === "bkw" && Right_Direction === "bkw") {
            var UrlToGet = hostname + "write_data?q=<Set_Face,1,8,>";
            $.get(UrlToGet, function (data, status) {
              console.log("Data: " + data + "    -- Status: " + status);
            });
          }
          else if (Left_Direction === "fwd" && Right_Direction === "fwd") {
            var UrlToGet = hostname + "write_data?q=<Set_Face,1,10,>";
            $.get(UrlToGet, function (data, status) {
              console.log("Data: " + data + "    -- Status: " + status);
            });
          }
        });

        SendMotorsOffSignal = 0;
      }

      SendMotorsOffSignal++;

      // if (SendMotorsOffSignal < 2) {
      //   var QData = "operation=motion&FL=off&FR=off&BL=off&BR=off";
      //   var UrlToGet = hostname + "controls?" + QData;
      //
      //   $.get(UrlToGet, function (data, status) {
      //     console.log("Data: " + data + "    -- Status: " + status);
      //
      //     var UrlToGet = hostname + "write_data?q=<Set_Face,1,3,>";
      //     $.get(UrlToGet, function (data, status) {
      //       console.log("Data: " + data + "    -- Status: " + status);
      //     });
      //
      //   });
      // }

    }
  });


  var listener = new window.keypress.Listener();

  listener.register_combo({
    keys: "w", on_keyup: function () {
      startCamera();
      var QData = "operation=motion&FL=on&FL_dir=fwd&FL_speed=96&FR=on&FR_dir=fwd&FR_speed=96&BL=on&BL_dir=fwd&BL_speed=96&BR=on&BR_dir=fwd&BR_speed=96";
      var UrlToGet = hostname + "controls?" + QData;
      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  listener.register_combo({
    keys: "s", on_keyup: function () {
      startCamera();
      var QData = "operation=motion&FL=on&FL_dir=bkw&FL_speed=96&FR=on&FR_dir=bkw&FR_speed=96&BL=on&BL_dir=bkw&BL_speed=96&BR=on&BR_dir=bkw&BR_speed=96";
      var UrlToGet = hostname + "controls?" + QData;
      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  listener.register_combo({
    keys: "a", on_keyup: function () {
      startCamera();
      var QData = "operation=motion&FL=on&FL_dir=bkw&FL_speed=156&FR=on&FR_dir=fwd&FR_speed=156&BL=on&BL_dir=bkw&BL_speed=156&BR=on&BR_dir=fwd&BR_speed=156";
      var UrlToGet = hostname + "controls?" + QData;

      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  listener.register_combo({
    keys: "d", on_keyup: function () {
      startCamera();
      var QData = "operation=motion&FL=on&FL_dir=fwd&FL_speed=156&FR=on&FR_dir=bkw&FR_speed=156&BL=on&BL_dir=fwd&BL_speed=156&BR=on&BR_dir=bkw&BR_speed=156";
      var UrlToGet = hostname + "controls?" + QData;

      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  listener.register_combo({
    keys: "x", on_keyup: function () {
      startCamera();
      var QData = "operation=motion&FL=off&FR=off&BL=off&BR=off";
      var UrlToGet = hostname + "controls?" + QData;

      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  setInterval(function () {
    $("#clockplace").html(GetTime());
    GetStatus();
  }, 500);


  $('.start_camera_btn').on('click', function (evt) {
    evt.preventDefault();

    startCamera();
    var xnum = Math.random();
    document.getElementById('panel-beep3').play();
    return false;
  });


  $('.generic_btn').on('click', function () {
    document.getElementById('panel-beep3').play();

    var UrlToGet = $(this).data("sendthis");
    $.get(UrlToGet, function (data, status) {
      console.log("Data: " + data + "    -- Status: " + status);
    });

    startCamera();

    setTimeout(function () {
      let QData = "operation=motion&FL=off&FR=off&BL=off&BR=off";
      let UrlToGet = hostname + "controls?" + QData;

      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });

    }, 2000);
  });

  $('.scan_btn').on('click', function () {
    var xnum = Math.random();
    document.getElementById('panel-beep2').play();
    var UrlToGet = hostname + "write_data?q=" + $(this).val();

    $.get(UrlToGet, function (data, status) {
      console.log("Data: " + data + "    -- Status: " + status);
    });
  });

  $('.camera_btn').on('click', function () {
    var xnum = Math.random();
    document.getElementById('panel-beep').play();
    var UrlToGet = hostname + "write_data?q=" + $(this).val();

    $.get(UrlToGet, function (data, status) {
      console.log("Data: " + data + "    -- Status: " + status);
    });
  });


  /*---------------------------------------
      Peity
  ----------------------------------------*/

  // Bar
  if ($('.peity-bar')[0]) {
    $('.peity-bar').each(function () {
      var peityWidth = ($(this).attr('data-width')) ? $(this).attr('data-width') : 65;

      $(this).peity('bar', {
        height: 36,
        fill: ['rgba(255,255,255,0.85)'],
        width: peityWidth,
        padding: 0.2
      });
    });
  }

  // Line
  if ($('.peity-line')[0]) {
    $('.peity-line').each(function () {
      var peityWidth = ($(this).attr('data-width')) ? $(this).attr('data-width') : 65;

      $(this).peity('line', {
        height: 50,
        fill: 'rgba(255,255,255,0.8)',
        stroke: 'rgba(255,255,255,0)',
        width: peityWidth,
        padding: 0.2
      });
    });
  }

  // Pie
  if ($('.peity-pie')[0]) {
    $('.peity-pie').each(function () {
      $(this).peity('pie', {
        fill: ['#fff', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.2)'],
        height: 50,
        width: 50
      });
    });
  }

  // Donut
  if ($('.peity-donut')[0]) {
    $('.peity-donut').each(function () {
      $(this).peity('donut', {
        fill: ['#fff', 'rgba(255,255,255,0.6)', 'rgba(255,255,255,0.2)'],
        height: 50,
        width: 50
      });
    });
  }


  /*---------------------------------------
      Easy Pie Charts
  ----------------------------------------*/
  if ($('.easy-pie-chart')[0]) {
    $('.easy-pie-chart').each(function () {
      var value = $(this).data('value');
      var size = $(this).data('size');
      var trackColor = $(this).data('track-color');
      var barColor = $(this).data('bar-color');

      $(this).find('.easy-pie-chart__value').css({
        lineHeight: (size - 2) + 'px',
        fontSize: (size / 5) + 'px',
        color: barColor
      });

      $(this).easyPieChart({
        easing: 'easeOutBounce',
        barColor: barColor,
        trackColor: trackColor,
        scaleColor: 'rgba(255,255,255,0.15)',
        lineCap: 'round',
        lineWidth: 1,
        size: size,
        animate: 3000,
        onStep: function (from, to, percent) {
          $(this.el).find('.percent').text(Math.round(percent));
        }
      })
    });
  }

});
