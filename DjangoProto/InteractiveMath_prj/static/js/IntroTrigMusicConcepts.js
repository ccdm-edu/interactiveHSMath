'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {
	//since this is on template and dont need it here...
	$('a[href="#AdvancedTopics"]').css('display', 'none');
	
	// only execute if all is loaded
	//if Next  button hit (in base template), set it up to go to intro page
	$("#GoToNextPage").wrap('<a href="../MusicSineIntro"></a>');

	
	// if either review button hit or audio is complete, clear out current elements and put in review terms 
	// and movies
})