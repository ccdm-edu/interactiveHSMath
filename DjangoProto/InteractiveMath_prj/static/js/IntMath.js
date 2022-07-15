'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function () {
	// tooltips are disabled by default, need to enable them all for bootstrap styling
    $('[data-toggle="tooltip"]').tooltip();
    
    // want the active topic selected to have a class active so it can look different to user
	$('ul.nav.flex-column > li.nav-item > a').on('click', function(e) {
		//console.log(" we hit an item in subtopic: id= " + this.getAttribute('id') + " href " +this.getAttribute('href'));
		// remove active from all li elements
		$('ul.nav.flex-column > li')
                    .removeClass('active');
        // can't add active to any DOM element since when new page loads, it will be crushed by reloading of subtopics.html
        // save "this" and when page loads, reset it to active
        sessionStorage.setItem("activePage", this.getAttribute('href'));
	});
	
	$( document ).ready(function() {
    	// now that new page is loaded, and subtopics has reloaded from scratch along with the page..
    	// recall whats active and change appearance
    	let firstDomEl = $('ul.nav.flex-column > li.nav-item:first > a');
    	if (firstDomEl.length > 0) {
    		// we have subtopics to work with, else, punt all this code
	    	let currPage = sessionStorage.getItem("activePage");
	    	if (currPage === null) {
	    		// we are entering this subtopic list for the first time, no old stale values
	    		// pick first item in list
	    		currPage = firstDomEl.attr('href');
	    		//console.log(" hitting this subtopic list for first time");
	    	} else {
		    	// check to see that the stored value is still part of this set of subtopics
		    	let expectedDomEl = $('ul.nav.flex-column > li.nav-item > a[href="' + currPage + '"')
		    	if (expectedDomEl.length == 0) {
		    		// user has changed topics and the old subtopic is now obsolete, pick first DOM element
		    		currPage = firstDomEl.attr('href');
		    		//console.log("have leftover subtopic that is obsolete");
		    		// clear out obsolete topic
		    		sessionStorage.removeItem("activePage");
		    	}
	    	}
	    	//console.log(" we hit an item in subtopic: active = " + currPage);
	    	// now that we have currently active page subtopic, set class to active so bootstrap will color
	    	// it differently
	    	$('ul.nav.flex-column > li.nav-item > a[href="' + currPage + '"').addClass('active');
    	} else {
    		//console.log("nothing here for subtopics");
    		// wait till we get to a page with subtopics.  For now, clear out old stuff
    		sessionStorage.removeItem("activePage");
    	}
	});
});