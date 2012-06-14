
(function($){
    $.widget('ui.fileUpload', {
        options: {
            cover: false,
            // 文件切片大小
            chunkSize: 1024 * 1024 * 1,
            maxFileSize: 1024 * 1024 * 1024 * 1,
            maxFiles: 100,
            // 自动开始上传
            autoStart: true
        },
        _create: function() {
            this._queue = [];
            var that = this;
            this.element.bind('change.fileUpload', function(){
                that._files = [];
                that._status = [];
                for(var i = 0; i < this.files.length && i < that.options.maxFiles; i++) {
                    var file = this.files[i];
                    if(file.size > that.options.maxFileSize) {
                        continue;
                    }
                    that._files.push(file);
                    that._status.push({
                        lastModified: Math.ceil(file.lastModifiedDate.getTime()/1000),
                        name: file.name,
                        size: file.size
                    });
                }
                if(that.options.autoStart && that._files.length) {
                    that._start();
                }
            });
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
                            that._prepare(that._files[i]);
                        }
                    }
                    i = 0;
                    while(i++ < 4) {
                        that.start();
                    }
                }
            });
        },
        start: function() {
            if(this._queue.length) {
                this._upload.apply(this, this._queue.shift());
            }
        },
        _prepare: function(file) {
            var progress = $('#progress_tpl').clone().removeAttr('id').appendTo("#progress_panel");
            $('.js-name', progress).val(file.name);
            progress.hide().show(); // force css reflow to show meter progress

            var start, end = 0, size = file.size;
            while(end < size) {
                start = end;
                end += this.options.chunkSize;
                end > size && (end = size);
                this._queue.push([file, start, end, progress]);
            }
        },
        _upload: function(file, start, end, progress) {
            var size = file.size,
            modifiedTime = Math.ceil(file.lastModifiedDate.getTime()/1000);

            if(start === 0) {
                this.chunkLoaded = [];
            }

            var xhr =  new XMLHttpRequest(),
            args = arguments,
            that = this;
            xhr.upload.addEventListener("progress", function(e){
                var index = Math.floor(start / that.options.chunkSize),
                loaded, percent;
                that.chunkLoaded[index] = e.loaded;
                loaded = that.chunkLoaded.reduce(function(pre, cur) {
                    return pre + cur;
                });
                percent = (100*loaded / size).toFixed(2);
                $(".js-percent", progress).val(percent);
            }, false);
            xhr.addEventListener("loadend", function(e){
                var resp = e.target.responseText;
                try {
                    var json = JSON.parse(resp);
                    if(json.error) {
                        throw json.msg;
                    }
                    console.log(end, size);
                    if(end === size) {
                        $(".js-percent", progress).val(100);
                    }
                    that.start();
                } catch (err) {
                    console.log('error: retrying...', err);
                    args.callee.apply(that, arguments);
                }
            }, false);
            xhr.open("POST", "fileUpload.php?" + $.param({
                action: 'upload',
                start: start,
                length: end - start,
                name: file.name,
                size: size,
                lastModified: modifiedTime
            }));
            xhr.send(file.webkitSlice(start, end));
        }
    });
})(jQuery);
