'use strict'

// Replacing $(function() { ... }) with native standard DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {

  // if the user has saved an old mode, resurrect it here
  let newbieMode = sessionStorage.getItem('UserIsNew');
  let $newbieRadio = document.getElementById("newbieMode");
  let $expertRadio = document.getElementById("expertMode");

  if (!newbieMode) {
    // first arrival to site, default newbie mode
    if ($newbieRadio) $newbieRadio.checked = true; // put them in newbie mode
    sessionStorage.setItem('UserIsNew', true); // if user never changes anything, they are classed as newbie
  } else if (newbieMode.toLowerCase() === "false") {
    if ($expertRadio) $expertRadio.checked = true; // put them in newbie mode
  } else {
    // user saved newbie mode or its their first arrival to site,
    sessionStorage.setItem('UserIsNew', true); // if user never changes anything, they are classed as newbie
    if ($newbieRadio) $newbieRadio.checked = true; // put them in newbie mode
  }

  // Dont want a next button on this page so kill it here
  let $nextBtn = $("#GoToNextPage");
  let $prevBtn = $("#GoToPreviousPage");
  if ($nextBtn) $nextBtn.style.display = 'none';
  if ($prevBtn) $prevBtn.style.display = 'none';

  // legal precedent states that on the home page, browserwrap must be in upper left of home page to be "more" valid */
  
  //********************************************************
  // create a "script" for the auto-demo tutorial, by now, all variables should be set
  // The script differs for mobile since we don't have a left menu but rather a "hamburger" menu to right
  //********************************************************
  const INTRO_FEATURES = [
    {segmentActivity: "PLAY_AUDIO", segmentParams: {filenameURL: 'LandingPageSeg0', waitTimeMillisec: 1000} },
    {segmentActivity: "ANNOTATE_ELEMENT", segmentParams: {element: 'segNum', color: "red", waitTimeMillisec: 2000} },
    {segmentActivity: "ANNOTATE_ELEMENT", segmentParams: {element: 'totalSeg', color: "green", waitTimeMillisec: 7000} },
    {segmentActivity: "REMOVE_ALL_ANNOTATE_ELEMENT", segmentParams: {waitTimeMillisec: 14000} },
    {segmentActivity: "ACT_ON_ELEMENT", segmentParams: {element:'#segNum', action: "focus", // positive values for offset x and y move the cursor "southwest"
     offset: {x: 30, y: 15}, waitTimeMillisec: 17000} // this is wait before you go on to next item
    },
    {segmentActivity: "REMOVE_ACT_ON_ELEMENT", segmentParams: {element:'#segNum', action: "focus", // positive values for offset x and y move the cursor "southwest"
     waitTimeMillisec: 12000}
    },
    {segmentActivity: "ACT_ON_ELEMENT", segmentParams: {element:'#AdvancedTopicLink', action: "click", // positive values for offset x and y move the cursor "southwest", so neg x is south east
     offset: {x: 0, y: 15}, waitTimeMillisec: 1000} // this is wait before you go on to next item
    },
    {segmentActivity: "SHOW_MODAL", segmentParams: {element: 'AdvancedTopics', waitTimeMillisec: 1000}, // wait time doesn't matter here
    }
  ];

  // the intro to the site varies whether we have a hamburger menu (generally present on mobile) or not
  let menuContainer = document.getElementById('upperNavbarCollapse');
  // Native replacement for jQuery .is(":visible") by validating window style dimensions
  let noHamburgerMenu = menuContainer && window.getComputedStyle(menuContainer).display !== 'none';
  let SCRIPT_AUTO_DEMO;

  if (noHamburgerMenu){
    // we get a left menu, we can demo it
    SCRIPT_AUTO_DEMO = [
      {
        segmentName: "Intro to Auto Demo",
        headStartForAudioMillisec: 25000, // generally the audio is longer than the cursor/annotate activity
        segmentActivities: INTRO_FEATURES
      },

		{ segmentName: "Welcome to this site...",
		  headStartForAudioMillisec: 12000, // generally the audio is longer than the cursor/annotate activity
		  segmentActivities: 
		  [
				{segmentActivity: "PLAY_AUDIO",
				 segmentParams: 
				 	{filenameURL: 'LandingPageSeg1',
				 	waitTimeMillisec: 9000}
				},
							
				//we only have one item to work on so far so this is slim for now...
				{segmentActivity: "ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#navbarDropdown',
				 	 action: "click",
				 	 // positive values for offset x and y move the cursor "southwest", so neg x is south east
				 	 offset: {x: 0, y: 25},
				 	waitTimeMillisec: 12000}  // this is wait before you go on to next item
				},
				// get rid of big red cursor but leave up the drop down menu
				{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#navbarDropdown',
				 	 action: "focus",
				 	waitTimeMillisec: 3000}
				},
				// we can't actually go to those pages else we loose this page and the autodemo stops
				// point to first dropdown menu (which for now is just Trig)
				{segmentActivity: "ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#TrigFuncTopic.dropdown-toggle',  //dropdown-item',
				 	 action: "click",
				 	 offset: {x: 0, y: 19},
				 	waitTimeMillisec: 7000}  // this is wait before you go on to next item
				},
				// remove red arrow only
				{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#TrigFuncTopic.dropdown-toggle',
				 	 action: "",
				 	waitTimeMillisec: 1000}
				},
				// "fake out" select of first menu item
				{segmentActivity: "ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'a.dropdown-item',  //dropdown-item',
				 	 action: "focus",
				 	 offset: {x: 0, y: 19},
				 	waitTimeMillisec: 7000}  // this is wait before you go on to next item
				},
				// remove select first menu item
				{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'a.dropdown-item',
				 	 action: "focus",
				 	waitTimeMillisec: 1000}
				},
				// remove drop down menu
				{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#TrigFuncTopic.dropdown-toggle',
				 	 action: "click",
				 	waitTimeMillisec: 1000}
				},
				//**********FAKE SUBTOPIC LIST **************
				// put up a fake subtopic list to show what we could do
				{segmentActivity: "FAKE_SUBTOPICS", 
				 segmentParams:
				 	{idToGo:  'NoSubtopicAvail',
				 	waitTimeMillisec: 7000}  // this is wait before you go on to next item
				},			
				// remove red cursor from dropdown
				{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#TrigFuncTopic.dropdown-toggle',   //dropdown-item',
				 	 action: "focus",
				 	 offset: {x: 0, y: 19},
				 	waitTimeMillisec: 1000}  // this is wait doesnt matter
				},
				// move red cursor over to 1st fake page
				{segmentActivity: "ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#firstFakePage.nav-link',
				 	 action: "focus",
				 	 offset: {x: 0, y: 19},
				 	waitTimeMillisec: 7000}  // this is wait before you go on to next item
				},
				// remove red cursor from 1st fake page
				{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#firstFakePage.nav-link',
				 	 action: "focus",
				 	 offset: {x: 0, y: 19},
				 	waitTimeMillisec: 1000}  // this is wait doesnt matter
				},
				// move red cursor over to 2nd fake page
				{segmentActivity: "ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#secondFakePage.nav-link',
				 	 action: "focus",
				 	 offset: {x: 0, y: 19},
				 	waitTimeMillisec: 5000}  // this is wait before you go on to next item
				},
				// remove red cursor from 2nd fake page
				{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#secondFakePage.nav-link',
				 	 action: "focus",
				 	 offset: {x: 0, y: 19},
				 	waitTimeMillisec: 1000}  // this is wait doesnt matter
				},
				// move red cursor over to 3rd fake page
				{segmentActivity: "ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#thirdFakePage.nav-link',
				 	 action: "focus",
				 	 offset: {x: 0, y: 19},
				 	waitTimeMillisec: 3000}  // this is wait before you go on to next item
				},
				// remove red cursor from 3rd fake page
				{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#thirdFakePage.nav-link',
				 	 action: "focus",
				 	 offset: {x: 0, y: 19},
				 	waitTimeMillisec: 1000}  // this is wait doesnt matter
				},
				// move red cursor over to 4rh fake page
				{segmentActivity: "ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#fourthFakePage.nav-link',
				 	 action: "focus",
				 	 offset: {x: 0, y: 19},
				 	waitTimeMillisec: 3000}  // this is wait before you go on to next item
				},
				// remove red cursor from 4th fake page
				{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#fourthFakePage.nav-link',
				 	 action: "focus",
				 	 offset: {x: 0, y: 19},
				 	waitTimeMillisec: 1000}  // this is wait doesnt matter
				},
				// remove fake subtopic list
							// put up a fake subtopic list to show what we could do
				{segmentActivity: "REMOVE_FAKE_SUBTOPICS", 
				 segmentParams:
				 	{idToGo:  'NoSubtopicAvail',
				 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
				},
				// get rid of big red cursor but leave up the drop down menu
				//***********END FAKE SUBLIST***************** 		
				// remove drop down menu
				{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#navbarDropdown',
				 	 action: "",
				 	waitTimeMillisec: 5000}
				},
	
		  ]
		}
		];
	} else {
		// MOBILE DEVICE
		// we loose upper menu, it collapses to hamburger menu
		SCRIPT_AUTO_DEMO = [
			{ segmentName: "Intro to Auto Demo",
			  headStartForAudioMillisec: 25000, // generally the audio is longer than the cursor/annotate activity
			  segmentActivities: INTRO_FEATURES
			},
			{ segmentName: "Welcome to this site...",
			  headStartForAudioMillisec: 33000, // generally the audio is longer than the cursor/annotate activity
			  segmentActivities: 
			  [		
				{segmentActivity: "PLAY_AUDIO",
				   segmentParams: 
					{filenameURL: 'LandingPageSeg1mobile',
					waitTimeMillisec: 9000}
				},	
				{segmentActivity: "ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'button.navbar-toggler',
				 	 action: "click",
				 	 // positive values for offset x and y move the cursor "southwest", so neg x is south east
				 	 offset: {x: 0, y: 25},
				 	waitTimeMillisec: 3000}  // this is wait before you go on to next item
				},
				// get rid of big red cursor but leave up the drop down menu
				{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'button.navbar-toggler',
				 	 action: "focus",
				 	waitTimeMillisec: 3000}
				},
				//demo for Trig, which will drop down a Trig Functions and Trig Identities
				{segmentActivity: "ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#navbarDropdown',
				 	 action: "click",
				 	 // positive values for offset x and y move the cursor "southwest", so neg x is south east
				 	 offset: {x: 0, y: 25},
				 	waitTimeMillisec: 4000}  // this is wait before you go on to next item
				},
				// get rid of big red cursor but leave up the drop down menu
				{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#navbarDropdown',
				 	 action: "focus",
				 	waitTimeMillisec: 3000}
				},
				// we can't actually go to those pages else we loose this page and the autodemo stops
				// point to first dropdown menu (which for now is just Trig Functions) and expand all the topics
				{segmentActivity: "ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#TrigFuncTopic.dropdown-toggle',  //dropdown-item',
				 	 action: "click",
				 	 offset: {x: 0, y: 19},
				 	waitTimeMillisec: 3000}  // this is wait before you go on to next item
				},
				//get rid of red arrow
				{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#TrigFuncTopic.dropdown-toggle',  //dropdown-item',
				 	 action: "",
				 	 offset: {x: 0, y: 19},
				 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
				},
				// "fake out" select of first menu item
				{segmentActivity: "ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'a.dropdown-item',  //dropdown-item',
				 	 action: "focus",
				 	 offset: {x: 0, y: 19},
				 	waitTimeMillisec: 7000}  // this is wait before you go on to next item
				},
				// remove select of first menu item
				{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'a.dropdown-item',  //dropdown-item',
				 	 action: "focus",
				 	 offset: {x: 0, y: 19},
				 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
				},
				// remove drop down menu
				{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'#TrigFuncTopic.dropdown-toggle',
				 	 action: "click",
				 	waitTimeMillisec: 3000}
				},
				// get rid of dropdown hamburger menu
				{segmentActivity: "ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'button.navbar-toggler',
				 	 action: "click",
				 	 // positive values for offset x and y move the cursor "southwest", so neg x is south east
				 	 offset: {x: 0, y: 25},
				 	waitTimeMillisec: 2000}  // this is wait before you go on to next item
				},
				// get rid of big red cursor but leave up the drop down menu
				{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
				 segmentParams:
				 	{element:'button.navbar-toggler',
				 	 action: "focus",
				 	waitTimeMillisec: 3000}
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
  let $playSegmentBtn = $('#playSegment');
  if ($playSegmentBtn) {
    $playSegmentBtn.on('click', function(){ 
      // this is only true for this pages demo... 
      let $segNumSelect = $('#segNum');
      let currSeg = $segNumSelect ? parseInt($segNumSelect.value) : 1; 
      
      if (currSeg === 1) { 
        // only illustrative for the first segment on autodemo intro 
        // Multiple matches handled natively via selector arrays to match sugar baseline rules
        let targetLinks = document.querySelectorAll('a[href="#AdvancedTopics"]');
        targetLinks.forEach(el => {
          el.style.display = 'inline-block';
          el.style.visibility = 'visible';
        });
      } 
      demo.startDemo(); 
    }); 
  }

  let $stopSegmentBtn = $('#stopSegment');
  if ($stopSegmentBtn) {
    $stopSegmentBtn.on('click', function(){ 
      demo.stopThisSegment(false); // we don't want to destroy controls box 
      // get rid of adv topics link, was for demo only 
      let targetLinks = document.querySelectorAll('a[href="#AdvancedTopics"]');
      targetLinks.forEach(el => el.style.display = 'none');
    }); 
  }

  let $dismissAutoDemoBtn = $('#dismissAutoDemo');
  if ($dismissAutoDemoBtn) {
    $dismissAutoDemoBtn.on('click', function(){ 
      // user is totally done, pause any demo segment in action and get rid of demo controls and go back to original screen 
      demo.stopThisSegment(); // may or may not be needed 
      // get rid of adv topics link, was for demo only 
      let targetLinks = document.querySelectorAll('a[href="#AdvancedTopics"]');
      targetLinks.forEach(el => el.style.display = 'none');
      
      let $legalNotice = $('#LegalNotice_Consent');
      if ($legalNotice) $legalNotice.style.top = ''; // let it float back up where it belongs 
    }); 
  }

  let $segNumSelect = $("#segNum");
  if ($segNumSelect) {
    $segNumSelect.on('change', function(){ 
      let currSeg = parseInt($segNumSelect.value); 
      demo.setCurrSeg(currSeg); 
      
      // remove the class so the animation will work on next page, cant do this until animation completes 
      let $clickHereCursor = $('#clickHereCursor');
      if ($clickHereCursor) $clickHereCursor.classList.remove('userHitPlay'); 
    }); 
  }

  //**************************************************************************** 
  // User has changed newbie/expert mode selection 
  //**************************************************************************** 
  // Framework-free event delegation loop maps directly onto your custom element factory structures
  let radioButtons = document.querySelectorAll("#selectNewbieOrExpert input[name='helpLevel']");
  radioButtons.forEach(radio => {
    let $radio = extendElement(radio);
    $radio.on('click', function(event) {
      // Find the active chosen option state natively via quick runtime properties
      let checkedRadio = document.querySelector('input[name="helpLevel"]:checked');
      let currentModeValue = checkedRadio ? checkedRadio.value : "";

      if (currentModeValue === "newbieMode") { 
        sessionStorage.setItem('UserIsNew', true); 
        console.log(' newbie mode'); 
      } else if (currentModeValue === "expertMode") { 
        // go to expert mode 
        console.log('expert mode'); 
        sessionStorage.setItem('UserIsNew', false); 
      } else { 
        console.log('Coding error on selection of user proficiency level'); 
      } 
    });
  });

}); 
