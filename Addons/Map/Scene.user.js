// ==UserScript==
// @name         Spacom.Addons.Map.Scene
// @version      0.1.0
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
// console.log('Spacom.Addons.Map.Scene booted');

const ERR_MSG = {
  NO_LIB: `Для работы дополнений необходимо установить и включить Spacom.Addons:<br>
    https://github.com/dimio/userscripts-spacom.ru-addons/raw/master/Addons/Addons.user.js`,
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

  Addons.Map.Scene = {
    createCircle(opt) {
      this.id = opt.id;
      this.x = opt.x;
      this.y = opt.y;

      const radius = opt.radius || 3;
      const fill = opt.fill || 'rgb(40,100,40)'; //light-green
      const opacity = opt.opacity || 0.2;

      const self = this;
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
      const x = opt.x;
      const y = opt.y;
      const color = opt.color || '#ff4800';
      const font = opt.font || "'Play'"; //"'FontAwesome'"
      const fontSize = opt.fontSize || 14;

      return new w.fabric.IText(text, {
        left: x,
        top: y + 18,
        fill: color,
        fontSize: fontSize,
        selection: false,
        hasRotatingPoint: false,
        hasBorders: false,
        hasControls: false,
        fontFamily: font,
        originX: 'center',
        originY: 'center',
        visible: false,
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
    _drawObject(object) {
      w.scene.add(object);
      w.scene.sendToBack(object);
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
