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
  var img = document.getElementById('stream_container');

  console.log(img.width);

  canvas.width = img.width;
  canvas.height = img.height;

  context.drawImage(img, 0, 0, img.width, img.height);

  var imageData = context.getImageData(0, 0, img.width, img.height);
  var sobelData = Sobel(imageData);
  var sobelImageData = sobelData.toImageData();
  context.putImageData(sobelImageData, 0, 0);

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


function GetStatus() {
  var UrlToGet = "/read_data";
  var data = {};

  $.ajax({
    url: UrlToGet,
    data: data,
    success: function (data, status) {
      console.log("Status: " + status);
      console.log(data);
      if (LastStatusCheck == null) LastStatusCheck = data;

      $.each(data, function (key, value) {
        console.log(key);
        console.log(value);
        key = 2;

        $("#table_stream_" + key + "").addClass("highlight");

        let key2 = key;

        clearTimeout(StatusTimeout[key2]);

        StatusTimeout[key2] = setTimeout(function () {
          $("#table_stream_" + key2 + "").removeClass("highlight");
        }, 5000);

        /*
            $("#table_stream_" + key + " td:nth-child(1)").html(value["servo"].servo_pos);
            $("#table_stream_" + key + " td:nth-child(2)").html(value["preview"].upload_left);
            $("#table_stream_" + key + " td:nth-child(3)").html(value["preview"].timestamp);
            $("#table_stream_" + key + " td:nth-child(4)").html((Math.round(value["preview"].time_taken * 1000) / 1000));
            $("#table_stream_" + key + " td:nth-child(5)").html('*');
            $("#table_stream_" + key + " td:nth-child(6)").html((Math.round(value["preview"].capture_time * 1000) / 1000));
            if (typeof value["fullsize"] != 'undefined') {
                if ('time_taken' in value["fullsize"]) {
                    $("#table_stream_" + key + " td:nth-child(7)").html((Math.round(value["fullsize"].time_taken * 1000) / 1000));
                }
                else {
                    $("#table_stream_" + key + " td:nth-child(7)").html("?");
                }
            }
            else {
                $("#table_stream_" + key + " td:nth-child(7)").html("??");
            }
            $("#table_stream_" + key + " td:nth-child(8)").html(value["preview"].timestamp);
        */
      });

      LastStatusCheck = data;

      backgroundCheck = setTimeout(function () {
        GetStatus();
      }, 1000);
    },
    dataType: "json"
  });
}

var cameraPreviewID = 0;
$(document).ready(function () {
//    document.body.webkitRequestFullScreen();

  canvas = document.getElementById("image_process_canvas");
  context = canvas.getContext("2d");

    var listener = new window.keypress.Listener();

  listener.register_combo({
    keys: "w", on_keyup: function () {
      var QData = "<Advance,96,120,msg>";
      var UrlToGet = "/write_data?q=" + QData;
      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  listener.register_combo({
    keys: "s", on_keyup: function () {
      var QData = "<Back_Off,96,60,msg>";
      var UrlToGet = "/write_data?q=" + QData;
      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  listener.register_combo({
    keys: "q", on_keyup: function () {
      var QData = "<Turn_L,96,20,msg>";
      var UrlToGet = "/write_data?q=" + QData;
      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  listener.register_combo({
    keys: "e", on_keyup: function () {
      var QData = "<Turn_R,96,20,msg>";
      var UrlToGet = "/write_data?q=" + QData;
      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  listener.register_combo({
    keys: "a", on_keyup: function () {
      var QData = "<Repeat_L,96,25,msg>";
      var UrlToGet = "/write_data?q=" + QData;
      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  listener.register_combo({
    keys: "d", on_keyup: function () {
      var QData = "<Repeat_R,96,25,msg>";
      var UrlToGet = "/write_data?q=" + QData;
      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  listener.register_combo({
    keys: "x", on_keyup: function () {
      var QData = "<Stop,0,0,msg>";
      var UrlToGet = "/write_data?q=" + QData;
      $.get(UrlToGet, function (data, status) {
        console.log("Data: " + data + "    -- Status: " + status);
      });
    }
  });

  setInterval(function () {
    $("#clockplace").html(GetTime());
  }, 1000);

  GetStatus();


  $('.generic_btn').on('click', function () {
    var xnum = Math.random();
    document.getElementById('panel-beep3').play();
    var UrlToGet = "/write_data?q=" + $(this).data("sendthis");

    $.get(UrlToGet, function (data, status) {
      console.log("Data: " + data + "    -- Status: " + status);
    });
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
});
