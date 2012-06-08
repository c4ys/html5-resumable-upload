
(function($){
    $.widget('ui.fileUpload', {
        options: {
            cover: false,
            // 文件切片大小
            chunkSize: 1024 * 1024 * 1,
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
                            that._upload(that._files[i]);
                        }
                    }
                }
            });
        },
        _upload:function(file) {
            var size = file.size,
            modifiedTime = Math.ceil(file.lastModifiedDate.getTime()/1000),
            part = -1,
            chunkSize = this.options.chunkSize,
            end = 0;
            var chunks = [], chunksCount = -1;
            var startTime = new Date().getTime(), timer = setInterval(function() {
                var elapsed = [ Math.round((new Date().getTime() - startTime) / 1000), 's'];
                if(elapsed[0] > 60) {
                    elapsed.unshift('min');
                    elapsed.unshift(Math.floor(elapsed[1]/60));
                    elapsed[2] = elapsed[2] % 60;
                }
                $(".js-time").val(elapsed.join(' '));
            }, 999);
            while( end < size && part < 10) {
                part++;
                (function(_start, _end) {
                    if(_end === undefined) {
                        end = _start + chunkSize;
                        if(end > size) {
                            end = size;
                        }
                        _end = end;
                    }
                    var xhr =  new XMLHttpRequest(), args = arguments;
                    xhr.upload.addEventListener("progress", function(e){
                        var index = Math.floor(_start / chunkSize), loaded = 0, percent;
                        chunks[index] = e.loaded;
                        chunks.forEach(function(val) {
                            loaded += val;
                        });
                        percent = (100*loaded / size).toFixed(2);
                        $(".js-percent").val(percent);
                    }, false);
                    xhr.addEventListener("loadend", function(e){
                        var resp = e.target.responseText;
                        try {
                            var json = JSON.parse(resp);
                            if(json.error) {
                                throw json.msg;
                            }
                            chunksCount++;
                            if(end < size) {
                                part++;
                                args.callee(end);
                            } else {
                                if(chunksCount === part) {
                                    $(".js-percent").val(100);
                                    clearInterval(timer);
                                }
                            }
                        } catch (err) {
                            console.log('error: retrying...');
                            args.callee(_start, _end);
                        }
                    }, false);
                    xhr.open("POST", "fileUpload.php?action=upload&" + $.param({
                        start: _start,
                        length: _end - _start,
                        name: file.name,
                        size: size,
                        lastModified: modifiedTime
                    }));
                    xhr.send(file.webkitSlice(_start, _end));
                })(end);
            }
        }
    });
})(jQuery);
