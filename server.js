var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
var path = require('path');

var Note = require('./models/Note.js');
var Article = require('./models/Article.js');

var request = require('request');
var cheerio = require('cheerio');
var axios = require('axios');

mongoose.Promise = Promise;

var port = process.env.PORT || 3030;

var app = express();

app.use(logger('dev'));
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);

// make public a static directory
app.use(express.static('public'));

var exphbs = require('express-handlebars');

app.engine(
  'handlebars',
  exphbs({
    defaultLayout: 'main',
    partialsDir: path.join(__dirname, '/views/layouts/partials')
  })
);
app.set('view engine', 'handlebars');

// configure mongo to work with mlab when deployed and locally
var MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/scraper';
mongoose.Promise = Promise;
mongoose.connect(
  MONGODB_URI,
  { useNewUrlParser: true }
);
var db = mongoose.connection;

db.on('error', function(error) {
  console.log('Mongoose Error: ', error);
});

db.once('open', function() {
  console.log('Mongoose connection successful.');
});

app.get('/', function(req, res) {
  Article.find({ saved: false }, function(error, data) {
    var hbsObject = {
      article: data
    };
    console.log(hbsObject);
    res.render('home', hbsObject);
  });
});

app.get('/saved', function(req, res) {
  Article.find({ saved: true })
    .populate('notes')
    .exec(function(error, articles) {
      var hbsObject = {
        article: articles
      };
      res.render('saved', hbsObject);
    });
});

// get request to scrape shoptalkshow
app.get('/scrape', function(req, res) {
  // grab html body
  axios.get('https://shoptalkshow.com/archives/').then(function(response) {
    var $ = cheerio.load(response.data);

    // use <a> tags with archive-block class
    $('a.archive-block').each(function(i, element) {
      // Save an empty result object
      var result = {};

      // grab text and href, add them to result object
      result.title = $(this).text();
      result.link = $(this).attr('href');

      //create new entry with article model using results object
      var entry = new Article(result);

      // save to mongo
      entry.save(function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          console.log(doc);
        }
      });
    });
    res.send('Scrape Complete');
  });
});

// get articles from db
app.get('/articles', function(req, res) {
  Article.find({}, function(error, doc) {
    if (error) {
      console.log(error);
    } else {
      res.json(doc);
    }
  });
});

// get article by id
app.get('/articles/:id', function(req, res) {
  Article.findOne({ _id: req.params.id })
    .populate('note')
    .exec(function(error, doc) {
      if (error) {
        console.log(error);
      } else {
        res.json(doc);
      }
    });
});

// post to save article using _i
app.post('/articles/save/:id', function(req, res) {
  Article.findOneAndUpdate({ _id: req.params.id }, { saved: true }).exec(
    function(err, doc) {
      if (err) {
        console.log(err);
      } else {
        res.send(doc);
      }
    }
  );
});

// delete an episode
app.post('/articles/delete/:id', function(req, res) {
  Article.findOneAndUpdate(
    { _id: req.params.id },
    { saved: false, notes: [] }
  ).exec(function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      res.send(doc);
    }
  });
});

// make new note
app.post('/notes/save/:id', function(req, res) {
  var newNote = new Note({
    body: req.body.text,
    article: req.params.id
  });
  console.log(req.body);
  newNote.save(function(error, note) {
    if (error) {
      console.log(error);
    }
    // Otherwise
    else {
      Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { notes: note } }
      ).exec(function(err) {
        if (err) {
          console.log(err);
          res.send(err);
        } else {
          res.send(note);
        }
      });
    }
  });
});

// delete note
app.delete('/notes/delete/:note_id/:article_id', function(req, res) {
  Note.findOneAndRemove({ _id: req.params.note_id }, function(err) {
    if (err) {
      console.log(err);
      res.send(err);
    } else {
      Article.findOneAndUpdate(
        { _id: req.params.article_id },
        { $pull: { notes: req.params.note_id } }
      ).exec(function(err) {
        if (err) {
          console.log(err);
          res.send(err);
        } else {
          res.send('Note Deleted');
        }
      });
    }
  });
});

app.listen(port, function() {
  console.log('App running on port ' + port);
});
