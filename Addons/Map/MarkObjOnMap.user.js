// ==UserScript==
// @name         Spacom.ru::Addons::Fleets::MarkObjOnMap
// @version      0.0.3
// @namespace    http://dimio.org/
// @description  Make fleets markable on map
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/?act=map
// @run-at       document-end
/* eslint linebreak-style: ["error", "unix"]*/
// ==/UserScript==
// console.log('Spacom.ru::Addons::Fleets::MarkObjOnMap booted');
const MARK_SETTINGS = {
    FILL_COLOR: {
        own: 'blue',
        other: 'red',
        pirate: 'yellow',
        peace: '#94ff00', //light-green
    },
    RADIUS: 0.8,
    OPACITY: 0.5,
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
    const Addons = w.Addons;

    if (!Addons.Fleets.mark_circles) {
        Addons.Fleets.mark_circles = {};
    }
    const circles = Addons.Fleets.mark_circles;

    Addons.Fleets.MarkOnMap = {
        buttonOn: null,
        buttonOff: null,
        enabled: false,

        markFleetsOnMap(fleets) {
            if (w.backlighted_fleets) {
                for (const i in w.backlighted_fleets) {
                    const fleet = w.backlighted_fleets[i];

                    if (fleet.fleet_id in circles) {
                        continue;
                    }

                    const center = Addons.getFleetCenter({
                        fleet,
                        mode: 'mark',
                    });

                    circles[i] = Addons.createCircle({
                        x: center.x,
                        y: center.y,
                        radius: MARK_SETTINGS.RADIUS,
                        fill: this.getMarkFillColor(fleet.owner),
                        opacity: MARK_SETTINGS.OPACITY,
                    });
                }

                Addons.drawCircles(circles);
            }
        },
        unmarkFleetsOnMap(circles) {
            circles = Addons.Fleets.mark_circles;
            for (const i in circles) {
                scene.remove(circles[i]);
                delete circles[i];
            }
        },
        getMarkFillColor(fleet_owner) {
            return MARK_SETTINGS.FILL_COLOR[fleet_owner] || 'white';
        },

        turnOn() {
            this.enabled = true;
            this.markFleetsOnMap();
            scene.renderAll();
        },
        turnOff() {
            if (this.enabled) {
                this.unmarkFleetsOnMap();
                scene.renderAll();
            }
        },
        makeMarkButtons() {
            const self = this;
            // Addons.waitMenu.bind(this);
            // разобр., почему не работает this.waitMenu, хотя waitMenu унаследована и вызывается так:
            // Addons.Fleets.waitMenu( $('#items_list > div.row.player_fleet_title'), function(menu) {
            Addons.waitMenu($('#items_list > div.row.player_fleet_title'), (menu) => {
                self.buttonOn = Addons.HTMLElement.createActionButton('Пометить на карте', 'fa fa-eye', 'map-backlight');
                self.buttonOn.on('click', self.turnOn.bind(self));

                self.buttonOff = Addons.HTMLElement.createActionButton('Убрать пометки', 'fa fa-eye-slash', 'map-backlight');
                self.buttonOff.on('click', self.turnOff.bind(self));

                Addons.HTMLElement.replaceContent($('div.col-xs-4.col-md-2.fleet_actions')[0], self.buttonOn, self.buttonOff);
            });
        },
        init() {
            this.makeMarkButtons();
        },
    };

})(window);
