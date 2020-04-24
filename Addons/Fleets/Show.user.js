// ==UserScript==
// @name         Spacom.Addons.Fleets.Show
// @version      0.1.2
// @namespace    http://dimio.org/
// @description  Some improvements on fleet show window
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/?act=game/map*
// @include      http*://spacom.ru/?act=game/map*
// @run-at       document-end
// ==/UserScript==
// console.log('Spacom.Addons.Fleets.Show booted');

const ERR_MSG = {
  NO_LIB: `Для работы Spacom.Addons.Fleets.Show необходимо установить и включить Spacom.Addons
<a href="https://github.com/dimio/userscripts-spacom.ru-addons">https://github.com/dimio/userscripts-spacom.ru-addons</a>`,
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
    OPT: {
      showShipsCount: true,
      showSystemName: true,
    },
    shipsCount: {
      calc(ships) {
        const shipCount = {};
        //garrison ships not defined
        if (w.Addons.isVariableDefined(ships)) {
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
    systemName: {
      showOnFleetBlock() {
        const fleetBlockTmpl = $('#fleet_instance');
        fleetBlockTmpl.html(fleetBlockTmpl.html().replace('y +',
          '$& "<br><span>" + map.stars[star_id].name + "</span>" + '));
      },
    },

    init() {
      if (this.OPT.showSystemName) {
        this.systemName.showOnFleetBlock();
      }

      if (this.OPT.showShipsCount) {
        const self = this;
        const _showFleetShips = w.map.showFleetShips;
        w.map.showFleetShips = (function (json) {
          _showFleetShips.call(this, json);
          self.shipsCount.show(
            self.shipsCount.calc(json.fleets.fleet.ships)
          );
        });
      }
    }
  };

  w.Addons.Fleets.Show.init();

})(window);