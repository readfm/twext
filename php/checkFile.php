<?php
  /**
  * This script check if the file with the given name exists on the server.
  * If the file exists, the response will be the file path, -1 otherwise.
  */
  $root = $_SERVER['DOCUMENT_ROOT'];  // document root
  $baseUrl = $_SERVER['SERVER_NAME'];   // server name "xc.cx"
  $filename = $_POST['filename']; // file name
  $path = '/draft/textime/'.$filename; // file path on the server

  // Check if the file with the given name is on the server
  if(file_exists($root.$path)) { // video is found on the server
    echo $baseUrl.$path; // return video path on the server
  } else {  // video not found
    echo -1;
  }
?>