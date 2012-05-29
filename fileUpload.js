;
(function($){
    $.widget('ui.fileUpload', {
        options: {
            // 命名空间
            namespace: undefined,
            // 最大文件切片大小
            maxChunkSize: 1024 * 10
        },
        _create: function() {
            this._files = this.element[0].files;
            this._loaded = this._total = 0;
            var that = this;
            this.element.bind('change.fileUpload', function(){
                that._sequence = that._getSequence();
                that._send();
            });
        },
        _send:function() {
            for(var n = 0; n < this._files.length; n++){
                var file = this._files[n];
                var start = 0;
                var end = this.options.maxChunkSize;
                var i = 1;
                var filename = encodeURIComponent(file.name);
                console.log(file)
                while( start < file.size ) {
                    console.log(file)
                    var chunk = file.webkitSlice(start, end);
                    var xhr =  new XMLHttpRequest();
                    xhr.upload.addEventListener("progress", function(e){
                        console.log(e)
                    }, false);
                    xhr.open("POST", "fileUpload.php?num=" + i + "&file="+ filename + "&size="+ file.size + "&per_size="+ this.options.maxChunkSize, false);
                    xhr.send(chunk);
                    i++;
                    start = end;
                    end = start + this.options.maxChunkSize;
                }
            }
        },
        _getSequence: function(){
            var files = this._files;
            this._sequence = [];
            for(n=0; n<files.length; n++){
                this._sequence.push({
                    index:n,
                    name:files[n].name,
                    size:files[n].size,
                    loaded:0,
                    parts:Math.ceil(files[n].size/this.options.maxChunkSize),
                    suc:0,
                    abort:0
                });
                this._total += files[n].size;
            }
            return this._sequence;
        }
    });
})(jQuery);