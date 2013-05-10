<?php
  
  $a = array('<foo>',"'bar'",'"baz"','&blong&');

  echo json_encode($a);

?>