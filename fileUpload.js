
(function($){
    $.widget('ui.fileUpload', {
        options: {
            cover: false,
            // 最大文件切片大小
            maxChunkSize: 1024 * 1024 * 10,
            // 自动开始上传
            autoStart: true
        },
        _files:[],
        _status:[],
        _que:[],
        _create: function() {
            var that = this;
            this.element.bind('change.fileUpload', function(){
                that._files = this.files;
                for(var i = 0; i < that._files.length; i++) {
                    var file = that._files[i];
                    that._status[i]={
                        lastModified: Math.ceil(file.lastModifiedDate.getTime()/1000),
                        name: file.name,
                        size: file.size
                    };
                }
                if(that.options.autoStart && i > 0) {
                    that.start();
                }
            });
        },
        start:function() {
            console.log(this.options);
            this._start();
        },
        _start : function() {
            var that = this;
            $.ajax({
                url:"fileUpload.php?action=init",
                data: {
                    cover: that.options.cover,
                    files: that._status
                },
                type:'POST',
                dataType: 'json',
                success:function(json) {
                    for(var i=0;i<json.length;i++) {
                        that._status[i].result = json[i] ? 0 : 2; // 0,队列中，1，上传中，2，重复，2，成功，3，失败，4，已删除
                        if(that._status[i].result===0) {
                            that._upload(i);
                        }
                    }
                }
            });
        },
        _upload:function(i) {
            var file = this._files[i],
            size = file.size,
            modifiedTime = Math.ceil(file.lastModifiedDate.getTime()/1000),
            part = 0,
            start = 0,
            trunk_size = this.options.maxChunkSize,
            end = 0;
            var chunks = [], chunksCount = 0;
            while( start < size ) {
                end = start + trunk_size;
                if(end > size) {
                    end = size;
                }
                (function(i, start, end) {
                    var xhr =  new XMLHttpRequest(), args = arguments;
                    xhr.upload.addEventListener("progress", function(e){
                        chunks[i] = e.loaded;
                        var loaded = 0, percent;
                        chunks.forEach(function(val) {
                            loaded += val;
                        });
                        percent = (100*loaded / size).toFixed(2);
                        $("meter, output").val(percent);
                    }, false);
                    xhr.addEventListener("loadend", function(e){
                        var resp = e.target.responseText;
                        try {
                            var json = JSON.parse(resp);
                            if(json.error) {
                                throw json.msg;
                            }
                            chunksCount++;
                            if(chunksCount === part) {
                                $("meter, output").val(100);
                            }
                        } catch (err) {
                            console.log('error: retrying...');
                            args.callee.apply(null, args);
                        }
                    }, false);
                    xhr.open("POST", "fileUpload.php?action=upload&" + $.param({
                        start: start,
                        length: end - start,
                        name: file.name,
                        size: size,
                        lastModified: modifiedTime
                    }));
                    xhr.send(file.webkitSlice(start, end));
                })(part, start, end);
                start = end;
                part++;
            }
        }
    });
})(jQuery);
