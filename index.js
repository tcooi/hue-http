var fs = require('fs');
var config = require('./config.json');

var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var hue = require("node-hue-api");
var HueApi = hue.HueApi;
var lightState = hue.lightState;

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

var port = process.env.PORT || 8020;

var router = express.Router();

router.get('/', function(req, res) {
  res.send('hello');
});

//get state of all lights
router.route('/state')
  .get(function(req, res) {
    getLights();
    // res.json({msg: 'hi'});
    serveJSON(function(err, data) {
      res.writeHead(200, {'Content-Type' : 'application/json'});
      res.end(data);
      return;
    });
  });

//turn on specified light
router.route('/:lamp_id/on')
  .get(function(req, res) {
    on(req.params.lamp_id);
    res.json({msg : 'lamp ' + req.params.lamp_id + ' on'});
  });

//turn off specified light
router.route('/:lamp_id/off')
  .get(function(req, res) {
    off(req.params.lamp_id);
    res.json({msg : 'lamp ' + req.params.lamp_id + ' off'});
  });

//if specified light is on = turn off
//if specified light is off = turn on
router.route('/:lamp_id/s')
  .get(function(req, res) {
    s(req.params.lamp_id);
    res.json({msg: 'lamp'});
  });

//increase or decrease brightness
//range 0 to 254
//accepts values -254 to 254
router.route('/:lamp_id/brightness_inc/:value')
  .get(function(req, res) {
    brightnessInc(req.params.lamp_id, req.params.value);
    res.json({});
  });

router.route('/:lamp_id/temperature/:value')
  .get(function(req, res) {
    temperatureSet(req.params.lamp_id, req.params.value);
    res.json({});
  });

//set brightness
//range 0% to 100%
router.route('/:lamp_id/brightness_set/:value')
  .get(function(req, res) {
    brightnessSet(req.params.lamp_id, req.params.value);
    res.json({});
  });
app.use('/hue', router);

app.listen(port);
console.log('listening to port ' + port);

var host = config.ip,
    username = config.username,
    api = new HueApi(host, username),
    state = lightState.create();

var displayResult = function(result) {
    console.log(result);
};

var displayError = function(err) {
    console.error(err);
};

var displayJSON = function(result) {
    console.log(JSON.stringify(result, null, 2));
};

var saveJSON = function(result) {
  fs.writeFile('hueData.json', JSON.stringify(result, null, 2), 'utf8');
};

var serveJSON = function(cb) {
  fs.readFile('hueData.json', function(err, data) {
    cb(err, data);
  });
};

var getLights = function() {
  api.lights(function(err, lights) {
      if (err) throw err;
      displayJSON(lights);
      saveJSON(lights);
  });
};

var on = function(lampId) {
  api.setLightState(lampId, state.on())
      .then(displayResult)
      .fail(displayError)
      .done();
};

var off = function(lampId) {
  api.setLightState(lampId, state.off())
      .then(displayResult)
      .fail(displayError)
      .done();
};

var s = function(lampId) {
  api.lights(function(err, lights) {
    if(err) throw err;
    if(lights.lights[0].state.on === true) {
      off(lampId);
    }else {
      on(lampId);
    }
  });
};

var temperatureSet = function(lampId, value) {
  api.setLightState(lampId, state.ct(value))
      .then(displayResult)
      .fail(displayError)
      .done();
};

var brightnessInc = function(lampId, value) {
  api.setLightState(lampId, state.bri_inc(value))
      .then(displayResult)
      .fail(displayError)
      .done();
};

var brightnessSet = function(lampId, value) {
  api.setLightState(lampId, state.brightness(value))
      .then(displayResult)
      .fail(displayError)
      .done();
};

var onOff = function(lampId) {
//if on, turn off
//if off, turn on
};
