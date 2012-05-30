;
(function($){
    $.widget('ui.fileUpload', {
        options: {
            // 命名空间
            namespace: undefined,
            // 最大文件切片大小
            maxChunkSize: 1024 * 1024 * 1
        },
        _create: function() {
            var $ = this;
            this.element.bind('change.fileUpload', function(){
                $._files =  $.element[0].files;
                $._loaded =  $._total = 0;
                $._getSequence();
                $._send();
            });
        },
        _send:function() {
            var $ = this;
            for(var blobIndex=0; blobIndex < $._sequence.length; blobIndex++){
                var quence = $._sequence[blobIndex];
                var file = $._files[quence.fileIndex];
                var chunk = file.webkitSlice(quence.start, quence.end);
                var xhr =  new XMLHttpRequest();
                console.log(blobIndex);
                var handler = function(e) {
                    console.log(e,blobIndex);
                }
                xhr.upload.addEventListener("progress", handler, false);
                xhr.open("POST", "fileUpload.php?num=" + quence.part + "&file="+ file.name + "&size="+ file.size + "&per_size="+ this.options.maxChunkSize);
                xhr.send(chunk);
            }
        },
        _progress:function(e,blobIndex){
            var $ = this;
            $._sequence[blobIndex].loaded = e.loaded;
            var loaded = 0;
            $.each($._sequence, function(index, value) { 
                loaded += value.loaded;
            });
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