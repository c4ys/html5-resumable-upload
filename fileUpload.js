;
(function($){
    $.widget('ui.fileUpload', {
        options: {
            // 最大文件切片大小
            maxChunkSize: 1024 * 1024 * 1,
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
                for(var i=0; i<that._files.length; i++) {
                    var file = that._files[i];
                    that._status[i]={
                        lastModified: Math.ceil(file.lastModifiedDate.getTime()/1000),
                        name: file.name,
                        size: file.size
                    };
                }
                if(that.options.autoStart) {
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
            part = 0,
            start = 0,
            trunk_size = 1024*1024*10,
            end = 0,
            length = trunk_size;
            while( start < file.size ) {
                part++;
                end = start + trunk_size;
                if(end > file.size) {
                    end = file.size;
                }
                length = end - start;
                var xhr =  new XMLHttpRequest();
                xhr.upload.addEventListener("progress", function(e){
                    console.log("progress:"+e.loaded/e.total);
                }, false);
                xhr.addEventListener("load", function(e){
                    var resp = e.target.responseText;
                    try {
                        var json = JSON.parse(resp);
                        if(json.error) {
                            throw json.msg;
                        }
                    } catch (err) {
                        if(typeof(err)=='string') {
                            console.log(err);
                        } else {
                            console.log(err.message);
                        }
                    }
                }, false);
                xhr.upload.addEventListener("error", function(e){
                    }, false);
                xhr.addEventListener("abort", function(e){
                    }, false);
                xhr.open("POST", "fileUpload.php?action=upload&name="+ file.name + "&length="+ length 
                    + "&start="+ start + "&size="+ file.size + "&lastModified="+ Math.ceil(file.lastModifiedDate.getTime()/1000));
                xhr.send(file.webkitSlice(start, end));
                start = end;
            }
        }
        
    });
})(jQuery);