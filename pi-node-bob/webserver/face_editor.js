//---------------------------------------------------------------------------------------------------------------------------


var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");


var mini_canvas = document.getElementById("mini_canvas");
var mini_context = mini_canvas.getContext("2d");
var DivideMiniScreen = 2.5;

var bw = window.innerWidth;
var bh = window.innerHeight;
var p = 0;

var Highlights = [];
var MouseCurrentX = 0;
var MouseCurrentY = 0;
var CurrentColor = "blue";
var LastMouseCurrentX = 0;
var LastMouseCurrentY = 0;
var SaveHighlights = [];

var PlayAnimationSeq = [];
var PlayAnimationRow = 0;
var PlayAnimation = false;
var PlayAnimationIntCounter = 0;


//---------------------------------------------------------------------------------------------------------------------------
function LoadFaceFile(face_name) {
  var ext = ".txt";
  $.ajax({
    url: "face/faces/" + face_name + ext,
    dataType: "json",
    success: function (data, status) {
      Highlights = data;
      drawLED(face_name);
      console.log("Status: " + status);
    },
    error: function (data, status) {
      console.log("error Status: " + status);
    }
  });
}


//---------------------------------------------------------------------------------------------------------------------------
function drawLED(face_name) {
  var grd;


  for (var y = 0; y <= 8 * 40; y += 40) {
    for (var x = 0; x <= 16 * 40; x += 40) {
      grd = context.createLinearGradient(0.5 + x, 0.5 + y, 0.5 + x + 40, 0.5 + y + 40);

      if ((y / 40) === MouseCurrentY && (x / 40) === MouseCurrentX) {
        grd.addColorStop(0, "red");
        grd.addColorStop(1, "#333");
      }
      else {
        grd.addColorStop(0, "#000");
        grd.addColorStop(1, "#333");
      }

      context.fillStyle = grd;
      context.fillRect(0.5 + x, 0.5 + y, 40, 40);

      grd = context.createLinearGradient(0.5 + (x / DivideMiniScreen), 0.5 + (y / DivideMiniScreen), 0.5 + (x / DivideMiniScreen) + (40 / DivideMiniScreen), 0.5 + (y / DivideMiniScreen) + (40 / DivideMiniScreen));
      grd.addColorStop(0, "#000");
      grd.addColorStop(1, "#222");
      mini_context.fillStyle = grd;
      mini_context.fillRect(0.5 + (x / DivideMiniScreen), 0.5 + (y / DivideMiniScreen), 40 / DivideMiniScreen, 40 / DivideMiniScreen);


    }
  }


  for (var i = 0; i < Highlights.length; i++) {

    grd = context.createLinearGradient(
      0.5 + (Highlights[i].X * 40),
      0.5 + (Highlights[i].Y * 40),
      0.5 + 40 + (Highlights[i].X * 40),
      0.5 + 40 + (Highlights[i].Y * 40));

    var DrawColor = "Yellow";
    if (typeof Highlights[i].Color === "undefined") {

    }
    else {
      DrawColor = Highlights[i].Color;
    }

    grd.addColorStop(0, DrawColor);
    grd.addColorStop(1, "#333");

    context.fillStyle = grd;
    context.fillRect(
      0.5 + (Highlights[i].X * 40),
      0.5 + (Highlights[i].Y * 40),
      40,
      40);

    grd = context.createLinearGradient(
      0.5 + (Highlights[i].X * (40 / DivideMiniScreen)),
      0.5 + (Highlights[i].Y * (40 / DivideMiniScreen)),
      0.5 + (40 / DivideMiniScreen) + (Highlights[i].X * (40 / DivideMiniScreen)),
      0.5 + (40 / DivideMiniScreen) + (Highlights[i].Y * (40 / DivideMiniScreen)));
    grd.addColorStop(0, DrawColor);
    grd.addColorStop(1, DrawColor);

    mini_context.fillStyle = grd;
    mini_context.fillRect(
      0.5 + (Highlights[i].X * (40 / DivideMiniScreen)),
      0.5 + (Highlights[i].Y * (40 / DivideMiniScreen)),
      (40 / (DivideMiniScreen + 2)),
      (40 / (DivideMiniScreen + 2)));
  }
  $.get("/robot_cmd?set_face=yes&face_name=" + face_name, function (data, status) {
//        console.log("Data: " + data + "    -- Status: " + status);
  });
}

//---------------------------------------------------------------------------------------------------------------------------
function drawBoard() {

  for (var y = 0; y <= 16 * 40; y += 40) {
    context.moveTo(0.5 + y + p, p);
    context.lineTo(0.5 + y + p, bh + p);
  }


  for (var x = 0; x <= 8 * 40; x += 40) {
    context.moveTo(p, 0.5 + x + p);
    context.lineTo(bw + p, 0.5 + x + p);
  }

  context.strokeStyle = "black";
  context.stroke();
}

//---------------------------------------------------------------------------------------------------------------------------
function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}


//---------------------------------------------------------------------------------------------------------------------------
$(document).ready(function () {
  //---------------------------------------------------------------------------------------------------------------------------
  bw = 40 * 16;//window.innerWidth;
  bh = 40 * 8;// window.innerHeight;
  canvas.width = bw;
  canvas.height = bh;


  mini_canvas.width = bw / DivideMiniScreen;
  mini_canvas.height = bh / DivideMiniScreen;

  PlayAnimationSeq = [];
  PlayAnimationRow = -1;
  PlayAnimationIntCounter = 0;
  PlayAnimation = false;

  drawLED();
  drawBoard();

  setInterval(function () {
    if (PlayAnimation && PlayAnimationSeq.length > 0) {
      PlayAnimationIntCounter++;

      if (PlayAnimationRow == -1) {
        PlayAnimationRow = 1;
        PlayAnimationIntCounter = 0;
      }

      if (PlayAnimationIntCounter > PlayAnimationSeq[PlayAnimationRow - 1]["Delay"]) {

        PlayAnimationRow++;
        if (PlayAnimationRow > PlayAnimationSeq.length) {
          PlayAnimationRow = 1;
        }

        LoadFaceFile(PlayAnimationSeq[PlayAnimationRow - 1]["FileName"]);
        PlayAnimationIntCounter = 0;
      }
    }
  }, 100);


  UrlToGet = "/robot_cmd";
  var data = {"load_faces": "yes"};

  $.ajax({
    url: UrlToGet,
    data: data,
    dataType: "json",
    success: function (data, status) {
      for (face in data[0].files) {
        var xvalue = data[0].files[face];
        xvalue = xvalue.replace(".txt", "");
        $('#face_list').append($('<option/>', {
          value: xvalue,
          text: xvalue
        }));
      }

      console.log("Status: " + status);
    },
    error: function (data, status) {
      console.log("error Status: " + status);
    }
  });

  UrlToGet = "/robot_cmd";
  var data = {"load_face_animations": "yes"};

  $.ajax({
    url: UrlToGet,
    data: data,
    dataType: "json",
    success: function (data, status) {
      for (face in data[0].files) {
        var xvalue = data[0].files[face];
        xvalue = xvalue.replace(".txt", "");
        $('#animation_list').append($('<option/>', {
          value: xvalue,
          text: xvalue
        }));
      }

      console.log("Status: " + status);
    },
    error: function (data, status) {
      console.log("error Status: " + status);
    }
  });

  //---------------------------------------------------------------------------------------------------------------------------
  $(".color_menu").on('click', function (e) {
    CurrentColor = $(this).data("color");
    e.preventDefault();
  });


  //---------------------------------------------------------------------------------------------------------------------------
  $("#face_list").on('change', function (e) {
    console.log("load face");
    PlayAnimation = false;

    LoadFaceFile($(this).val());
  });

  //---------------------------------------------------------------------------------------------------------------------------
  $("#animation_list").on('change', function (e) {
    console.log("load animation");

    UrlToGet = "/robot_cmd";
    var data = {"load_face_animation": "yes", "face_animation_name": $(this).val() + ".txt"};

    $.ajax({
      url: UrlToGet,
      data: data,
      dataType: "text",
      success: function (data, status) {
        console.log(data);
        console.log("Status: " + status);

        PlayAnimationSeq = [];
        var lines = data.split(/\r\n|\r|\n/);
        for (var i = 0; i < lines.length; i++) {
          var linex = lines[i];
          linex = linex.split(";");
          if (linex.length == 2) {
            PlayAnimationSeq.push({"FileName": linex[0].trim(), "Delay": linex[1].trim()});
          }

        }
        PlayAnimationRow = -1;
        PlayAnimationIntCounter = 0;
        PlayAnimation = true;
      },
      error: function (data, status) {
        console.log("error Status: " + status);
      }

    });

    e.preventDefault();
  });


  setTimeout(function () {
    drawLED();
    drawBoard();
  }, 2000);

  canvas.addEventListener('mousemove', function (evt) {
    var mousePos = getMousePos(canvas, evt);

    MouseCurrentX = Math.floor(mousePos.x / 40);
    MouseCurrentY = Math.floor(mousePos.y / 40);

    if (MouseCurrentX >= 16) {
      MouseCurrentX = 16;
    }
    if (MouseCurrentY >= 8) {
      MouseCurrentY = 8;
    }

    if (MouseCurrentX !== LastMouseCurrentX || MouseCurrentY !== LastMouseCurrentY) {
      LastMouseCurrentX = MouseCurrentX;
      LastMouseCurrentY = MouseCurrentY
      var message = 'Mouse position: ' + MouseCurrentX + ',' + MouseCurrentY;

      drawLED();
      drawBoard();

//        writeMessage(canvas, message);
//        writeMessage(canvas, "##MYIP##");
    }
  }, false);


  canvas.addEventListener('click', function (event) {
//	console.log("click");


    PlayAnimation = false;
    var DeleteDot = false;
    for (var i = 0; i < Highlights.length; i++) {
      if (Highlights[i].X == MouseCurrentX && Highlights[i].Y == MouseCurrentY) {
        Highlights.splice(i, 1);
        DeleteDot = true;
        break;
      }
    }

    if (!DeleteDot) {
      Highlights.push({X: MouseCurrentX, Y: MouseCurrentY, Color: CurrentColor});
    }

    drawLED();
    drawBoard();
  }, false);


});
