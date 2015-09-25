var express = require('express');
var app = express();
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');

app.set('port', (process.env.PORT || 3000));

app.use(express.static(path.join(__dirname, '/public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/', express.static(path.join(__dirname, 'public')));

app.get('/favorites', function(req, res){
  var data = fs.readFileSync('./data.json');
  res.setHeader('Content-Type', 'application/json');
  res.send(data);
});

app.post('/favorites', function(req, res){
  if(!req.body.oid || !req.body.title){
    res.send("Error");
      return;
  }   
  
    var data = JSON.parse(fs.readFileSync('./data.json'));
    data[req.body.oid] = req.body.title;
    fs.writeFile('./data.json', JSON.stringify(data));
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
});

app.listen(app.get('port'), function(){
    console.log("Listening on " + app.get('port'));
});
