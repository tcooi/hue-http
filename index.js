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
      console.log('get state of lamps');
      res.json(data);
    });
  });

//get state of all groups
router.route('/groups')
  .get((req, res) => {
    api.groups((err, data) => {
      if(err) throw err;
      console.log('get state of groups');
      res.json(data);
    });
  });

//get state of light with Light ID
router.route('/light/:lightId/state')
  .get((req, res) => {
    let lightId = req.params.lightId;
    api.lights((err, data) => {
      if(err) throw err;
      let light = data.lights.filter(light => light.id === lightId);
      console.log(`get lamp ${lightId} state`);
      api.lightStatusWithRGB(lightId, (err, data) => {
        if(err) {console.log(err)}
        res.json({data: light, rgb: data.state.rgb});
      })
    });
  });

//turn on light with light ID
router.route('/light/:lightId/on')
  .get((req, res) => {
    let lightId = req.params.lightId;
    api.setLightState(lightId, state.on(), (err, data) => {
      if(err) throw err;
      console.log(`lamp ${lightId} turned on`);
      api.lights((err, data) => {
        if(err) throw err;
        let light = data.lights.filter(light => light.id === lightId);
        res.json({msg: `lamp ${lightId} turned on`, data: light});
      });
    });
  });

//turn off light with light ID
router.route('/light/:lightId/off')
  .get((req, res) => {
    let lightId = req.params.lightId;
    api.setLightState(lightId, state.off(), (err, data) => {
      if(err) throw err;
      console.log(`lamp ${lightId} turned off`);
      api.lights((err, data) => {
        if(err) throw err;
        let light = data.lights.filter(light => light.id === lightId);
        res.json({msg: `lamp ${lightId} turned off`, data: light});
      });
    });
  });

//toggle light with light ID
router.route('/light/:lightId/toggle')
  .get((req, res) => {
    let lightId = req.params.lightId;
    api.lights((err, data) => {
      if(err) throw err;
      let light = data.lights.filter(light => light.id === lightId);
      if(light[0].state.on) {
        api.setLightState(lightId, state.off(), (err, data) => {
          if(err) throw err;
          console.log(`lamp ${lightId} turned off`);
        });
      } else {
        api.setLightState(lightId, state.on(), (err, data) => {
          if(err) throw err;
          console.log(`lamp ${lightId} turned on`);
        });
      }
      res.json(!light[0].state.on);
    });
  });

//set light brightness with light ID
router.route('/light/:lightId/brightness/set/:value')
  .get((req, res) => {
    let lightId = req.params.lightId;
    let value = req.params.value;
    api.setLightState(lightId, state.brightness(value), (err, data) => {
      if(err) throw err;
      console.log(`light ${lightId} brightness set to ${value}%`);
      api.lights((err, data) => {
        if(err) throw err;
        let light = data.lights.filter(light => light.id === lightId);
        res.json(light);
      });
    });
  });

//incremental light brightness adjustment with light ID
router.route('/light/:lightId/brightness/incremental/:value')
  .get((req, res) => {
    let lightId = req.params.lightId;
    let value = req.params.value;
    api.setLightState(lightId, state.bri_inc(value*2.54), (err, data) => {
      if(err) throw err;
      console.log(`light ${lightId} brightness adjusted ${value}%`);
      api.lights((err, data) => {
        if(err) throw err;
        let light = data.lights.filter(light => light.id === lightId);
        res.json(light);
      });
    });
  });

//set light temperature with light ID
router.route('/light/:lightId/temperature/set/:value')
  .get((req, res) => {
    let lightId = req.params.lightId;
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
router.route('/light/:lightId/temperature/incremental/:value')
  .get((req, res) => {
    let lightId = req.params.lightId;
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
    let groupId = req.params.groupId;
    api.setGroupLightState(groupId, state.on(), (err, data) => {
      console.log(`group ${groupId} turned on`);
      api.groups((err, data) => {
        if(err) throw err;
        let group = data.filter(group => group.id === groupId);
        res.json(group);
      });
    });
  });

//turn off group with group ID
router.route('/group/:groupId/off')
  .get((req, res) => {
    let groupId = req.params.groupId;
    api.setGroupLightState(groupId, state.off(), (err, data) => {
      console.log(`group ${groupId} turned off`);
      api.groups((err, data) => {
        if(err) throw err;
        let group = data.filter(group => group.id === groupId);
        res.json(group);
      })
    });
  });

//toggle group with group ID
router.route('/group/:groupId/toggle')
  .get((req, res) => {
    let groupId = req.params.groupId;
    api.groups((err, data) => {
      if(err) throw err;
      let group = data.filter(group => group.id === groupId);
      if(group[0].state.any_on) {
        api.setGroupLightState(groupId, state.off(), (err, data) => {
          if(err) throw err;
          console.log(`group ${groupId} turned off`);
        });
      } else {
        api.setGroupLightState(groupId, state.on(), (err, data) => {
          if(err) throw err;
          console.log(`group ${groupId} turned on`);
        });
      }
      res.json(group);
    });
  });

//set group brightness with group ID
router.route('/group/:groupId/brightness/set/:value')
  .get((req, res) => {
    let groupId = req.params.groupId;
    let value = req.params.value;
    api.setGroupLightState(groupId, state.brightness(value), (err, data) => {
      if(err) throw err;
      console.log(`group ${groupId} brightness set to ${value}%`);
      api.groups((err, data) => {
        if(err) throw err;
        let group = data.filter(group => group.id === groupId);
        res.json(group);
      });
    });
  });

//incremental group brightness with group ID
router.route('/group/:groupId/brightness/incremental/:value')
  .get((req, res) => {
    let groupId = req.params.groupId;
    let value = req.params.value;
    api.setGroupLightState(groupId, state.bri_inc(value*2.54), (err, data) => {
      if(err) throw err;
      console.log(`group ${groupId} brightness adjusted ${value}%`);
      api.groups((err, data) => {
        if(err) throw err;
        let group = data.filter(group => group.id === groupId);
        res.json(group);
      });
    });
  });

//set group temperature with group ID
router.route('/group/:groupId/temperature/set/:value')
  .get((req, res) => {
    let groupId = req.params.groupId;
    let value = req.params.value;
    api.setGroupLightState(groupId, state.ct(153+(value*3.47)), (err, data) => {
      if(err) throw err;
      console.log(`group ${groupId} temperature set to ${value}%`);
      api.groups((err, data) => {
        if(err) throw err;
        let group = data.filter(group => group.id === groupId);
        res.json(group);
      });
    });
  });

//incremental group temperature adjustment with group ID
router.route('/group/:groupId/temperature/incremental/:value')
  .get((req, res) => {
    let groupId = req.params.groupId;
    let value = req.params.value;
    api.setGroupLightState(groupId, state.ct_inc(value*3.47), (err, data) => {
      if(err) throw err;
      console.log(`group ${groupId} temperature adjusted ${value}%`);
      api.groups((err, data) => {
        if(err) throw err;
        let group = data.filter(group => group.id === groupId);
        res.json(group);
      });
    });
  });

//get state of group with groupname
router.route('/groupname/:groupName/state')
  .get((req, res) => {
    let groupName = req.params.groupName;
    api.groups((err, data) => {
      if(err) console.log(err);
      let group = data.filter(group => group.name.toLowerCase() === groupName.toLowerCase());
      let lights = group[0].lights;
      console.log(`get group ${groupName} state`);
      //rewrite..
      let rgbArray = [];
      lights.forEach((light) => {
        api.lightStatusWithRGB(light, (err, data) => {
          if(err) {console.log(err)}
          rgbArray.push(data.state.rgb);
          if(rgbArray.length === lights.length) {
            res.json({data: group, rgb: rgbArray});
          };
        });
      });
    });
  });

//turn on group with groupname
router.route('/groupname/:groupName/on')
  .get((req, res) => {
    let groupName = req.params.groupName;
    api.groups((err, data) => {
      if(err) console.log(err);
      let group = data.filter(group => group.name.toLowerCase() === groupName.toLowerCase());
      let lights = group[0].lights;
      console.log(`group ${groupName} turned on`);
      //rewrite..
      let rgbArray = [];
      lights.forEach((light) => {
        api.setLightState(light, state.on(), (err, data) => {
          if(err) throw err;
        })
        api.lightStatusWithRGB(light, (err, data) => {
          if(err) {console.log(err)}
          console.log(data);
          rgbArray.push(data.state.rgb);
          if(rgbArray.length === lights.length) {
            api.groups((err, data) => {
              if(err) console.log(err);
              group = data.filter(group => group.name.toLowerCase() === groupName.toLowerCase());
              res.json({data: group, rgb: rgbArray});
            });
          };
        });
      });
    });
  });

//turn off group with groupname
router.route('/groupname/:groupName/off')
  .get((req, res) => {
    let groupName = req.params.groupName;
    api.groups((err, data) => {
      if(err) console.log(err);
      let group = data.filter(group => group.name.toLowerCase() === groupName.toLowerCase());
      let lights = group[0].lights;
      console.log(`group ${groupName} turned off`);
      //rewrite..
      let rgbArray = [];
      lights.forEach((light) => {
        api.setLightState(light, state.off(), (err, data) => {
          if(err) throw err;
        })
        api.lightStatusWithRGB(light, (err, data) => {
          if(err) {console.log(err)};
          rgbArray.push(data.state.rgb);
          if(rgbArray.length === lights.length) {
            api.groups((err, data) => {
              if(err) console.log(err);
              group = data.filter(group => group.name.toLowerCase() === groupName.toLowerCase());
              res.json({data: group, rgb: rgbArray});
            });
          };
        });
      });
    });
  });

router.route('/groupname/:groupName/toggle2')
  .get((req, res) => {
    let groupName = req.params.groupName;



    api.groups((err, data) => {
      if (err) console.log(err.stack);
      let group = data.filter(group => group.name.toLowerCase() === groupName.toLowerCase());
      let lights = group[0].lights;
      console.log(group);
      console.log(lights);

      lights.forEach((lightId) => {

      })
    })
  })

//toggle group with groupname
router.route('/groupname/:groupName/toggle')
  .get((req, res) => {
    let groupName = req.params.groupName;
    api.groups((err, data) => {
      if (err) console.log(err);
      let group = data.filter(group => group.name.toLowerCase() === groupName.toLowerCase());
      let lights = group[0].lights;
      lights.forEach((lightId) => {
        api.lights((err, data) => {
          if (err) throw err;
          let state = data.lights.filter((light) => light.id == lightId)
          if (state[0].state.on) {
            console.log('light is on');
            api.setLightState(lightId, state.off(), (err, data) => {
              if (err) console.log(err)
              console.log(data);
            })
          } else {
            console.log('light is off');
            api.setLightState(lightId, state.on(), (err, data) => {
              if (err) console.log(err)
              console.log(data);
            })
          }
        })
        res.json({})
      })
    });
  });

//set group brightness with groupname
router.route('/groupname/:groupName/brightness/set/:value')
  .get((req, res) => {
    let groupName = req.params.groupName;
    let value = req.params.value;
    api.groups((err, data) => {
      if (err) console.log(err.stack);
      let group = data.filter((group) => group.name.toLowerCase() === groupName.toLowerCase());
      api.setGroupLightState(group[0].id, state.brightness(value), (err, data) => {
        if (err) console.log(err.stack);
        res.json({});
        //todo
      })
    })
  })

//incremental group brightness adjustment with groupname
router.route('/groupname/:groupName/brightness/incremental/:value')
  .get((req, res) => {
    let groupName = req.params.groupName;
    let value = req.params.value;
    api.groups((err, data) => {
      if (err) console.log(err.stack);
      let group = data.filter((group) => group.name.toLowerCase() === groupName.toLowerCase());
      api.setGroupLightState(group[0].id, state.bri_inc(value*2.54), (err, data) => {
        if (err) console.log(err.stack);
        res.json({});
        //todo
      })
    })
  })

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
