// ==UserScript==
// @name         Spacom.ru::Addons::Map::MarkAnomaly
// @version      0.0.1
// @namespace    http://dimio.org/
// @description  testing
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/?act=map
// @run-at       document-end
// ==/UserScript==
console.log( "Spacom::Addons::Testing booted" );
//<span class="industry"><i class="fa fa-cogs"></i> 160 производства</span>

(function (window) {
  window.unsafeWindow = window.unsafeWindow || window;
  var w = unsafeWindow;

  if (w.self != w.top) {
    return;
  }

  if ( !w.Addons ){
    w.Addons = {};
  }

  var indexedDB = w.indexedDB || w.mozIndexedDB || w.webkitIndexedDB || w.msIndexedDB;
  var IDBTransaction = w.IDBTransaction || w.webkitIDBTransaction || w.msIDBTransaction,
      baseName  = 'server_' +w.server_id,
      storeName = 'stars';

  var circles = {};
  var anomalies = [];
  var anomalies_circles = {};
  var JSONedDB = [];

  Addons.FindAnomaly = {
    button: null,
    enabled: false,

    getStarData: function (star_id, callback){
      var d = $.Deferred();
      var self = this;

      this.connectDB(function(db){
        var request = db.transaction([storeName], "readonly").objectStore(storeName).get(star_id);
        request.onerror = this.logger;
        request.onsuccess = function(){
          if (request.result !== undefined) {
            d.resolve(request.result);
          }
          else {
            self.downloadStarData(star_id);
          }
        };
      });

      return d.promise();
    },

    findAnomalies: function () {

      if ( !w.isObjNotEmpry(anomalies_circles) ){
        const explored_stars = w.map.stars.slice().filter((star) => {
          return +star.explored === 1;
        });

        let cnt = 0;
        for ( let i in explored_stars ) {
          //if ( cnt > 9 ) break;
          cnt++;

          //let star = explored_stars[i];
          let star;

          this.getStarData( explored_stars[i].id ).then(
            (star_data) => {
              star = star_data;
              if ( star !== undefined ){
                JSONedDB.push( JSON.stringify(star) );

                for ( let type in star.anomaly ){
                  if (star.anomaly[type] !== undefined){
                    anomalies.push(star);
                  }
                }
              }
            }
          );
        }

        console.log(JSONedDB);

        if ( anomalies.length ){
          //console.log( anomalies );
          console.log( 'anomalies finded: ', anomalies.length );

          for ( let i in anomalies ){
            let star = anomalies[i];

            anomalies_circles[i] = this.createCircle({
              center: getCenterXY(star.x, star.y),
              radius: '1.5',
            });
          }
        }
      }
      this.drawCircles( anomalies_circles );
    },

    drawCircles: function ( circles ) {
      for ( let i in circles ){
        this.drawCircle( circles[i] );
      }
    },

    drawCircle: function ( circle ) {
      var left = w.current_x;
      var top = w.current_y;
      var right = w.current_x + (w.base_width / w.current_scale);
      var bottom = w.current_y + (w.base_height / w.current_scale);

      // вызывать поиск аномалий только тогда, когда массив с ними пуст
      /*if (!this.circles) {
        if (this.enabled) {
          this.findAnomalies();
        } else {
          return;
        }
      }*/

      //var show = this.enabled;
      var show = true;

      if (circle){
        //if (show) {
        var raduis = circle.getRadiusX();
        show = this.inBox(
          circle.getLeft(), circle.getTop(),
          left  - raduis, top    - raduis,
          right + raduis, bottom + raduis
        );
        //}

        //circle.set({visible:show});
        circle.set({visible: true});
      }
    },

    createCircle: function ( opt ) {
      var center = opt.center; //перенести в вызов, здесь получать уже готовые коорд.
      var radius = opt.radius || 3;
      var fill = opt.circle_fill || 'rgb(40,100,40)';

      let circle = new fabric.Circle({
        left: center.x,
        top: center.y,
        radius: radius * box_size,
        fill: fill,
        opacity: 0.2,
        originX: 'center',
        originY: 'center',
        selectable: false,
        visible: false,
        //visible: true,
      });

      scene.add(circle);
      scene.sendToBack(circle);

      return circle;
    },

    inBox: function (x, y, left, top, right, bottom) {
      return (x > left && x < right && y > top && y < bottom);
    },
    turnOn: function ( flag ){
      this.enabled = flag;
      this.findAnomalies();
      scene.renderAll();
    },
    toggle: function () {
      this.turnOn( !this.enabled );
    },
    init: function () {
      var self = this;
      this.button = createMapButton( "fa-diamond", 'anomaly-testing', 'Find anomalies' );
      this.button.on( "click", this.toggle.bind(this) );

      // переопределение ф-и map.renewMap
      var renewMap = map.renewMap;
      map.renewMap = function () {
        renewMap();
        self.drawCircles();
        //self.findAnomalies();
      };
    },

    downloadStarData: function ( obj_id ){
      let url = APIUrl() + '&act=map&task=star_planets&star_id=' + obj_id + '&format=json';
      $.getJSON( url, {}, function( json ){
        let obj_data = json.star;

        obj_data.summ_base = {};
        obj_data.anomaly = {};

        obj_data.summ_base.food = 0;
        obj_data.summ_base.production = 0;
        obj_data.summ_base.science = 0;
        obj_data.summ_base.population = 0;

        for ( let i in obj_data.planets ){
          let planet = obj_data.planets[i];

          obj_data.summ_base.food += +planet.food_base;
          obj_data.summ_base.production += +planet.production_base;
          obj_data.summ_base.science += +planet.science_base;
          obj_data.summ_base.population += +planet.populationmax_base;

          obj_data.anomaly.food = ( +planet.anomaly_food !== 0 ) ? +planet.anomaly_food : obj_data.anomaly.food;
          obj_data.anomaly.house = ( +planet.anomaly_house !== 0 ) ? +planet.anomaly_house : obj_data.anomaly.house;
          obj_data.anomaly.money = ( +planet.anomaly_money !== 0 ) ? +planet.anomaly_money : obj_data.anomaly.money;
          obj_data.anomaly.production = ( +planet.anomaly_production !== 0 ) ? +planet.anomaly_production : obj_data.anomaly.production;
          obj_data.anomaly.science = ( +planet.anomaly_science !== 0 ) ? +planet.anomaly_science : obj_data.anomaly.science;
        }

        Addons.FindAnomaly.setStarData( obj_data );
      });
    },

    setStarData: function (data){
      this.connectDB(function(db){
        var request = db.transaction([storeName], "readwrite").objectStore(storeName).put(data);
        request.onerror = this.logerr;
        request.onsuccess = function(){
          return request.result;
        };
      });
    },

    logger: function (err){
      console.err(err);
    },

    connectDB: function (f){
      var request = indexedDB.open(baseName, 1);
      request.onerror = this.logger;
      request.onsuccess = function(){
        // При успешном открытии вызвали коллбэк передав ему объект БД
        f(request.result);
      };
      request.onupgradeneeded = function(e){
        // Если БД еще не существует, то создаем хранилище объектов.
        e.currentTarget.result.createObjectStore(storeName, {
          keyPath: "id",
          autoIncrement: false,
        });
        connectDB(f);
      };
    },

  };

  if (w.map) {
    //Addons.Testing.init();
    Addons.FindAnomaly.init();
  }
})(window);

