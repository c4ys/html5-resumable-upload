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
            var that = this;
            that._files=that._que=[];
            this.element.bind('change.fileUpload', function(){
                var files = this.files;
                // 取得每个文件当前的服务器路径
                for(i=0; i<files.length; i++) {
                    var file = files[i];
                    that._files.push({
                        lastModifiedDate: Math.ceil(file.lastModifiedDate.getTime()/1000),
                        name: file.name,
                        size: file.size,
                        loaded:0
                    });
                }
                $.ajax({
                    url:"fileUpload.php",
                    data: {
                        action: 'init',
                        files: that._files
                    },
                    type:'POST',
                    dataType: 'json',
                    success:function(json) {
                        
                    }
                });
                // 
            });
        }
        
    });
})(jQuery);