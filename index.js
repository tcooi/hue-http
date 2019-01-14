const fs = require('fs');
const config = require('./config.json');

const express = require('express');
const bodyParser = require('body-parser');
let app = express();

let hue = require("node-hue-api");
let HueApi = hue.HueApi;
let lightState = hue.lightState;

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

let port = process.env.PORT || 8020;

let router = express.Router();

let host = config.ip,
    username = config.username,
    api = new HueApi(host, username),
    state = lightState.create();

let displayResult = function(result) {
    console.log(result);
};

let displayError = function(err) {
    console.error(err);
};

let displayJSON = function(result) {
    console.log(JSON.stringify(result, null, 2));
};

let saveJSON = function(result) {
  fs.writeFile('hueData.json', JSON.stringify(result, null, 2), 'utf8');
};

let serveJSON = function(cb) {
  fs.readFile('hueData.json', function(err, data) {
    cb(err, data);
  });
};

let getLights = function() {
  api.lights(function(err, lights) {
      if (err) throw err;
      displayJSON(lights);
      saveJSON(lights);
  });
};

// let on = function(lampId) {
//   api.setLightState(lampId, state.on())
//       .then(displayResult)
//       .fail(displayError)
//       .done();
// };

// let off = function(lampId) {
//   api.setLightState(lampId, state.off())
//       .then(displayResult)
//       .fail(displayError)
//       .done();
// };

let temperatureSet = function(lampId, value) {
  api.setLightState(lampId, state.ct(value))
      .then(displayResult)
      .fail(displayError)
      .done();
};

let brightnessInc = function(lampId, value) {
  api.setLightState(lampId, state.bri_inc(value))
      .then(displayResult)
      .fail(displayError)
      .done();
};

let brightnessSet = function(lampId, value) {
  api.setLightState(lampId, state.brightness(value))
      .then(displayResult)
      .fail(displayError)
      .done();
};

//get state of all lights
// router.route('/state')
//   .get(function(req, res) {
//     getLights();
//     serveJSON(function(err, data) {
//       res.writeHead(200, {'Content-Type' : 'application/json'});
//       res.end(data);
//       return;
//     });
//   });

//get state of all lights
router.route('/lights')
  .get((req, res) => {
    api.lights((err, data) => {
      if(err) throw err;
      console.log(data);
      let lights = data;
      res.json(lights)
    });
  });

//get all groups
router.route('/groups')
  .get((req, res) => {
    api.groups((err, data) => {
      if(err) throw err;
      console.log(data);
      let groups = data;
      res.json(groups)
    });
  });

//get specific light state
router.route('/:lampId/state')
  .get((req, res) => {
    api.lights((err, data) => {
      if(err) throw err;
      let lights = data.lights.filter(light => light.id === req.params.lampId);
      console.log('get light state');
      res.json(lights)
    });
  });

//turn on specific light
router.route('/:lampId/on')
  .get((req, res) => {
    api.setLightState(req.params.lampId, state.on())
      .then(console.log(`lamp ${req.params.lampId} turned on`))
      .done();
      res.json({msg: `lamp ${req.params.lampId} turned on`});
  });

//turn off specific light
router.route('/:lampId/off')
  .get((req, res) => {
    api.setLightState(req.params.lampId, state.off())
      .then(console.log(`lamp ${req.params.lampId} turned off`))
      .done();
      res.json({msg: `lamp ${req.params.lampId} turned off`})
  });

//toggle specific light
router.route('/:lampId/toggle')
  .get((req, res) => {
    api.lights((err, data) => {
      let lampId = req.params.lampId
      if(err) throw err;
      let light = data.lights.filter(light => light.id === lampId);
      if(light[0].state.on) {
        api.setLightState(lampId, state.off())
          .then(console.log('turned off'))
          .done()
      } else {
        api.setLightState(lampId, state.on())
          .then(console.log('turned on'))
          .done()
      }
      res.json(light[0].state.on)
    })
  });

//increase or decrease brightness
//range 0 to 254
//accepts values -254 to 254
router.route('/:lamp_id/brightness_inc/:value')
  .get(function(req, res) {
    brightnessInc(req.params.lamp_id, req.params.value);
    res.json({msg: `${req.params.value}`});
  });

//set brightness
//range 0% to 100%
router.route('/:lamp_id/brightness_set/:value')
  .get(function(req, res) {
    brightnessSet(req.params.lamp_id, req.params.value);
    res.json({});
  });

//kelvin incremental
router.route('/:lamp_id/temperature/:value')
  .get(function(req, res) {
    temperatureSet(req.params.lamp_id, req.params.value);
    res.json({});
  });


//kelvin set




app.use('/', router);

app.listen(port);
console.log('listening to port ' + port);
