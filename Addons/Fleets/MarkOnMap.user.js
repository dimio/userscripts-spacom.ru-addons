// ==UserScript==
// @name         Spacom.Addons.Fleets.MarkOnMap
// @version      0.1.1
// @namespace    http://dimio.org/
// @description  Mark/unmark fleets on map
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/?act=game/map*
// @include      http*://spacom.ru/?act=game/map*
// @run-at       document-idle
// ==/UserScript==
console.log(GM_info.script.name, 'booted v.', GM_info.script.version);
const homePage = GM_info.scriptMetaStr.split('\n')[6].split(' ')[6];

const ERR_MSG = {
  NO_LIB: `Для работы ${GM_info.script.name} необходимо установить и включить последние версии следующих дополнений:
<ul>
<li>Spacom.Addons</li>
<li>Spacom.Addons.Fleets.Sort</li>
<li>Spacom.Addons.Map.Scene</li>
</ul>
<a href="${homePage}">${homePage}</a>`,
};

(function (window) {
  'use strict';

  window.unsafeWindow = window.unsafeWindow || window;
  const w = unsafeWindow;
  const Addons = w.Addons;

  if (w.self !== w.top) {
    return;
  }
  if (!Addons || !Addons.Fleets.Sort || !Addons.Map.Scene) {
    w.showSmallMessage(ERR_MSG.NO_LIB);
    return;
  }

  Addons.Fleets.MarkOnMap = {
    OPT: {
      MARK_SETTINGS: {
        FILL_COLOR: {
          own: 'blue',
          other: 'red',
          pirate: 'yellow',
          peace: '#94ff00', //light-green
        },
        RADIUS: 0.8,
        OPACITY: 0.5,
      },
    },

    buttonOn: null,
    buttonOff: null,
    enabled: false,
    marks: {},

    createMarks(fleets) {
      for (const fleet of fleets) {
        const center = Addons.Common.getObjCenter({
          obj: fleet,
          mode: 'mark',
        });

        if (fleet.fleet_id in this.marks[w.sub_menu]) {
          if (w.sub_menu.includes('own')) {
            Addons.Map.Scene.setObjectCenter(
              Addons.Map.Scene.getObjectById(fleet.fleet_id),
              center
            );
          }
          continue;
        }

        this.marks[w.sub_menu][fleet.fleet_id] = Addons.Map.Scene.createCircle({
          id: fleet.fleet_id,
          x: center.x,
          y: center.y,
          radius: this.OPT.MARK_SETTINGS.RADIUS,
          fill: this.getMarkFillColor(fleet.owner),
          opacity: this.OPT.MARK_SETTINGS.OPACITY,
        });
      }
    },
    mark() {
      this.createMarks(Addons.Fleets.Sort.fleets);
      if (Addons.Common.isObjNotEmpty(this.marks[w.sub_menu])) {
        Addons.Map.Scene.show(this.marks[w.sub_menu])
      }
    },
    unmark() {
      Addons.Map.Scene.hide(this.marks[w.sub_menu]);
      // it's needed so that do not highlight again
      // deleted, rearranged or moved to garrison fleets
      if (w.sub_menu.includes('own')) {
        delete this.marks[w.sub_menu];
      }
    },
    getMarkFillColor(fleetOwner) {
      return this.OPT.MARK_SETTINGS.FILL_COLOR[fleetOwner] || 'white';
    },
    turnOn() {
      this.enabled = true;
      if (!Addons.Common.isVariableDefined(this.marks[w.sub_menu])) {
        this.marks[w.sub_menu] = [];
      }
      this.mark();
    },
    turnOff() {
      if (this.enabled) {
        this.unmark();
      }
    },
    addMarkButtons() {
      const self = this;
      const fleetsTitleActions = $('#items_list .player_fleet_title .fleet_actions');
      Addons.Common.waitObj(fleetsTitleActions, () => {
        self.buttonOn = Addons.DOM.createActionButton('Пометить', 'fa fa-eye',
          'map-mark');
        self.buttonOn.on('click', self.turnOn.bind(self));

        self.buttonOff = Addons.DOM.createActionButton('Скрыть', 'fa fa-eye-slash',
          'map-unmark');
        self.buttonOff.on('click', self.turnOff.bind(self));

        Addons.DOM.replaceContent(fleetsTitleActions,
          fleetsTitleActions.children('button').length === 0,
          self.buttonOn, self.buttonOff);
      });
    },
    init() {
      this.addMarkButtons();
    },
  };

})(window);
