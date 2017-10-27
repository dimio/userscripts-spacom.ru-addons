// ==UserScript==
// @name         Spacom.ru::Addons
// @version      0.0.13
// @namespace    http://dimio.org/
// @description  Provide Spacom.ru::Addons library functions on spacom.ru
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/*
// @run-at       document-start
// ==/UserScript==
/**
 * Based on "Spacom addons" by segrey (
 * https://greasyfork.org/en/scripts/27897-spacom-addons
**/
// console.log('Spacom.ru::Addons booted');

(function(window) {
    window.unsafeWindow = window.unsafeWindow || window;
    const w = unsafeWindow;

    if (w.self !== w.top) {
        return;
    }
    if (!w.Addons) {
        w.Addons = {};
    }

    w.Addons = {
        waitFor(obj, prop, callback) {
            const token = setInterval(() => {
                if (obj[prop] !== undefined) {
                    clearInterval(token);
                    callback(obj[prop]);
                }
            }, 0);
        },
        waitMenu(menu, callback) {
            const token = setInterval(() => {
                if (typeof menu !== 'undefined') {
                    if (w.isVariableDefined(menu.length) && menu.length > 0) {
                        clearInterval(token);
                        callback(menu);
                    }
                }
            }, 0);
        },
        replaceElemContent(elem) {
            $(elem).empty();

            for (let i = 1; i < arguments.length; i++) {
                $(elem).append(arguments[i]);
            }

            return elem;
        },

        createCircle(opt) {
            const x = opt.x;
            const y = opt.y;

            const radius = opt.radius || 3;
            const fill = opt.fill || 'rgb(40,100,40)'; // light-green
            const opacity = opt.opacity || 0.2;

            const circle = new w.fabric.Circle({
                left: x,
                top: y,
                radius: radius * w.box_size,
                fill,
                opacity,
                originX: 'center',
                originY: 'center',
                selectable: false,
                visible: false,
            });

            w.scene.add(circle);
            w.scene.sendToBack(circle);

            return circle;
        },
        drawCircle(circle) {
            circle.set({
                visible: true,
            });
        },
        drawCircles(circles) {
            for (const i in circles) {
                if (circles.hasOwnProperty(i)) {
                    this.drawCircle(circles[i]);
                }
            }
        },

        getFleetCenter(opt) {
            const fleet = opt.fleet;
            const mode = opt.mode;

            let center;

            switch (mode) {
                case 'mark':
                    center = w.getCenterXY(fleet.x, fleet.y);
                    break;

                case 'viewzone':
                    if (+fleet.turn === 0) {
                        center = w.getCenterXY(fleet.x, fleet.y);
                    }
                    else {
                        center = { x: fleet.start_x, y: fleet.start_y };
                    }
                    break;
            }

            return center;
        },

        appendElemClickableIcon(opt) {
            const elem = opt.elem;
            const icon = opt.icon;
            const css_name = opt.css_name;
            const title = opt.title;
            const callback = opt.callback;

            const appended_elem = $(elem);

            const clickable_icon = document.createElement('a');
            clickable_icon.href = '#';
            clickable_icon.title = title;
            clickable_icon.setAttribute('onclick', `${callback};return false;`);
            clickable_icon.innerHTML = ` <i class="fa ${icon}" id="${css_name}"></i></a>`;

            appended_elem.append(clickable_icon);

            return elem;
        },

    };

    w.makeElementClickable = function(elem, icon, css_name, title, callback) {
        let text = elem.innerText;
        if (icon) { text = `<i id="${css_name}" class="fa ${icon}"></i> ${text}`; }
        elem.innerHTML = `<a href="#" title="${title}" onclick="${callback}; return false;">${text}</a>`;

        return elem;
    };

    w.createNaviBarButton = function(name, last_el_num, callback) {
        const last = $(`#navi > div:nth-child(${last_el_num})`);

        $(last).parent().css({
            // width: `${parseInt($(last).parent().css('width'), 10) + 15}px`,
            width: 'fit-content',
            'padding-left': '5px',
            'padding-right': '5px',
        });
        $(last).parent().children('*').css({
            // 'margin-left': '10px',
            'margin-right': '5px',
        });

        const next = $(`<div class="${last.attr('class')}" onclick="${callback};
return false;"><a href="#">${name}</a></div>`);
        last.after(next);

        return next;
    };

    w.createActionButton = function(btn_text, css_class, css_id) {
        const button = $(`<button class="btn-action" id="${css_id}" onclick="return false;">
<i class="${css_class}" aria-hidden="true"></i> <br><span class="button-text">${btn_text}</span>
<br></button>`);

        return button;
    };

    w.appendElemActionButton = function(button, parent_el) {
        parent_el.append(button);

        return parent_el;
    };

    w.createMapButton = function(css, id, title) {
        const last = $('#radar + div');
        const next = $(`<div id="${id}" title="${title}"><i class="fa ${css} fa-2x"></i></div>`).css({
            'z-index': last.css('z-index'),
            position: last.css('position'),
            cursor: last.css('cursor'),
            color: last.css('color'),
            right: last.css('right'),
            bottom: `${parseInt(last.css('bottom'), 10) + 40}px`,
        });
        last.before(next);

        return next;
    };

    w.sortAlphabetically = function(a, b) {
        // const a_cmp = a.toUpperCase();
        // const b_cmp = b.toUpperCase();

        // return (a_cmp < b_cmp) ? -1 : (a_cmp > b_cmp) ? 1 : 0;

        // in IE10 - use localeCompare from Intl.JS
        return a.localeCompare(b);
    };

    w.sortNumerically = function(a, b) {
        const a_cmp = parseFloat(a, 10);
        const b_cmp = parseFloat(b, 10);

        return a_cmp - b_cmp;
    };

    w.isObjNotEmpry = function(obj) {
        if (Object.values(obj).filter(this.isVariableDefined).length > 0) {
            return true;
        }
        return false;
    };

    w.isVariableDefined = function(value) {
        if (typeof value === 'undefined') {
            return false; // retrun value >>> 0
        }
        if (value === null) {
            return false;
        }
        return true;
    };

    w.toggleFlag = function(flag) {
        if (this.isVariableDefined(flag)) {
            return null;
        }
        return true;
    };

})(window);

/*
     w.appendOnclickEvent = function(i, elem, callback) {
        const last_onclick = $(elem).attr('onclick');
        const new_onclick = `${callback}; ${last_onclick}`;
        $(elem).attr('onclick', new_onclick);

        return elem;
    };
*/
