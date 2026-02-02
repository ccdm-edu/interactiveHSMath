'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
// THIS js file covers all that is common to whole site
$(function () {
		    
	// tooltips are disabled by default, need to enable them all for bootstrap styling
    $('[data-toggle="tooltip"]').tooltip();
    
    //*************** 
    // Make the highlighted page for left menu match what is active
    //***************

	function isSamePage(url1, url2){
		//this is a kloodge, need to use one style of URL, currently use some hardcoded values from populate*.py (relative URLs) and 
		//Django has a different absolute style from urls.py
		
		//One way two urls can match, the letters after last slash match indicating same page--I realize
		//that in general, this is bad practice but site is so small right now, all pages at one common level
		let url1_split = url1.split('/');
		let url2_split = url2.split('/');
		let url1_page = url1_split[url1_split.length - 1];
		if (url1_page === '') {
			//url1 ended in a slash and so last char after slash is null, take before last slash
			url1_page = url1_split[url1_split.length - 2];
		}
		let url2_page = url2_split[url2_split.length - 1];
		if (url2_page ==='') {
			//url1 ended in a slash and so last char after slash is null, take before last slash
			url2_page = url2_split[url2_split.length - 2];
		}	
		if 	( url1_page === url2_page ) {
			return true;
		} else {
			return false;
		}
	}
	// -- when user uses either back or next button within a topic, subpages to left should reflect whats active
	function changeHighlightedLeftMenu(buttonSelPage) {
		// get rid of the old "active" page, there may not be anything stored under sessionStorage yet so just search and remove
		// buttonSelPage may not be in the same URL form as the anchor for li.nav-item--find its equivalent
		console.log("current URL is " + $(location).attr("href"));
		let equivURL = "";
		$('ul.nav.flex-column > li.nav-item > a').each(function() {
			// make all members of list inactive
  			if ($(this).hasClass('active')) {
				$(this).removeClass('active');  
				console.log("removed active from list item " + $(this).text());
			};
			// desired URL may or may not exactly match string of item on list but it may be the same page
			// get the alternate form for desired URL that does match
			if (isSamePage($(this).attr('href'), buttonSelPage)){
				equivURL = $(this).attr('href');
			}
		});
		if (equivURL != "") {
			// then it found the desired URL in the list
			// if page hasnt changed yet, setting session storage will update properly	
			sessionStorage.setItem("activePage", equivURL);
			// if page has already changed, update here as active
			let searchItem = 'ul.nav.flex-column > li.nav-item > a[href="' + equivURL + '"]';
			let $currActiveListItemATag = $(searchItem);
			$currActiveListItemATag.addClass('active')
		} else {
			// not a catastrophic error but an annoyance to user, need to fix sw bug
			console.log('Cannot find desired URL in list of pages on left menu. Desired = ' + buttonSelPage);
		}
	}

    //*************** 
    // Make the highlighted page for upper menu bar match what is active
    //***************	
	// on upper menu bar, where its topics, not the subtopics over in list to left, we want selected items to appear different
	$('div#upperNavbarCollapse.collapse.navbar-collapse > ul.navbar-nav > li.nav-item > a.nav-link').on('click', function() {
		$(this).css('font-weight', 'bold');
		// can't change font on any DOM element since when new page loads, it will be crushed by reloading of subtopics.html
        // save "this" and when page loads, reset it to active
        sessionStorage.setItem("activeTopBarIndex", $('div#upperNavbarCollapse.collapse.navbar-collapse > ul.navbar-nav > li.nav-item').index($(this).parent()));
        // clear out obsolete topic, in case there is one, we want to go to first element of the subtopics
		sessionStorage.removeItem("activePage");
	});
	
	$( document ).ready(function() {
		// when we change pages, ensure the correct left menu item is highlighted, no matter how we got there
		let currentPageURL = $(location).attr('href');
		changeHighlightedLeftMenu(currentPageURL);
		    	
    	// now that a new page has loaded, highlight which top menu item we are on
    	// recall whats active and change appearance
     	let currTopIndex = sessionStorage.getItem("activeTopBarIndex");
    	let $currTopItem = $('div#upperNavbarCollapse.collapse.navbar-collapse > ul.navbar-nav > li.nav-item > a').eq(parseInt(currTopIndex));
    	$currTopItem.css('font-weight', 'bold');
    	
    	// ALLOW COOKIE SELECTION by user
    	// allow user to change cookie selection for all pages and, eventually, save users cookie selection only if they choose yes
    	// Right now, we don't use cookies.  Save in localStorage so its avail between pages and not sent back to server.
    	const COOKIE_STAT_MSG = "allowCookie"
    	let cookieStat = ifLocalStorageAvail(COOKIE_STAT_MSG, "get");
    	if (cookieStat === null) {
			// user has not chosen a cookie choice
			$("#cookieIndicatorNo").css('display','inline-block');
			$("#cookieIndicatorYes").css('display','none');	
		} else {
			if (cookieStat == "false")  {
				// user has elected no
				$("#cookieIndicatorNo").css('display','inline-block');
				$("#cookieIndicatorYes").css('display','none');	
			} else {
				//user last selected yes to allow cookies
				$("#cookieIndicatorYes").css('display','inline-block');
				$("#cookieIndicatorNo").css('display','none');		
			}
		}
		// Allow user to change their mind on cookies and save it for their entire session (locally on their machine)
    	$("#yesCookies").on('click', function(){
			// save something to remember cookies are yes (don't use cookies right now)
			$("#cookieIndicatorYes").css('display','inline-block');
			$("#cookieIndicatorNo").css('display','none');
			ifLocalStorageAvail(COOKIE_STAT_MSG, "set", "true");
			// legally can store a cookie telling server "allow cookies"
			// At this time, the site does not use "extra" cookies so this is just a placeholder if that changes
		});
		$("#noCookies").on('click', function(){
			// delete the image that says cookies ok
			$("#cookieIndicatorNo").css('display','inline-block');
			$("#cookieIndicatorYes").css('display','none');
			ifLocalStorageAvail(COOKIE_STAT_MSG, "set", "false");
			// legally can store a cookie telling server "no cookies"  Google already does cookies on this site
		});    	
	});
		
	//***********************************
 	// Advanced popup window that is draggable and has expln/todo stuff
 	
    $("#AdvancedTopics").draggable({
    	//need to mousedown inside window to move it, else mousing down near the window will also move it
    	handle: ".modal-content"
    })
    .touch();  
    
    // if touch device, jquery ui doesn't handle it yet so use "bandaid" that allows click/move on touch devices--need to tell
    // touch user what they can do
    function is_touch_enabled() {
		return ( 'ontouchstart' in window ) || 
		( navigator.maxTouchPoints > 0 ) || 
		( navigator.msMaxTouchPoints > 0 );
	};
	if (is_touch_enabled()) {
		// the jquery.touch.min.js solution is suboptimal but at least we can move the window for touch devices--need to tell user
		// they now have to double "click" to close
		$("#advModal").attr("data-original-title", "Select and touch to move or mouse drag.");
		$("#advModalClose").attr("data-original-title", "Double touch to close")
	} else {
		// using mouse, jquery ui draggable will work ok.  Have to grab it on top label to move it
		// a bit flaky with jquery.touch.min.js in there
		$("#advModal").attr("data-original-title", "drag me around as needed");
	}

        
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