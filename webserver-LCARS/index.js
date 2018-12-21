var backgroundCheck;
var LastStatusCheck = null;
var BigPictureTimeout = null;
var StatusTimeout = [];
var LastBigPicture = "";

function checkTime(i) {
  if (i < 10) {
    i = "0" + i
  }
  ;  // add zero in front of numbers < 10
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
  let UrlToGet = "/start_camera";

  if (!CameraRunning) {
    CameraRunning = true;
    $.get(UrlToGet, function (data, status) {
      console.log("Data: " + data + "    -- Status: " + status);

      if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
        $("#stream_container").attr("src", "http://192.168.1.126:8080/video_stream.jpg?time=1&pDelay=120000");
      }
      else {
        $("#stream_container").attr("src", "/video_stream.jpg?time=1&pDelay=120000");
      }

      setTimeout(function () {
        CameraRunning = false;
      }, 10000);

    });
  }
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
    var UrlToGet = "/write_data?q=" + QData;
    $.get(UrlToGet, function (data, status) {
      //console.log("Data: " + data + "    -- Status: " + status);
    });
  }

  if (StatusType == 0) {
    var UrlToGet = "/read_data";
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
//            console.log(key);
//          console.log(value.data);
            try {
              var datajson = JSON.parse(value.data);
//          console.log(datajson);

              $("#table_stream_" + StatusRow + "").addClass("highlight");

              let StatusRow2 = StatusRow;
              clearTimeout(StatusTimeout[StatusRow2]);
              StatusTimeout[StatusRow2] = setTimeout(function () {
                $("#table_stream_" + StatusRow2 + "").removeClass("highlight");
              }, 1250);


              $("#table_stream_" + StatusRow + " td:nth-child(1)").html(datajson["c"]);
              $("#table_stream_" + StatusRow + " td:nth-child(2)").html(datajson["fle"]);
              $("#table_stream_" + StatusRow + " td:nth-child(3)").html(datajson["fre"]);

              $("#table_stream_" + StatusRow + " td:nth-child(4)").html(datajson["ble"]);
              $("#table_stream_" + StatusRow + " td:nth-child(5)").html(datajson["bre"]);

              $("#table_stream_" + StatusRow + " td:nth-child(6)").html(datajson["lh"]);
              $("#table_stream_" + StatusRow + " td:nth-child(7)").html(datajson["rh"]);
              $("#table_stream_" + StatusRow + " td:nth-child(8)").html(datajson["us"]);
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

function detectmob() {
  if( navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i)
  ){
    return true;
  }
  else {
    return false;
  }
}

function detectmob2() {
  if(window.innerWidth <= 800 && window.innerHeight <= 600) {
    return true;
  } else {
    return false;
  }
}
var s = function (sel) {
  return document.querySelector(sel);
};

$(document).ready(function () {
  canvas = document.getElementById("image_process_canvas");
  context = canvas.getContext("2d");

  if (detectmob() || detectmob2()) {
    var static = nipplejs.create({
      zone: s('.panels_div'),
      mode: 'static',
      size: 200,
      position: {
        left: '50%',
        top: '50%'
      },
      color: 'red'
    });
  } else {
    $("#joystick_block").html("<div class=\"zone static\" style=\"z-index: 99\"></div>");
    var static = nipplejs.create({
      zone: s('.panels_div'),
      mode: 'static',
      size: 200,
      position: {
        left: '50%',
        top: '50%'
      },
      color: 'red'
    });
  }


  static.on('hidden', function (evt, data) {
    var QData = "operation=motion&FL=off&FR=off&BL=off&BR=off";
    var UrlToGet = "/controls?" + QData;

    $.get(UrlToGet, function (data, status) {
      console.log("Data: " + data + "    -- Status: " + status);
    });
  });


  static.on('start end', function (evt, data) {
//    console.log(evt);
//    console.log(data);

    if (evt.type === "end") {
      var QData = "operation=motion&FL=off&FR=off&BL=off&BR=off";
      var UrlToGet = "/controls?" + QData;

      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);

        var UrlToGet = "/write_data?q=<Set_Face,1,3,>";
        $.get(UrlToGet, function (data, status) {
          console.log("Data: " + data + "    -- Status: " + status);
        });

      });
    } else
    {
      var UrlToGet = "/write_data?q=<Set_Face,1,6,>";
      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }

  });

  function resolveToPoint(rad, diameter) {
    var r = diameter / 2;
    return {mX: r * Math.cos(rad), mY: r * Math.sin(rad)};
  }

  static.on('move', function (evt, data) {
//    console.log(evt);
    console.log(data);

    //90 to 0 == forward to right
    //270 to 360 == reverse to right
    //180 to 270 == left to reverse
    //180 to 90 == left to forward

    if (typeof data.angle.radian !== "undefined") {
      var QData = "";
      var XYSpeed = resolveToPoint(data.angle.radian, data.distance * 2);
//      console.log(data.angle.radian);
//      console.log(resolveToPoint(data.angle.radian, 100));

      console.log(XYSpeed);


      if (XYSpeed.mY > 5 || XYSpeed.mY < -5) {

        var Left_Direction = "fwd";
        var Right_Direction = "fwd";
        var Left_Speed = 0;
        var Right_Speed = 0;

        var YValue = Math.round(data.distance * 3);

        var XValue = XYSpeed.mX;
        if (XValue < 0) {
          XValue = XValue * (-1);
        }

        XValue = Math.round((50 - XValue) / 50);

        if (XYSpeed.mY < 5) {
          Left_Direction = "bkw";
          Right_Direction = "bkw";
          Left_Speed = YValue;
          Right_Speed = YValue;

          if (XYSpeed.mX > 5) Right_Speed = Math.round(Right_Speed * XValue);
          if (XYSpeed.mX < -5) Left_Speed = Math.round(Left_Speed * XValue);

          var UrlToGet = "/write_data?q=<Set_Face,1,8,>";
          $.get(UrlToGet, function (data, status) {
            console.log("Data: " + data + "    -- Status: " + status);
          });

        } else
        {
          var UrlToGet = "/write_data?q=<Set_Face,1,10,>";
          $.get(UrlToGet, function (data, status) {
            console.log("Data: " + data + "    -- Status: " + status);
          });

        }

        if (XYSpeed.mY > 5) {
          Left_Direction = "fwd";
          Right_Direction = "fwd";
          Left_Speed = YValue;
          Right_Speed = YValue;

          if (XYSpeed.mX > 5) Right_Speed = Math.round(Right_Speed * XValue);
          if (XYSpeed.mX < -5) Left_Speed = Math.round(Left_Speed * XValue);
        }

        QData = "operation=motion&FL=on&FL_dir=" + Left_Direction + "&FL_speed=" + Left_Speed + "&FR=on&FR_dir=" + Right_Direction + "&FR_speed=" + Right_Speed + "&BL=on&BL_dir=" + Left_Direction + "&BL_speed=" + Left_Speed + "&BR=on&BR_dir=" + Right_Direction + "&BR_speed=" + Right_Speed + "";
      }

      if (QData !== "") {
        startCamera();
        var UrlToGet = "/controls?" + QData;
        $.get(UrlToGet, function (data, status) {
          console.log("Data: " + data + "    -- Status: " + status);
        });
      }
    }
  });


  var listener = new window.keypress.Listener();

  listener.register_combo({
    keys: "w", on_keyup: function () {
      startCamera();
      var QData = "operation=motion&FL=on&FL_dir=fwd&FL_speed=96&FR=on&FR_dir=fwd&FR_speed=96&BL=on&BL_dir=fwd&BL_speed=96&BR=on&BR_dir=fwd&BR_speed=96";
      var UrlToGet = "/controls?" + QData;
      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  listener.register_combo({
    keys: "s", on_keyup: function () {
      startCamera();
      var QData = "operation=motion&FL=on&FL_dir=bkw&FL_speed=96&FR=on&FR_dir=bkw&FR_speed=96&BL=on&BL_dir=bkw&BL_speed=96&BR=on&BR_dir=bkw&BR_speed=96";
      var UrlToGet = "/controls?" + QData;
      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  listener.register_combo({
    keys: "a", on_keyup: function () {
      startCamera();
      var QData = "operation=motion&FL=on&FL_dir=bkw&FL_speed=156&FR=on&FR_dir=fwd&FR_speed=156&BL=on&BL_dir=bkw&BL_speed=156&BR=on&BR_dir=fwd&BR_speed=156";
      var UrlToGet = "/controls?" + QData;

      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  listener.register_combo({
    keys: "d", on_keyup: function () {
      startCamera();
      var QData = "operation=motion&FL=on&FL_dir=fwd&FL_speed=156&FR=on&FR_dir=bkw&FR_speed=156&BL=on&BL_dir=fwd&BL_speed=156&BR=on&BR_dir=bkw&BR_speed=156";
      var UrlToGet = "/controls?" + QData;

      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  listener.register_combo({
    keys: "x", on_keyup: function () {
      startCamera();
      var QData = "operation=motion&FL=off&FR=off&BL=off&BR=off";
      var UrlToGet = "/controls?" + QData;

      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  setInterval(function () {
    $("#clockplace").html(GetTime());
    GetStatus();
  }, 500);


  $('.start_camera_btn').on('click', function () {
    startCamera();
    var xnum = Math.random();
    document.getElementById('panel-beep3').play();
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
      let UrlToGet = "/controls?" + QData;

      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });

    }, 2000);
  });

  $('.scan_btn').on('click', function () {
    var xnum = Math.random();
    document.getElementById('panel-beep2').play();
    var UrlToGet = "/write_data?q=" + $(this).val();

    $.get(UrlToGet, function (data, status) {
      console.log("Data: " + data + "    -- Status: " + status);
    });
  });

  $('.camera_btn').on('click', function () {
    var xnum = Math.random();
    document.getElementById('panel-beep').play();
    var UrlToGet = "/write_data?q=" + $(this).val();

    $.get(UrlToGet, function (data, status) {
      console.log("Data: " + data + "    -- Status: " + status);
    });
  });
})
;
