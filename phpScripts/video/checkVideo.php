<?php
  /**
  * This script check if the file with the given name exists on the server.
  * If the file exists, the response will be the file path, -1 otherwise.
  */
  $root = $_SERVER['DOCUMENT_ROOT'];
  $baseUrl = $_SERVER['SERVER_NAME'];   // xc.cx
  $videoName = $_POST['videoName'];
  $videoPath = '/draft/textime/videos/'.$videoName;
  if(file_exists($root.$videoPath)) {
    echo $baseUrl.$videoPath;
  } else {
    echo -1;
  }
?>