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
console.log( "Spacom.ru::Addons::Map::MarkAnomaly dev booted" );
const ANOMALY_LABEL = {
    'food': {'ico': '\uf0f5', 'color': '#f9cc6d'}, //fa-cutlery
    'house': {'ico': '\uf0ac', 'color': '#24CA25'}, //fa-globe
    'money': {'ico': '\uf10c', 'color': '#FFF5B2'}, //fa-circle-o
    'production': {'ico': '\uf085', 'color': '#ea8a6c'}, //fa-cogs
    'science': {'ico': '\uf0c3', 'color': '#3ff0d9'}, //fa-flask
};

/*fabric.Image.fromURL('/image/star/' + this.type.toLowerCase() + '.png', function (img) {
                    var center = getCenterXY(self.x, self.y);
                    self.imageCanvas = img.set({
                        left: (center.x),
                        top: (center.y),
                        width: box_size,
                        height: box_size,
                        evented: true,
                        nature: "star",
                        id: self.id,
                        selection: false,
                        hasRotatingPoint: false,
                        hasBorders: false,
                        hasControls: false,
                        moveCursor: 'pointer',
                        hoverCursor: 'pointer',
                        originX: center,
                        originY: center,



                    });
                    scene.add(self.imageCanvas);
                    */

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
    var anomalies_texts = {};
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

                                for ( let type in star.anomaly ){
                                    if (star.anomaly[type] === undefined){
                                        delete(star.anomaly[type]);
                                    }
                                    else {
                                        anomalies.push(star);
                                    }
                                }
                            }
                        }
                    );
                }

                //console.log(JSONedDB);

                if ( anomalies.length ){
                    //console.log( anomalies );
                    console.log( 'anomalies found, cnt: ', anomalies.length );
                    var anomaly_label = {};

                    for ( let i in anomalies ){
                        let star = anomalies[i];
                        var center = getCenterXY(star.x, star.y);

                        anomalies_circles[i] = this.createCircle({
                            center: center,
                            radius: '1.5',
                        });

                        let label = this.makeAnomalyLabel(star);

                        anomalies_texts[i] = this.makeMapText(label.text, {
                            x: center.x,
                            y: center.y,
                            color: label.color,
                        });

                        if (star.id == '254'){
                            console.log(star);
                            console.log(anomalies[i]);
                            console.log(anomalies_texts[i]);
                        }
                    }
                }
            }

            this.drawObjectsOnScene( anomalies_circles);
            this.drawObjectsOnScene( anomalies_texts);
            //this.drawIcons( anomalies_icons );
        },

        makeAnomalyLabel(star){
            var text,
                color;

            for ( let type in star.anomaly ){
                text = this.makeAnomalyLabelIco(type) + ' ' + star.anomaly[type];
                color = this.makeAnomalyLabelColor(type);
            }

            return {'text': text, 'color': color};
        },

        makeAnomalyLabelIco(type){
            return ANOMALY_LABEL[type].ico;
        },

        makeAnomalyLabelColor(type){
            return ANOMALY_LABEL[type].color;
        },

        makeMapText(text, opt){
            var x = opt.x;
            var y = opt.y;
            var color = opt.color || '#ff4800';
            //var center = {x: x, y: y};

            const text_obj = new fabric.IText(text, {
                //left: x * box_size - 16 - text.length * 4,
                //top: y * box_size - 48,
                left: x,
                top: y + 18,
                fill: color,
                fontSize: "14",
                selection: false,
                hasRotatingPoint: false,
                hasBorders: false,
                hasControls: false,
                fontFamily: "'FontAwesome'",
                originX: 'center',
                originY: 'center',
                visible: false,
            });

            scene.add(text_obj);
            scene.sendToBack(text_obj);

            return text_obj;
        },
        drawObjectOnScene(object){
            if (object){
                object.set({visible: true});
                //scene.add(object);
            }
        },
        drawObjectsOnScene: function ( objects, type ) {
            for ( let i in objects ){
                this.drawObjectOnScene( objects[i] );
            }
            scene.renderAll();
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
                //self.drawCircles();
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
            console.error(err);
        },

        connectDB: function (f){
            var request = indexedDB.open(baseName, 1);
            var self = this;
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
                self.connectDB(f);
            };
        },

    };

    if (w.map) {
        //Addons.Testing.init();
        Addons.FindAnomaly.init();
    }
})(window);
