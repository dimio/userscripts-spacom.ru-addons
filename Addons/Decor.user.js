// ==UserScript==
// @name         Spacom.ru::Addons::Decor
// @version      0.0.1
// @namespace    http://dimio.org/
// @description  none
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/*
// @include      http*://spacom.ru/*
// @run-at       document-end
// ==/UserScript==

(function(window) {
    window.unsafeWindow = window.unsafeWindow || window;
    const w = unsafeWindow;

    if (w.self !== w.top) {
        return;
    }
    if (!w.Addons.Decor) {
        w.Addons.Decor = {};
    }

    w.Addons.Decor = {
        formatTurnMoney() {
            const turn_money = document.getElementsByClassName('turn money');
            const money = {};
            money.per_turn = +turn_money[0].innerText;
            money.total = turn_money[1].innerText.split('/');
            money.available = +money.total[0];
            money.max = +money.total[1];

            for (const i in money) {
                money[i] = money[i].toLocaleString();
            }

            money.total = `${money.available} / ${money.max}`;
            document.getElementsByClassName('turn money')[0].innerText = money.per_turn;
            document.getElementsByClassName('turn money')[1].innerText = money.total;
        },
        formatTurnScience() {
            let turn_science = +document.getElementsByClassName('turn science')[0].innerText;
            turn_science = turn_science.toLocaleString();
            document.getElementsByClassName('turn science')[0].innerText = turn_science;
        },
        init() {
            this.formatTurnMoney();
            this.formatTurnScience();
        },
    };

    w.Addons.waitObj(document.getElementsByClassName('turn money'), () => {
        // w.Addons.Decor.init();
    });

})(window);
