/* ============================================================================
 * COMPONENT: Client side Javascript
 * FILE:      LandingPage.js
 * ============================================================================
 * 
 * DESCRIPTION:
 * This file handles the user interaction with index.html.  The automated demo 
 * introduces the site.  One can choose newbie or expert mode, the former gives alot more
 * help.   
 * 
 * DEPENDENCIES:
 * SCRIPT_AUTO_DEMO is the script sent to autodemo.js to execute the automated demo of
 * how the page works as a tutorial to user.
 * - All static files, such as this js, are served over cloud service such as Cloudflare
 * 
 * ARCHITECTURE NOTES:
 * There is no jquery or bootstrap dependency, we do use a "sugar" file that has 
 *    the parts of those libraries we need but uses native HTML/JS:  jqBS-shorthand.js
 * 
 * FIRST PRODUCTION VERSION: 2026-06-07
 * AUTHOR:     C. DeMeyer (with Gemini AI assist)
 * ============================================================================
 */
'use strict'

// Replacing $(function() { ... }) with native standard DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {

	// 1. Resurrect saved user mode from session storage
	const isNewbie = sessionStorage.getItem('UserIsNew')?.toLowerCase() !== 'false';
	
	// Sync session state and toggle the corresponding checked properties directly via .prop()
	sessionStorage.setItem('UserIsNew', isNewbie);
	$(isNewbie ? '#newbieMode' : '#expertMode')?.prop('checked', true);


	// legal precedent states that on the home page, browserwrap must be in upper left of home page to be "more" valid */
		//**************************************************************************** 
	// User has changed newbie/expert mode selection 
	$('#selectNewbieOrExpert')?.on('click', (event) => {
	  const target = event.target;
	  
	  // Filter for input radio clicks inside the wrapper container
	  if (target.matches("input[name='helpLevel']")) {
	    const isNewbieSelection = target.value === 'newbieMode';
	    
	    sessionStorage.setItem('UserIsNew', isNewbieSelection);
	    console.log(isNewbieSelection ? 'newbie mode' : 'expert mode');
	  }
	});

	//********************************************************
	// create an Auto Demo "script" for the auto-demo tutorial, by now, all variables should be set
	// The script differs for mobile since we don't have a left menu but rather a "hamburger" menu to right
	//********************************************************
	const INTRO_FEATURES = [
		{ segmentActivity: "PLAY_AUDIO", segmentParams: { filenameURL: 'LandingPageSeg0', waitTimeMillisec: 1000 } },
		{ segmentActivity: "ANNOTATE_ELEMENT", segmentParams: { element: 'segNum', color: "red", waitTimeMillisec: 2000 } },
		{ segmentActivity: "ANNOTATE_ELEMENT", segmentParams: { element: 'totalSeg', color: "green", waitTimeMillisec: 7000 } },
		{ segmentActivity: "REMOVE_ALL_ANNOTATE_ELEMENT", segmentParams: { waitTimeMillisec: 14000 } },
		{
			segmentActivity: "ACT_ON_ELEMENT", segmentParams: {
				element: '#segNum', action: "focus", // positive values for offset x and y move the cursor "southwest"
				offset: { x: 30, y: 15 }, waitTimeMillisec: 17000
			} // this is wait before you go on to next item
		},
		{
			segmentActivity: "REMOVE_ACT_ON_ELEMENT", segmentParams: {
				element: '#segNum', action: "focus", // positive values for offset x and y move the cursor "southwest"
				waitTimeMillisec: 12000
			}
		},
		{
			segmentActivity: "ACT_ON_ELEMENT", segmentParams: {
				element: '#AdvancedTopicLink', action: "click", // positive values for offset x and y move the cursor "southwest", so neg x is south east
				offset: { x: 0, y: 15 }, waitTimeMillisec: 1000
			} // this is wait before you go on to next item
		},
		{
			segmentActivity: "SHOW_MODAL", segmentParams: { element: 'AdvancedTopics', waitTimeMillisec: 1000 }, // wait time doesn't matter here
		}
	];

	// the intro to the site varies whether we have a hamburger menu (generally present on mobile) or not
	let menuContainer = $('#upperNavbarCollapse');
	// Native replacement for jQuery .is(":visible") by validating window style dimensions
	let noHamburgerMenu = menuContainer && window.getComputedStyle(menuContainer).display !== 'none';
	let SCRIPT_AUTO_DEMO;

	if (noHamburgerMenu) {
		// we get a left menu, we can demo it
		SCRIPT_AUTO_DEMO = [
			{
				segmentName: "Intro to Auto Demo",
				headStartForAudioMillisec: 25000, // generally the audio is longer than the cursor/annotate activity
				segmentActivities: INTRO_FEATURES
			},

			{
				segmentName: "Welcome to this site...",
				headStartForAudioMillisec: 12000, // generally the audio is longer than the cursor/annotate activity
				segmentActivities:
					[
						{
							segmentActivity: "PLAY_AUDIO",
							segmentParams:
							{
								filenameURL: 'LandingPageSeg1',
								waitTimeMillisec: 9000
							}
						},

						//we only have one item to work on so far so this is slim for now...
						{
							segmentActivity: "ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#link-trig-menu',
								action: "click",
								// positive values for offset x and y move the cursor "southwest", so neg x is south east
								offset: { x: 0, y: 25 },
								waitTimeMillisec: 12000
							}  // this is wait before you go on to next item
						},
						// we can't actually go to those pages else we loose this page and the autodemo stops
						// point to first dropdown menu (which for now is just Trig)
						{
							segmentActivity: "ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#TrigFuncTopic',  //dropdown-item',
								action: "click",
								offset: { x: 0, y: 19 },
								waitTimeMillisec: 7000
							}  // this is wait before you go on to next item
						},
						// "fake out" select of first menu item
						{
							segmentActivity: "ACT_ON_ELEMENT",
							segmentParams:
							{
								element: 'a.dropdown-item',  //dropdown-item',
								action: "focus",
								offset: { x: 0, y: 19 },
								waitTimeMillisec: 7000
							}  // this is wait before you go on to next item
						},
						// remove select first menu item
						{
							segmentActivity: "REMOVE_ACT_ON_ELEMENT",
							segmentParams:
							{
								element: 'a.dropdown-item',
								action: "focus",
								waitTimeMillisec: 1000
							}
						},
						// remove drop down menu and all children
						{
							segmentActivity: "REMOVE_ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#link-trig-menu',
								action: "click",
								waitTimeMillisec: 1000
							}
						},
						//**********FAKE SUBTOPIC LIST **************
						// put up a fake subtopic list to show what we could do
						{
							segmentActivity: "FAKE_SUBTOPICS",
							segmentParams:
							{
								idToGo: 'NoSubtopicAvail',
								waitTimeMillisec: 7000
							}  // this is wait before you go on to next item
						},
						// remove red cursor from dropdown
						{
							segmentActivity: "REMOVE_ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#TrigFuncTopic.dropdown-toggle',   //dropdown-item',
								action: "focus",
								offset: { x: 0, y: 19 },
								waitTimeMillisec: 1000
							}  // this is wait doesnt matter
						},
						// move red cursor over to 1st fake page
						{
							segmentActivity: "ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#firstFakePage.nav-link',
								action: "focus",
								offset: { x: 0, y: 19 },
								waitTimeMillisec: 7000
							}  // this is wait before you go on to next item
						},
						// remove red cursor from 1st fake page
						{
							segmentActivity: "REMOVE_ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#firstFakePage.nav-link',
								action: "focus",
								offset: { x: 0, y: 19 },
								waitTimeMillisec: 1000
							}  // this is wait doesnt matter
						},
						// move red cursor over to 2nd fake page
						{
							segmentActivity: "ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#secondFakePage.nav-link',
								action: "focus",
								offset: { x: 0, y: 19 },
								waitTimeMillisec: 5000
							}  // this is wait before you go on to next item
						},
						// remove red cursor from 2nd fake page
						{
							segmentActivity: "REMOVE_ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#secondFakePage.nav-link',
								action: "focus",
								offset: { x: 0, y: 19 },
								waitTimeMillisec: 1000
							}  // this is wait doesnt matter
						},
						// move red cursor over to 3rd fake page
						{
							segmentActivity: "ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#thirdFakePage.nav-link',
								action: "focus",
								offset: { x: 0, y: 19 },
								waitTimeMillisec: 3000
							}  // this is wait before you go on to next item
						},
						// remove red cursor from 3rd fake page
						{
							segmentActivity: "REMOVE_ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#thirdFakePage.nav-link',
								action: "focus",
								offset: { x: 0, y: 19 },
								waitTimeMillisec: 1000
							}  // this is wait doesnt matter
						},
						// move red cursor over to 4rh fake page
						{
							segmentActivity: "ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#fourthFakePage.nav-link',
								action: "focus",
								offset: { x: 0, y: 19 },
								waitTimeMillisec: 3000
							}  // this is wait before you go on to next item
						},
						// remove red cursor from 4th fake page
						{
							segmentActivity: "REMOVE_ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#fourthFakePage.nav-link',
								action: "focus",
								offset: { x: 0, y: 19 },
								waitTimeMillisec: 1000
							}  // this is wait doesnt matter
						},
						// remove fake subtopic list
						// put up a fake subtopic list to show what we could do
						{
							segmentActivity: "REMOVE_FAKE_SUBTOPICS",
							segmentParams:
							{
								idToGo: 'NoSubtopicAvail',
								waitTimeMillisec: 1000
							}  // this is wait before you go on to next item
						},
						// get rid of big red cursor but leave up the drop down menu
						//***********END FAKE SUBLIST***************** 		


					]
			}
		];
	} else {
		// MOBILE DEVICE
		// we loose upper menu, it collapses to hamburger menu
		SCRIPT_AUTO_DEMO = [
			{
				segmentName: "Intro to Auto Demo",
				headStartForAudioMillisec: 25000, // generally the audio is longer than the cursor/annotate activity
				segmentActivities: INTRO_FEATURES
			},
			{
				segmentName: "Welcome to this site...",
				headStartForAudioMillisec: 33000, // generally the audio is longer than the cursor/annotate activity
				segmentActivities:
					[
						{
							segmentActivity: "PLAY_AUDIO",
							segmentParams:
							{
								filenameURL: 'LandingPageSeg1mobile',
								waitTimeMillisec: 9000
							}
						},
						{
							segmentActivity: "ACT_ON_ELEMENT",
							segmentParams:
							{
								element: 'button.navbar-toggler',
								action: "click",
								// positive values for offset x and y move the cursor "southwest", so neg x is south east
								offset: { x: 0, y: 25 },
								waitTimeMillisec: 3000
							}  // this is wait before you go on to next item
						},
						// get rid of big red cursor but leave up the drop down menu
						{
							segmentActivity: "REMOVE_ACT_ON_ELEMENT",
							segmentParams:
							{
								element: 'button.navbar-toggler',
								action: "focus",
								waitTimeMillisec: 3000
							}
						},
						//demo for Trig, which will drop down a Trig Functions and Trig Identities
						{
							segmentActivity: "ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#link-trig-menu.nav-link.dropdown-toggle.navbarDropdown',
								action: "click",
								// positive values for offset x and y move the cursor "southwest", so neg x is south east
								offset: { x: 0, y: 25 },
								waitTimeMillisec: 4000
							}  // this is wait before you go on to next item
						},
						// get rid of big red cursor but leave up the drop down menu
						{
							segmentActivity: "REMOVE_ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#link-trig-menu.nav-link.dropdown-toggle.navbarDropdown',
								action: "focus",
								waitTimeMillisec: 3000
							}
						},
						// we can't actually go to those pages else we loose this page and the autodemo stops
						// point to first dropdown menu (which for now is just Trig Functions) and expand all the topics
						{
							segmentActivity: "ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#TrigFuncTopic.dropdown-toggle',  //dropdown-item',
								action: "click",
								offset: { x: 0, y: 19 },
								waitTimeMillisec: 3000
							}  // this is wait before you go on to next item
						},
						//get rid of red arrow
						{
							segmentActivity: "REMOVE_ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#TrigFuncTopic.dropdown-toggle',  //dropdown-item',
								action: "",
								offset: { x: 0, y: 19 },
								waitTimeMillisec: 1000
							}  // this is wait before you go on to next item
						},
						// "fake out" select of first menu item
						{
							segmentActivity: "ACT_ON_ELEMENT",
							segmentParams:
							{
								element: 'a.dropdown-item',  //dropdown-item',
								action: "focus",
								offset: { x: 0, y: 19 },
								waitTimeMillisec: 7000
							}  // this is wait before you go on to next item
						},
						// remove select of first menu item
						{
							segmentActivity: "REMOVE_ACT_ON_ELEMENT",
							segmentParams:
							{
								element: 'a.dropdown-item',  //dropdown-item',
								action: "focus",
								offset: { x: 0, y: 19 },
								waitTimeMillisec: 1000
							}  // this is wait before you go on to next item
						},
						// remove drop down menu
						{
							segmentActivity: "REMOVE_ACT_ON_ELEMENT",
							segmentParams:
							{
								element: '#TrigFuncTopic.dropdown-toggle',
								action: "click",
								waitTimeMillisec: 3000
							}
						},
						// get rid of dropdown hamburger menu
						{
							segmentActivity: "ACT_ON_ELEMENT",
							segmentParams:
							{
								element: 'button.navbar-toggler',
								action: "click",
								// positive values for offset x and y move the cursor "southwest", so neg x is south east
								offset: { x: 0, y: 25 },
								waitTimeMillisec: 2000
							}  // this is wait before you go on to next item
						},
						// get rid of big red cursor but leave up the drop down menu
						{
							segmentActivity: "REMOVE_ACT_ON_ELEMENT",
							segmentParams:
							{
								element: 'button.navbar-toggler',
								action: "focus",
								waitTimeMillisec: 3000
							}
						},

					]
			}
		];
	}

	//**************************************************************************** 
	// User initiates autoDemo activity 
	//**************************************************************************** 
	//*** user clicks the start demo image, iniitalize everything 
	let demo = new AutoDemo(SCRIPT_AUTO_DEMO); // give the demo the full script 

	let $startAutoDemoBtn = $('#startAutoDemo');
	if ($startAutoDemoBtn) {
		$startAutoDemoBtn.on('click', function() {
			demo.prepDemoControls();
			// need to move down legal stuff to make more room for demo list of subtopics natively 
			let $legalNotice = $('#LegalNotice_Consent');
			if ($legalNotice) $legalNotice.style.top = '400px';
		});
	}

	//**************************************************************************** 
	// User has interacted with autoDemo controls 
	//**************************************************************************** 
	// User has selected play 
	$('#playSegment')?.on('click', () => {
	  const currSeg = parseInt($('#segNum')?.val() || 1, 10);
	
	  if (currSeg === 1) {
	    // Show links and force their display structure seamlessly
	    $$('a[href="#AdvancedTopics"]').show().forEach(el => {
	      el.style.display = 'inline-block';
	      el.style.visibility = 'visible';
	    });
	  }
	  
	  demo.startDemo();
	});

	$('#stopSegment')?.on('click', () => {
	  demo.stopThisSegment(false);
	  $$('a[href="#AdvancedTopics"]').hide();
	});

	$('#dismissAutoDemo')?.on('click', () => {
	  demo.stopThisSegment();
	  
	  $$('a[href="#AdvancedTopics"]').hide();
	  
	  $('#LegalNotice_Consent')?.prop('style').removeProperty('top');
	});

	$('#segNum')?.on('change', function() {
	  const currSeg = parseInt(this.value, 10);
	  demo.setCurrSeg(currSeg);
	
	  $('#clickHereCursor')?.removeClass('userHitPlay');
	});

}); 
