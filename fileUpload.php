<?PHP

set_time_limit(0);

$upload_dir = "upload/";

$action = $_GET['action'];
if ($action == 'init') {
    $files = $_POST['files'];
    $return = array();
    foreach ($files as $v) {
        $destfile = 'upload/' . rawurlencode($v['name']);
        // cover=false时，如果文件存在、文件名、大小，修改时间都一样，则返回false，其他都返回true，表示文件有修改，需要重传。
        if (isset($_POST['cover']) && $_POST['cover'] == "true") {
            @unlink($destfile);
            $return[] = true;
        } else {
            if (file_exists($destfile)) {
                if (filesize($destfile) == $v['size'] && filemtime($destfile) == $v['lastModified']) {
                    $return[] = false;
                } else {
                    @unlink($destfile);
                    $return[] = true;
                }
            } else {
                $return[] = true;
            }
        }
    }
    exit(json_encode($return));
} elseif ($action == 'upload') {
    // 上传文件片段
    try {
        $src = fopen('php://input', 'rb');
        // windows上传文件如果局域网速度太快，往往会出现无权，需要等一下。这里设置不超过5秒
        $time = time();
        $destfile = $upload_dir . rawurlencode($_GET['name']);
        while (!($dest = @fopen($destfile, 'cb'))) {
            if (time() - $time > 5) {
                throw new Exception('写文件超时');
            }
        }
        fseek($dest, $_GET['start']);
        stream_copy_to_stream($src, $dest, $_GET['length']);
        fclose($dest);
        touch($destfile, $_GET['lastModified']);
        exit(json_encode(array('error' => 0)));
    } catch (Exception $e) {
        header("Status:500 Internal Server Error");
        exit(json_encode(array('error' => 1, 'msg' => $e->getMessage())));
    }
} elseif ($action == 'delete') {
    // 删除上传文件
    $destfile = $upload_dir . rawurlencode($_GET['name']);
    @unlink($destfile);
}

