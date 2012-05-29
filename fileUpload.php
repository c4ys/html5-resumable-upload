<?PHP

set_time_limit(0);
session_start();

$file = "upload/{$_GET['file']}";
$num = $_GET['num'];
$size = $_GET['size'];
$per_size = $_GET['per_size'];
$hashname = substr(md5($file . $size), 8, 16);
$transfed = isset($_SESSION["file_transfer_$hashname"]) ? $_SESSION["file_transfer_$hashname"] : 0;
if (!file_exists("{$file}.part{$num}") || filesize("{$file}.part{$num}") != $per_size) {
    file_put_contents("{$file}.part{$num}", fopen('php://input', 'r'));
}
$transfed++;
if ($transfed == ceil($size / $per_size)) {
    if (!file_exists($file) || filesize($file) != $size) {
        for ($i = 1; $i <= ceil($size / $per_size); $i++) {
            if ($i == 1) {
                @unlink($file);
            }
            file_put_contents($file, fopen("{$file}.part{$i}", 'r'), FILE_APPEND);
        }
    }
    unset($_SESSION["file_transfer_$hashname"]);
} else {
    $_SESSION["file_transfer_$hashname"] = $transfed;
}
echo $transfed;
exit;