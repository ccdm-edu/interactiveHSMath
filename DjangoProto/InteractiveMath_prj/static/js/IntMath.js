'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
// THIS js file covers all that is common to whole site
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
        sessionStorage.setItem("activePage", $(this).attr('href'));
        
	});
	
	// on upper menu bar, want selected items to appear different
	$('div#upperNavbarCollapse.collapse.navbar-collapse > ul.navbar-nav.mr-auto > li.nav-item > a.nav-link').on('click', function(e) {
		$(this).css('font-weight', 'bold');
		// can't change font on any DOM element since when new page loads, it will be crushed by reloading of subtopics.html
        // save "this" and when page loads, reset it to active
        sessionStorage.setItem("activeTopBarIndex", $('div#upperNavbarCollapse.collapse.navbar-collapse > ul.navbar-nav.mr-auto > li.nav-item').index($(this).parent()));
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
	    	} else {
		    	// check to see that the stored value is still part of this set of subtopics
		    	let expectedDomEl = $('ul.nav.flex-column > li.nav-item > a[href="' + currPage + '"]');
		    	if (expectedDomEl.length == 0) {
		    		// user has changed topics and the old subtopic is now obsolete, pick first DOM element
		    		currPage = firstDomEl.attr('href');
		    		// clear out obsolete topic
		    		sessionStorage.removeItem("activePage");
		    	}
	    	}
	    	// now that we have currently active page subtopic, set class to active so bootstrap will color
	    	// it differently
	    	$('ul.nav.flex-column > li.nav-item > a[href="' + currPage + '"').addClass('active');
    	} else {
    		// wait till we get to a page with subtopics.  For now, clear out old stuff
    		sessionStorage.removeItem("activePage");
    	}
    	
    	// now that a new page has loaded, highlight which top menu item we are on
    	// recall whats active and change appearance
     	let currTopIndex = sessionStorage.getItem("activeTopBarIndex");
    	let $currTopItem = $('div#upperNavbarCollapse.collapse.navbar-collapse > ul.navbar-nav.mr-auto > li.nav-item > a').eq(parseInt(currTopIndex));
    	$currTopItem.css('font-weight', 'bold');
	});
		
	//***********************************
 	// Javascript for advanced popup window that is draggable and has expln/todo stuff
 	
    $("#AdvancedTopics").draggable({
    	//need to mousedown inside window to move it, else mousing down near the window will also move it
    	handle: ".modal-content"
    });  
    
	$("#AdvancedTopics>.modal-dialog>.modal-content>.modal-header>.tabs").click(function(){    
	    $(".tabs").removeClass("active");
	    $(".tabs h6").removeClass("font-weight-bold");    
	    $(".tabs h6").addClass("text-muted");    
	    $(this).children("h6").removeClass("text-muted");
	    $(this).children("h6").addClass("font-weight-bold");
	    $(this).addClass("active");
	
	    let current_fs = $(".active");
		// create ID number of new fieldset
	    let next_fs = $(this).attr('id');
	    next_fs = "#" + next_fs + "1";
		// unshow all fieldsets and show the new one
	    $("fieldset").removeClass("show");
	    $(next_fs).addClass("show");
	});   
	
	// Change text on both tabs of advanced text drop down to match the stuff thats hidden in html under class 
	$("#AdvancedTopics > .modal-dialog > .modal-content > .modal-body > #tab011 > p").html($(".AdvTopic_ToDo").html());
	$("#AdvancedTopics > .modal-dialog > .modal-content > .modal-body > #tab021 > p").html($(".AdvTopic_Expln").html());
	
});