$(document).ready(function() {
	$('#like_btn').click(function() {
		var catecategoryIdVar;
		catecategoryIdVar = $(this).attr('data-categoryid');
		//This is async, it doesn't wait for the server to respond but when server
		// finaly returns number, it comes here and finishes.
		//PROBLEM is, when you reload page, the same user gets the LIKE button again...
		// clicking on a hidden button does not seem to increase the likes...
		$.get('/Rango/like_category',
				{'category_id': catecategoryIdVar},
				function(data) {
					$('#like_count').html(data);
					$('#like_btn').hide()
				})	
	});
	
	$('#search-input').keyup(function() {
		var query;
		query = $(this).val();
		// another async function call and the internal function is called when
		// server responds
		$.get('/Rango/suggest/',
				{'suggestion': query},
				function(data) {
					$('#categories-listing').html(data);
				})
	})
});