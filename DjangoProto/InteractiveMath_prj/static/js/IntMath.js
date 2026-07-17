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
 *    the parts of those libraries we need but uses native HTML/JS:  jq-shorthand.js
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
        console.log('link path is ' + linkPath + ' and current path is ' + currentPathLeftMenu);
        
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
	// Avoid bootstrap which treats modals as interruptors to user behavior rather than instructional aids
	// Advanced popup window that is draggable (Native HTML Dialog System)
	const myDialog = document.getElementById('AdvancedTopics');

	// Native Hamburger Collapse Menu Event Listener
	const toggler = document.querySelector(".navbar-toggler");
	const collapseMenu = document.getElementById("upperNavbarCollapse");
	if (toggler && collapseMenu) {
		toggler.addEventListener("click", function() {
			collapseMenu.classList.toggle("show");
		});
	}

	// Modeless Open Action: Allows background visibility while active
	document.addEventListener('click', function(e) {
		if (e.target.closest('#AdvancedTopicLink')) {
			e.preventDefault();
			if (myDialog) {
				myDialog.style.left = '';
				myDialog.style.top = '';
				myDialog.style.margin = 'auto'; // FIX: Restores default browser layout center point upon open

				const toDoContent = $(".AdvTopic_ToDo") ? $(".AdvTopic_ToDo").html() : null;
				const explnContent = $(".AdvTopic_Expln") ? $(".AdvTopic_Expln").html() : null;

				if (toDoContent) {
					let $target011 = $("#tab011 > p", myDialog);
					if ($target011) $target011.html(toDoContent);
				}
				if (explnContent) {
					let $target021 = $("#tab021 > p", myDialog);
					if ($target021) $target021.html(explnContent);
				}
				myDialog.show(); // Opened modelessly as requested for instructional design
			}
		}
	});

	// Delegated handler: Intercepts clicks on your close buttons anywhere on the page
	document.addEventListener('click', function(e) {
		if (e.target.closest('.dialog-close-trigger')) {
			e.preventDefault();
			if (myDialog) {
				myDialog.close();
			}
		}
	});

	// Cleaned up Tab-Click Selector
	document.addEventListener('click', function(e) {
		const tabEl = e.target.closest('#AdvancedTopics .tabs');
		if (tabEl) {
			// Remove classes and clear inline borders natively on all tabs
			$$(".tabs").each(function(tab) {
				tab.removeClass("active");
				tab.style.borderBottom = "none";
				let h6 = tab.querySelector("h6");
				if (h6) {
					h6.style.fontWeight = "normal";
					h6.style.color = "#6c757d"; // Native muted inline colors
				}
			});

			// Style active selected tab natively
			let $tab = extendElement(tabEl);
			$tab.addClass("active");
			$tab.style.borderBottom = "2px solid #007bff";

			let activeH6 = $tab.querySelector("h6");
			if (activeH6) {
				activeH6.style.fontWeight = "bold";
				activeH6.style.color = "#212529";
			}

			let next_fs = "#" + $tab.attr('id') + "1";
			$$("fieldset").each(function(fs) {
				fs.classList.remove("show");
			});

			let $nextFs = $(next_fs);
			if ($nextFs) {
				$nextFs.addClass("show");
			}
		}
	});

	// =========================================================================
	// 2. DRAG AND DROP HANDLER FOR NATIVE DIALOG window Advanced popup
	// =========================================================================
	if (myDialog) {
		let startX = 0, startY = 0;
		let initialLeft = 0, initialTop = 0;

		myDialog.addEventListener('pointerdown', function(e) {
			if (e.target.closest('button, input, select, textarea, .tabs, .close, .dialog-close-trigger')) return;
			e.preventDefault(); // Clears out browser centering rules so inline tracking moves perfectly
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

		// Initialize tooltips cleanly
		// Modified framework target properties into stable standard HTML tooltips
		let $advModal = $("#advModal");
		if ($advModal) $advModal.attr("title", "Drag me around from anywhere inside the window.");

		let $advModalClose = $("#advModalClose");
		if ($advModalClose) $advModalClose.attr("title", "Click to close");
	}
});
