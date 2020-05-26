// ==UserScript==
// @name         Spacom.Addons.Map.Scene
// @version      0.1.2
// @namespace    http://dimio.org/
// @description  Draw on map
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
console.log(GM_info.script.name, 'booted v.', GM_info.script.version);
const homePage = GM_info.scriptMetaStr.split('\n')[6].split(' ')[6];

const ERR_MSG = {
  NO_LIB: `Для работы ${GM_info.script.name} необходимо установить и включить последние версии следующих дополнений:
<ul>
<li>Spacom.Addons</li>
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
  if (!Addons) {
    w.showSmallMessage(ERR_MSG.NO_LIB);
    return;
  }

  Addons.Map.Scene = {
    addArrowhead(line, opt) {
      this.id = opt.id;
      this.width = opt.width || 10;
      this.height = opt.height || 25;
      this.fill = opt.fill || 'rgb(40,100,40)';

      const offset = this._calcArrowheadOffset(line.x1, line.y1,
        line.x2, line.y2, this.height);

      const triangle = new w.fabric.Triangle({
        // id: this.id,
        width: this.width,
        height: this.height,
        fill: this.fill,
        left: line.x2 - offset.dx,
        top: line.y2 - offset.dy,
        angle: this._calcArrowheadAngleDeg(line.x1, line.y1, line.x2, line.y2),
        originX: 'center',
        originY: 'center',
      });

      return new w.fabric.Group(
        [line, triangle], {
          id: this.id,
          selectable: false,
        });
    },
    _calcArrowheadOffset(x1, y1, x2, y2, triangleHeight) {
      const deltaX = x2 - x1;
      const deltaY = y2 - y1;
      const lineLength = Math.sqrt(
        Math.pow(deltaX, 2) + Math.pow(deltaY, 2)
      );
      const dx = (triangleHeight / 2 * deltaX) / lineLength;
      const dy = (triangleHeight / 2 * deltaY) / lineLength;

      return {dx, dy};
    },
    _calcArrowheadAngleDeg(x1, y1, x2, y2) {
      let angle = 0;
      const dx = x2 - x1;
      const dy = y2 - y1;

      if (dx === 0) {
        angle = (dy === 0) ? 0 :
          (dy > 0) ? Math.PI / 2 : Math.PI * 3 / 2;
      }
      else if (dy === 0) {
        angle = (dx > 0) ? 0 : Math.PI;
      }
      else {
        angle = (dx < 0) ? Math.atan(dy / dx) + Math.PI :
          (dy < 0) ? Math.atan(dy / dx) + (2 * Math.PI) :
            Math.atan(dy / dx);
      }

      return angle * 180 / Math.PI + 90;
    },
    createLine(opt) {
      this.coords = opt.coords;
      this.id = opt.id;
      this.stroke = opt.stroke || 'rgb(40,100,40)'; //light-green
      this.strokeWidth = opt.strokeWidth || 1;
      this.strokeDashArray = opt.strokeDashArray || [];

      return new w.fabric.Line(this.coords, {
          id: this.id,
          stroke: this.stroke,
          strokeWidth: this.strokeWidth,
          strokeDashArray: this.strokeDashArray,
          selectable: false,
          originX: 'center',
          originY: 'center',
        }
      );
    },
    createCircle(opt) {
      this.id = opt.id;
      this.x = opt.x;
      this.y = opt.y;

      const radius = opt.radius || 3;
      const fill = opt.fill || 'rgb(40,100,40)'; //light-green
      const opacity = opt.opacity || 0.2;

      return new w.fabric.Circle({
        id: this.id,
        left: this.x,
        top: this.y,
        radius: radius * w.box_size,
        fill,
        opacity,
        originX: 'center',
        originY: 'center',
        selectable: false,
        visible: false,
      });
    },
    createText(text, opt) {
      this.x = opt.x;
      this.y = opt.y;
      this.id = opt.id;
      this.color = opt.color || '#ff4800';
      this.font = opt.font || "'Play'"; //"'FontAwesome'"
      this.fontSize = opt.fontSize || 14;
      this.editable = opt.editable || false;

      return new w.fabric.IText(text, {
        id: this.id,
        left: this.x,
        top: this.y, // + 18
        fill: this.color,
        backgroundColor: '#000000',
        fontSize: this.fontSize,
        editable: this.editable,
        selection: false,
        hasRotatingPoint: false,
        hasBorders: false,
        hasControls: false,
        fontFamily: this.font,
        cursorColor: '#da1822',
        originX: 'center',
        originY: 'center',
        visible: false,
        selectable: false,
      });
    },
    show(objects) {
      this.drawObjects(
        objects.filter((object) => {
          return w.scene.getObjects().every((sceneObject) => {
            return object.id !== sceneObject.id
          })
        })
      );
      this.toggleObjectsVisibility(objects, true);
      w.scene.renderAll();
    },
    hide(objects) {
      this.removeObjects(objects);
      w.scene.renderAll();
    },
    getObjectById(id) {
      return w.scene.getObjects().filter((sceneObject) => {
        return sceneObject.id === id;
      })[0];
    },
    setObjectCenter(object, center) {
      // circle
      object.set({
        left: center.x,
        top: center.y,
      })
    },
    _drawObject(object, toBack = true) {
      w.scene.add(object);
      if (toBack) {
        w.scene.sendToBack(object);
      }
    },
    drawObjects(objects) {
      for (const i in objects) {
        if (objects.hasOwnProperty(i)) {
          this._drawObject(objects[i]);
        }
      }
    },
    toggleObjectsVisibility(objects, visibility) {
      for (const i in objects) {
        if (objects.hasOwnProperty(i)) {
          objects[i].set({
            visible: visibility,
          });
        }
      }
    },
    removeObjects(objects) {
      for (const i in objects) {
        if (objects.hasOwnProperty(i)) {
          w.scene.remove(objects[i]);
        }
      }
    },
  };

})(window);
