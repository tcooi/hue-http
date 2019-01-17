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


let temperatureSet = function(lampId, value) {
  api.setLightState(lampId, state.ct(value))
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
router.route('/light/:lampId/state')
  .get((req, res) => {
    api.lights((err, data) => {
      if(err) throw err;
      let lights = data.lights.filter(light => light.id === req.params.lampId);
      console.log(`get light ${req.params.lampId} state`);
      res.json(lights)
    });
  });

//turn on specific light
router.route('/light/:lampId/on')
  .get((req, res) => {
    api.setLightState(req.params.lampId, state.on())
      .then(console.log(`lamp ${req.params.lampId} turned on`))
      .done();
      res.json({msg: `lamp ${req.params.lampId} turned on`});
  });

//turn off specific light
router.route('/light/:lampId/off')
  .get((req, res) => {
    api.setLightState(req.params.lampId, state.off())
      .then(console.log(`lamp ${req.params.lampId} turned off`))
      .done();
      res.json({msg: `lamp ${req.params.lampId} turned off`})
  });

//toggle specific light
router.route('/light/:lampId/toggle')
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
    });
  });

//light set brightness
router.route('/light/:lampId/brightness/set/:value')
  .get((req, res) => {
    api.setLightState(req.params.lampId, state.brightness(req.params.value))
    .then(console.log(`light ${req.params.lampId} brightness set to ${req.params.value}%`))
    .done();
    res.json({});
  });

//light incremental brightness
router.route('/light/:lampId/brightness/incremental/:value')
  .get((req, res) => {
    api.setLightState(req.params.lampId, state.bri_inc(req.params.value*2.54))
    .then(console.log(`light ${req.params.lampId} brightness ${req.params.value*2.54} / ${req.params.value}%`))
    .done();
  });

//get specific group state with group ID
router.route('/group/:groupId/state')
  .get((req, res) => {
    api.groups((err, data) => {
      if(err) throw err;
      let groups = data.filter(group => group.id === req.params.groupId);
      console.log('get group state');
      res.json(groups)
    });
  });

//turn on specific group with group ID
router.route('/group/:groupId/on')
  .get((req, res) => {
    api.setGroupLightState(req.params.groupId, state.on())
      .then(console.log(`group ${req.params.groupId} turned on`))
      .done()
      res.json({})
  });

//turn off specific groups with group ID
router.route('/group/:groupId/off')
  .get((req, res) => {
    api.setGroupLightState(req.params.groupId, state.off())
      .then(console.log(`group ${req.params.groupId} turned off`))
      .done()
      res.json({})
  })

//group set brightness

//group incremental brightness

//get specific group state with groupname
router.route('/groupname/:groupName/state')
  .get((req, res) => {
    api.groups((err, data) => {
      if(err) throw err;
      let groups = data.filter(group => group.name === req.params.groupName);
      console.log(`get group ${req.params.groupName} state `);
      res.json(groups);
    });
  });


//kelvin incremental
router.route('/:lamp_id/temperature/:value')
  .get(function(req, res) {
    temperatureSet(req.params.lamp_id, req.params.value);
    res.json({});
  });


//kelvin set


//get scene
//todo

//set scene
//todo

//get rgb
//todo

//rgb set
//todo

//color set
//todo

app.use('/', router);

app.listen(port);
console.log('listening to port ' + port);
