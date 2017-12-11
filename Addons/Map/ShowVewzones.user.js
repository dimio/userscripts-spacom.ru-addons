// ==UserScript==
// @name         Spacom.ru::Addons::Map::ShowViwzones
// @version      0.0.3
// @namespace    http://dimio.org/
// @description  none
// @author       segrey
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
/**
 * Based on "Spacom addons" by segrey:
 * https://greasyfork.org/en/scripts/27897-spacom-addons
**/
//console.log('Spacom.ru::Addons::Map::ShowViwzones');

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

    Addons.Map.ShowViewzones = {
        button: null,
        circles: null,
        enabled: false,

        createCircles() {
            this.circles = {};

            const fleets = w.map.fleets.filter((fleet) => {
                return +fleet.view_radius !== 0 && (+fleet.turn === 0 || +fleet.start_turn - +fleet.turn === 0);
            });

            for (const i in fleets) {
                if (fleets.hasOwnProperty(i)) {
                    const fleet = fleets[i];

                    //if (fleet.owner === 'own' && (fleet.turn === 0 || fleet.start_turn - fleet.turn === 0)) {
                    const center = Addons.getObjCenter({
                        obj: fleet,
                        mode: 'viewzone',
                    });

                    this.circles[i] = Addons.createCircle({
                        x: center.x,
                        y: center.y,
                        radius: fleet.view_radius,
                    });
                    //}
                }
            }
        },
        showViewZones(flag) {
            this.enabled = flag;

            if (!this.circles) {
                if (this.enabled) {
                    this.createCircles();
                    Addons.drawObjectsOnScene(this.circles);
                }
                else {
                    return;
                }
            }

            Addons.toggleObjectsVisiblityOnScene(this.circles, this.enabled);
            w.scene.renderAll();
        },
        toggle() {
            this.showViewZones(!this.enabled);
        },
        init() {
            this.button = Addons.HTMLElement.createMapButton(
                'fa-eye',
                'spacom-addons-exploreallgeo',
                'Показать зоны видимости',
            );
            this.button.on('click', this.toggle.bind(this));
        },
    };

    if (w.map) {
        Addons.Map.ShowViewzones.init();
    }
})(window);
