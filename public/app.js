// $(document).ready(function() {
//   $(".noteForm").hide();
//   $(".savetheNote").hide();
//   $(".deletetheNote").hide();
//   $(".editting").hide();
// });

var id = "";
var titleofNote = "";

// This will run the scrape route to get the articles
$(document).on("click", "#scrape", function() {
  location.href = "/scrape";
});

// This will save the article to the saved page
$(document).on("click", ".save", function() {
  id = $(this).attr("data-id");
  $("#" + id).hide();

  $.ajax({
      method: "POST",
      url: "/articles/" + id,
      data: {
          savedNews: true
      }
  });
});

// This will delete an article from the saved page
$(document).on("click", ".deleteFromSaved", function() {
  id = $(this).attr("data-id");

  $.ajax({
      method: "POST",
      url: "/articles/" + id,
      data: {
          savedNews: false           
      }
  });
  location.href = "/saved";
});

// This will add a note to the related article
// $(document).on("click", ".saveNote", function() {
//   id = $(this).attr("data-id");

//   $.ajax({
//       method: "GET",
//       url: "/articles/" + id
//   })
//   .done(function(data) {

//       if (data.note) {
//           $(".noteTextArea").html(data.note.body);
//       }
//       $(".noteSection").show();
//       $(".editting").show();
//       $(".saveNote").show();
//       $(".deleteNote").show();
//       $(".saveOrDelete").hide();
//       $(".title").html(titleofNote);
//   });
// });

// This will save the user entered note to the db
$(document).on("click", ".saveNote", function() {
    id = $(this).attr("data-id");
    var body = $("." + id).val().trim();

  $.ajax({
      method: "POST",
      url: "/note",
      data: {
          body: body,
          id: id
      }
  })
  .done(function(data) {
      // This empties the form
      document.getElementById("noteForm").reset();
  });
});

// This deletes the note from the db
$(document).on("click", "#deleteNote", function() {
  $(".noteForm").fadeOut("slow");
  // This empties the form
  document.getElementById("noteForm").reset();
  $(".noteSection").hide();
  $(".editNote").hide();
  $(".editting").hide();
  $(".saveOrDelete").show();

  $.ajax({
      method: "POST",
      url: "/articles/" + id,
      data: {
          body: ""
      }
  })
  .done(function(data) { 
      $(".saveNote").hide();
      $(".deleteNote").hide();  
  });
});