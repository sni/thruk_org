<?php

header('Content-Type: application/json');

if(!isset($_POST['text']) or empty($_POST['text'])) {
    print json_encode(['data' => ['message' => 'no input', 'rc' => 1, 'result' => '' ]]);
    exit(0);
}

$tmpin   = tempnam("/tmp", "naglint_in");
rename($tmpin, $tmpin.'.cfg');
$tmpin   = $tmpin.'.cfg';
$handle  = fopen($tmpin, "w+");
fwrite($handle, $_POST['text']);
fclose($handle);
$tmpout  = tempnam("/tmp", "naglint_out");
system("cd /omd/versions/default/ && PERL5LIB=/omd/versions/default/lib/perl5/:share/thruk/lib:share/thruk/plugins/plugins-available/conf/lib/: ./bin/naglint $tmpin > $tmpout 2>&1", $rc);
$res = file_get_contents($tmpout);
unlink($tmpin);
unlink($tmpout);
$result  = Array(1);
$replace = str_replace('/tmp/', '', $tmpin);
$res     = str_replace($replace.":", "line ", $res);
if($rc == 0) {
    $ok     = Array(1);
}
print json_encode(['data' => ['message' => 'ok', 'rc' => 0, 'result' => $res ]]);

?>