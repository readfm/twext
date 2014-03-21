<?php
  /**
  * This script check if the file with the given name exists on the server.
  * If the file exists, the response will be the file path, -1 otherwise.
  */
  $root = $_SERVER['DOCUMENT_ROOT'];  // document root
  $filename = $_POST['filename']; // file name
  $path = '/draft/textime/'.$filename; // file path on the server

  echo unlink($root.$path);
?>