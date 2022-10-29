'use strict'
//JQuery, dont do this script until document DOM objects are loaded and ready
$(function() {

    //********************************************************
	// create a "script" for the auto-demo tutorial, by now, all variables should be set
	//********************************************************	
    
	const SCRIPT_AUTO_DEMO = [
	{ segmentName: "Intro to Auto Demo",
	  headStartForAudioMillisec: 10000, // generally the audio is longer than the cursor/annotate activity
	  segmentActivities: 
	  [
			{segmentActivity: "PLAY_AUDIO",
			 segmentParams: 
			 	{filenameURL: '../../static/AudioExpln/LandingPage_Seg0.mp3',
			 	waitTimeMillisec: 0}
			},
			{segmentActivity: "ANNOTATE_ELEMENT",
			 segmentParams: 
			 	{element: 'segNum', 
			 	 color: "red",
			 	 waitTimeMillisec: 5000}
			},
			{segmentActivity: "ANNOTATE_ELEMENT",
			 segmentParams: 
			 	{element: 'totalSeg', 
			 	 color: "green",
			 	 waitTimeMillisec: 8000}
			},
			{segmentActivity: "REMOVE_ALL_ANNOTATE_ELEMENT",
			 segmentParams: 
			 	{waitTimeMillisec: 1000}
			},
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'segNum',
			 	 action: "focus",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	 offset: {x: 15, y: 20},
			 	waitTimeMillisec: 16000}  // this is wait before you go on to next item
			},
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'segNum',
			 	 action: "focus",
			 	 // positive values for offset x and y move the cursor "southwest"
			 	waitTimeMillisec: 8000}
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
			 	{filenameURL: '../../static/AudioExpln/LandingPage_Seg1.mp3',
			 	waitTimeMillisec: 6000}
			},
			//we only have one item to work on so far so this is slim for now...
			{segmentActivity: "ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'navbarDropdown',
			 	 action: "click",
			 	 // positive values for offset x and y move the cursor "southwest", so neg x is south east
			 	 offset: {x: 0, y: 25},
			 	waitTimeMillisec: 8000}  // this is wait before you go on to next item
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
			 	{element:'TrigFuncTopic.dropdown-item',
			 	 action: "focus",
			 	 offset: {x: 0, y: 19},
			 	waitTimeMillisec: 15000}  // this is wait before you go on to next item
			},
			// remove drop down menu
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'navbarDropdown',
			 	 action: "click",
			 	waitTimeMillisec: 5000}
			},
			// remove red cursor
			{segmentActivity: "REMOVE_ACT_ON_ELEMENT", 
			 segmentParams:
			 	{element:'TrigFuncTopic.dropdown-item',
			 	 action: "focus",
			 	 offset: {x: 0, y: 19},
			 	waitTimeMillisec: 1000}  // this is wait doesnt matter
			},
	  ]
	}
	];
		
    //****************************************************************************
    // User initiates autoDemo activity
    //****************************************************************************   
	//*** user clicks the start demo image, iniitalize everything
	let demo = new AutoDemo(SCRIPT_AUTO_DEMO);  // give the demo the full script
    $('#startAutoDemo').on('click', function(event) {  
       	// flash a "click here" image to get them to hit play
    	$('#clickHereCursor').addClass('userHitPlay'); 	
		//first get rid of "lets do the demo" image and put up the demo controls
		$('#startAutoDemo').css('display', 'none');
		$('#autoDemoCtls').css('display', 'inline-block');
		$('#autoDemoCtls').css('visibility', 'visible');
		// fill in the controls properly
		//$('#segName').html('<b>' + SCRIPT_AUTO_DEMO[0].segmentName + '</b>');
		$('#totalSeg').text('/' + SCRIPT_AUTO_DEMO.length);
		$('#segNum').attr('max', SCRIPT_AUTO_DEMO.length);
		demo.setCurrSeg(1);  // default start at begin
		$('#stopSegment').prop('disabled', true);  // when first start up, can only hit play
				
    });
    	
    //****************************************************************************
    // User has interacted with autoDemo controls
    //****************************************************************************

	// User has selected play
    $('#playSegment').on('click', function(){	
    	// activate pause and disable play
    	$(this).prop('disabled', true);  // disable play once playing
    	$('#stopSegment').prop('disabled', false);  // reactivate pause
    	// this is only true for this pages demo...
    	let currSeg = parseInt($('#segNum').val());
    	if (currSeg === 1){
    		// only illustrative for the first segment on autodemo intro
	    	$('a[href="#AdvancedTopics"]').css('display', 'inline-block');
	    	$('a[href="#AdvancedTopics"]').css('visibility', 'visible');
    	}
    	demo.setCurrSeg(currSeg);
    	demo.startDemo();
		// remove the class so the animation will work on next page, cant do this until animation completes
    	$('#clickHereCursor').removeClass('userHitPlay'); 
    });
    
    $('#stopSegment').on('click', function(){	
    	demo.stopThisSegment();
    	// change icons so play is now enabled and stop is disabled
    	$(this).prop('disabled', true);  // disable play once playing
    	$('#playSegment').prop('disabled', false);  // reactivate play 
    	// get rid of adv topics link, was for demo only
    	$('a[href="#AdvancedTopics"]').css('display', 'none');
    	// remove the class so the animation will work on next page, cant do this until animation completes
    	$('#clickHereCursor').removeClass('userHitPlay'); 
    });
    
    $('#dismissAutoDemo').on('click', function(){	
    	// user is totally done, pause any demo segment in action and get rid of demo controls and go back to original screen
    	demo.stopThisSegment();  // may or may not be needed
    	
		$('#startAutoDemo').css('display', 'inline-block');
		$('#startAutoDemo').css('opacity', '1.0');
		// pull the control panel for autodemo off the page
		$('#autoDemoCtls').css('display', 'none');
		
		// get rid of adv topics link, was for demo only
    	$('a[href="#AdvancedTopics"]').css('display', 'none');
    	// remove the class so the animation will work on next page, cant do this until animation completes
    	$('#clickHereCursor').removeClass('userHitPlay'); 
    });

	$("#segNum").change(function(){
		let currSeg = parseInt($('#segNum').val());
		demo.setCurrSeg(currSeg);
		// remove the class so the animation will work on next page, cant do this until animation completes
    	$('#clickHereCursor').removeClass('userHitPlay'); 
	});

 
})