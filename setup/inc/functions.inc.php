<?php
  /**************************************************************************\
  * phpGroupWare - Setup                                                     *
  * http://www.phpgroupware.org                                              *
  * --------------------------------------------                             *
  *  This program is free software; you can redistribute it and/or modify it *
  *  under the terms of the GNU General Public License as published by the   *
  *  Free Software Foundation; either version 2 of the License, or (at your  *
  *  option) any later version.                                              *
  \**************************************************************************/

  /* $Id$ */

  /* ######## Start security check ########## */
  $d1 = strtolower(substr($phpgw_info["server"]["api_inc"],0,3));
  $d2 = strtolower(substr($phpgw_info["server"]["server_root"],0,3));
  $d3 = strtolower(substr($phpgw_info["server"]["app_inc"],0,3));
  if($d1 == "htt" || $d1 == "ftp" || $d2 == "htt" || $d2 == "ftp" || $d3 == "htt" || $d3 == "ftp") {
    echo "Failed attempt to break in via an old Security Hole!<br>\n";
    exit;
  } unset($d1);unset($d2);unset($d3);
  /* ######## End security check ########## */

  // Include to check user authorization against  the 
  // password in ../header.inc.php to protect all of the setup
  // pages from unauthorized use.

  if(file_exists("../version.inc.php")) {
    include("../version.inc.php");  // To set the current core version
  }else{
    $phpgw_info["server"]["versions"]["phpgwapi"] = "Undetected";
  }

  $phpgw_info["server"]["app_images"] = "templates/default/images";

  include("./inc/phpgw_setup.inc.php");
  include("./inc/phpgw_schema_proc.inc.php");
  $phpgw_setup = new phpgw_setup;
?>