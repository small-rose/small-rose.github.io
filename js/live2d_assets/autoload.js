// build time:Mon Jun 29 2020 23:10:15 GMT+0800 (中国标准时间)
try{$("<link>").attr({href:"assets/waifu.min.css?v=1.4.2",rel:"stylesheet",type:"text/css"}).appendTo("head");$("body").append('<div class="waifu"><div class="waifu-tips"></div><canvas id="live2d" class="live2d"></canvas><div class="waifu-tool"><span class="fui-home"></span> <span class="fui-chat"></span> <span class="fui-eye"></span> <span class="fui-user"></span> <span class="fui-photo"></span> <span class="fui-info-circle"></span> <span class="fui-cross"></span></div></div>');$.ajax({url:"assets/waifu-tips.min.js?v=1.4.2",dataType:"script",cache:true,success:function(){$.ajax({url:"assets/live2d.min.js?v=1.0.5",dataType:"script",cache:true,success:function(){live2d_settings["hitokotoAPI"]="hitokoto.cn";live2d_settings["modelId"]=5;live2d_settings["modelTexturesId"]=1;live2d_settings["modelStorage"]=false;initModel("assets/waifu-tips.json")}})}})}catch(err){console.log("[Error] JQuery is not defined.")}
//rebuild by neat 