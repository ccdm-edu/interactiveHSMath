'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {

	// bootstrap jquery django modal library requires an element click to start off the mnodal window so we need to fake that here
	// button is invisible and clicked by js here to start modal window coming up
	// BUT, you have to wait till all the js has been loaded first
	// WHAT a stinking kloodge-monster!!  need to redo this without this library...
	
	$.getScript("../../../static/js/jquery-bootstrap-modal-forms-min.js", function() {
		console.log(" about to click the button");
		$('#kloodgeToGetBotModal').trigger('click');
	});
	
	//need to not have every css load on every page, when that is fixed, can get rid of this
	$('a[href="#AdvancedTopics"]').css('display', 'none');
	$('#startAutoDemo').css('display', 'none');

})