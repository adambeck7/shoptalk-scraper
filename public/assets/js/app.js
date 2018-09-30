//make scrape button perform scrape
$('#scrape').on('click', function() {
  $.ajax({
    method: 'GET',
    url: '/scrape'
  }).done(function(data) {
    console.log(data);
    window.location = '/';
  });
});

//assign save button action
$('.save').on('click', function() {
  var thisId = $(this).attr('data-id');
  $.ajax({
    method: 'POST',
    url: '/articles/save/' + thisId
  }).done(function(data) {
    window.location = '/';
  });
});

//remove from saved button action
$('.delete').on('click', function() {
  var thisId = $(this).attr('data-id');
  $.ajax({
    method: 'POST',
    url: '/articles/delete/' + thisId
  }).done(function(data) {
    window.location = '/saved';
  });
});

//save note action
$('.saveNote').on('click', function() {
  var thisId = $(this).attr('data-id');
  if (!$('#noteText' + thisId).val()) {
    alert('please enter a note to save');
  } else {
    $.ajax({
      method: 'POST',
      url: '/notes/save/' + thisId,
      data: {
        text: $('#noteText' + thisId).val()
      }
    }).done(function(data) {
      console.log(data);
      $('#noteText' + thisId).val('');
      $('.modalNote').modal('hide');
      window.location = '/saved';
    });
  }
});

//delete note button
$('.deleteNote').on('click', function() {
  var noteId = $(this).attr('data-note-id');
  var articleId = $(this).attr('data-article-id');
  $.ajax({
    method: 'DELETE',
    url: '/notes/delete/' + noteId + '/' + articleId
  }).done(function(data) {
    console.log(data);
    $('.modalNote').modal('hide');
    window.location = '/saved';
  });
});
