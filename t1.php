<?php

try {
    $src = fopen('php://input', 'rb');
    $time = time();
    while (!($dest = @fopen('upload/' . $_GET['file'], 'cb'))) {
        if (time() - $time > 30) {
            break;
        }
    }
    fseek($dest, $_GET['start']);
    stream_copy_to_stream($src, $dest, $_GET['length']);
    fclose($dest);
    exit(json_encode(array('error' => 0)));
} catch (Exception $e) {
    exit(json_encode(array('error' => 1, 'msg' => $e->getMessage())));
}