// ==UserScript==
// @name         Spacom.Addons.Fleets.MarkOnMap
// @version      0.1.0
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
// @run-at       document-end
// ==/UserScript==
// console.log('Spacom.Addons.Fleets.MarkOnMap booted');

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
  NO_LIB: `Для работы Spacom.Addons.Fleets.MarkOnMap необходимо установить и включить следующие дополнения:
<ul>
<li>Spacom.Addons</li>
<li>Spacom.Addons.Map.Scene</li>
</ul>
<a href="https://github.com/dimio/userscripts-spacom.ru-addons">https://github.com/dimio/userscripts-spacom.ru-addons</a>`,
};

(function (window) {
  window.unsafeWindow = window.unsafeWindow || window;
  const w = unsafeWindow;

  if (w.self !== w.top) {
    return;
  }
  if (!w.Addons || !w.Addons.Map.Scene) {
    w.showSmallMessage(ERR_MSG.NO_LIB);
    return;
  }
  if (!w.Addons.Fleets) {
    return;
  }

  w.Addons.Fleets.MarkOnMap = {
    buttonOn: null,
    buttonOff: null,
    enabled: false,
    marks: {},

    createMarks(fleets) {
      for (const fleet of fleets) {
        const center = w.Addons.getObjCenter({
          obj: fleet,
          mode: 'mark',
        });

        if (fleet.fleet_id in this.marks[w.sub_menu]) {
          if (w.sub_menu.includes('own')) {
            w.Addons.Map.Scene.setObjectCenter(
              w.Addons.Map.Scene.getObjectById(fleet.fleet_id),
              center
            );
          }
          continue;
        }

        this.marks[w.sub_menu][fleet.fleet_id] = w.Addons.Map.Scene.createCircle({
          id: fleet.fleet_id,
          x: center.x,
          y: center.y,
          radius: MARK_SETTINGS.RADIUS,
          fill: this.getMarkFillColor(fleet.owner),
          opacity: MARK_SETTINGS.OPACITY,
        });
      }
    },
    mark() {
      this.createMarks(w.Addons.Fleets.Sort.fleets);
      if (w.Addons.isObjNotEmpty(this.marks[w.sub_menu])) {
        w.Addons.Map.Scene.show(this.marks[w.sub_menu])
      }
    },
    unmark() {
      w.Addons.Map.Scene.hide(this.marks[w.sub_menu]);
      // it's needed so that do not highlight again
      // deleted, splitted or moved to garrison fleets
      if (w.sub_menu.includes('own')) {
        delete this.marks[w.sub_menu];
      }
    },
    getMarkFillColor(fleetOwner) {
      return MARK_SETTINGS.FILL_COLOR[fleetOwner] || 'white';
    },
    turnOn() {
      this.enabled = true;
      if (!w.Addons.isVariableDefined(this.marks[w.sub_menu])) {
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
      w.Addons.waitObj($('#items_list > div.row.player_fleet_title'), () => {
        self.buttonOn = w.Addons.DOM.createActionButton('Пометить', 'fa fa-eye',
          'map-mark');
        self.buttonOn.on('click', self.turnOn.bind(self));

        self.buttonOff = w.Addons.DOM.createActionButton('Скрыть', 'fa fa-eye-slash',
          'map-unmark');
        self.buttonOff.on('click', self.turnOff.bind(self));

        w.Addons.DOM.replaceContent($('div.col-xs-4.col-md-2.fleet_actions')[0],
          self.buttonOn, self.buttonOff);
      });
    },
    init() {
      this.addMarkButtons();
    },
  };

})(window);
