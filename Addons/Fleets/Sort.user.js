// ==UserScript==
// @name         Spacom.ru::Addons::Fleets::Sort
// @namespace    http://tampermonkey.net/
// @version      0.0.5
// @description  Add a sorting filtres for fleets tabs
// @author       dimio
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   dimio.org, dimio@dimio.org
// @encoding     utf-8
// @match        http*://spacom.ru/?act=map
// @run-at       document-end
// ==/UserScript==
console.log('Spacom.ru::Addons::Fleets::Sort booted');
/* TODO:
[ ] добавить фильтрацию (по владельцу или имени, по типу, по состоянию)
[ ] для своих флотов - галка "исключить орбит. станции" (с сохр. состояния в local storage)
[х] откл. сорт. по скорости?
[x] если "пираты" (или "чужие", отсортир. по владельцу) - вместо владельца сорт. по назв. флота
[x] сохранять состояние сортировки, если вкладка флота не закрыта специально (напр. - была нажата "обзор" или "лететь") - пока глючно
*/

(function(window, undefined) {

    window.unsafeWindow = window.unsafeWindow || window;
    const w = unsafeWindow;

    if (w.self != w.top) {
        return;
    }

    // сделать настройки фильтрации в глобальном хэше (для простоты восприятия)
    // и передавать в ф-и href на них
    let sortby_last = null;
    let sortby_flag = null;
    let filterby_last = null;
    let filter_key = null;
    let filtered_fleets = [];
    let sorted_fleets = [];

    // null можно не передавать, будет undefined, но с null наглядней
    // so:
    document.getElementsByClassName('navi_menu_item')[2].setAttribute('onclick', `showFleets('other', 'fleet', ${
                                                                      null}); return false;`);
    // or so (jquery):
    $('#navi > div:nth-child(2)').attr('onclick', `showFleets('own', 'fleet', ${null}); return false;`);
    w.createNaviBarButton('Гарнизон', 1, `showFleets('own', 'garrison', ${null})`);
    w.createNaviBarButton('Пираты', 4, `showFleets('pirate', 'fleet', ${null})`);

    function purgeFleetFilters() {
        sortby_last = null;
        sortby_flag = null;
        filter_key = null;
        filtered_fleets.length = 0; // purge arr
    }

    w.showFleets = function(owner, fleet_type, redraw, sortby, filterby, filter_key) {
        // close the Fleets tab and purge filters
        if (sub_menu == `fleets_${owner}_${fleet_type}` && redraw === null) {
            purgeFleetFilters();
            sub_menu = false;
            $('#items_list').html('');
        }
        // вкладка флотов переключена, но не закрыта - сбросить фильтры и вывести станд. флоты
        else if (sub_menu !== false && sub_menu != `fleets_${owner}_${fleet_type}` && redraw === null) {
            sub_menu = `fleets_${owner}_${fleet_type}`;
            $('#items_list').html('');
            purgeFleetFilters();
            sorted_fleets = getFleets(owner, fleet_type);
            // и отсортировать по умолчанию (ф-я из map.js)
            sorted_fleets = sortFleetsBy(sorted_fleets, owner, sortby, filterby);
            drawFleetsTab(owner, fleet_type, sortby, filterby, sorted_fleets);
        }
        // вкладка флотов открыта
        else {
            map.clearInfo();

            // если был применен фильтр и он не сброшен - показать его результаты и обрабатывать их для сортировки
            // if ( filtered_fleets.filter( w.isArrElemDefined ).length > 0 && redraw !== null && w.isVariableDefined( filterby ) ){
            if (filtered_fleets.filter(w.isArrElemDefined).length > 0 && w.isVariableDefined(filterby_last)) {
                sorted_fleets = filtered_fleets;
            } else {
                sorted_fleets = getFleets(owner, fleet_type);
            }

            // если окно флотов закрыто автоматически (например - кн. "лететь") - сохранить фильтрацию
            // просто щелчек тоже сработает и отфильтрует по allow_fly... что не нужно делать
            if (sub_menu === false && (sortby_last || filterby_last)) {
                sortby = sortby_last;
                sortby_last = null;
                sortby_flag = null;
                sorted_fleets = sorted_fleets.filter(returnFleetsAllowFly);
            }

            // sorting selected
            if (sortby && sortby != 'no') {
                sorted_fleets = sortFleetsBy(sorted_fleets, owner, sortby, filterby);
                drawFleetsTab(owner, fleet_type, sortby, filterby, sorted_fleets);
            }
            // filtering selected
            else if (w.isVariableDefined(filterby) && (sortby == 'no' || sortby === null)) {
                sorted_fleets = filterFleetsBy(owner, fleet_type, sortby, filterby, filter_key);
                filtered_fleets = sorted_fleets.slice();
                drawFleetsTab(owner, fleet_type, sortby, filterby, sorted_fleets);
                filterby = null;
            }
            // или отсортировать по умолч. флоты по соотв. владельцу (гарнизон, свои, чужие, пираты)
            // show fleets sorting by default
            else {
                sorted_fleets = sortFleetsBy(sorted_fleets, owner, sortby, filterby);
                drawFleetsTab(owner, fleet_type, sortby, filterby, sorted_fleets);
            }

            sub_menu = `fleets_${owner}_${fleet_type}`;
        }
    };

    function returnFleetsAllowFly(fleet) {
        /* if ( +map.fleets[fleet.fleet_id].allow_fly === 1 ){
            return true;
        }
        return false;*/
        return +map.fleets[fleet.fleet_id].allow_fly === 1;
    }

    function filterFleetsBy(owner, fleet_type, sortby, filterby, filter_key) {
        const filter_keys = {};
        if (filter_key === null) {
            // сортировка по игроку - сбрасывает отфильтрованное
            if (filterby == 'player_name') {
                sorted_fleets = getFleets(owner, fleet_type);
            }
            /*
            for..in loops iterate over the entire prototype chain,
            which is virtually never what you want. Use Object.{keys,values,entries},
            and iterate over the resulting array no restricted syntax
            */
            for (const i in sorted_fleets) {
                // хэш: имя ключа == параметру фильрации
                // filter_keys[ sorted_fleets[i][filterby] ] = sorted_fleets[i][filterby];
                filter_keys[sorted_fleets[i][filterby]] = filterby;
            }
            if (Object.keys(filter_keys).filter(w.isArrElemDefined).length > 0) {
                showModalFilterList(filter_keys, owner, fleet_type, sortby, filterby);
            } else {
                let message = 'Не найдены параметры для фильтрации. ';
                message += 'Для сброса фильтров закройте и откройте заново текущую вкладку флотов.';
                w.showSmallMessage(message);
            }
        } else {
            sorted_fleets = sorted_fleets.filter((fleet) => {
                return fleet[filterby] == filter_key;
            });
        }

        filterby_last = filterby;
        return sorted_fleets;
    }

    function getFleets(owner, fleet_type) {
        sorted_fleets = map.fleets.slice();
        if (sorted_fleets.filter(w.isArrElemDefined).length > 0) {
            sorted_fleets = returnFleetsByOwner(owner, fleet_type, sorted_fleets);
        } else {
            $('#items_list').html('<div class="player_fleet_title">Нет флотов</div>');
            return false;
        }
        return sorted_fleets;
    }

    function drawFleetsTab(owner, fleet_type, sortby, filterby, sorted_fleets) {
        if (sorted_fleets && sorted_fleets.filter(w.isArrElemDefined).length > 0) {
            $('#items_list').append(tmpl('fleets_title', sorted_fleets));
            for (const i in sorted_fleets) {
                const fleet = sorted_fleets[i];
                map.showBlockFleet(fleet, fleet.owner);
            }
            $('#items_list>>>[title],#items_list>>>>[title]').qtip({
                position: {
                    my: 'bottom center', // at the bottom right of...
                    at: 'top center', // Position my top left...
                },
                style: {
                    classes: 'qtip-dark tips',
                },
            });

            const timerID = setInterval(() => {
                const divs = {};
                divs.fleet_speed = $('#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_speed')[0];
                divs.player_name = $('#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_name')[0];
                divs.turn = $('#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_state')[0];
                divs.ico = $('#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_ico_list')[0];
                divs.stat = $('#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_stat')[0];

                if (Object.keys(divs).filter(w.isArrElemDefined).length > 0) {
                    clearInterval(timerID);
                    makeClickableSortingIcons(divs, owner, fleet_type, filterby);
                    makeClickableFilteringIcons(divs, owner, fleet_type, sortby);
                }
            }, 0);
        } else if (owner != 'own') {
            $('#items_list').html('<div class="player_fleet_title">Нет видимых чужих флотов</div>');
        } else {
            $('#items_list').html('<div class="player_fleet_title">Нет собственных флотов</div>');
        }
    }

    function sortFleetsBy(sorted_fleets, owner, sortby, filterby) {
        switch (sortby) {
            case 'fleet_speed':
                sorted_fleets.sort(sortFleetsBySpeed);
                sorted_fleets.map((fleet) => {
                    fleet.fleet_speed = parseFloat(fleet.fleet_speed).toFixed(2);
                    return fleet;
                });
                break;
            case 'turn': // by state
                if (owner != 'own') { sorted_fleets.sort(sortOtherFleetsByState); } else { sorted_fleets.sort(sortOwnFleetsByState); }
                break;
            case 'ico': // by fleet type
                sorted_fleets.sort(sortFleetsByType);
                break;
            case 'player_name':
                if (owner != 'own') {
                    if (filterby == 'player_name') {
                        sorted_fleets.sort(sortFleetsByFleetName);
                        break;
                    }
                    sorted_fleets.sort(sortFleetsByPlayerName);
                    break;
                }
                sorted_fleets.sort(sortFleetsByFleetName);
                break;
            case 'player_id':
                if (owner != 'other') { break; }
                sorted_fleets.sort(sortFleetsByPlayerId);
                break;
            case 'stat':
                sorted_fleets.sort(sortFleetsByStat);
                break;
                // case 'weight':
            default:
                sorted_fleets.sort(w.fleetOrder);
                break;
        }

        if (w.isVariableDefined(sortby_flag) && sortby_flag === sortby) {
            sorted_fleets.reverse();
            sortby_flag = null;
        } else if (w.isVariableDefined(sortby)) {
            sortby_flag = sortby;
        } else {
            sortby_flag = null;
        }

        sortby_last = sortby;

        return sorted_fleets;
    }

    function showModalFilterList(arr, owner, fleet_type, sortby, filterby) {
        const sorted_list = Object.keys(arr).sort(w.sortAlphabetically);
        // TODO: (если совсем нечего делать будет)
        // ?? + добавить обработку значений перед выводом:
        // если по типу кораблей - возвр. названия кораблей по имени иконок,
        // если по игроку - ничего, по статусу - кол-во ходов
        // и обратную обработку для генерации кнопки ОК

        const id = 'fl_filter';
        let message = `Отфильтровать по:</br><select id="${id}">`;
        for (const i in sorted_list) {
            message += `<option>${sorted_list[i]}</option>`;
        }
        message += '</select>';

        w.showSmallMessage(message);

        $('#data_modal > select').change(function(selected) {
            const select = $(this).val();
            $('#data_modal > button').attr('onclick', `showFleets('${owner}', '${
                                           fleet_type}', '1', ${null}, '${filterby}', '${
                                           select}', '${null}'); $.modal.close();`);
        })
            .change();
    }

    function makeClickableFilteringIcons(divs, owner, fleet_type, sortby) {
        for (const i in divs) { // i = div type
            const div = divs[i];
            if (i == 'fleet_speed' || i == 'stat' || (i == 'player_name' && owner != 'other')) {
                continue;
            }
            if (fleet_type == 'garrison' && i == 'turn') {
                continue;
            }

            w.appendElemClickableIcon(div, 'fa-filter', `filter-by-${i}`, 'Отфильтровать',
                                      `showFleets('${owner}', '${fleet_type}', '1', '` + 'no' + `', '${i}', ${null}, ${null})`);

        }
    }

    function makeClickableSortingIcons(divs, owner, fleet_type, filterby) {
        for (const i in divs) { // i = div type
            const div = divs[i];

            if (fleet_type == 'garrison') {
                if (i == 'player_name' || i == 'turn') {
                    continue;
                }
            }
            w.makeElementClickable(div, 'fa-sort', 'Отсортировать',
                                   // "showFleets('" +owner+ "', '" +fleet_type+ "', '1', '" +i+ "', '" +filterby+ "', " +null+ ", " +null+ ")" );
                                   `showFleets('${owner}', '${fleet_type}', '1', '${i}', '${filterby}')`);
            if (owner == 'other' && i == 'player_name') { // а надо в принципе по id сортировать?
                w.appendElemClickableIcon(div, 'fa-id-badge', `sort-by-${i}`, 'Отсортировать по ID владельца',
                                          // "showFleets('" +owner+ "', '" +fleet_type+ "', '1', 'player_id', '" +filterby+ "', " +null+ ", " +null+ ")" );
                                          `showFleets('${owner}', '${fleet_type}', '1', 'player_id')`);
            }
        }
    }

    function returnFleetsByOwner(owner, fleet_type, sorted_fleets) {
        switch (fleet_type) {
            case 'fleet': // default
                sorted_fleets = sorted_fleets.filter((fleet) => {
                    return fleet.owner == owner && +fleet.garrison !== 1;
                });
                break;
            case 'garrison':
                sorted_fleets = sorted_fleets.filter((fleet) => {
                    // return fleet.owner == owner && +fleet.garrison !== 0 && fleet.ico !== null;
                    return fleet.owner == owner && +fleet.garrison !== 0 && +fleet.weight !== 0;
                });
                break;
        }

        return sorted_fleets;
    }

    function sortFleetsByStat(a, b) {
        // добавить сорт. по военным параметрам (поврежденные флоты - наверх)
        return w.sortNumerically(a.health, b.health);
    }

    function sortOwnFleetsByState(a, b) {
        // TODO: можно переделать через w.sortNumerically и тернарный оператор?
        /* Order:
        allow_bomb
        allow_invasion
        allow_settle
        allow_explore
        allow_fly
        allow_transfer
        allow_garrison
        allow_station
        start_turn
        */

        if (a.allow_bomb > b.allow_bomb) {
            return 1;
        }        else if (a.allow_bomb < b.allow_bomb) {
            return -1;
        }

        if (a.allow_invasion > b.allow_invasion) {
                return 1;
            }            else if (a.allow_invasion < b.allow_invasion) {
                return -1;
            }

        if (a.allow_settle > b.allow_settle) {
                    return 1;
                }                else if (a.allow_settle < b.allow_settle) {
                    return -1;
                }

        if (a.allow_explore > b.allow_explore) {
                        return 1;
                    }                    else if (a.allow_explore < b.allow_explore) {
                        return -1;
                    }

        if (a.allow_fly > b.allow_fly) {
                            return 1;
                        }                        else if (a.allow_fly < b.allow_fly) {
                            return -1;
                        }

        if (a.allow_transfer > b.allow_transfer) {
                                return 1;
                            }                            else if (a.allow_transfer < b.allow_transfer) {
                                return -1;
                            }

        if (a.allow_garrison > b.allow_garrison) {
                                    return 1;
                                }                                else if (a.allow_garrison < b.allow_garrison) {
                                    return -1;
                                }

        if (a.allow_station > b.allow_station) {
                                        return -1;  // изучает аномалию - опускаем ниже
                                    }                                    else if (a.allow_station < b.allow_station) {
                                        return 1; // готова изучить или не станция - поднять
                                    }

        if (a.start_turn > b.start_turn) {
                                            return -1;  // будет дольше в полёте - опустить
                                        }                                        else if (a.start_turn < b.start_turn) {
                                            return 1;
                                        }









        return 0;
    }

    function sortFleetsByFleetName(a, b) {
        return w.sortAlphabetically(a.fleet_name, b.fleet_name);
    }

    function sortFleetsByPlayerName(a, b) {
        return w.sortAlphabetically(a.player_name, b.player_name);
    }

    function sortFleetsByType(a, b) {
        return w.sortAlphabetically(a.ico, b.ico);
    }

    function sortOtherFleetsByState(a, b) {
        return w.sortNumerically(a.turn, b.turn);
    }

    function sortFleetsByPlayerId(a, b) {
        // по возрастанию
        return w.sortNumerically(a.player_id, b.player_id);
    }

    function sortFleetsBySpeed(a, b) {
        // по убыванию
        return -w.sortNumerically(a.fleet_speed, b.fleet_speed);
    }

})(window);
