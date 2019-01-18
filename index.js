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

//get state of all groups
router.route('/groups')
  .get((req, res) => {
    api.groups((err, data) => {
      if(err) throw err;
      console.log(data);
      let groups = data;
      res.json(groups)
    });
  });

//get state of light with Light ID
router.route('/light/:lampId/state')
  .get((req, res) => {
    api.lights((err, data) => {
      if(err) throw err;
      let light = data.lights.filter(light => light.id === req.params.lampId);
      console.log(`get light ${req.params.lampId} state`);
      res.json(light)
    });
  });

//turn on light with light ID
router.route('/light/:lampId/on')
  .get((req, res) => {
    api.setLightState(req.params.lampId, state.on())
      .then(console.log(`lamp ${req.params.lampId} turned on`))
      .done();
      res.json({msg: `lamp ${req.params.lampId} turned on`});
  });

//turn off light with light ID
router.route('/light/:lampId/off')
  .get((req, res) => {
    api.setLightState(req.params.lampId, state.off())
      .then(console.log(`lamp ${req.params.lampId} turned off`))
      .done();
      res.json({msg: `lamp ${req.params.lampId} turned off`})
  });

//toggle light with light ID
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

//set light brightness with light ID
router.route('/light/:lampId/brightness/set/:value')
  .get((req, res) => {
    api.setLightState(req.params.lampId, state.brightness(req.params.value))
    .then(console.log(`light ${req.params.lampId} brightness set to ${req.params.value}%`))
    .done();
    res.json({});
  });

//incremental light brightness adjustment with light ID
router.route('/light/:lampId/brightness/incremental/:value')
  .get((req, res) => {
    api.setLightState(req.params.lampId, state.bri_inc(req.params.value*2.54))
    .then(console.log(`light ${req.params.lampId} brightness ${req.params.value*2.54} / ${req.params.value}%`))
    .done();
  });

//set light temperature with light ID
router.route('/light/:lampId/temperature/set/:value')
  .get((req, res) => {
    let lightId = req.params.lampId;
    let value = req.params.value;
    api.setLightState(lightId, state.ct(153+(value*3.47)), (err, data) => {
      if(err) throw err;
      console.log(`light ${lightId} temperature set to ${value}%`);
      api.lights((err, data) => {
        if(err) throw err;
        let light = data.lights.filter(light => light.id === lightId);
        res.json(light)
      });
    });
  });

//incremental light temperature adjustment with light ID
router.route('/light/:lampId/temperature/incremental/:value')
  .get((req, res) => {
    let lightId = req.params.lampId;
    let value = req.params.value;
    api.setLightState(lightId, state.ct_inc(value*3.47), (err, data) => {
      if(err) throw err;
      console.log(`light ${lightId} temperature adjusted ${value}%`);
      api.lights((err, data) => {
        if(err) throw err;
        let light = data.lights.filter(light => light.id === lightId);
        res.json(light);
      });
    });
  });

//get state of group with group ID
router.route('/group/:groupId/state')
  .get((req, res) => {
    api.groups((err, data) => {
      if(err) throw err;
      let group = data.filter(group => group.id === req.params.groupId);
      console.log('get group state');
      res.json(group)
    });
  });

//turn on group with group ID
router.route('/group/:groupId/on')
  .get((req, res) => {
    api.setGroupLightState(req.params.groupId, state.on())
      .then(console.log(`group ${req.params.groupId} turned on`))
      .done()
      res.json({})
  });

//turn off group with group ID
router.route('/group/:groupId/off')
  .get((req, res) => {
    api.setGroupLightState(req.params.groupId, state.off())
      .then(console.log(`group ${req.params.groupId} turned off`))
      .done()
      res.json({})
  })

//toggle group with group ID

//set group brightness wiith group ID

//incremental group brightness with group ID

//set group temperature with group ID

//incremental group temperature adjustment with group ID

//get state of group with groupname
router.route('/groupname/:groupName/state')
  .get((req, res) => {
    api.groups((err, data) => {
      if(err) throw err;
      let groups = data.filter(group => group.name === req.params.groupName);
      console.log(`get group ${req.params.groupName} state `);
      res.json(groups);
    });
  });

//turn on group with groupname

//turn off group with groupname

//toggle group with groupname

//set group brightness with groupname

//incremental group brightness adjustment with groupname

//set group temperature with groupname

//incremental group temperature adjustment with groupname


//get scenes
//todo

//set scene
//todo


//color set
//todo

app.use('/', router);
app.listen(port);
console.log('listening to port ' + port);
