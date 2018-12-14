<?php
/**
 * Created by PhpStorm.
 * User: ekim
 * Date: 2018-12-14
 * Time: 18:59
 */

$dir    = './faces';
//$files1 = scandir($dir);
$files2 = scandir($dir, 0);

$file_array = [];

foreach ($files2 as $file2) {
  if (stripos($file2,".txt") !== false && stripos($file2,"animation") !== false) {
    array_push( $file_array, $file2 );
  }
}

echo json_encode($file_array);
