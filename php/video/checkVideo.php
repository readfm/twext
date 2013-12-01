<?php
  /**
  * This script check if the file with the given id exists on the server.
  * If the file exists, the response will be the file path, -1 otherwise.
  */
  $root = $_SERVER['DOCUMENT_ROOT'];  // document root
  $baseUrl = $_SERVER['SERVER_NAME'];   // server name "xc.cx"
  $videoId = $_POST['videoId']; // video id
  $videoPath = '/draft/textime/videos/'.$videoId; // video path on the server

  // Check if the video with the given id is on the server
  if(file_exists($root.$videoPath)) { // video is found on the server
    echo $baseUrl.$videoPath; // return video path on the server
  } else {  // video not found
    echo -1;
  }
?>