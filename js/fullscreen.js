//控制全屏
function enterfullscreen() { //进入全屏
    $("#fullscreen").removeClass("fa-expand-arrows-alt").addClass("fa-desktop");
    var docElm = document.documentElement;
    //W3C
    if(docElm.requestFullscreen) {
        docElm.requestFullscreen();
    }
    //FireFox
    else if(docElm.mozRequestFullScreen) {
        docElm.mozRequestFullScreen();
    }
    //Chrome等
    else if(docElm.webkitRequestFullScreen) {
        docElm.webkitRequestFullScreen();
    }
    //IE11
    else if(elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
    }
}

function exitfullscreen() { //退出全屏
   // $("#fullscreen").html("切换全屏");
    $("#fullscreen").removeClass("fa-desktop").addClass("fa-expand-arrows-alt");
    if(document.exitFullscreen) {
        document.exitFullscreen();
    } else if(document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
    } else if(document.webkitCancelFullScreen) {
        document.webkitCancelFullScreen();
    } else if(document.msExitFullscreen) {
        document.msExitFullscreen();
    }
}

let b = false;
$('#fullscreen').on('click', function() {
    b = !b;
    b ? enterfullscreen() : exitfullscreen();
})