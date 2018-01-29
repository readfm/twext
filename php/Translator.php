<?php

// Bing Translator Api key
$key = 'afd3892b8c284d11af48d37932363dc6';

$path = "https://api.microsofttranslator.com/V2/Http.svc/";

$action = $_POST['action'];  // Translate text or Detect text language
$text = $_POST['text'];
$target = $_POST['to']; // empty in case of Detect

$params = '?text=' . urlencode($text) . '&to=' . $target;

$headers = "Content-type: text/xml\r\n" .
    "Ocp-Apim-Subscription-Key: $key\r\n";

// NOTE: Use the key 'http' even if you are making an HTTPS request. See:
// http://php.net/manual/en/function.stream-context-create.php
$options = array (
  'http' => array (
    'header' => $headers,
    'method' => 'GET'
  )
);

try {
  $context  = stream_context_create ($options);
  $result = file_get_contents ($path . $action . $params, false, $context);
  $xml = new SimpleXMLElement($result);
  echo $xml;
} catch(Exception $e) {
  echo -1;
}
?>