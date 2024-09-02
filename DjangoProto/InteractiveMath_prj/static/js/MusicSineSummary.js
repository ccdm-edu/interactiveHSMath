'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {
	
	//need to not have every css load on every page, when that is fixed, can get rid of this
	$('a[href="#AdvancedTopics"]').css('display', 'none');
	
	//Dont want a next button on this page so kill it here.  Once at end of a topic, time to pick a new topic and that can't be my choice
    $("#GoToNextPage").css('display', 'none');
    $("#GoToPreviousPage").wrap('<a href="../MusicNotesTrig"></a>');

})