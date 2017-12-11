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
// @include      http*://spacom.ru/?act=map
// @run-at       document-end
// ==/UserScript==
// http://bit.ly/2xV40HV
console.log('Spacom.ru::Addons::Map::MarkAnomaly dev booted');
const ANOMALY_MARK = {
    LABEL: {
        food: { ico: '\uf0f5', color: '#f9cc6d' }, // fa-cutlery
        house: { ico: '\uf0ac', color: '#24CA25' }, // fa-globe
        money: { ico: '\uf10c', color: '#FFF5B2' }, // fa-circle-o
        production: { ico: '\uf085', color: '#ea8a6c' }, // fa-cogs
        science: { ico: '\uf0c3', color: '#3ff0d9' }, //fa-flask
    },
    RADIUS: 0.75,
    OPACITY: 0.25,
};
const ERR_MSG = {
    NO_LIB: `Для работы дополнений необходимо установить и включить Spacom.ru::Addons:<br>
https://github.com/dimio/userscripts-spacom.ru-addons/raw/master/Addons.user.js`,
};

(function(window) {
    window.unsafeWindow = window.unsafeWindow || window;
    const w = unsafeWindow;

    if (w.self !== w.top) {
        return;
    }
    if (!w.Addons) {
        w.showSmallMessage(ERR_MSG.NO_LIB);
        return;
    }
    if (!w.Addons.Map) {
        w.Addons.Map = {};
    }
    const Addons = w.Addons;

    const indexedDB = w.indexedDB || w.mozIndexedDB || w.webkitIndexedDB || w.msIndexedDB;
    // const IDBTransaction = w.IDBTransaction || w.webkitIDBTransaction || w.msIDBTransaction;
    const baseName = `server_${w.server_id}`;
    const storeName = 'stars';

    //const anomalies = [];
    //anomalies.circles = {};
    //anomalies.texts = {};

    Addons.Map.MarkAnomaly = {
        button: null,
        enabled: false,
        anomalies: {
            circles: {},
            texts: {},
        },

        logger(err) {
            console.error(err);
        },
        connectDB(f) {
            const request = indexedDB.open(baseName, 1);
            const self = this;
            request.onerror = this.logger;
            request.onsuccess = function() {
                // При успешном открытии вызвали коллбэк передав ему объект БД
                f(request.result);
            };
            request.onupgradeneeded = function(e) {
                // Если БД еще не существует, то создаем хранилище объектов.
                e.currentTarget.result.createObjectStore(storeName, {
                    keyPath: 'id',
                    autoIncrement: false,
                });
                self.connectDB(f);
            };
        },

        getStarData(star_id) {
            const d = $.Deferred();
            const self = this;

            this.connectDB(function(db) {
                const request = db.transaction([storeName], 'readonly').objectStore(storeName).get(star_id);
                request.onerror = this.logger;
                request.onsuccess = function() {
                    if (typeof request.result !== 'undefined') {
                        d.resolve(request.result);
                    }
                    else {
                        self.downloadStarData(star_id);
                    }
                };
            });

            return d.promise();
        },

        markAnomalies() {
            if (!Addons.isObjNotEmpty(this.anomalies.circles)) {
                this.createAnomaliesMarks();
            }

            if (this.enabled) {
                Addons.drawObjectsOnScene(this.anomalies.circles);
                Addons.drawObjectsOnScene(this.anomalies.texts);
            }
            else {
                Addons.delObjectsOnScene(this.anomalies.circles);
                Addons.delObjectsOnScene(this.anomalies.texts);
            }
        },

        createAnomaliesMarks(callback) {
            const explored_stars = w.map.stars.filter((star) => {
                return +star.explored === 1;
            });

            for (const i in explored_stars) {
                let star;
                this.getStarData(explored_stars[i].id).then(
                    (star_data) => {
                        star = star_data;
                        if (typeof star !== 'undefined') {
                            for (const type in star.anomaly) {
                                if (typeof star.anomaly[type] === 'undefined') {
                                    delete (star.anomaly[type]);
                                }
                                else {
                                    const center = Addons.getObjCenter({
                                        obj: star,
                                        mode: 'mark',
                                    });
                                    const label = this.createAnomalyLabel(type, star.anomaly[type]);

                                    this.anomalies.circles[i] = Addons.createCircle({
                                        x: center.x,
                                        y: center.y,
                                        radius: ANOMALY_MARK.RADIUS,
                                        fill: label.color,
                                        opacity: ANOMALY_MARK.OPACITY,
                                    });

                                    this.anomalies.texts[i] = Addons.createMapText(label.text, {
                                        x: center.x,
                                        y: center.y,
                                        color: label.color,
                                    });
                                }
                            }
                        }
                    }
                );
            }
            //callback(this.anomalies.circles, this.anomalies.texts);
        },

        createAnomalyLabel(type, cnt) {
            const text = `${ANOMALY_MARK.LABEL[type].ico} ${cnt}`;
            const color = ANOMALY_MARK.LABEL[type].color;

            return { text, color };
        },

        downloadStarData(obj_id) {
            const url = `${w.APIUrl()}&act=map&task=star_planets&star_id=${obj_id}&format=json`;
            $.getJSON(url, {}, (json) => {
                const obj_data = json.star;

                obj_data.summ_base = {};
                obj_data.anomaly = {};

                obj_data.summ_base.food = 0;
                obj_data.summ_base.production = 0;
                obj_data.summ_base.science = 0;
                obj_data.summ_base.population = 0;

                for (const i in obj_data.planets) {
                    const planet = obj_data.planets[i];

                    obj_data.summ_base.food += +planet.food_base;
                    obj_data.summ_base.production += +planet.production_base;
                    obj_data.summ_base.science += +planet.science_base;
                    obj_data.summ_base.population += +planet.populationmax_base;

                    obj_data.anomaly.food = (+planet.anomaly_food !== 0) ? +planet.anomaly_food : obj_data.anomaly.food;
                    obj_data.anomaly.house = (+planet.anomaly_house !== 0) ? +planet.anomaly_house : obj_data.anomaly.house;
                    obj_data.anomaly.money = (+planet.anomaly_money !== 0) ? +planet.anomaly_money : obj_data.anomaly.money;
                    obj_data.anomaly.production = (+planet.anomaly_production !== 0) ? +planet.anomaly_production : obj_data.anomaly.production;
                    obj_data.anomaly.science = (+planet.anomaly_science !== 0) ? +planet.anomaly_science : obj_data.anomaly.science;
                }

                // удалять udefined аномалии здесь, перед добавлением системы в базу
                this.setStarData(obj_data);
            });
        },

        /*
        function saveToTheDb(value) {
            return new Promise(function(resolve, reject) {
                db.values.insert(value, function(err, user) { // ошибка идет первой
                    if (err) {
                        return reject(err); // не забудьте вернуть здесь
                    }
                    resolve(user);
                })
            }
        }
        */
        setStarData(data) {
            this.connectDB(function(db) {
                const request = db.transaction([storeName], 'readwrite').objectStore(storeName).put(data);
                request.onerror = this.logerr;
                request.onsuccess = function() {
                    return request.result;
                };
            });
        },

        turnOn(flag) {
            this.enabled = flag;
            this.markAnomalies();
            w.scene.renderAll();
        },
        toggle() {
            this.turnOn(!this.enabled);
        },
        init() {
            this.button = Addons.HTMLElement.createMapButton(
                'fa-diamond',
                'spacom-addons-exploreallgeo',
                'Отметить аномалии на карте',
            );
            this.button.on('click', this.toggle.bind(this));
        },
    };

    if (w.map) {
        Addons.Map.MarkAnomaly.init();
    }
})(window);
