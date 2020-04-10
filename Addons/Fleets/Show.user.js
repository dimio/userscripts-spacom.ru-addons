// ==UserScript==
// @name         Spacom.Addons.Fleets.Show
// @version      0.1.0
// @namespace    http://dimio.org/
// @description  Some improvements on fleet show window
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/?act=game/map*
// @run-at       document-end
// ==/UserScript==

const ERR_MSG = {
  NO_LIB: `Для работы дополнений необходимо установить и включить Spacom.Addons:<br>
https://github.com/dimio/userscripts-spacom.ru-addons/raw/master/Addons/Addons.user.js`,
};

(function (window) {
  'use strict';

  window.unsafeWindow = window.unsafeWindow || window;
  const w = unsafeWindow;

  if (w.self !== w.top) {
    return;
  }
  if (!w.Addons) {
    w.showSmallMessage(ERR_MSG.NO_LIB);
    return;
  }
  if (!w.Addons.Fleets) {
    w.Addons.Fleets = {};
  }

  w.Addons.Fleets.Show = {
    shipsCount: {
      calc(ships) {
        const shipCount = {};
        //garrison ships not defined
        if (typeof ships !== 'undefined') {
          ships.forEach((ship) => {
            shipCount[ship.image] = (shipCount[ship.image] || 0) + 1;
          });
        }
        return shipCount;
      },
      show(shipCount) {
        w.$('.fleet_ico_container').each(
            function () {
              w.$(this).append(
                  shipCount[w.$(this).children('img').attr('src').split(
                      '/')[3]]);
            }
        )
      },
    },

    init() {
      const self = this;
      const _showFleetShips = w.map.showFleetShips;
      w.map.showFleetShips = (function (json) {
        _showFleetShips.call(this, json);
        self.shipsCount.show(
            self.shipsCount.calc(json.fleets.fleet.ships)
        );
      });
    }
  };

  w.Addons.Fleets.Show.init();

})(window);