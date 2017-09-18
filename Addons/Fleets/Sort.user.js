// ==UserScript==
// @name         Spacom.ru::Addons::Fleets::Sort
// @version      0.0.13
// @namespace    http://dimio.org/
// @description  Add a sorting filtres for fleets tabs
// @author       dimio (dimio@dimio.org)
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   https://github.com/dimio/userscripts-spacom.ru-addons/issues
// @supportURL   https://spacom.ru/forum/discussion/47/polzovatelskie-skripty
// @encoding     utf-8
// @match        http*://spacom.ru/?act=map
// @run-at       document-end
// ==/UserScript==
console.log('Spacom.ru::Addons::Fleets::Sort booted');

(function (window) {

    window.unsafeWindow = window.unsafeWindow || window;
    const w = unsafeWindow;

    if (w.self !== w.top) {
        return;
    }

    const flags = {
        sortby_last: null,
        sortby_flag: null,
        filterby_last: null,
    };
    const filters_stack = [];

    $('#navi > div:nth-child(3)').attr('onclick', 'showFleets({owner: \'other\'}); Addons.Fleets.MarkOnMap.init(); return false;');
    $('#navi > div:nth-child(2)').attr('onclick', 'showFleets({owner: \'own\'}); Addons.Fleets.MarkOnMap.init(); return false;');
    w.createNaviBarButton('Гарнизон', 1, 'showFleets({owner: \'own\', fleet_type: \'garrison\'}); Addons.Fleets.MarkOnMap.init()');
    w.createNaviBarButton('Союзные', 3, 'showFleets({owner: \'peace\'}); Addons.Fleets.MarkOnMap.init()');
    w.createNaviBarButton('Пираты', 5, 'showFleets({owner: \'pirate\'}); Addons.Fleets.MarkOnMap.init()');

    w.showFleets = function (opt) {
        const owner = opt.owner || 'own';
        const fleet_type = opt.fleet_type || 'fleet';
        const redraw = opt.redraw || null;

        let sortby = opt.sortby || 'weight';

        const filterby = opt.filterby || null;
        const filter_key = opt.filter_key || null;

        const exclude_f_flag = opt.exclude_f_flag || false;

        w.backlighted_fleets = {};

        if (Addons.Fleets.MarkOnMap){
            Addons.Fleets.MarkOnMap.makeMarkButtons();
        }

        // close the Fleets tab and purge filters
        if (w.sub_menu === `fleets_${owner}_${fleet_type}` && redraw === null) {
            purgeFleetFilters(sortby, filterby, filter_key, filters_stack);
            w.sub_menu = false;
            $('#items_list').html('');
            return false;
        }
        // вкладка флотов переключена, но не была закрыта - сбросить фильтры
        else if (w.sub_menu !== false && w.sub_menu !== `fleets_${owner}_${fleet_type}` && redraw === null) {
            purgeFleetFilters(sortby, filterby, filter_key, filters_stack);
            w.sub_menu = `fleets_${owner}_${fleet_type}`;
            $('#items_list').html('');
        }

        w.map.clearInfo();
        let sorted_fleets = getFleets(owner, fleet_type);

        // если окно флотов закрыто автоматически (например - по кн. "лететь") - сохранить сортировку
        if (w.sub_menu === false && (flags.sortby_last || flags.filterby_last)) {
            sortby = flags.sortby_last;
            flags.sortby_last = null;
            flags.sortby_flag = null;
        }

        // применить фильтры повторно
        if (w.isObjNotEmpry(filters_stack)) {
            for (const i in filters_stack) {
                if (filters_stack.hasOwnProperty(i)) {
                    let filter = Object.keys(filters_stack[i]);
                    // нужно сюда sortby передавать? проверить
                    sorted_fleets = filterFleetsBy(sorted_fleets, owner, fleet_type, sortby, filter,
                                                   filters_stack[i][filter][0], filters_stack[i][filter][1]);
                }
            }
        }

        // filtering selected
        if (w.isVariableDefined(filterby) && (sortby === 'no' || sortby === null)) {
            sorted_fleets = filterFleetsBy(sorted_fleets, owner, fleet_type, sortby, filterby, filter_key, exclude_f_flag);
            if (w.isVariableDefined(filter_key)){
                let filter = {};
                filter[filterby] = [];
                filter[filterby].push(filter_key, exclude_f_flag);
                filters_stack.push(filter);
            }
        }
        // sorting selected
        else if (sortby && sortby !== 'no') {
            sorted_fleets = sortFleetsBy(sorted_fleets, owner, sortby, filterby);
        }

        drawFleetsTab(sorted_fleets, owner);

        w.sub_menu = `fleets_${owner}_${fleet_type}`;

        const timerID = setInterval(() => {
            const divs = getNaviDivs();
            if (w.isObjNotEmpry(divs)) {
                clearInterval(timerID);
                makeClickableSortingIcons(divs, owner, fleet_type, filterby);
                makeClickableFilteringIcons(divs, owner, fleet_type, sortby);
            }
        }, 0);

        // для корректной работы подсветки на карте - развернуть
        // отфильтрованный массив в хэш (уникальность ключей)
        for (let i in sorted_fleets){
            let fleet = sorted_fleets[i];
            if (fleet.fleet_id in w.backlighted_fleets){
                continue;
            }
            w.backlighted_fleets[fleet.fleet_id] = fleet;
        }

        return true;
    };

    function purgeFleetFilters(sortby, filterby, filter_key) {
        filters_stack.length = 0;

        sortby = null;
        flags.sortby_last = null;
        flags.sortby_flag = null;

        filterby = null;
        flags.filterby_last = null;
        filter_key = null;

        w.backlighted_fleets = {};
    }

    function filterFleetsBy(sorted_fleets, owner, fleet_type, sortby, filterby, filter_key, exclude_f_flag) {
        const filter_keys = {};

        if (filter_key === null) {
            for (const i in sorted_fleets) {
                if (sorted_fleets.hasOwnProperty(i)) {
                    // хэш: имя ключа == параметру фильрации
                    // filter_keys[ sorted_fleets[i] -> [filterby] ] = sorted_fleets[i] -> [filterby];
                    filter_keys[sorted_fleets[i][filterby]] = filterby;
                }
            }
            if (w.isObjNotEmpry(filter_keys)) {
                showModalFilterList(filter_keys, owner, fleet_type, sortby, filterby);
            }
            else {
                let message = 'Не найдены параметры для фильтрации. ';
                message += 'Для сброса фильтров закройте и откройте заново текущую вкладку флотов.';
                w.showSmallMessage(message);
            }
        }
        else if (exclude_f_flag === true) {
            sorted_fleets = sorted_fleets.filter((fleet) => {
                return fleet[filterby] !== filter_key;
            });
        }
        else {
            sorted_fleets = sorted_fleets.filter((fleet) => {
                return fleet[filterby] === filter_key;
            });
        }

        flags.filterby_last = filterby;

        return sorted_fleets;
    }

    function showModalFilterList(arr, owner, fleet_type, sortby, filterby) {
        const sorted_list = Object.keys(arr).sort(w.sortAlphabetically);
        const id = 'fl_filter';
        let message = `Отфильтровать по:</br><select id="${id}">`;

        for (const i in sorted_list) {
            if (sorted_list.hasOwnProperty(i)) {
                message += `<option>${sorted_list[i]}</option>`;
            }
        }
        message += '</select></br>';
        message += '<input type="checkbox" id="filtering-list-checkbox"/>';
        message += '<label for="filtering-list-checkbox">Исключить выбранное</label>';

        w.showSmallMessage(message);

        $('#filtering-list-checkbox').change(function (exclude_f_flag) {
            if ($(this).is(':checked')) {
                exclude_f_flag = true;
            }
            else {
                exclude_f_flag = false;
            }

            $('#data_modal > select').change(function () {
                const select = $(this).val();
                $('#data_modal > button').attr('onclick',
                                               `showFleets({owner:'${owner}', fleet_type:'${fleet_type}',
redraw:'1', sortby:'no', filterby:'${filterby}',
filter_key:'${select}', exclude_f_flag:${exclude_f_flag}}); $.modal.close();`);
            }).change();

        }).change();
    }

    function getFleets(owner, fleet_type) {
        let fleets = w.map.fleets.slice();

        if (w.isObjNotEmpry(fleets)) {
            fleets = returnFleetsByOwner(owner, fleet_type, fleets);
            return fleets;
        }

        return false;
    }

    function drawFleetsTab (sorted_fleets) {
        if (sorted_fleets && w.isObjNotEmpry(sorted_fleets)) {
            $('#items_list').append(w.tmpl('fleets_title', sorted_fleets));
            for (const i in sorted_fleets) {
                if (w.isVariableDefined(i)) {
                    const fleet = sorted_fleets[i];
                    w.map.showBlockFleet(fleet, fleet.owner);
                }
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
        }
        else {
            $('#items_list').html('<div class="player_fleet_title">Нет подходящих флотов</div>');
        }
    }

    function getNaviDivs() {
        const divs = {};
        divs.fleet_speed = $('#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_speed')[0];
        divs.player_name = $('#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_name')[0];
        divs.turn = $('#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_state')[0];
        divs.ico = $('#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_ico_list')[0];
        divs.stat = $('#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_stat')[0];

        return divs;
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
                if (owner !== 'own') {
                    sorted_fleets.sort(sortOtherFleetsByState);
                }
                else {
                    sorted_fleets.sort(sortOwnFleetsByState).reverse();
                }
                break;
            case 'ico': // by fleet type
                sorted_fleets.sort(sortFleetsByType);
                break;
            case 'player_name':
                if (owner !== 'own') {
                    if (filterby === 'player_name') {
                        sorted_fleets.sort(sortFleetsByFleetName);
                        break;
                    }
                    sorted_fleets.sort(sortFleetsByPlayerName);
                    break;
                }
                sorted_fleets.sort(sortFleetsByFleetName);
                break;
            case 'player_id':
                if (owner !== 'other') { break; }
                sorted_fleets.sort(sortFleetsByPlayerId);
                break;
            case 'stat':
                sorted_fleets.sort(sortFleetsByStat);
                break;
            case 'weight':
                sorted_fleets.sort(w.fleetOrder);
                break;
            default:
                sorted_fleets.sort(w.fleetOrder);
                break;
        }

        if (sortby && sortby !== 'weight' && flags.sortby_flag === sortby) {
            sorted_fleets.reverse();
            flags.sortby_flag = null;
        }
        else if (w.isVariableDefined(sortby)) {
            flags.sortby_flag = sortby;
        }
        else {
            flags.sortby_flag = null;
        }

        if (sortby !== 'weight') flags.sortby_last = sortby;

        return sorted_fleets;
    }

    function makeClickableFilteringIcons(divs, owner, fleet_type) {
        for (let i in divs) { // i = filterby
            if (w.isVariableDefined(i)) {
                const div = divs[i];
                if (i === 'fleet_speed' || i === 'stat' || (fleet_type === 'garrison' && i === 'turn')) {
                    continue;
                }
                if (i === 'player_name') {
                    if (owner === 'other' || owner === 'peace'){
                        w.appendElemClickableIcon(div, 'fa-id-badge', `filter-by-${i}`, 'Отфильтровать по владельцу',
                                                  `showFleets({owner:'${owner}', fleet_type:'${fleet_type}',
redraw:'1', sortby:'no', filterby:'${i}'})`);
                    }

                    i = 'fleet_name';
                    w.appendElemClickableIcon(div, 'fa-filter', `filter-by-${i}`, 'Отфильтровать',
                                              `showFleets({owner:'${owner}', fleet_type:'${fleet_type}',
redraw:'1', sortby:'no', filterby:'${i}'})`);
                    continue;
                }

                w.appendElemClickableIcon(div, 'fa-filter', `filter-by-${i}`, 'Отфильтровать',
                                          `showFleets({owner:'${owner}', fleet_type:'${fleet_type}',
redraw:'1', sortby:'no', filterby:'${i}'})`);
            }
        }
    }

    function makeClickableSortingIcons(divs, owner, fleet_type) {
        for (let i in divs) { // i = sortby
            if (w.isVariableDefined(i)) {
                const div = divs[i];

                if (fleet_type === 'garrison') {
                    if (i === 'player_name' || i === 'turn') {
                        continue;
                    }
                }

                w.makeElementClickable(div, 'fa-sort', `sort-by-${i}`, 'Отсортировать',
                                       `showFleets({owner:'${owner}', fleet_type:'${fleet_type}',
redraw:'1', sortby:'${i}'})`);
            }
        }
    }

    function returnFleetsByOwner(owner, fleet_type, sorted_fleets) {
        switch (fleet_type) {
            case 'fleet': // default
                sorted_fleets = sorted_fleets.filter((fleet) => {
                    return fleet.owner === owner && +fleet.garrison !== 1;
                });
                break;
            case 'garrison':
                sorted_fleets = sorted_fleets.filter((fleet) => {
                    return fleet.owner === owner && +fleet.garrison !== 0 && +fleet.weight !== 0;
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
        // Order:
        /* const order = [ //qw
            'allow_bomb',
            'allow_invasion',
            'allow_settle',
            'allow_explore',
            'allow_fly',
            'allow_transfer',
            'allow_garrison',
            'allow_station',
            'start_turn',
        ];*/
        // return w.sortNumerically( a[order[j]], b[order[j]] );

        if (a.allow_explore > b.allow_explore) {
            return 1;
        }
        else if (a.allow_explore < b.allow_explore) {
            return -1;
        }

        if (a.allow_fly > b.allow_fly) {
            return 1;
        }
        else if (a.allow_fly < b.allow_fly) {
            return -1;
        }

        if (a.allow_transfer > b.allow_transfer) {
            return 1;
        }
        else if (a.allow_transfer < b.allow_transfer) {
            return -1;
        }

        if (a.allow_garrison > b.allow_garrison) {
            return 1;
        }
        else if (a.allow_garrison < b.allow_garrison) {
            return -1;
        }

        if (a.allow_station > b.allow_station) {
            return -1;  // изучает аномалию - опускаем ниже
        }
        else if (a.allow_station < b.allow_station) {
            return 1; // готов изучить или не станция - поднять
        }

        if (a.start_turn > b.start_turn) {
            return -1;  // будет дольше в полёте - опустить
        }
        else if (a.start_turn < b.start_turn) {
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
