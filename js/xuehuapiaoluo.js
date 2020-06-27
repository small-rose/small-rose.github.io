/*æ ·å¼ä¸€*/
//èƒŒæ™¯é›ªèŠ±é£˜è½ç‰¹æ•ˆ
(function($){
	$.fn.snow = function(options){
	var $flake = $('<div id="snowbox" />').css({'position': 'absolute','z-index':'9999', 'top': '-50px'}).html('&#10052;'),
	documentHeight 	= $(document).height(),
	documentWidth	= $(document).width(),
	defaults = {
		minSize		: 10,
		maxSize		: 20,
		newOn		: 1000,
		flakeColor	: "#AFDAEF" /* æ­¤å¤„å¯ä»¥å®šä¹‰é›ªèŠ±é¢œè‰²ï¼Œè‹¥è¦ç™½è‰²å¯ä»¥æ”¹ä¸º#FFFFFF */
	},
	options	= $.extend({}, defaults, options);
	var interval= setInterval( function(){
	var startPositionLeft = Math.random() * documentWidth - 100,
	startOpacity = 0.5 + Math.random(),
	sizeFlake = options.minSize + Math.random() * options.maxSize,
	endPositionTop = documentHeight - 200,
	endPositionLeft = startPositionLeft - 500 + Math.random() * 500,
	durationFall = documentHeight * 10 + Math.random() * 5000;
	$flake.clone().appendTo('body').css({
		left: startPositionLeft,
		opacity: startOpacity,
		'font-size': sizeFlake,
		color: options.flakeColor
	}).animate({
		top: endPositionTop,
		left: endPositionLeft,
		opacity: 0.2
	},durationFall,'linear',function(){
		$(this).remove()
	});
	}, options.newOn);
    };
})(jQuery);
$(function(){
    $.fn.snow({ 
	    minSize: 5, /* å®šä¹‰é›ªèŠ±æœ€å°å°ºå¯¸ */
	    maxSize: 50,/* å®šä¹‰é›ªèŠ±æœ€å¤§å°ºå¯¸ */
	    newOn: 500  /* å®šä¹‰å¯†é›†ç¨‹åº¦ï¼Œæ•°å­—è¶Šå°è¶Šå¯†é›† */
    });
});