<?PHP

set_time_limit(0);

$upload_dir = "upload/";

$action = $_POST['action'];
if ($action == 'init') {
    // 初始化一个上传，并返回唯一文件名称
    $files = $_POST['files'];
    foreach ($files as &$v) {
        $pathinfo = pathinfo($v['name']);
        $ext = $pathinfo['extension'];
        $v['location'] = $upload_dir . uniqid() . "." . $ext;
    }
    exit(json_encode($files));
} elseif ($action == 'range') {
    // 取得文件已上传部分

    print_r($_POST);
} elseif ($action == 'upload') {
    // 上传文件

    print_r($_POST);
}

