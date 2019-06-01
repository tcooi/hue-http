# hue-http
## Setup
fix dependencies
```
npm install
```
create settings.json object with hue ip and username, more info about hue username [here](https://developers.meethue.com/documentation/getting-started)
```
{
  "ip": "HUE_IP",
  "username": "HUE_USERNAME"
}
```
start node server
```
npm start
```
## Commands
`localhost:8020/lights`
return state of all lights

`localhost:8020/groups`
return state of all groups

`localhost:8020/light/[Light ID]/state`
return state of light with light ID

`localhost:8020/light/[Light ID]/on`
turn on light with light ID

`localhost:8020/light/[Light ID]/off`
turn off light with light ID

`localhost:8020/light/[Light ID]/toggle`
toggle light with light ID

`localhost:8020/light/[light ID]/brightness/set/[value]`
set light brightness using light ID and brightness value, 0 - 100

`localhost"8020/light/[light ID]/brightness/incremental/[value]`
incremental brightness adjustment using light ID and value for incremental adjustment, -100 - +100

`localhost:8020/light/[light ID]/temperature/set/[value]`
set light temperature using light ID and temperature value, 0 - 100

`localhost:8020/light/[light ID]/temperature/incremental/[value]`
incremental temperature adjustment using light ID and value for incremental adjustment, -100 - +100
