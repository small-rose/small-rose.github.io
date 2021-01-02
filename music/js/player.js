/**************************************************
 * 云音乐 v3.0
 * 播放器主功能模块
 * 编写：RG(https://ytxmgy.com)
 * 时间：2019-5-12
 *************************************************/
// 播放器功能配置
var mkPlayer = {
    api: "api.php", // api地址
    loadcount: 20,  // 搜索结果一次加载多少条
    method: "POST",     // 数据传输方式(POST/GET)
    defaultlist: 3,    // 默认要显示的播放列表编号
    autoplay: false,    // 是否自动播放(true/false) *此选项在移动端可能无效
    coverbg: true,      // 是否开启封面背景(true/false) *开启后会有些卡
    mcoverbg: true,     // 是否开启[移动端]封面背景(true/false)
    dotshine: true,    // 是否开启播放进度条的小点闪动效果[不支持IE](true/false) *开启后会有些卡
    mdotshine: false,   // 是否开启[移动端]播放进度条的小点闪动效果[不支持IE](true/false)
    volume: 0.6,        // 默认音量值(0~1之间)
    version: "v3.0",    // 播放器当前版本号(仅供调试) RG新增
    debug: false   // 是否开启调试模式(true/false)
};


var page="";
/*******************************************************
 * 以下内容是播放器核心文件，不建议进行修改，否则可能导致播放器无法正常使用!
 * 
 * 哈哈，吓唬你的！想改就改呗！不过建议修改之前先【备份】,要不然改坏了弄不好了。
 ******************************************************/

// 存储全局变量
var rem = [];

// 音频错误处理函数
function audioErr() {
    // 没播放过，直接跳过
    if(rem.playlist === undefined) return true;
    
    if(rem.errCount > 10) { // 连续播放失败的歌曲过多
        layer.msg('似乎出了点问题~播放已停止');
        rem.errCount = 0;
    } else {
        rem.errCount++;     // 记录连续播放失败的歌曲数目
        layer.msg('当前歌曲播放失败，自动播放下一首');
        nextMusic();    // 切换下一首歌
    } 
}

// 点击暂停按钮的事件
function pause() {
    if(rem.paused === false) {  // 之前是播放状态
        rem.audio[0].pause();  // 暂停
    } else {
        // 第一次点播放
        if(rem.playlist === undefined) {
            rem.playlist = rem.dislist;
            
            musicList[1].item = musicList[rem.playlist].item; // 更新正在播放列表中音乐
            
            // 正在播放 列表项已发生变更，进行保存
            playerSavedata('playing', musicList[1].item);   // 保存正在播放列表
            
            listClick(0);
        }
        rem.audio[0].play();
    }
}

// 循环顺序
function orderChange() {
    if(!rem.order) rem.order = 2;
    rem.order++;
    if(rem.order > 3) rem.order = 1;
    
    var orderDiv = $(".btn-order");
    orderDiv.removeClass();
    switch(rem.order) {
        case 1:     // 单曲循环
            orderDiv.addClass("player-btn btn-order btn-order-single");
            orderDiv.attr("title","单曲循环");
            break;
            
        case 3:     // 随机播放
            orderDiv.addClass("player-btn btn-order btn-order-random");
            orderDiv.attr("title","随机播放");
            break;
            
        default:    // 顺序播放
            orderDiv.addClass("player-btn btn-order btn-order-list");
            orderDiv.attr("title","列表循环");
    }
}

// 播放
function audioPlay() {
    rem.paused = false;     // 更新状态（未暂停）
    refreshList();      // 刷新状态，显示播放的波浪
    $(".btn-play").addClass("btn-state-paused");        // 恢复暂停
    
    if((mkPlayer.dotshine === true && !rem.isMobile) || (mkPlayer.mdotshine === true && rem.isMobile)) {
        $("#music-progress .mkpgb-dot").addClass("dot-move");   // 小点闪烁效果
    }
    
    var music = musicList[rem.playlist].item[rem.playid];   // 获取当前播放的歌曲信息
    var msg = " 正在播放: " + music.name + " - " + music.artist;  // 改变浏览器标题
    
    // 清除定时器
    if (rem.titflash !== undefined ) 
    {
        clearInterval(rem.titflash);
    }
    // 标题滚动
    titleFlash(msg);
}
// 标题滚动
function titleFlash(msg) {

    // 截取字符
    var tit = function() {
        msg = msg.substring(1,msg.length)+ msg.substring(0,1);
        document.title = msg;
    };
    // 设置定时间 300ms滚动
    rem.titflash = setInterval(function(){tit()}, 300);
}
// 暂停
function audioPause() {
    rem.paused = true;      // 更新状态（已暂停）
    
    $(".list-playing").removeClass("list-playing");        // 移除其它的正在播放
    
    $(".btn-play").removeClass("btn-state-paused");     // 取消暂停
    
    $("#music-progress .dot-move").removeClass("dot-move");   // 小点闪烁效果

     // 清除定时器
    if (rem.titflash !== undefined ) 
    {
        clearInterval(rem.titflash);
    }
    document.title = rem.webTitle;    // 改变浏览器标题
}

// 播放上一首歌
function prevMusic() {
    playList(rem.playid - 1);
}

// 播放下一首歌
function nextMusic() {
    switch (rem.order ? rem.order : 1) {
        case 1,2: 
            playList(rem.playid + 1);
        break;
        case 3: 
            if (musicList[1] && musicList[1].item.length) {
                var id = parseInt(Math.random() * musicList[1].item.length);
                playList(id);
            }
        break;
        default:
            playList(rem.playid + 1); 
        break;
    }
}
// 自动播放时的下一首歌
function autoNextMusic() {
    if(rem.order && rem.order === 1) {
        playList(rem.playid);
    } else {
        nextMusic();
    }
}

// 歌曲时间变动回调函数
function updateProgress(){
    // 暂停状态不管
    if(rem.paused !== false) return true;
    // 同步进度条
	music_bar.goto(rem.audio[0].currentTime / rem.audio[0].duration);
    // 同步歌词显示	
	scrollLyric(rem.audio[0].currentTime);
}

// 显示的列表中的某一项点击后的处理函数
// 参数：歌曲在列表中的编号
function listClick(no) {
    // 记录要播放的歌曲的id
    var tmpid = no;
    
    // 调试信息输出
    if(mkPlayer.debug) {
        console.log("点播了列表中的第 " + (no + 1) + " 首歌 " + musicList[rem.dislist].item[no].name);
    }
    
    // 搜索列表的歌曲要额外处理
    if(rem.dislist === 0) {
        
        // 没播放过
        if(rem.playlist === undefined) {
            rem.playlist = 1;   // 设置播放列表为 正在播放 列表
            rem.playid = musicList[1].item.length - 1;  // 临时设置正在播放的曲目为 正在播放 列表的最后一首
        }
        
        // 获取选定歌曲的信息
        var tmpMusic = musicList[0].item[no];
        
        
        // 查找当前的播放列表中是否已经存在这首歌
        for(var i=0; i<musicList[1].item.length; i++) {
            if(musicList[1].item[i].id == tmpMusic.id && musicList[1].item[i].source == tmpMusic.source) {
                tmpid = i;
                playList(tmpid);    // 找到了直接播放
                return true;    // 退出函数
            }
        }
        
        
        // 将点击的这项追加到正在播放的条目的下方
        musicList[1].item.splice(rem.playid + 1, 0, tmpMusic);
        tmpid = rem.playid + 1;
        
        // 正在播放 列表项已发生变更，进行保存
        playerSavedata('playing', musicList[1].item);   // 保存正在播放列表
    } else {    // 普通列表
        // 与之前不是同一个列表了（在播放别的列表的歌曲）或者是首次播放
        if((rem.dislist !== rem.playlist && rem.dislist !== 1) || rem.playlist === undefined) {
            rem.playlist = rem.dislist;     // 记录正在播放的列表
            musicList[1].item = musicList[rem.playlist].item; // 更新正在播放列表中音乐
            
            // 正在播放 列表项已发生变更，进行保存
            playerSavedata('playing', musicList[1].item);   // 保存正在播放列表
            
            // 刷新正在播放的列表的动画
            refreshSheet();     // 更改正在播放的列表的显示
        }
    }
    
    playList(tmpid);
    
    return true;
}

// 播放正在播放列表中的歌曲
// 参数：歌曲在列表中的ID
function playList(id) {
    // 第一次播放
    if(rem.playlist === undefined) {
        pause();
        return true;
    }
    
    // 没有歌曲，跳出
    if(musicList[1].item.length <= 0) return true;
    
    // ID 范围限定
    if(id >= musicList[1].item.length) id = 0;
    if(id < 0) id = musicList[1].item.length - 1;
    
    // 记录正在播放的歌曲在正在播放列表中的 id
    rem.playid = id;
    
    // 如果链接为空，则 ajax 获取数据后再播放
    if(musicList[1].item[id].url === null || musicList[1].item[id].url === "") {
        ajaxUrl(musicList[1].item[id], play);
    } else {
        play(musicList[1].item[id]);
    }
}

// 初始化 Audio
function initAudio() {
    rem.audio = $('<audio></audio>').appendTo('body');
    
    // 应用初始音量
    rem.audio[0].volume = volume_bar.percent;
    // 绑定歌曲进度变化事件
    rem.audio[0].addEventListener('timeupdate', updateProgress);   // 更新进度
    rem.audio[0].addEventListener('play', audioPlay); // 开始播放了
    rem.audio[0].addEventListener('pause', audioPause);   // 暂停
    $(rem.audio[0]).on('ended', autoNextMusic);   // 播放结束
    rem.audio[0].addEventListener('error', audioErr);   // 播放器错误处理
}

var pages;
// 播放音乐
// 参数：要播放的音乐数组
function play(music) {
    // 调试信息输出
    if(mkPlayer.debug) {
        console.log('开始播放 - ' + music.name);
        
        console.info('id: "' + music.id + '",\n' + 
        'name: "' + music.name + '",\n' +
        'artist: "' + music.artist + '",\n' +
        'album: "' + music.album + '",\n' +
        'source: "' + music.source + '",\n' +
        'url_id: "' + music.url_id + '",\n' + 
        'pic_id: "' + music.pic_id + '",\n' + 
        'lyric_id: "' + music.lyric_id + '",\n' + 
        'pic: "' + music.pic + '",\n' +
        'url: "' + music.url + '"');
    }
    $(".music-name-play").text(music.name +" - " +music.artist);//当前歌曲
    $(".music-163,.music-name-play,.logo-163").attr("title","当前播放： "+music.artist+" - "+music.name);

    var music_id = music.lyric_id; //获取歌曲id
    //comments(music_id,0);//显示评论
    $.when(comments(music_id,0)).done(function(page){
        //console.log(page);
        $(".tcdPageCode").createPage({
            pageCount:page, //总页数
            current:1,       //起始页
            backFn:function(p){
                //console.log(p);//p:当前页
                if($(".hot-comment-all").is(":visible")){
                    $(".hot-comment-all").fadeOut();
                }else if($(".comment-author-all").is(":hidden")){
                    $(".comment-author-all").fadeIn();
                };
                comments(music_id,p-1);
            }
        });
    })

    


    // 遇到错误播放下一首歌
    if(music.url == "err") {
        audioErr(); // 调用错误处理函数
        return false;
    }
    
    addHis(music);  // 添加到播放历史
    
    // 如果当前主界面显示的是播放历史，那么还需要刷新列表显示
    if(rem.dislist == 2 && rem.playlist !== 2) {
        loadList(2);
    } else {
        refreshList();  // 更新列表显示
    }
    
    // 解决网易云音乐部分歌曲无法播放问题
    if(music.source == "netease") {
        music.url = music.url.replace(/m7c.music./g, "m7.music.");
        music.url = music.url.replace(/m8c.music./g, "m8.music.");
    } else if(music.source == "baidu") {    // 解决百度音乐防盗链
        music.url = music.url.replace(/http:\/\/zhangmenshiting.qianqian.com/g, "https://gss0.bdstatic.com/y0s1hSulBw92lNKgpU_Z2jR7b2w6buu");
    }
	
    try {
        rem.audio[0].pause();
        rem.audio.attr('src', music.url);
        rem.audio[0].play();
    } catch(e) {
        audioErr(); // 调用错误处理函数
        return;
    }
    
    rem.errCount = 0;   // 连续播放失败的歌曲数归零
    music_bar.goto(0);  // 进度条强制归零
    changeCover(music);    // 更新封面展示
    ajaxLyric(music, lyricCallback);     // ajax加载歌词
    music_bar.lock(false);  // 取消进度条锁定
}


// 我的要求并不高，保留这一句版权信息可好？
// 保留了，你不会损失什么；而保留版权，是对作者最大的尊重。
console.info('欢迎使用 云音乐!\n当前版本：'+mkPlayer.version+' \n作者：mengkun(https://mkblog.cn) and RG(https://ytxmgy.com)\n歌曲来源于各大音乐平台\n '+mkPlayer.version+' 是在 RG 在mengkun v2.4基础上所作,新增网易云热评模块');

// 音乐进度条拖动回调函数
function mBcallback(newVal) {
    var newTime = rem.audio[0].duration * newVal;
    // 应用新的进度
    rem.audio[0].currentTime = newTime;
    refreshLyric(newTime);  // 强制滚动歌词到当前进度
}

// 音量条变动回调函数
// 参数：新的值
function vBcallback(newVal) {
    if(rem.audio[0] !== undefined) {   // 音频对象已加载则立即改变音量
        rem.audio[0].volume = newVal;
    }
    
    if($(".btn-quiet").is('.btn-state-quiet')) {
        $(".btn-quiet").removeClass("btn-state-quiet");     // 取消静音
    }
    
    if(newVal === 0) $(".btn-quiet").addClass("btn-state-quiet");
    
    playerSavedata('volume', newVal); // 存储音量信息
}

// 下面是进度条处理
var initProgress = function(){  
    // 初始化播放进度条
    music_bar = new mkpgb("#music-progress", 0, mBcallback);
    music_bar.lock(true);   // 未播放时锁定不让拖动
    // 初始化音量设定
    var tmp_vol = playerReaddata('volume');
    tmp_vol = (tmp_vol != null)? tmp_vol: (rem.isMobile? 1: mkPlayer.volume);
    if(tmp_vol < 0) tmp_vol = 0;    // 范围限定
    if(tmp_vol > 1) tmp_vol = 1;
    if(tmp_vol == 0) $(".btn-quiet").addClass("btn-state-quiet"); // 添加静音样式
    volume_bar = new mkpgb("#volume-progress", tmp_vol, vBcallback);
};  

// mk进度条插件
// 进度条框 id，初始量，回调函数
mkpgb = function(bar, percent, callback){  
    this.bar = bar;
    this.percent = percent;
    this.callback = callback;
    this.locked = false;
    this.init();  
};

mkpgb.prototype = {
    // 进度条初始化
    init : function(){  
        var mk = this,mdown = false;
        // 加载进度条html元素
        $(mk.bar).html('<div class="mkpgb-bar"></div><div class="mkpgb-cur"></div><div class="mkpgb-dot"></div>');
        // 获取偏移量
        mk.minLength = $(mk.bar).offset().left; 
        mk.maxLength = $(mk.bar).width() + mk.minLength;
        // 窗口大小改变偏移量重置
        $(window).resize(function(){
            mk.minLength = $(mk.bar).offset().left; 
            mk.maxLength = $(mk.bar).width() + mk.minLength;
        });
        // 监听小点的鼠标按下事件
        $(mk.bar + " .mkpgb-dot").mousedown(function(e){
            e.preventDefault();    // 取消原有事件的默认动作
        });
        // 监听进度条整体的鼠标按下事件
        $(mk.bar).mousedown(function(e){
            if(!mk.locked) mdown = true;
            barMove(e);
        });
        // 监听鼠标移动事件，用于拖动
        $("html").mousemove(function(e){
            barMove(e);
        });
        // 监听鼠标弹起事件，用于释放拖动
        $("html").mouseup(function(e){
            mdown = false;
        });
        
        function barMove(e) {
            if(!mdown) return;
            var percent = 0;
            if(e.clientX < mk.minLength){ 
                percent = 0; 
            }else if(e.clientX > mk.maxLength){ 
                percent = 1;
            }else{  
                percent = (e.clientX - mk.minLength) / (mk.maxLength - mk.minLength);
            }
            mk.callback(percent);
            mk.goto(percent);
            return true;
        }
        
        mk.goto(mk.percent);
        
        return true;
    },
    // 跳转至某处
    goto : function(percent) {
        if(percent > 1) percent = 1;
        if(percent < 0) percent = 0;
        this.percent = percent;
        $(this.bar + " .mkpgb-dot").css("left", (percent*100) +"%"); 
        $(this.bar + " .mkpgb-cur").css("width", (percent*100)+"%");
        return true;
    },
    // 锁定进度条
    lock : function(islock) {
        if(islock) {
            this.locked = true;
            $(this.bar).addClass("mkpgb-locked");
        } else {
            this.locked = false;
            $(this.bar).removeClass("mkpgb-locked");
        }
        return true;
    }
};  


/*2019-03-21新增评论功能*/
$(document).on("click",".close a,.new-function,.logo-163",function(){
     $('.comment-163').toggleClass("show");
     $('.close a').toggleClass("fa-angle-down");
});


/*Ajax获取评论*/
function comments(music_id,offset){
    var sid = music_id;
    var limit="20";
    var json ={"sid":sid,"offset":offset,"limit":limit};
    var pages = $.Deferred();
    $.ajax({ 
        url:"http://api-music.ytxmgy.com/wyy/servlet/CommentController",//请求的url地址
        dataType:"json",//返回的格式为json 
        async:true,//请求是否异步，默认true异步，这是ajax的特性 
        data:json,//参数值 
        type:"GET",//请求的方式 
        beforeSend:function(){
        
        },//请求前的处理 
        success:function(req){
            var code=req.code;
            if(code==200){
                var z=req; //赋值
                var hotComments =z.hotComments;//热评
                var comments=z.comments;//评论
                var total = z.total; //评论总数
                page = Math.ceil(z.total / limit);//获取评论总页数 （向上取整）
                $(".go-comment a,.music-name-play,.music-163").attr("href","https://music.163.com/#/song?id="+music_id);
                pages.resolve(page);
                if(hotComments){
                    //alert("you");
                    var hot_num = hotComments.length;//热门评论数
                    var sth = getConnemt(hotComments);
                    $(".hot-comment-all").html(sth);
                    var num = comments.length;//默认获取用户评论数
                    var sthNew =getConnemt(comments);
                    $(".comment-author-all").html(sthNew);
                    $(".new").html(total);//显示总评论数
                    $(".hot-num").text('('+hot_num+')');
                    $(".num").text('('+total+')');
                }else{
                    //alert("wu");
                    var num = comments.length;//默认获取用户评论数
                    var sthNew =getConnemt(comments);
                    $(".comment-author-all").html(sthNew);  
                }
            }
            /*启动分页*/ 
        },//请求成功的处理 
        complete:function(req){
            
        },//请求完成的处理 
        error:function(){
            
        }//请求出错的处理 
    });

    return pages.promise();//总页数
}


/*评论函数*/
function getConnemt(comments) {
    var num = comments.length;
    var html = '';
    if(num == 0){
        layer.msg('不要执着的翻下去了,用喜欢的方式过这辈子吧！');
    }//没有评论的提示
    for (var a = 0; a < num; a++) {
        var userId = comments[a].user.userId //获取用户ID
        var user_name = comments[a].user.nickname; //获取用户名
        var user_avatar = comments[a].user.avatarUrl; //获取用户头像
        var content = comments[a].content; //获取评论内容
        var time = timeStamp(comments[a].time); //获取评论时间
        var like = comments[a].likedCount; //评论获赞
        var alt = /\@(.+?)\s+/g; //@用户 匹配正则
        var result;
        while ((result = alt.exec(content)) != null) {
            content = content.replace(alt,
            function(a, b) {
                var codeURI = encodeURI(result[1]);
                return "<a class='links' href='https://music.163.com/#/user/home?nickname=" + codeURI + "' target='_blank'>@" + result[1] + "</a>";
            });
        } //替换@链接
        var emoji = /\[.+?\]/g; //正则匹配到emoji
        content = content.replace(emoji,function(a, b) {
            if(face[a]){
                return "<img src='./face/" + face[a] + "' alt="+a+">";
            }else{
                return a;
            }
            
        }); //输出表情
        var reply = comments[a].beReplied.length; //获得评论回复数量
        if (reply > 0) {
            for (r = 0; r < reply; r++) {
                var replys = comments[a].beReplied[r]; //获得评论回复
                var re_content = replys.content; //评论内容
                var re_userid = replys.user.userId; //用户ID
                var re_name = replys.user.nickname; //用户名
                var re_avatar = replys.user.avatarUrl; //用户头像
            }
            html += '<div class="comment-author">' + '<div class="avatar">' + '<img src=' + user_avatar + '>' + '</div><!-- 评论头像 -->' + '<div class="content">' + '<a class="user" href="https://music.163.com/#/user/home?id=' + userId + '" target="_blank">' + user_name + '</a><!-- 用户名 -->' + '<p>' + content + '</p>' + '<div class="comment-reply"><!-- 其他用户回复 -->' + '<div class="avatar"><img src=' + re_avatar + '></div><!-- 评论头像 -->' + '<div class="content">' + '<a class="user" href="https://music.163.com/#/user/home?id=' + re_userid + '" target="_blank">' + re_name + ' ：</a><!-- 用户名 -->' + '<p>' + re_content + '</p>' + '</div>' + '</div>' + '<span class="tools">' + '<span class="time">' + time + '</span>' + '<span class="like" title="'+user_name+" 的评论获得了 "+like+' 个赞"><i class="fa fa-thumbs-o-up"></i>(' + like + ')</span>' + '</span>' + '</div>' + '</div>';
        } else {
            html += '<div class="comment-author">' + '<div class="avatar">' + '<img src=' + user_avatar + '>' + '</div><!-- 评论头像 -->' + '<div class="content">' + '<a class="user" href="https://music.163.com/#/user/home?id=' + userId + '" target="_blank">' + user_name + '</a><!-- 用户名 -->' + '<p>' + content + '</p>' + '<span class="tools">' + '<span class="time">' + time + '</span>' + '<span class="like" title="'+user_name+" 的评论获得了 "+like+' 个赞"><i class="fa fa-thumbs-o-up"></i>(' + like + ')</span>' + '</span>' + '</div>' + '</div>';
        }
    } //评论
    return html;
}

/*时间转化*/
function timeStamp(StatusMinute) {
    var current_time = new Date(); //系统当前时间
    var get_time = current_time - StatusMinute; //显示时间差
    var days = Math.floor(get_time / (24 * 3600 * 1000)) //计算出相差天数
    var leave1 = get_time % (24 * 3600 * 1000) //计算出小时数
    var hours = Math.floor(leave1 / (3600 * 1000)) //计算天数后剩余的毫秒数
    var leave2 = leave1 % (3600 * 1000) //计算相差分钟数      
    var minutes = Math.floor(leave2 / (60 * 1000)) //计算小时数后剩余的毫秒数
    var leave3 = leave2 % (60 * 1000) //计算相差秒数 
    var seconds = Math.round(leave3 / 1000) //计算分钟数后剩余的毫秒数
    if (days == 0 & hours < 24) {
        StatusMinute = hours + "小时前";
    }
    if (days == 0 & hours == 0 & minutes < 60) {
        StatusMinute = minutes + "分钟前";
    }
    if (days == 0 & hours == 0 & minutes == 0 & seconds < 60) {
        StatusMinute = seconds + "秒前";
    }
    if (days == 0 & hours == 0 & minutes == 0 & seconds == 5) {
        StatusMinute = "刚刚";
    }
    if (days > 1 & days < 2) {
        hours = hours < 10 ? ('0' + hours) : hours;
        minutes = minutes < 10 ? ('0' + minutes) : minutes;
        StatusMinute = "昨天" + hours + ":" + minutes;
    }
    if (days > 2) {
        StatusMinute = formatDateTime(StatusMinute);
    }
    return StatusMinute;
    //alert(" 相差 "+days+"天 "+hours+"小时 "+minutes+" 分钟"+seconds+" 秒");  
}

//转换时间戳为年月日
function formatDateTime(inputTime){
    let date = new Date(inputTime);
    let y = date.getFullYear();
    let m = date.getMonth() + 1;
    m = m < 10 ? ('0' + m) : m;
    let d = date.getDate();
    d = d < 10 ? ('0' + d) : d;
    let h = date.getHours();
    h = h < 10 ? ('0' + h) : h;
    let minute = date.getMinutes();
    let second = date.getSeconds();
    minute = minute < 10 ? ('0' + minute) : minute;
    second = second < 10 ? ('0' + second) : second;
    return y + '年' + m + '月' + d + '日' + h + ':' + minute + ':' + second;
}

/*分页*/
(function($){
    var ms = {
        init: function(obj, args) {
            return (function() {
                ms.fillHtml(obj, args);
                obj.off("click"); //这边解绑一下
                ms.bindEvent(obj, args);
            })();
        },
        //填充html
        fillHtml:function(obj,args){
            return (function(){
                obj.empty();
                //上一页
                if(args.current > 1){
                    obj.append('<a href="javascript:;" class="prevPage">上一页</a>');
                }else{
                    obj.remove('.prevPage');
                    obj.append('<span class="disabled">上一页</span>');
                }
                //中间页码
                if(args.current != 1 && args.current >= 4 && args.pageCount != 4){
                    obj.append('<a href="javascript:;" class="tcdNumber">'+1+'</a>');
                }
                if(args.current-2 > 2 && args.current <= args.pageCount && args.pageCount > 5){
                    obj.append('<span>...</span>');
                }
                var start = args.current -2,end = args.current+2;
                if((start > 1 && args.current < 4)||args.current == 1){
                    end++;
                }
                if(args.current > args.pageCount-4 && args.current >= args.pageCount){
                    start--;
                }
                for (;start <= end; start++) {
                    if(start <= args.pageCount && start >= 1){
                        if(start != args.current){
                            obj.append('<a href="javascript:;" class="tcdNumber">'+ start +'</a>');
                        }else{
                            obj.append('<span class="current">'+ start +'</span>');
                        }
                    }
                }
                if(args.current + 2 < args.pageCount - 1 && args.current >= 1 && args.pageCount > 5){
                    obj.append('<span>...</span>');
                }
                if(args.current != args.pageCount && args.current < args.pageCount -2  && args.pageCount != 4){
                    obj.append('<a href="javascript:;" class="tcdNumber">'+args.pageCount+'</a>');
                }
                //下一页
                if(args.current < args.pageCount){
                    obj.append('<a href="javascript:;" class="nextPage">下一页</a>');
                }else{
                    obj.remove('.nextPage');
                    obj.append('<span class="disabled">下一页</span>');
                }
            })();
        },
        //绑定事件
        bindEvent:function(obj,args){
            return (function(){
                obj.on("click","a.tcdNumber",function(){
                    var current = parseInt($(this).text());
                    ms.fillHtml(obj,{"current":current,"pageCount":args.pageCount});
                    if(typeof(args.backFn)=="function"){
                        args.backFn(current);
                    }
                });
                //上一页
                obj.on("click","a.prevPage",function(){
                    var current = parseInt(obj.children("span.current").text());
                    ms.fillHtml(obj,{"current":current-1,"pageCount":args.pageCount});
                    if(typeof(args.backFn)=="function"){
                        args.backFn(current-1);
                    }
                });
                //下一页
                obj.on("click","a.nextPage",function(){
                    var current = parseInt(obj.children("span.current").text());
                    ms.fillHtml(obj,{"current":current+1,"pageCount":args.pageCount});
                    if(typeof(args.backFn)=="function"){
                        args.backFn(current+1);
                    }
                });
            })();
        }
    }
    $.fn.createPage = function(options){
        var args = $.extend({
            pageCount : 15,
            current : 1,
            backFn : function(){}
        },options);
        ms.init(this,args);
    }
})(jQuery);


/*评论与显示*/
$(document).on("click",".hot-comment h3,.comments h3",function(){
	$(this).next().slideToggle(600);
  	$(this).find("i").toggleClass("fa-chevron-down");
});


