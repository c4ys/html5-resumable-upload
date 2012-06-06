<?php

try {
    $src = fopen('php://input', 'rb');
    $time = time();
    while (!($dest = @fopen('upload/' . $_GET['file'], 'cb'))) {
        if (time() - $time > 30) {
            header("Status:504 Gateway Timeout");
            exit;
        }
    }
    $p = fseek($dest, $_GET['start']);
    stream_copy_to_stream($src, $dest, $_GET['length']);
    fclose($dest);
    exit(json_encode(array('error' => 0, 'p' => $p)));
} catch (Exception $e) {
    header("Status:500 Internal Server Error");
    exit;
}