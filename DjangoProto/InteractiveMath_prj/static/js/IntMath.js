'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
// THIS js file covers all that is common to whole site
$(function () {
    
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
		return url1_page === url2_page;
	}
	// -- when user uses either back or next button within a topic, subpages to left should reflect whats active
	function changeHighlightedLeftMenu(buttonSelPage) {
		// get rid of the old "active" page, there may not be anything stored under sessionStorage yet so just search and remove
		// buttonSelPage may not be in the same URL form as the anchor for li.nav-item--find its equivalent
		console.log("current URL is " + $(location).attr("href"));
		let equivURL = "";
		// Updated layout targets to reflect framework-free navigation structure
		$('ul.nav.flex-column > li.nav-item > a').each(function() {
  			if ($(this).hasClass('active')) {
				$(this).removeClass('active');  
				console.log("removed active from list item " + $(this).text());
			};
			if (isSamePage($(this).attr('href'), buttonSelPage)){
				equivURL = $(this).attr('href');
			}
		});
		if (equivURL != "") {
			sessionStorage.setItem("activePage", equivURL);
			let searchItem = 'ul.nav.flex-column > li.nav-item > a[href="' + equivURL + '"]';
			let $currActiveListItemATag = $(searchItem);
			$currActiveListItemATag.addClass('active')
		} else {
			console.log('Cannot find desired URL in left menu list. Desired = ' + buttonSelPage);
		}
	}

    //*************** 
    // Make the highlighted page for upper menu bar match what is active
    //***************	
	// on upper menu bar, where its topics, not the subtopics over in list to left, we want selected items to appear different
	$('#upperNavbarCollapse > ul.navbar-nav > li.nav-item > a.nav-link').on('click', function() {
		$(this).css('font-weight', 'bold');
		// can't change font on any DOM element since when new page loads, it will be crushed by reloading of subtopics.html
        // save "this" and when page loads, reset it to active
        sessionStorage.setItem("activeTopBarIndex", $('#upperNavbarCollapse > ul.navbar-nav > li.nav-item').index($(this).parent()));
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
    	let $currTopItem = $('#upperNavbarCollapse > ul.navbar-nav > li.nav-item > a').eq(parseInt(currTopIndex));
    	$currTopItem.css('font-weight', 'bold');
    	
    	// ALLOW COOKIE SELECTION by user
    	// allow user to change cookie selection for all pages and, eventually, save users cookie selection only if they choose yes
    	// Right now, we don't use cookies.  Save in localStorage so its avail between pages and not sent back to server.
    	const COOKIE_STAT_MSG = "allowCookie"
    	let cookieStat = ifLocalStorageAvail(COOKIE_STAT_MSG, "get");
    	if (cookieStat === null || cookieStat == "false") {
			$("#cookieIndicatorNo").css('display','inline-block');
			$("#cookieIndicatorYes").css('display','none');	
		} else {
			$("#cookieIndicatorYes").css('display','inline-block');
			$("#cookieIndicatorNo").css('display','none');		
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
    // Advanced popup window that is draggable (Vanilla JS replacing jQuery UI & jQuery Touch)
    // Avoid bootstrap which treats modals as interruptors to user behavior rather than instructional aids
	// Advanced popup window that is draggable (Native HTML Dialog System)
	
	$(document).ready(function() {
	    const myDialog = document.getElementById('AdvancedTopics');
	    
        // Native Hamburger Collapse Menu Event Listener
	    const toggler = document.querySelector(".navbar-toggler");
	    const collapseMenu = document.getElementById("upperNavbarCollapse");
	    if (toggler && collapseMenu) {
	        toggler.addEventListener("click", function () {
	            collapseMenu.classList.toggle("show");
	        });
	    }
	    
	    // Modeless Open Action: Allows background visibility while active
	    $(document).on('click', '#AdvancedTopicLink', function(e) {
	        e.preventDefault();
	        if (myDialog) {
	            myDialog.style.left = '';
	            myDialog.style.top = '';
	            myDialog.style.margin = 'auto'; // FIX: Restores default browser layout center point upon open
	            
	            const toDoContent = $(".AdvTopic_ToDo").html();
	            const explnContent = $(".AdvTopic_Expln").html();
	            
	            if (toDoContent) {
	                $("#AdvancedTopics #tab011 > p").html(toDoContent);
	            }
	            if (explnContent) {
	                $("#AdvancedTopics #tab021 > p").html(explnContent);
	            }
	            
	            myDialog.show(); // Opened modelessly as requested for instructional design
	        }
	    });
	    
	    // Delegated handler: Intercepts clicks on your close buttons anywhere on the page
	    $(document).on('click', '.dialog-close-trigger', function(e) {
	        e.preventDefault();
	        if (myDialog) {
	            myDialog.close();
	        }
	    });
	    
	    // Cleaned up Tab-Click Selector
	    $(document).on('click', '#AdvancedTopics .tabs', function() {    
	        $(".tabs").removeClass("active").css("border-bottom", "none");
	        $(".tabs h6").css({"font-weight": "normal", "color": "#6c757d"}); // Native muted inline colors   
	        
	        $(this).addClass("active").css("border-bottom", "2px solid #007bff");
	        $(this).children("h6").css({"font-weight": "bold", "color": "#212529"});
	    
	        let next_fs = "#" + $(this).attr('id') + "1";
	        $("fieldset").removeClass("show");
	        $(next_fs).addClass("show");
	    });
	
	    // =========================================================================
	    // 2. DRAG AND DROP HANDLER FOR NATIVE DIALOG
	    // =========================================================================
	    if (myDialog) {
	        let startX = 0, startY = 0;
	        let initialLeft = 0, initialTop = 0;
	    
	        myDialog.addEventListener('pointerdown', function(e) {
	            if (e.target.closest('button, input, select, textarea, .tabs, .close, .dialog-close-trigger')) return;
	            e.preventDefault();
	    
	    		// Clears out browser centering rules so inline tracking moves perfectly
            	myDialog.style.margin = '0'; 
            	
	            const rect = myDialog.getBoundingClientRect();
	            initialLeft = rect.left;
	            initialTop = rect.top;
	    
	            startX = e.clientX;
	            startY = e.clientY;
	    
	            function drag(e) {
	                const deltaX = e.clientX - startX;
	                const deltaY = e.clientY - startY;
	                myDialog.style.left = (initialLeft + deltaX) + 'px';
	                myDialog.style.top = (initialTop + deltaY) + 'px';
	            }
	    
	            function stopDragging() {
	                document.removeEventListener('pointermove', drag);
	                document.removeEventListener('pointerup', stopDragging);
	            }
	    
	            document.addEventListener('pointermove', drag);
	            document.addEventListener('pointerup', stopDragging);
	        });
	    }
	
	    // Initialize tooltips cleanly
	    // Modified framework target properties into stable standard HTML tooltips
	    $("#advModal").attr("title", "Drag me around from anywhere inside the window.");
	    $("#advModalClose").attr("title", "Click to close");
	});

});