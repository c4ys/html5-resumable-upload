;
(function($){
    $.widget('ui.fileUpload', {
        options: {
            // 命名空间
            namespace: undefined,
            // 最大文件切片大小
            maxChunkSize: 1024 * 1024 * 1,
            progress: null
        },
        _create: function() {
            var self = this;
            this.element.bind('change.fileUpload', function(){
                self._files =  self.element[0].files;
                self._loaded =  self._total = self._speed = 0;
                self._getSequence();
                self._send();
            });
        },
        _send:function() {
            this._start = new Date().getTime()/1000;
            for(var blobIndex=0; blobIndex < this._sequence.length; blobIndex++){
                this._sendBlob(blobIndex);
            }
        },
        _sendBlob:function (blobIndex){
            var self = this;
            var quence = self._sequence[blobIndex];
            var file = self._files[quence.fileIndex];
            var chunk = file.webkitSlice(quence.start, quence.end);
            var xhr =  new XMLHttpRequest();
            (function(index,callback){
                var progressHandler = function(e) {
                    self._sequence[index].loaded = e.loaded;
                    var loaded = 0;
                    $.each(self._sequence, function(i, v) { 
                        loaded += v.loaded;
                    });
                    self._loaded=loaded;
                    self._speed = Math.floor(self._loaded/(new Date().getTime()/1000 - self._start));
                    console.log(self.filesizeReadable(self._speed),self.filesizeReadable(self._total),self.filesizeReadable(self._loaded));
                };
                var errorHandler = function(e) {
                };
                var completeHandler = function(e) {
                };
                var CanceledHandler = function(e) {
                };
                xhr.addEventListener("progress", progressHandler, false);
                xhr.addEventListener("load", completeHandler, false);
                xhr.addEventListener("error", errorHandler, false);
                xhr.addEventListener("abort", CanceledHandler, false);
            })(blobIndex,this.options.progress);
            xhr.open("POST", "fileUpload.php?num=" + quence.part + "&file="+ file.name + "&size="+ file.size + "&per_size="+ this.options.maxChunkSize);
            xhr.setRequestHeader('X-File-Name', file.name);
            xhr.setRequestHeader('X-File-Size', file.size);
            xhr.setRequestHeader('X-File-Etag', file.name);
            xhr.send(chunk);
        },
        filesizeReadable:function(size){
            if(size > 1024*1024*1024) {
                return (size/(1024*1024*1024)).toFixed(2)+"GB";
            } else if(size > 1024*1024) {
                return (size/(1024*1024)).toFixed(2)+"MB";
            } else {
                return (size/(1024)).toFixed(2)+"MB";
            }
        },
        _getSequence: function(){
            var files = this._files;
            this._sequence = [];
            for(var index = 0; index < files.length; index++){
                var file = this._files[index];
                var start = 0;
                var end = this.options.maxChunkSize;
                var part = 1;
                while( start < file.size ) {
                    this._sequence.push({
                        fileIndex:index,
                        part:part,
                        start:start,
                        end:end,
                        loaded:0
                    });
                    part++;
                    start = end;
                    end = start + this.options.maxChunkSize;
                }
                this._total += file.size;
            }
            return this._sequence;
        }
    });
})(jQuery);