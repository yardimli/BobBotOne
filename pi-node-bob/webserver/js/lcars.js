var backgroundCheck;
var LastStatusCheck = null;
var BigPictureTimeout = [];
var StatusTimeout = [];

function checkTime(i) {
    if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
    return i;
}

function GetTime() {
    var today = new Date();
    var h = today.getHours();
    var m = today.getMinutes();
    var s = today.getSeconds();
    m = checkTime(m);
    s = checkTime(s);
    return  h + ":" + m + ":" + s;
}


function GetStatus() {
    var UrlToGet = "http://192.168.1.246:8080/status.php";
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

                            $("#table_stream_" + key + "").addClass("highlight");

                            let key2 = key;

                            clearTimeout(StatusTimeout[key2]);

                            StatusTimeout[key2] = setTimeout(function () {
                                //console.log("timeout:");
                                //console.log(key2);
                                $("#table_stream_" + key2 + "").removeClass("highlight");
                            }, 5000);

                            var xnum = Math.random();
                            $("#pi" + key + " .camerabox").attr("src", "http://192.168.1.246:8080/pi_camera/temp_picamera_frame_" + key + ".jpg?n=" + xnum);
                            $("#pi" + key + " .thumbnail").data("full", "http://192.168.1.246:8080/pi_camera/temp_picamera_full_" + key + ".jpg?n=" + xnum);

                            if (parseInt(LastStatusCheck[key2]["preview"].upload_left)<4) {
                                if (key2+"" != "246") {
                                    var UrlToGet = "http://192.168.1.246:8080/mirror.php?filename=startupload.php&serverip=192.168.1." + key2 + ":8080";
                                }
                                else {
                                    var UrlToGet = "http://192.168.1.246:8080/startupload.php";
                                }

                                $.get(UrlToGet, function (data, status) {
                                    //console.log("Data: " + data + "    -- Status: " + status);
                                    //console.log(xcameraid);
                                });

                            }
                        }
                    }


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

                }

            });

            LastStatusCheck = data;

            backgroundCheck = setTimeout(function () {
                GetStatus();
            }, 200);
        },
        dataType: "json"
    });
}

var cameraPreviewID=0;
var CameraOrderList = [1,6,5]; //4,3,2,
$(document).ready(function () {
//    document.body.webkitRequestFullScreen();

    setInterval(function () {
        $("#clockplace").html(GetTime());
    },1000);

    setInterval(function () {
        cameraPreviewID++;
        if (cameraPreviewID>CameraOrderList.length-1) {cameraPreviewID=0;}
        if (CameraOrderList[cameraPreviewID] != 1) {
            var UrlToGet = "http://192.168.1.246:8080/mirror.php?filename=savebigimage.php&serverip=192.168.1.24" + CameraOrderList[cameraPreviewID] + ":8080";
        }
        else {
            var UrlToGet = "http://192.168.1.246:8080/savebigimage.php";
        }
        $.get(UrlToGet, function (data, status) {
            //console.log("Data: " + data + "    -- Status: " + status);
        });

        let camera_id3 = CameraOrderList[cameraPreviewID];

        clearTimeout(BigPictureTimeout[camera_id3]);
        BigPictureTimeout[camera_id3] = setTimeout(function () {
            var xnum = Math.random();
            $(".camerabox_big").attr("src", "http://192.168.1.246:8080/pi_camera/temp_picamera_full_24" + camera_id3 + ".jpg?n=" + xnum);
        }, 1500);

    },8000);

    GetStatus();


    for (i = 0; i < 6; i++) {
        var xnum = Math.random();
        $("#pi24" + (i + 1) + " .camerabox").attr("src", "http://192.168.1.246:8080/pi_camera/temp_picamera_frame_24" + (i + 1) + ".jpg?n=" + xnum);
        $("#pi24" + (i + 1) + " .camerabox").data("full", "http://192.168.1.246:8080/pi_camera/temp_picamera_full_24" + (i + 1) + ".jpg?n=" + xnum);
    }
    $(".camerabox_big").attr("src", "http://192.168.1.246:8080/pi_camera/temp_picamera_full_246.jpg?n=" + xnum);


    $('.camerabox').on('click', function () {
        document.getElementById('panel-beep').play();
        var xserverid = $(this).closest('.streambox').data("piid");
        var xcameraid = $(this).closest('.streambox').data("cameraid");

        if (xcameraid != "1") {
            var UrlToGet = "http://192.168.1.246:8080/mirror.php?filename=savebigimage.php&serverip=192.168.1.24" + xcameraid + ":8080";
        }
        else {
            var UrlToGet = "http://192.168.1.246:8080/savebigimage.php";
        }
        $.get(UrlToGet, function (data, status) {
            //console.log("Data: " + data + "    -- Status: " + status);
            //console.log(xcameraid);
        });
        let camera_id2 = $(this).closest('.streambox').data("cameraid");

        clearTimeout(BigPictureTimeout[camera_id2]);
        BigPictureTimeout[camera_id2] = setTimeout(function () {
            var xnum = Math.random();
            $(".camerabox_big").attr("src", "http://192.168.1.246:8080/pi_camera/temp_picamera_full_24" + camera_id2 + ".jpg?n=" + xnum);
        }, 1500);
    });

    $('.streambtn').on('click', function () {
        var xnum = Math.random();
        document.getElementById('panel-beep2').play();
        var xserverid = $(this).closest('.streambox').data("piid");
        var xcameraid = $(this).closest('.streambox').data("cameraid");

        if (xcameraid != "1") {
            var UrlToGet = "http://192.168.1.246:8080/mirror.php?filename=startupload.php&serverip=192.168.1.24" + xcameraid + ":8080";
        }
        else {
            var UrlToGet = "http://192.168.1.246:8080/startupload.php";
        }

        $.get(UrlToGet, function (data, status) {
            console.log("Data: " + data + "    -- Status: " + status);
            console.log(xcameraid);
        });
    });

    $('.servobtn').on('click', function () {
        var xnum = Math.random();
        document.getElementById('panel-beep3').play();
        var xserverid = $(this).closest('.streambox').data("piid");
        console.log(xserverid);
        var UrlToGet = "http://192.168.1.246:8080/servopi.php?server=" + xserverid + "&value=" + $(this).val();

        $.get(UrlToGet, function (data, status) {
            console.log("Data: " + data + "    -- Status: " + status);
        });
    });
});
