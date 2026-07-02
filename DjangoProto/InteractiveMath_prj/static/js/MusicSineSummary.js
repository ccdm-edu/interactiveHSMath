/* ============================================================================
 * COMPONENT: Client side Javascript
 * FILE:      MusicSineSummary.js
 * ============================================================================
 * 
 * DESCRIPTION:
 * Handle user interaction of page with corresponding name (i.e. test1.js handles user
 * interaction for test1.html which is styled by test1.css).  This is the final summary
 * page for the trig functions in musician tuning notes.  It is an iframed youtube video
 * mp4 that sums it all up.
 * 
 * DEPENDENCIES:
 * - All static files, such as this js, are served over cloud service such as Cloudflare
 * 
 * ARCHITECTURE NOTES:
 * There is no jquery or bootstrap dependency, we do use a "sugar" file that has 
 *    the parts of those libraries we need but uses native HTML/JS:  jq-shorthand.js
 * 
 * FIRST PRODUCTION VERSION: 2026-06-07
 * AUTHOR:     C. DeMeyer (with Gemini AI assist)
 * ============================================================================
 */
'use strict'

// Replacing $(function() { ... }) with native standard DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {

	// need to not have every css load on every page, when that is fixed, can get rid of this
	let targetLinks = document.querySelectorAll('a[href="#AdvancedTopics"]');
	targetLinks.forEach(el => {
		el.style.display = 'none';
	});

	// Dont want a next button on this page so kill it here. Once at end of a topic, time to pick a new topic and that can't be my choice
	let $nextBtn = document.getElementById("GoToNextPage");
	if ($nextBtn) $nextBtn.style.display = 'none';

	let $prevBtn = document.getElementById("GoToPreviousPage");
	if ($prevBtn) {
		let wrapper = document.createElement('a');
		wrapper.href = "../MusicNotesTrig";
		$prevBtn.parentNode.insertBefore(wrapper, $prevBtn);
		wrapper.appendChild($prevBtn);
	}

});
