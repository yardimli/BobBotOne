<?php
/**
 * Created by PhpStorm.
 * User: ekim
 * Date: 2018-12-14
 * Time: 18:59
 */
file_put_contents("./faces/".$_GET["face_name"].".txt", $_GET["highlight"]);