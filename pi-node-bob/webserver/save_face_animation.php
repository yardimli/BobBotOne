<?php
/**
 * Created by PhpStorm.
 * User: ekim
 * Date: 2018-12-14
 * Time: 18:59
 */

file_put_contents("./faces/animation_".$_GET["face_animation_name"].".txt", $_GET["animation_cmd"]);