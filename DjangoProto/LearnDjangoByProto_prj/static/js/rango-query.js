$(document).ready(function() {

	// tooltips using Bootstrap, enable them all but only hovering triggers them, not clicking
	// https://getbootstrap.com/docs/4.0/components/tooltips/
	$('[data-toggle="tooltip"]').tooltip({
    	trigger : 'hover'
	});
	
	//put your code in the document ready to ensure it doesn't execute till page
	// is fully loaded
	$('#about-btn').click(function() {
	alert('You clicked the button using JQuery!');
	});
	
	$('p').hover(
			//Hover requires two functions, first to do when you hover, next to do
			// when you leave hover
			function() {
				$(this).css('color', 'red');
			},
			function() {
				$(this).css('color', 'blue');
			});
	// so the msg text is on page and every time you click button, the stringlet
	// below gets appended to the text on the page...
	$('#about-btn').click(function() {
		msgStr = $('#msg').html();
		msgStr = msgStr + ' ooooooo, fancyyyyyy! ';
		$('#msg').html(msgStr);
	})
});

