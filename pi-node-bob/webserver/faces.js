var mini_canvas = document.getElementById("mini_canvas");
var mini_context = mini_canvas.getContext("2d");
var DivideMiniScreen = 2.5;

var bw = window.innerWidth;
var bh = window.innerHeight;
var p = 0;

var Highlights = [];

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
      grd = mini_context.createLinearGradient(0.5 + (x / DivideMiniScreen), 0.5 + (y / DivideMiniScreen), 0.5 + (x / DivideMiniScreen) + (40 / DivideMiniScreen), 0.5 + (y / DivideMiniScreen) + (40 / DivideMiniScreen));
      grd.addColorStop(0, "#000");
      grd.addColorStop(1, "#222");
      mini_context.fillStyle = grd;
      mini_context.fillRect(0.5 + (x / DivideMiniScreen), 0.5 + (y / DivideMiniScreen), 40 / DivideMiniScreen, 40 / DivideMiniScreen);
    }
  }


  for (var i = 0; i < Highlights.length; i++) {
    var DrawColor = "Yellow";
    if (typeof Highlights[i].Color === "undefined") {
    }
    else {
      DrawColor = Highlights[i].Color;
    }

    grd = mini_context.createLinearGradient(
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

  $.get("/set_face?face_name=" + face_name, function (data, status) {
//        console.log("Data: " + data + "    -- Status: " + status);
  });

}


//---------------------------------------------------------------------------------------------------------------------------
$(document).ready(function () {
  //---------------------------------------------------------------------------------------------------------------------------
  bw = 40 * 16;//window.innerWidth;
  bh = 40 * 8;// window.innerHeight;
  mini_canvas.width = bw / DivideMiniScreen;
  mini_canvas.height = bh / DivideMiniScreen;

//    LoadFaceFile("face1.txt");

  PlayAnimationSeq = [];
  PlayAnimationSeq.push({"FileName": "face1", "Delay": 50});
  PlayAnimationSeq.push({"FileName": "face2", "Delay": 50});
  PlayAnimationSeq.push({"FileName": "face3", "Delay": 50});
  PlayAnimationSeq.push({"FileName": "face4", "Delay": 50});
  PlayAnimationSeq.push({"FileName": "face5", "Delay": 50});
  PlayAnimationSeq.push({"FileName": "face6", "Delay": 50});
  PlayAnimationSeq.push({"FileName": "face7", "Delay": 50});
  PlayAnimationSeq.push({"FileName": "face8", "Delay": 50});
  PlayAnimationSeq.push({"FileName": "face9", "Delay": 50});
  PlayAnimationSeq.push({"FileName": "face10", "Delay": 50});
  PlayAnimationSeq.push({"FileName": "face11", "Delay": 50});
  PlayAnimationSeq.push({"FileName": "face12", "Delay": 50});
  PlayAnimationSeq.push({"FileName": "face13", "Delay": 50});
  PlayAnimationSeq.push({"FileName": "face14", "Delay": 50});
  PlayAnimationRow = -1;
  PlayAnimationIntCounter = 0;
  PlayAnimation = false;


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


  UrlToGet = "/load_faces";
  var data = {};

  $.ajax({
    url: UrlToGet,
    data: data,
    dataType: "json",
    success: function (data, status) {
      for (face in data) {
        var xvalue = data[face];
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

  UrlToGet = "/load_face_animations";
  var data = {};

  $.ajax({
    url: UrlToGet,
    data: data,
    dataType: "json",
    success: function (data, status) {
      for (face in data) {
        var xvalue = data[face];
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
  $("#face_list").on('change', function (e) {
    console.log("load face");
    PlayAnimation = false;

    LoadFaceFile($(this).val());
  });

  //---------------------------------------------------------------------------------------------------------------------------
  $("#animation_list").on('change', function (e) {
    console.log("load animation");

    UrlToGet = "/load_face_animation";
    var data = {"face_animation_name": $(this).val() + ".txt"};

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
          if (linex.length==2) {
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
})
;
