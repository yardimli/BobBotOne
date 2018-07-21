/**
 * Created by ekim on 25/4/17.
 */

var backgroundCheck;
var LastStatusCheck = null;

function GetStatus() {
    var UrlToGet = "http://192.168.1.241:8080/status.php";
    var data = {};

    $.ajax({
        url: UrlToGet,
        data: data,
        success: function (data, status) {
//            console.log("Status: " + status);
//            console.log(data);
            if (LastStatusCheck == null) LastStatusCheck = data;

            $.each(data, function (key, value) {
//                console.log(key);
//                console.log(value["fullsize"]);
//                console.log(value["preview"]);
//                console.log(value["servo"]);

                if ("preview" in value && "servo" in value) {

                    var NewData = "";
                    if (key in LastStatusCheck) {
                        if (LastStatusCheck[key]["preview"].upload_left != value["preview"].upload_left) {
                            NewData = "!";

                            var xnum = Math.random();
                            $("#pi"+ key +" .camerabox").attr("src", "http://192.168.1.241:8080/pi_camera/temp_picamera_frame_" + key + ".jpg?n=" + xnum);
                            $("#pi"+ key +" .thumbnail").data("full", "http://192.168.1.241:8080/pi_camera/temp_picamera_full_" + key + ".jpg?n=" + xnum);
                        }
                    }

                    $("#pi" + key + " .servoinfo").html("Servo Pos: " + value["servo"].servo_pos + "<br>Preview Left: " + value["preview"].upload_left + NewData + " <br>Last Update: " + value["preview"].timestamp);


                }

            });

            LastStatusCheck = data;

            backgroundCheck = setTimeout(function () {
                GetStatus();
            }, 1000);
        },
        dataType: "json"
    });
}

$(document).ready(function () {

    for (i = 0; i < 6; i++) {
        var xnum = Math.random();
        $("#pi24"+ (i+1) +" .camerabox").attr("src", "http://192.168.1.241:8080/pi_camera/temp_picamera_frame_24" + (i + 1) + ".jpg?n=" + xnum);
        $("#pi24"+ (i+1) +" .thumbnail").data("full", "http://192.168.1.241:8080/pi_camera/temp_picamera_full_24" + (i + 1) + ".jpg?n=" + xnum);
    }


    backgroundCheck = setTimeout(function () {
        GetStatus();
    });

    $('.streambtn').on('click', function () {
        var xcameraid = $(this).data("cameraid");

        if (xcameraid != "1") {
            var UrlToGet = "http://192.168.1.241:8080/mirror.php?filename=startupload.php&serverip=192.168.1.24" + xcameraid + ":8080";
        }
        else {
            var UrlToGet = "http://192.168.1.241:8080/startupload.php";
        }

        $.get(UrlToGet, function (data, status) {
            console.log("Data: " + data + "    -- Status: " + status);
            console.log(xcameraid);
            imageNr[(xcameraid - 1)] = 20;
        });
    });

    $('.servobtn').on('click', function () {
        var xserverid = $(this).data("piid");
        console.log(xserverid);
        var UrlToGet = "http://192.168.1.241:8080/servopi.php?server=" + xserverid + "&value=" + $(this).data("servopos");

        $.get(UrlToGet, function (data, status) {
            console.log("Data: " + data + "    -- Status: " + status);
        });
    });


    $('[data-toggle="popover"]').popover({
        container: 'body',
        html: true,
        placement: 'bottom',
        trigger: 'hover',
        content: function () {
            // get the url for the full size img
            var url = $(this).data('full');
            return '<img src="' + url + '" width="1024">'
        }
    });
});
