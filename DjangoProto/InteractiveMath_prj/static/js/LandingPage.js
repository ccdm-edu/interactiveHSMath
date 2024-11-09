'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {
   	 	
	// if the user has saved an old mode, resurrect it here
	let newbieMode = sessionStorage.getItem('UserIsNew');
	if (!newbieMode) {
		// first arrival to site, default newbie mode
		$("#newbieMode").prop('checked', true); // put them in newbie mode
		sessionStorage.setItem('UserIsNew', true);  // if user never changes anything, they are classed as newbie
	} else if (newbieMode.toLowerCase() === "false") {
		$("#expertMode").prop('checked', true); // put them in newbie mode
	} else {
		// user saved newbie mode or its their first arrival to site,
		sessionStorage.setItem('UserIsNew', true);  // if user never changes anything, they are classed as newbie
		$("#newbieMode").prop('checked', true); // put them in newbie mode
	}
	
	//Dont want a next button on this page so kill it here	
    $("#GoToNextPage").css('display', 'none');
    $("#GoToPreviousPage").css('display', 'none');

	//legal precedent states that on the home page, browserwrap must be in upper left of home page to be "more" valid */    
    //$('#LegalNotice_Consent').css('top', '100px');
    //********************************************************
	// create a "script" for the auto-demo tutorial, by now, all variables should be set
	//********************************************************	

	let SCRIPT_AUTO_DEMO = [
	{ segmentName: "Intro to Auto Demo",
	  headStartForAudioMillisec: 25000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: 'LandingPageSeg0',
			 	waitTimeMillisec: 1000}
			},
			{segmentActivity: "ANNOTATE_ELEMENT",
			 segmentParams: 
			 	{element: 'segNum', 
			 	 color: "red",
			 	 waitTimeMillisec: 2000}
			},
			{segmentActivity: "ANNOTATE_ELEMENT",
			 segmentParams: 
			 	{element: 'totalSeg', 
			 	 color: "green",
			 	 waitTimeMillisec: 7000}
			},
			{segmentActivity: "REMOVE_ALL_ANNOTATE_ELEMENT",
			 segmentParams: 
			 	{waitTimeMillisec: 5000}
			},
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'segNum',
			 	 action: "focus",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x: 30, y: 15},
			 	waitTimeMillisec: 17000}  // this is wait before you go on to next item
			},
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'segNum',
			 	 action: "focus",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	waitTimeMillisec: 19000}
			},
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'AdvancedTopicLink',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest", so neg x is south east
			 	 offset: {x: 0, y: 15},
			 	waitTimeMillisec: 1000}  // this is wait before you go on to next item
			},
			{segmentActivity: "SHOW_MODAL",
			 segmentParams:
			 	{element: 'AdvancedTopics',
			 	waitTimeMillisec: 0},  // wait time doesn't matter here
			 },
			 
	  ]
	},
	{ segmentName: "Welcome to this site...",
	  headStartForAudioMillisec: 8000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: 'LandingPageSeg1',
			 	waitTimeMillisec: 6000}
			},
						
			//we only have one item to work on so far so this is slim for now...
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'navbarDropdown',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest", so neg x is south east
			 	 offset: {x: 0, y: 25},
			 	waitTimeMillisec: 12000}  // this is wait before you go on to next item
			},
			// get rid of big red cursor but leave up the drop down menu
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'navbarDropdown',
			 	 action: "focus",
			 	waitTimeMillisec: 3000}
			},
			// we can't actually go to those pages else we loose this page and the autodemo stops
			// point to first dropdown menu (which for now is just Trig)
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'TrigFuncTopic.dropdown-toggle',  //dropdown-item',
			 	 action: "click",
			 	 offset: {x: 0, y: 19},
			 	waitTimeMillisec: 7000}  // this is wait before you go on to next item
			},
			// remove drop down menu
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'TrigFuncTopic.dropdown-toggle',
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
			 	{element:'TrigFuncTopic.dropdown-toggle',   //dropdown-item',
			 	 action: "focus",
			 	 offset: {x: 0, y: 19},
			 	waitTimeMillisec: 1000}  // this is wait doesnt matter
			},
			// move red cursor over to 1st fake page
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'firstFakePage.nav-link',
			 	 action: "focus",
			 	 offset: {x: 0, y: 19},
			 	waitTimeMillisec: 16000}  // this is wait before you go on to next item
			},
			// remove red cursor from 1st fake page
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'firstFakePage.nav-link',
			 	 action: "focus",
			 	 offset: {x: 0, y: 19},
			 	waitTimeMillisec: 1000}  // this is wait doesnt matter
			},
			// move red cursor over to 2nd fake page
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'secondFakePage.nav-link',
			 	 action: "focus",
			 	 offset: {x: 0, y: 19},
			 	waitTimeMillisec: 5000}  // this is wait before you go on to next item
			},
			// remove red cursor from 2nd fake page
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'secondFakePage.nav-link',
			 	 action: "focus",
			 	 offset: {x: 0, y: 19},
			 	waitTimeMillisec: 1000}  // this is wait doesnt matter
			},
			// move red cursor over to 3rd fake page
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'thirdFakePage.nav-link',
			 	 action: "focus",
			 	 offset: {x: 0, y: 19},
			 	waitTimeMillisec: 3000}  // this is wait before you go on to next item
			},
			// remove red cursor from 3rd fake page
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'thirdFakePage.nav-link',
			 	 action: "focus",
			 	 offset: {x: 0, y: 19},
			 	waitTimeMillisec: 1000}  // this is wait doesnt matter
			},
			// move red cursor over to 4rh fake page
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'fourthFakePage.nav-link',
			 	 action: "focus",
			 	 offset: {x: 0, y: 19},
			 	waitTimeMillisec: 3000}  // this is wait before you go on to next item
			},
			// remove red cursor from 4th fake page
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'fourthFakePage.nav-link',
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
			//***********END FAKE SUBLIST***************** 		
			// remove drop down menu
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'navbarDropdown',
			 	 action: "click",
			 	waitTimeMillisec: 5000}
			},

	  ]
	}
	];
	// read the config file and find the actual filenames and put in true values.  First call 'may' have to read
	// from file, all succeeding calls will be faster since read from local memory
   	getActualFilename(SCRIPT_AUTO_DEMO[0].segmentActivities[0].segmentParams.filenameURL)
   		.done(resp1 => {
			  	SCRIPT_AUTO_DEMO[0].segmentActivities[0].segmentParams.filenameURL = resp1;
			  	// these should be fast, in case previous one had to open file all this is now cached
			  	getActualFilename(SCRIPT_AUTO_DEMO[1].segmentActivities[0].segmentParams.filenameURL)
			  	.done(resp2 => SCRIPT_AUTO_DEMO[1].segmentActivities[0].segmentParams.filenameURL = resp2)
			  	});
	
    //****************************************************************************
    // User initiates autoDemo activity
    //****************************************************************************   
	//*** user clicks the start demo image, iniitalize everything
	let demo = new AutoDemo(SCRIPT_AUTO_DEMO);  // give the demo the full script
    $('#startAutoDemo').on('click', function(event) {  
		demo.prepDemoControls();
		demo.moveToRightForAutoDemo($('#selectNewbieOrExpert'))
		// need to move down legal stuff to make more room for demo list of subtopics
		$('#LegalNotice_Consent').css('top', '400px');
    });
    	
    //****************************************************************************
    // User has interacted with autoDemo controls
    //****************************************************************************

	// User has selected play
    $('#playSegment').on('click', function(){	

    	// this is only true for this pages demo...
    	let currSeg = parseInt($('#segNum').val());
    	if (currSeg === 1){
    		// only illustrative for the first segment on autodemo intro
	    	$('a[href="#AdvancedTopics"]').css('display', 'inline-block');
	    	$('a[href="#AdvancedTopics"]').css('visibility', 'visible');
    	}
    	demo.startDemo();
    });
    
    $('#stopSegment').on('click', function(){	
    	demo.stopThisSegment(false);  //we don't want to destroy controls box
    	// get rid of adv topics link, was for demo only
    	$('a[href="#AdvancedTopics"]').css('display', 'none');

    });
    
    $('#dismissAutoDemo').on('click', function(){	
    	// user is totally done, pause any demo segment in action and get rid of demo controls and go back to original screen
    	demo.stopThisSegment();  // may or may not be needed
    	
		$('#startAutoDemo').css('opacity', '1.0');  // make the start image visible
		
		// get rid of adv topics link, was for demo only
    	$('a[href="#AdvancedTopics"]').css('display', 'none');

    	demo.moveToLeftForAutoDemo($('#selectNewbieOrExpert'))
    	$('#LegalNotice_Consent').css('top', '');   //let it float back up where it belongs
    });

	$("#segNum").change(function(){
		let currSeg = parseInt($('#segNum').val());
		demo.setCurrSeg(currSeg);
		// remove the class so the animation will work on next page, cant do this until animation completes
    	$('#clickHereCursor').removeClass('userHitPlay'); 
	});

    //****************************************************************************
    // User has changed newbie/expert mode selection
    //****************************************************************************
	$("#selectNewbieOrExpert input[name='helpLevel']").on('click', function(event) {
		if($('input:radio[name=helpLevel]:checked').val() == "newbieMode"){
			sessionStorage.setItem('UserIsNew', true);
			console.log(' newbie mode');
		} else if($('input:radio[name=helpLevel]:checked').val() == "expertMode") {
			// go to expert mode
			console.log('expert mode');
			sessionStorage.setItem('UserIsNew', false);
		} else {
			console.log('Coding error on selection of user proficiency level');
		}    
	});   
     
})