<?php
  require 'firebase.php'; // Firebase REST Api

  /**
  * Access Token class; get and save access token.
  */
  class AccessToken {
    private $grantType = "client_credentials";  // Grant type
    private $scope = "http://api.microsofttranslator.com";  // Application scope
    private $clientId = "9d9e0c6e-1b5a-4f31-b9ac-2623d53a78ac"; // Application client Id.
    private $clientSecret = "p+KdZ4FL0XeWNRSD826U9Gn+GbSW7Lz5F1RTMeB3MNk=";  // Application client secret.
    private $url = "https://datamarket.accesscontrol.windows.net/v2/OAuth2-13/";  // Bing access token authentication url
    private $firebaseUrl = "https://readfm.firebaseio.com/AccessToken";  // Firebase url for the access token

    /**
    * Get the access token.
    * @return string access token.
    */
    function getAccessToken() {
      // Create the request parameters array
      $paramArr = array (
        'grant_type'    => $this->grantType,
        'scope'         => $this->scope,
        'client_id'     => $this->clientId,
        'client_secret' => $this->clientSecret
      );
      // Create http query of the request paramaters
      $paramArr = http_build_query($paramArr);

      // Send request to Bing for getting the access token
      $ch = curl_init();  // Start curl session
      curl_setopt($ch, CURLOPT_URL, $this->url);  // Set the url option in the session
      curl_setopt($ch, CURLOPT_POST, TRUE); // Set request type to POST
      curl_setopt($ch, CURLOPT_POSTFIELDS, $paramArr);
      curl_setopt($ch, CURLOPT_RETURNTRANSFER, TRUE);  // return the transfer as a string of the return value of curl_exec() instead of direct output.
      curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);  // stop cURL from verifying the peer's certificate.
      // Send the request
      $strResponse = curl_exec($ch);  // execute curl session
      // Close curl session
      curl_close($ch);

      // Decode the returned JSON string.
      $objResponse = json_decode($strResponse);
      if ($objResponse->error) {  // if error exist
        return null;
      }
      $accessToken = $objResponse->access_token;
      return $accessToken;  // return access token
    }

    /**
    * Save the access token into firebase db.
    * @param $accessToken the access token to be saved
    */
    function saveAccessToken($accessToken) {
      if($accessToken == null) $accessToken = ""; // Save empty string if no access token is retrieved
      // Use firebase REST Api to save the access token
      $ref = new firebase($this->firebaseUrl); // Create firebase object
      $ref->set($accessToken); // Save the value into firebase db
    }
  } // end of class

  // Run the script
  $obj = new AccessToken(); // Create AccessToken class object
  $accessToken = $obj->getAccessToken();  // Get the access token
  $obj->saveAccessToken($accessToken);  // Save the access token into firebase
?>