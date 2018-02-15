var id = "";
var titleofNote = "";

// This will save the article to the saved page
$(document).on("click", ".save", function() {
  id = $(this).attr("data-id");
  $("#" + id).hide();
    console.log("Save button clicked!");
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