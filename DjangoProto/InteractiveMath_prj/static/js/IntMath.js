/* ============================================================================
 * COMPONENT: Client side Javascript
 * FILE:      IntMath.js
 * ============================================================================
 * 
 * DESCRIPTION:
 * This file handles the activity of all that is common to all pages.  For example,
 * highlighting left menu when on that page, cookie indication, advanced popup window
 * drag/drop ability.
 * 
 * DEPENDENCIES:
 * - All static files, such as this js, are served over cloud service such as Cloudflare
 * 
 * ARCHITECTURE NOTES:
 *
 * There is no jquery or bootstrap dependency, we do use a "sugar" file that has 
 *    the parts of those libraries we need but uses native HTML/JS:  jqBS-shorthand.js
 * 
 * FIRST PRODUCTION VERSION: 2026-06-07
 * AUTHOR:     C. DeMeyer (with Gemini AI assist)
 * ============================================================================
 */

'use strict' //JQuery, dont do this script until document DOM objects are loaded and ready  
document.addEventListener('DOMContentLoaded', () => {
	
	//***************
	// Make the highlighted page for left menu match what is active
	//***************
    let currentPathLeftMenu = window.location.pathname;
    // sometimes Django keeps final slash, eliminate it
    if (currentPathLeftMenu.endsWith('/') && currentPathLeftMenu.length > 1) {
        currentPathLeftMenu = currentPathLeftMenu.slice(0, -1);
    }
	// Target ONLY .nav-link elements that live inside the left menu container
	const navLinksLeftMenu = document.querySelectorAll('.flex-column .nav-link');

	// First pass: Clean out any old active designations
	navLinksLeftMenu.forEach(link => {
		link.classList.remove('active-tab');
	});
	
    navLinksLeftMenu.forEach(link => {
        let linkPath = new URL(link.href, window.location.origin).pathname;
        // Remove any trailing slash from the link path as well
        if (linkPath.endsWith('/') && linkPath.length > 1) {
            linkPath = linkPath.slice(0, -1);
        }
        
        if (currentPathLeftMenu === linkPath) {
            // Change 'active' to 'active-tab' to match your CSS style exactly
            link.classList.add('active-tab'); 
        }
    });
	//***************
	// Make the highlighted page for upper menu bar match what is active
	//***************
	// glean the subsite location url
	const currentPath = window.location.pathname;

	// 1. Target all navigation elements inside your navbar container
	const navContainer = document.getElementById('upperNavbarCollapse');
	if (!navContainer) return; // Safety check

	const navLinks = navContainer.querySelectorAll('a');

	// 2. First pass: Clean out any old active designations
	navLinks.forEach(link => {
		link.classList.remove('active-tab');
	});

	// 3. Second pass: Find the match and highlight
	navLinks.forEach(link => {
		// Native .pathname safely parses the href string into a clean path
		const linkPath = link.pathname;

		// Ignore placeholder links like href="#"
		if (link.getAttribute('href') !== '#' && linkPath === currentPath) {
			link.classList.add('active-tab');

			// 4. Trace upward to find any parent menu containers
			// This highlights 'Trig' when you are inside 'Trig Functions' -> 'Intro to concepts'
			// and keeps going upward till top is hit for any deeply nested lists
			let parentLi = link.closest('li');
			while (parentLi && navContainer.contains(parentLi)) {
				// ':scope > a' strictly finds the <a> that belongs directly to THIS <li>,
				// ignoring any <a> tags inside deeper nested submenus.
				const parentLink = parentLi.querySelector(':scope > a');

				if (parentLink && parentLink !== link) {
					parentLink.classList.add('active-tab');
				}

				// Climb safely out of the current <li> to the next outer <li> level
				if (parentLi.parentElement) {
					parentLi = parentLi.parentElement.closest('li');
				} else {
					break;
				}
			}
		}
	});
	//***************
	// ALLOW COOKIE SELECTION by user
	// allow user to change cookie selection for all pages and, eventually, save users cookie selection only if they choose yes
	// Right now, we don't use cookies. Save in localStorage so its avail between pages and not sent back to server.
	const COOKIE_STAT_MSG = "allowCookie"
	let cookieStat = ifLocalStorageAvail(COOKIE_STAT_MSG, "get");
	if (cookieStat === null || cookieStat == "false") {
		let $noInd = $("#cookieIndicatorNo");
		let $yesInd = $("#cookieIndicatorYes");
		if ($noInd) $noInd.style.display = 'inline-block';
		if ($yesInd) $yesInd.style.display = 'none';
	} else {
		let $yesInd = $("#cookieIndicatorYes");
		let $noInd = $("#cookieIndicatorNo");
		if ($yesInd) $yesInd.style.display = 'inline-block';
		if ($noInd) $noInd.style.display = 'none';
	}

	// Allow user to change their mind on cookies and save it for their entire session (locally on their machine)
	let $yesCookiesBtn = $("#yesCookies");
	if ($yesCookiesBtn) {
		$yesCookiesBtn.on('click', function() {
			// save something to remember cookies are yes (don't use cookies right now)
			let $yesInd = $("#cookieIndicatorYes");
			let $noInd = $("#cookieIndicatorNo");
			if ($yesInd) $yesInd.style.display = 'inline-block';
			if ($noInd) $noInd.style.display = 'none';
			ifLocalStorageAvail(COOKIE_STAT_MSG, "set", "true"); // legally can store a cookie telling server "allow cookies"
			// At this time, the site does not use "extra" cookies so this is just a placeholder if that changes
		});
	}

	let $noCookiesBtn = $("#noCookies");
	if ($noCookiesBtn) {
		$noCookiesBtn.on('click', function() {
			// delete the image that says cookies ok
			let $noInd = $("#cookieIndicatorNo");
			let $yesInd = $("#cookieIndicatorYes");
			if ($noInd) $noInd.style.display = 'inline-block';
			if ($yesInd) $yesInd.style.display = 'none';
			ifLocalStorageAvail(COOKIE_STAT_MSG, "set", "false"); // legally can store a cookie telling server "no cookies" Google already does cookies on this site
		});
	}
	
	//***********************************
	// Advanced popup window that is draggable and has expln/todo stuff
	// Advanced popup window that is draggable (Vanilla JS replacing jQuery UI & jQuery Touch)
	const myDialogEl = document.getElementById('AdvancedTopics');
	const $myDialog = myDialogEl ? extendElement(myDialogEl) : null;
	
	// Native Hamburger Collapse Menu Event Listener
	const toggler = document.querySelector(".navbar-toggler");
	const collapseMenu = document.getElementById("upperNavbarCollapse");
	if (toggler && collapseMenu) {
		toggler.addEventListener("click", function() {
			collapseMenu.classList.toggle("show");
		});
	}
	
	/* =========================================================================
	   1. UNIFIED DELEGATED CLICK LISTENER 
	   ========================================================================= */
	document.addEventListener('click', function(e) {
		const linkEl = e.target.closest('#AdvancedTopicLink');
		if (!linkEl || !myDialogEl || !$myDialog) return;
	
		e.preventDefault(); // Stop native anchor hash jump behavior
	
		// Reset dragging tracking states cleanly
		myDialogEl.classList.remove('is-dragged');
		myDialogEl.style.left = '';
		myDialogEl.style.top = '';
	
		// Safe local DOM Lookups (No ternary evaluation short-circuit bugs)
		const toDoNode = $(".AdvTopic_ToDo");
		const explnNode = $(".AdvTopic_Expln");
		const toDoContent = toDoNode ? toDoNode.html() : null;
		const explnContent = explnNode ? explnNode.html() : null;
	
		// Populate clean inner <div> element targets safely
		if (toDoContent) {
			let $target = $myDialog.find("#tab011 > div");
			if ($target) $target.html(toDoContent);
		}
		if (explnContent) {
			let $target = $myDialog.find("#tab021 > div");
			if ($target) $target.html(explnContent);
		}
	
		// Set layout tabs to active by default on launch
		const innerPanel = myDialogEl.querySelector("#tab011");
		if (innerPanel) innerPanel.classList.add("show");
		
		const innerTab = myDialogEl.querySelector("#tab01");
		if (innerTab) innerTab.classList.add("active");
	
		// Trigger the dialog modally so it is promoted to the browser's top-layer z-index viewport pipeline
		if (!myDialogEl.open) {
			myDialogEl.showModal();
		}
	});
	
	// Delegated Close Handler
	document.addEventListener('click', function(e) {
		if (e.target.closest('.dialog-close-trigger')) {
			e.preventDefault();
			if (myDialogEl && $myDialog) {
				myDialogEl.close();
			}
		}
	});
	
	// Tab-Click Switcher Mechanics
	document.addEventListener('click', function(e) {
		const tabEl = e.target.closest('#AdvancedTopics .tabs');
		if (!tabEl) return;
	
		// Clear active statuses natively across all layout tabs
		$$("#AdvancedTopics .tabs").each(function() {
			this.classList.remove("active");
		});
	
		let $tab = extendElement(tabEl);
		$tab.addClass("active");
	
		// Switch tab layout fields using fieldset trackers
		$$("#AdvancedTopics fieldset").each(function() {
			this.classList.remove("show");
		});
	
		let $nextFs = $("#" + $tab.attr('id') + "1");
		if ($nextFs) {
			$nextFs.addClass('show');
		}
	});
	
	/* =========================================================================
	   2. STREAMLINED DRAG AND DROP ENGINE
	   ========================================================================= */
	if (myDialogEl) {
		let startX = 0, startY = 0;
		let initialLeft = 0, initialTop = 0;
	
		myDialogEl.addEventListener('pointerdown', function(e) {
			// Ignore structural actions or selectable inputs
			if (e.target.closest('button, input, select, textarea, .tabs, .close, .dialog-close-trigger')) return;
	
			// Explicitly switch the element from centering CSS to absolute pixel coordinates
			initialLeft = myDialogEl.offsetLeft;
			initialTop = myDialogEl.offsetTop;
	
			myDialogEl.style.left = initialLeft + 'px';
			myDialogEl.style.top = initialTop + 'px';
			myDialogEl.classList.add('is-dragged');
	
			startX = e.clientX;
			startY = e.clientY;
	
			function drag(e) {
				myDialogEl.style.left = (initialLeft + (e.clientX - startX)) + 'px';
				myDialogEl.style.top = (initialTop + (e.clientY - startY)) + 'px';
			}
	
			function stopDragging() {
				document.removeEventListener('pointermove', drag);
				document.removeEventListener('pointerup', stopDragging);
			}
	
			document.addEventListener('pointermove', drag);
			document.addEventListener('pointerup', stopDragging);
		});
	
		// Append layout accessibility tooltips cleanly using your custom shim attributes
		let $advModal = $("#advModal");
		if ($advModal) $advModal.attr("title", "Drag me around from anywhere inside the window.");
		let $advModalClose = $("#advModalClose");
		if ($advModalClose) $advModalClose.attr("title", "Click to close");
	}
	//*******End of Advanced Popup window handling ****************************

	
	//******************************************Handle menu/submenu 'show' on click*********************/
	// 1. Primary Toggles: Top-level dropdown links ("Trig", "Legal")
    $$('.nav-item.dropdown > .dropdown-toggle').each(function(btn) {
        btn.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const currentMenu = btn.parent().find('.dropdown-menu');
            
            // Close all other primary menus and nested submenus first
            $$('.dropdown-menu, .submenu').each(function(menu) {
                if (menu !== currentMenu) menu.removeClass('show');
            });
            
            // Toggle the clicked menu
            if (currentMenu) currentMenu.toggleClass('show');
        });
    });

    // 2. Nested Toggles: Deep submenus ("Trig Functions")
    $$('.has-submenu > .dropdown-toggle').each(function(subBtn) {
        subBtn.click(function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const currentSubmenu = subBtn.parent().find('.submenu');
            
            // Close any sibling submenus on this layer
            $$('.submenu').each(function(sub) {
                if (sub !== currentSubmenu) sub.removeClass('show');
            });
            
            // Toggle the nested level submenu box
            if (currentSubmenu) currentSubmenu.toggleClass('show');
        });
    });

});
