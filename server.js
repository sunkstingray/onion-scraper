var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var request = require("request");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static("public"));


// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoHeadlines";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  // useMongoClient: true
});

var mydb = mongoose.connection;

// If there are any errors connecting to the db
mydb.on("error", function(error) {
    console.log("Mongoose Error: ", error);
  });
  
  // For a successful connection
  mydb.once("open", function() {
    console.log("Successfully connected to the Mongoose database!");
  });

// For handlebars, to define the main layout
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Routes

// app.get("/", function(req, res) {
//     res.render("index");
// });

// This route will scrape the Onion's website
app.get("/", function(req, res) {
    console.log("-------INDEX ROUTE-------");
    // Each time the user "scrapes", this will remove any article the user hasn't previously saved
    db.Article.find({"savedNews":false}).remove().exec();

    request("http://www.nytimes.com/", function(error, response, html) {
        var newArray = [];
        var entry = {};
        var $ = cheerio.load(html);

        $("article").each(function(i, element) {
            // This will only allow 10 results
            if (i >= 10) {
               return false;
            }
            var result = {};
            
            result.title = $(this).children('h2').children('a').text().trim();
            result.link = $(this).children('h2').children('a').attr('href');
            result.excerpt = $(this).children('p.summary').text().trim();
            //console.log($(this));
            result.savedNews = false;
            // result.pic = $(this).children(".thumb").text();
            //console.log(result);
            entry = new db.Article(result);

            // For handlebars to recognize the id
            //entry.newsId = entry._id;

            if (result.title){
            //newArray.push(entry);
            
            // Create a new Article using the `result` object built from scraping
            db.Article.create(result)
                .then(function(dbArticle) {
                // View the added result in the console
                console.log(dbArticle);
                })
                .catch(function(err) {
                // If an error occurred, send it to the client
                return res.json(err);
                });
            }
        });
        //var news = {newsStuff: newArray}
        //res.render("index", news);
        res.redirect("/index");
    });

});




// // This route will get all the saved articles from the db
app.get("/saved", function(req, res) {
    console.log("-------SAVED ROUTE-------");
    db.Article.find({"savedNews": true }, function(error, doc) {
        if (error) {
            res.send(error);
        } else {
            if (doc.length === 0) {
                res.redirect("/");
            } else {
                var news = {newsStuff: doc}
                res.render("saved", news);
            }
        }
    })
});


// // This route will get all the notes for an article
app.get("/notes/:article", function(req, res) {
    console.log("-------NOTES ROUTE-------");
    var noteTitle;
    db.Note.find({"article": req.params.article}, function(error, doc) {
        if (error) {
            res.send(error);
        } else {
            var noteDoc = doc;
            db.Article.find({"_id":req.params.article}, function(error, doc) {
                if (error) {
                    res.send(error);
                } else {
                    noteTitle = doc[0].title;
                    console.log("title:"+noteTitle);
                    var notes = {
                        noteList: noteDoc,
                        articleId: req.params.article,
                        noteTitle: noteTitle
                    }
                    res.render("notes", notes);
                }
            });

            // var notes = {
            //     noteList: doc,
            //     articleId: req.params.article,
            //     noteTitle: noteTitle
            // }
            // res.render("notes", notes);
            }
    })
});


// // This route will get the scrapped articles from the db
app.get("/index", function(req, res) {
    console.log("-------SCRAPED INDEX ROUTE-------");
    db.Article.find({"savedNews":false}, function(error, doc) {
        if (error) {
            res.send(error);
        } else {
            if (doc.length === 0) {
                res.redirect("/");
            } else {
                var news = { newsStuff: doc}
                res.render("index", news);
            }
        }
    });
});

// // This route selects a specific id and will save or delete the article
app.post("/articles/:id", function(req, res) {

    console.log("---------Save and Delete Path----------")
    var savedNews = req.body.savedNews;

    if (savedNews === "true") {
        db.Article.findOneAndUpdate({ "_id": req.params.id }, { "savedNews": true } )
            .exec(function(err, doc) {
                if (err) {
                    console.log(err);
                } else { 
                    res.send(doc);
                }
            });
    } else if (savedNews === "false") {
        db.Article.findOneAndUpdate({ "_id": req.params.id }, { "savedNews": false } )
            .exec(function(err, doc) {
                if (err) {
                    console.log(err);
                } else { 
                    res.send(doc);
                }
            });
    }
});

// // This route adds a note to an article
app.post("/notes/:article", function(req, res) {
    console.log("*********** NOTE ADDED **********");

    var result = {};

    result.body = req.body.noteBody;
    result.article = req.params.article;

    entry = new db.Note(result);
    
    db.Note.create(entry)
    .then(function(dbNote) {
    // View the added result in the console
    console.log(dbNote);
    })
    .catch(function(err) {
    // If an error occurred, send it to the client
    return res.json(err);
    });
    res.redirect("/notes/" + req.params.article);
});

// // This route deletes a note from an article
app.post("/notes/delete/:id.:article", function(req, res) {
    console.log("*********** NOTE DELETED **********");

    var id = req.params.id;
    var article = req.params.article;
    
    db.Note.findByIdAndRemove(id)
    .then(function(dbNote) {
    // View the added result in the console
    console.log(dbNote);
    })
    .catch(function(err) {
    // If an error occurred, send it to the client
    return res.json(err);
    });
    res.redirect("/notes/" + article);
});

// // This route will show the note on a specific article
// app.get("/articles/:id", function(req, res) {
//     db.Article.findOne({ "_id": req.params.id })
//     .populate("note")
//     .exec(function(error, doc) {
//         if (error) {
//             console.log(error);
//         } else {
//             res.json(doc);
//         }
//     });
// });

// Start the server
app.listen(PORT, function() {
  console.log("NYT Scraper running on port " + PORT + "!");
});
