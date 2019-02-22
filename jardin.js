const http = require('http');
const url = require('url');
const Influx = require('influx');
const gpio = require('rpi-gpio');
const gpiop = gpio.promise;
const config = require ('../monitor/config')

const jardinDB = new Influx.InfluxDB(config.jardinSchema)
/*
jardinDB.query(`

    select duree_arrosage from jardin
    order by desc
    limit 1

  `).then((duree) => {
    if (duree) {
      arrosage(duree);
    } else {
      console.log('Durée d arrosage inexistante');
    }
  }).catch((err)=> console.log(err))
*/

arrosage(20000);

function arrosage(duree){
  gpiop.setup(26, gpio.DIR_OUT, gpio.EDGE_BOTH)
    .then(() => {
     return gpiop.write(26, true)
    })
    .then(() => {
      setTimeout(closePins, duree);
    })
    .catch((err) => {
      console.log('Error: ', err.toString())
    })

    gpio.on('change', function(channel, value) {
      console.log('Channel ' + channel + ' value is now ' + value);
      if (value === true) {
        jardinDB.writePoints([{
          measurement: 'jardin',
          fields: {
            time_on: Date.now(),
            duree_arrosage: duree
          }
        }])
      }
      });

    function closePins() {
      jardinDB.writePoints([{
        measurement: 'jardin',
        fields: {
          time_off: Date.now()
        }
      }]);
      gpio.destroy(function() {
        console.log('All pins unexported');
      });
    }
}


/**
http.createServer(function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  var q = url.parse(req.url, true).query;
  var txt = q.year + " " + q.month;
  res.end(txt);
}).listen(8080);*/
