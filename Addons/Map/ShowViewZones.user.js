// ==UserScript==
// @name         Spacom.Addons.Map.ShowViewZones
// @version      0.1.0
// @namespace    http://dimio.org/
// @description  Show on a map view zones for fleets and colonized systems
// @author       dimio (dimio@dimio.org)
// @author       segrey
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/?act=game/map*
// @include      http*://spacom.ru/?act=game/map*
// @run-at       document-end
// ==/UserScript==
/**
 * Based on "Spacom addons" by segrey:
 * https://greasyfork.org/en/scripts/27897-spacom-addons
 **/
//console.log('Spacom.Addons.Map.ShowViwZones');

const ERR_MSG = {
  NO_LIB: `Для работы Spacom.Addons.Map.ShowViewZones необходимо установить и включить Spacom.Addons
<a href="https://github.com/dimio/userscripts-spacom.ru-addons">https://github.com/dimio/userscripts-spacom.ru-addons</a>`,
};

(function (window) {
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
    title: 'Показать зоны видимости',

    createCircles() {
      this.circles = {};

      const fleets = w.map.fleets.filter((fleet) => {
        return +fleet.view_radius !== 0 && (+fleet.turn === 0
          || +fleet.start_turn - +fleet.turn === 0);
      });

      for (const i in fleets) {
        if (fleets.hasOwnProperty(i)) {
          const fleet = fleets[i];

          const center = Addons.getObjCenter({
            obj: fleet,
            mode: 'viewzone',
          });

          this.circles[i] = Addons.Map.Scene.createCircle({
            x: center.x,
            y: center.y,
            radius: fleet.view_radius,
          });
        }
      }
    },
    showViewZones(flag) {
      this.enabled = flag;

      // small bug: it show VZ for deleted fleets also
      if (!this.circles) {
        if (this.enabled) {
          this.createCircles();
          Addons.Map.Scene.drawObjects(this.circles);
        }
        else {
          return;
        }
      }

      Addons.Map.Scene.toggleObjectsVisibility(this.circles, this.enabled);
      w.scene.renderAll();
    },
    toggle() {
      const icon = $('#spacom-addons-showviewzones i');
      icon.toggleClass('fa-eye fa-eye-slash');
      this.title = icon.hasClass('fa-eye-slash') ?
        'Скрыть зоны видимости' : 'Показать зоны видимости';
      icon.attr('title', this.title);
      this.showViewZones(!this.enabled);
    },
    init() {
      this.button = Addons.DOM.createMapButton(
        'fa-eye',
        'spacom-addons-showviewzones',
        this.title,
      );
      this.button.on('click', this.toggle.bind(this));
    },
  };

  if (w.map) {
    Addons.Map.ShowViewzones.init();
  }

})(window);
