<?php
  /**
  * Generate random string of length 10
  */
  function generateRandomString() {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'; // all characters
    $randstring = '';
    for($i = 0; $i < 10; $i++) {
      $randstring .= $characters[rand(0, strlen($characters)-1)];
    }
    return $randstring;
  }

  if (isset($_FILES["blob"])) { // blob file is sent
    $uploadDirectory = $_SERVER['DOCUMENT_ROOT'].'/draft/textime/audios/';  // path on the server where file is uploaded
    $fileName = generateRandomString().'.wav'; // audio file name, randomly generated

    while(file_exists($uploadDirectory.$fileName)) {  // keep generating file name till not duplicate
      $fileName = generateRandomString().'.wav';
    }

    if (!move_uploaded_file($_FILES["blob"]["tmp_name"], $uploadDirectory.$fileName)) { // move file to server
      echo false; // problem uploaded file
    }
    echo($fileName); // print upload path on server
    /*if(file_exists($uploadDirectory)) { // check if file already exist on server
      echo false;
    } else {  // file not on server, upload file
      if (!move_uploaded_file($_FILES["blob"]["tmp_name"], $uploadDirectory)) { // move file to server
        echo("problem moving uploaded file"); // problem uploaded file
      }
      echo($uploadDirectory); // print upload path on server
    }*/
  }
?>