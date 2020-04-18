// ==UserScript==
// @name         Spacom.Addons.Map.Ruler
// @version      0.1.1
// @namespace    http://dimio.org/
// @description  Measure distance between stars on map
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
// console.log('Spacom.Addons.Map.Ruler booted');

const SETTINGS = {
  COLOR: {
    default: '#37ff87',
  },
  DASH: {
    isDashed: false,
    pattern: [5, 20, 20, 5],
  },
  TEXT: {
    addTurn: true,
  },
};

const ERR_MSG = {
  NO_LIB: `Для работы Spacom.Addons.Map.Ruler необходимо установить и включить следующие дополнения:
<ul>
<li>Spacom.Addons</li>
<li>Spacom.Addons.Map.Scene</li>
</ul>
<a href="https://github.com/dimio/userscripts-spacom.ru-addons">https://github.com/dimio/userscripts-spacom.ru-addons</a>`,
};

(function (window) {
  'use strict';

  window.unsafeWindow = window.unsafeWindow || window;
  const w = unsafeWindow;

  if (w.self !== w.top) {
    return;
  }
  if (!w.Addons || !w.Addons.Map.Scene) {
    w.showSmallMessage(ERR_MSG.NO_LIB);
    return;
  }
  if (!w.Addons.Map) {
    w.Addons.Map = {};
  }
  const Addons = w.Addons;

  Addons.Map.Ruler = {
    button: null,
    enabled: false,
    title: 'Вкл/Выкл линейку',
    path: [],
    leg: [],

    toggle(flag) {
      this.enabled = typeof flag === "boolean" ? flag : !this.enabled;

      if (this.enabled) {
        this.leg = [];
        w.scene.defaultCursor = `url('${this.rulerIco}') 2 2, auto`;
        w.scene.on('mouse:over', function (e) {
          if (e.target !== null && e.target.nature === 'star') {
            e.target.hoverCursor = 'crosshair';
          }
        });
      }
      else {
        if (this.leg.length > 1) {
          this.path.push({color: SETTINGS.COLOR.default, line: this.line});
        }
        w.scene.defaultCursor = 'default';
        w.scene.on('mouse:over', function (e) {
          if (e.target !== null) {
            e.target.hoverCursor = 'pointer';
          }
        });
      }
    },
    makePath(point) {
      point["center"] = w.getCenterXY(point.x, point.y);
      this.leg.push(point);
      if (this.leg.length > 1) {
        let prev = this.leg[this.leg.length - 2];
        let curr = this.leg[this.leg.length - 1];
        if (curr.id === prev.id) {
          this.leg.shift();
          this.path.push({color: SETTINGS.COLOR.default, line: this.line});
          this.toggle(true);
          return;
        }

        this.drawArrow(prev, curr);
      }
    },
    // draw arrow between two points (from p1 to p2)
    drawArrow(p1, p2) {
      const id = p2.id + '' + p1.id;
      const distance = this.getDistance(p1, p2);
      const line = Addons.Map.Scene.createLine({
        coords: [p1.center.x, p1.center.y, p2.center.x, p2.center.y],
        id: id,
        stroke: SETTINGS.COLOR.default,
        strokeDashArray: SETTINGS.DASH.isDashed ?
          SETTINGS.DASH.pattern : [],
      });
      const arrow = Addons.Map.Scene.addArrowhead(
        line,
        {
          id: id,
          fill: SETTINGS.COLOR.default,
        });
      const text = Addons.Map.Scene.createText(
        distance.toLocaleString() +
        (SETTINGS.TEXT.addTurn ? `\nХод: ${w.turn}` : ''),
        {
          id: id,
          x: (line.x1 + line.x2) / 2,
          y: (line.y1 + line.y2) / 2,
          color: SETTINGS.COLOR.default,
          editable: true,
        });
      Addons.Map.Scene.show([text, arrow]);
      w.scene.setActiveObject(text);
      // console.log(JSON.stringify([leg, text]))
    },
    getDistance(from, to) {
      return w.distance(
        from.x, from.y,
        to.x, to.y
      );
    },
    addButton() {
      this.button = Addons.DOM.createMapButton(
        '',
        'spacom-addons-ruler',
        this.title,
        this.rulerIco,
      );
      this.button.on('click', this.toggle.bind(this));
    },
    init() {
      this.addButton();

      const self = this;
      $(document).keyup(function (event) {
        if (event.keyCode === 27) { // Esc
          self.toggle(false);
        }
      });

      const _clickMapStar = w.map.clickMapStar;
      w.map.clickMapStar = function (id, fleet_id) {
        if (this.enabled) {
          this.makePath({
              id: w.map.stars[id].id,
              x: w.map.stars[id].x,
              y: w.map.stars[id].y,
            }
          );
        }
        else {
          _clickMapStar.call(w.map, ...arguments);
        }
      }
      .bind(this);
    },
    rulerIco: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMuOCAzLjgiPjxkZWZzPjxmaWx0ZXIgaWQ9ImEiIGNvbG9yLWludGVycG9sYXRpb24tZmlsdGVycz0ic1JHQiI+PGZlQ29sb3JNYXRyaXggcmVzdWx0PSJjb2xvcjIiIHZhbHVlcz0iLTEgMCAwIDAgMSAwIC0xIDAgMCAxIDAgMCAtMSAwIDEgMC4yMSAwLjcyIDAuMDcgMSAwIi8+PC9maWx0ZXI+PGZpbHRlciBpZD0iYiIgY29sb3ItaW50ZXJwb2xhdGlvbi1maWx0ZXJzPSJzUkdCIj48ZmVDb2xvck1hdHJpeCByZXN1bHQ9ImNvbG9yMiIgdmFsdWVzPSItMSAwIDAgMCAxIDAgLTEgMCAwIDEgMCAwIC0xIDAgMSAwLjIxIDAuNzIgMC4wNyAxIDAiLz48L2ZpbHRlcj48L2RlZnM+PGcgZmlsbD0ibm9uZSIgZmlsbC1ydWxlPSJldmVub2RkIiBmaWx0ZXI9InVybCgjYSkiIHRyYW5zZm9ybT0ibWF0cml4KC0uMDA0MDggLS4wNTE0MyAtLjA1NTYxIC4wMDQwMiAzLjYgMy4zKSI+PGcgZmlsbD0iIzAwMCIgZmlsbC1ydWxlPSJub256ZXJvIj48cGF0aCBkPSJNNDcuMiA3LjRhMSAxIDAgMDAtMS4zLS4xIDEgMSAwIDAwLS4yIDEuNCA0LjIgNC4yIDAgMDEtMSA2LjMgMSAxIDAgMDAtLjUgMWMwIC4zLjEuNy40LjkuNC4yLjcuMSAxIDBhNi40IDYuNCAwIDAwMS42LTkuNXpNNDIuMyA3LjNjLjQgMCAuNy0uMy44LS42YTEgMSAwIDAwMC0xIDEgMSAwIDAwLTEtLjVBNiA2IDAgMDAzNyA5LjhjLS43IDIuNC4yIDUgMi4xIDYuNi4zLjIuNy4zIDEgLjIuNC0uMi42LS41LjYtLjlhMSAxIDAgMDAtLjQtMSA0LjMgNC4zIDAgMDEtMS4xLTUuMiA0IDQgMCAwMTMuMS0yLjJ6Ii8+PHBhdGggZD0iTTYwIDEuMWEzIDMgMCAwMC0zLjgtMS4zbC03LjQgMy40YTkuNiA5LjYgMCAwMC04LjEtMkExMCAxMCAwIDAwMzQgNi42TDcuMiAxMWwtLjEtLjZBMiAyIDAgMDA2IDkgMiAyIDAgMDA0IDlsLTUuNSAzLjRjLS44LjQtMS4xIDEuMi0xIDJ2LjRsLTIgLjNhMSAxIDAgMDAtLjcuN2MtLjEuNCAwIC43LjIgMSAuMi4zLjYuNSAxIC40bDEuOS0uM2EyIDIgMCAwMDEuNCAxLjZoLjlsMjIuMi0zLjdjLjUgMiAxLjIgNCAyLjIgNmwtMS44IDFhMSAxIDAgMDAtLjUgMWMwIC4zLjIuNy41LjguMy4yLjcuMiAxIDBsMS44LTFjMSAxLjkgMi4zIDMuNiAzLjggNUwxNC44IDQ1LjZhMi4xIDIuMSAwIDAwLjIgMi45TDEzLjcgNTBhMSAxIDAgMDAtLjIgMWMuMS4zLjQuNi44LjcuMyAwIC43IDAgMS0uNGwxLjItMS42LjMuMi43LjVjLjUuMSAxIDAgMS41LS4ybDUuNi0zLjJjLjYtLjMgMS0xIDEtMS42LjEtLjctLjEtMS40LS42LTEuOGwtLjUtLjQgMTcuNy0yMS40YzMgLjEgNS44LTEgNy44LTMuMyAyLTIuMiAzLTUuMiAyLjYtOC4ybDYuNy00LjhjMS4yLS45IDEuNi0yLjcuOS00ek0wIDE2LjVsLS40LTIuM0w1IDEwLjhsLjMgMS42YzAgLjYuNiAxIDEuMS45bDI2LjYtNC42Yy0uMi43LS4zIDEuNS0uMyAyLjJMMjMgMTIuNnptMjcuNCA1bDEuNy0xYy4zIDAgLjUtLjQuNS0uOGExIDEgMCAwMC0uNS0xIDEgMSAwIDAwLTEgMGwtMS43IDFjLS44LTEuNi0xLjUtMy40LTItNS4zTDMzIDEzYy4zIDIuNSAxLjYgNC44IDMuNCA2LjRMMzAuOCAyNmEyNS40IDI1LjQgMCAwMS0zLjQtNC41em0tNSAyMi42bDEuMyAxLTUuNiAzLjMtMS44LTEuNkwzOCAyMC42bDIgLjgtMTcuNiAyMS4zYTEgMSAwIDAwMCAxLjR6bTI0LjItMjUuNGE3LjggNy44IDAgMDEtMTAtMS45IDguNSA4LjUgMCAwMS0uMS0xMC41YzIuMy0zIDYuNC00IDkuOC0yLjNhOC40IDguNCAwIDAxLjMgMTQuN3pNNTguMSAzLjhsLTYgNC4zYy0uMy0xLjItMS0yLjMtMS43LTMuM0w1NyAxLjdjLjUtLjIgMSAwIDEuMy40bC4xLjNjLjMuNS4yIDEuMS0uMyAxLjR6Ii8+PC9nPjwvZz48dGV4dCBzdHlsZT0ibGluZS1oZWlnaHQ6MS4yNSIgeD0iLTIuMSIgeT0iMi45IiBzdHJva2Utd2lkdGg9Ii4xIiBmb250LWZhbWlseT0ic2Fucy1zZXJpZiIgZm9udC1zaXplPSI0LjciIGZvbnQtd2VpZ2h0PSI0MDAiIGxldHRlci1zcGFjaW5nPSIwIiB3b3JkLXNwYWNpbmc9IjAiLz48ZyBmaWx0ZXI9InVybCgjYikiIHRyYW5zZm9ybT0ibWF0cml4KC43OTEzIDAgMCAuODM0OSAyIC0uMykiPjxwYXRoIGQ9Ik0tMi40IDEuMmgxLjd2LjJoLTEuN3oiLz48cGF0aCBkPSJNLTEuNC41djEuN2gtLjJWLjV6Ii8+PC9nPjwvc3ZnPg==",
  };

  Addons.Map.Ruler.init();

})(window);