// ==UserScript==
// @name         Spacom.ru::Addons::OrderGeoExplore
// @namespace    http://tampermonkey.net/
// @version      0.2.2
// @description  Geo-exploring auto buying
// @author       dimio
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   dimio.org, dimio@dimio.org
// @encoding     utf-8
// @match        http*://spacom.ru/?act=map
// @include      http*://spacom.ru/?act=map
// @run-at       document-end
// ==/UserScript==
// console.log('Spacom::Addons::ExploreAllGeo booted');

const EXPLORE_COST = 25;
const ERR_MSG = {
    NO_LIB: `Для работы дополнений необходимо установить и включить Spacom.ru::Addons:<br>
https://github.com/dimio/userscripts-spacom.ru-addons/raw/master/Addons.user.js`,
    EXPLORE_BREAK: 'Ошибка автоматической разведки. Перезагрузите страницу и попробуйте снова.',
    EXPLORE_NOMONEY: 'Недостаточно денег для проведения разведки. Требуется N кредитов, баланс - X кредитов.',
    EXPLORE_NOFLEETS: 'Нет готовых к разведке флотов.',
};
const EXPLORE_MSG_OK = 'Будет разведано систем: X. ' +
    'Результат разведки станет доступен через 1 ход. Это стоило вам N кредитов.';

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
    if (!w.Addons.Fleets) {
        w.Addons.Fleets = {};
    }
    const Addons = w.Addons;

    Addons.Fleets.OrderGeoExplore = {
        orderExploreAll() {
            const money = +document.getElementsByClassName('turn money')[1].innerText.split('/')[0];

            const Explore = {};
            Explore.fleets = this.getAllowExploreFleets();
            Explore.available = Explore.fleets.length;
            Explore.cost = Explore.available * EXPLORE_COST;

            if (money < Explore.cost) {
                let message = ERR_MSG.EXPLORE_NOMONEY.replace('N', Explore.cost);
                message = message.replace('X', money);
                w.showSmallMessage(message);
                return false;
            }
            else if (Explore.fleets.length > 0) {
                Explore.YesNo = confirm(`Разведать ${Explore.available} систем за ${Explore.cost} кредитов?`);
                if (Explore.YesNo) {
                    for (const i in Explore.fleets) {
                        if (Explore.fleets.hasOwnProperty(i)) {
                            // Explore.json_answer = this.orderExplore(+Explore.fleets.shift().fleet_id);
                            Explore.response = this.orderExplore(+Explore.fleets.shift().fleet_id).then((json) => {
                                console.log('This: ', json);
                                if (+json.explore.status !== 1) {
                                    w.showSmallMessage(ERR_MSG.EXPLORE_BREAK);
                                    return false;
                                }
                                return json;
                            });
                            console.log('And this...', Explore.response);
                        }
                    }

                    /* const timeoutID = w.setInterval(() => {
                         if (Explore.fleets.length === 0 && Explore.status === 1) {
                             w.clearInterval(timeoutID);
                             let message = EXPLORE_MSG_OK.replace('N', Explore.cost);
                             message = message.replace('X', Explore.available);
                             w.showSmallMessage(message);
                         }
                     }, 0);*/
                    if (Explore.response) {
                        let message = EXPLORE_MSG_OK.replace('N', Explore.cost);
                        message = message.replace('X', Explore.available);
                        w.showSmallMessage(message);
                        /* w.map.removeAllFleets();
                        w.map.jsonToFleets(Explore.json_answer);
                        w.map.drawFleets();
                        w.parseAnswer(Explore.json_answer, '');*/
                    }
                }
            }
            else {
                w.showSmallMessage(ERR_MSG.EXPLORE_NOFLEETS);
            }
            return true;
        },
        orderExplore(fleet_id) {
            return $.getJSON(`${w.APIUrl()}&act=map&task=fleets&order=explore&fleet_id=${fleet_id}&format=json`)
                .then((json) => {
                    // return +json.explore.status;
                    return json;
                });
        },
        getAllowExploreFleets() {
            let fleets = w.map.fleets.filter((fleet) => {
                return +fleet.allow_explore === 1;
            });

            fleets.sort((a, b) => {
                if (a.star_id === b.star_id) {
                    b.delme = 1;
                    return 0;
                }
                return +a.star_id - +b.star_id;
            });

            fleets = fleets.filter((fleet) => {
                return fleet.delme !== 1;
            });

            return fleets;
        },
        init() {
            this.button = Addons.HTMLElement.createMapButton(
                'fa-wpexplorer',
                'spacom-addons-exploreallgeo',
                'Заказать массовую георазведку систем',
            );
            this.button.on('click', this.orderExploreAll.bind(this));
        },
    };

    if (w.map) {
        Addons.Fleets.OrderGeoExplore.init();
    }
})(window);

/*
        orderExplore(fleet_id) {
            return $.getJSON(`${w.APIUrl()}&act=map&task=fleets&order=explore&fleet_id=${fleet_id}&format=json`,
                {}, (json) => {
                    if (+json.explore.status !== 1) {
                        return 0;
                    }
                    w.map.removeAllFleets();
                    w.map.jsonToFleets(json);
                    w.map.drawFleets();
                    w.parseAnswer(json, '');
                    return 1;
                });
        },
*/
