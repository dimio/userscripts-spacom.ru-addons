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
console.log( 'Spacom.ru::Addons::Fleets::Sort booted' );
/*TODO:
[] для своих флотов - галка "исключить орбит. станции" (с сохр. состояния в local storage)
[] откл. сорт. по скорости?
*/

(function( window, undefined ) {
    'use strict';
    window.unsafeWindow = window.unsafeWindow || window;
    var w = unsafeWindow;

    if ( w.self != w.top ) {
        return;
    }

    var sortby_last = null;
    var sortby_flag = null;
    var filtered_fleets = [];

    //списком аргументы передавать?
    // so:
    document.getElementsByClassName('navi_menu_item')[2].setAttribute( 'onclick', "showFleets('other', 'fleet', " +null+ ", " +null+ ", '" +sortby_last+ "', " +null+ ", " +null+ "); return false;" );
    // or so (jquery):
    $('#navi > div:nth-child(2)').attr( 'onclick', "showFleets('own', 'fleet', " +null+ ", "  +null+ ", '" +sortby_last+ "', " +null+ ", " +null+ "); return false;" );
    w.createNaviBarButton( 'Гарнизон', 1, "showFleets('own', 'garrison', " +null+ ", " +null+ ", '" +sortby_last+ "', " +null+ ", " +null+ ")" );
    w.createNaviBarButton( 'Пираты', 4, "showFleets('pirate', 'fleet', " +null+ ", " +null+ ", '" +sortby_last+ "', " +null+ ", " +null+ ")" );


    w.showFleets = function( owner, fleet_type, sortby, filterby, sortby_last, redraw, filter_key ){
        if ( sub_menu == 'fleets_' +owner+ '_' +fleet_type && redraw === null ){
            sortby_last = null;
            sortby_flag = null;
            filter_key = null;
            filtered_fleets.length = 0; //purge arr
            sub_menu = false;
            $("#items_list").html('');
        }
        else {
            sub_menu = 'fleets_' +owner+ '_' +fleet_type;
            map.clearInfo();

            var sorted_fleets = map.fleets.slice();

            if ( sorted_fleets.length > 0 ){
                sorted_fleets = returnFleetsByOwner( owner, fleet_type, sorted_fleets );
            }
            else {
                $("#items_list").html('<div class="player_fleet_title">Нет флотов</div>');
                return false;
            }

            if ( sortby_last !== null ){
                sortby = sortby_last;
            }
            if ( filtered_fleets.length > 0 && redraw !== null ){
                sorted_fleets = filtered_fleets;
            }

            if ( sortby === null && filterby === null ){
                sorted_fleets.sort( w.fleetOrder );
            }
            else if ( sortby !== null && filterby === null ){
                sorted_fleets = sortFleetsBy( owner, sortby, sorted_fleets );
            }
            else if ( filterby !== null ){ //sortby === null &&
                if ( filter_key === null ){
                    let filter_keys = {};
                    for ( let i in sorted_fleets ){
                        // $keys{$key->$sorted_fleets->[$fleet]->{$filterby}} = $player_name
                        filter_keys[ sorted_fleets[i][filterby] ] = sorted_fleets[i][filterby];
                    }
                    if ( Object.keys( filter_keys ).length > 1 ){
                        showModalFilterList( filter_keys, owner, fleet_type, sortby, filterby );
                    }
                    else {
                        let message = 'Фильтрация по единственному параметру невозможна. ';
                        message += 'Для сброса фильтров закройте и откройте заново текущую вкладку флотов.';
                        w.showSmallMessage( message );
                        sub_menu = false;
                        //$("#items_list").html('');
                    }
                }
                else {
                    sorted_fleets = sorted_fleets.filter( function( fleet ){
                        return fleet[filterby] == filter_key;
                    } );
                    filtered_fleets = sorted_fleets.slice();
                }
            }
            else { console.error( 'sortby & filterby not defined' ); }

            if ( ( sorted_fleets ) && ( sorted_fleets.filter( function(value){ return value !== undefined; } ).length > 0 ) )
            {
                $("#items_list").append(tmpl("fleets_title", sorted_fleets));
                for ( let i in sorted_fleets ){
                    let fleet = sorted_fleets[i];
                    map.showBlockFleet( fleet, fleet.owner );
                }
                $("#items_list>>>[title],#items_list>>>>[title]").qtip({
                    position: {
                        my: 'bottom center', // at the bottom right of...
                        at: 'top center', // Position my top left...
                    },
                    style: {
                        classes: 'qtip-dark tips'
                    }
                });

                let timerID = setInterval( function(){
                    var divs = {};
                    divs.fleet_speed = $("#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_speed")[0];
                    divs.player_name = $("#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_name")[0];
                    divs.state = $("#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_state")[0];
                    divs.ico = $("#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_ico_list")[0];

                    if ( Object.keys(divs).length > 0 ){
                        clearInterval( timerID );
                        makeClickableSortingIcons( divs, owner, fleet_type );
                        makeClickableFilteringIcons( divs, owner, fleet_type );
                    }
                }, 0 );
            }
            else if ( owner != 'own' ) {
                $("#items_list").html('<div class="player_fleet_title">Нет видимых чужих флотов</div>');
            }
            else {
                $("#items_list").html('<div class="player_fleet_title">Нет собственных флотов</div>');
            }

        }
    };

    function showModalFilterList( arr, owner, fleet_type, sortby, filterby ){
        let sorted_list = Object.keys( arr ).sort( sortAlphabetically );
        let id = 'fl_filter';

        let message = 'Отфильтровать по:</br><select id="' +id+ '">';
        for ( let i in sorted_list ){
            message += '<option>' +sorted_list[i]+ '</option>';
        }
        message += '</select>';

        w.showSmallMessage( message );

        $('#data_modal > select').change( function( selected ){
            var select = $(this).val();
            $("#data_modal > button").attr( 'onclick',
                                           "showFleets('" +owner+ "', '" +fleet_type+ "', '" +sortby+ "', '" +filterby+ "', " +null+ ", '1', '" +select+ "'); $.modal.close();" );
        } )
            .change();
    }

    function makeClickableFilteringIcons(divs, owner, fleet_type){
        for ( let i in divs ){ // i = div type
            let div = divs[i];
            if ( i == 'player_name' && owner != 'other' ){ continue; }

            w.appendElemClickableIcon( div, 'fa-filter', 'filter-by-' +i, 'Отфильтровать',
                                      "showFleets('" +owner+ "', '" +fleet_type+ "', " +null+ ", '" +i+ "', " +null+ ", '1', " +null+ ")" );

        }
    }

    function makeClickableSortingIcons(divs, owner, fleet_type){
        //TODO: как вызывать w.makeElementClickable универсально (а именно - заголовок)
        for ( let i in divs ){ // i = div type
            let div = divs[i];
            w.makeElementClickable( div, 'fa-sort', 'Отсортировать',
                                   "showFleets('" +owner+ "', '" +fleet_type+ "','" +i+ "', " +null+ ", " +null+ ", '1', " +null+ ")" );
            if ( owner == 'other' && i == 'player_name' ){ // а надо в принципе по id сортировать?
                w.appendElemClickableIcon( div, 'fa-id-badge', 'sort-by-' +i, 'Отсортировать по ID владельца',
                                          "showFleets('" +owner+ "', '" +fleet_type+ "','player_id', " +null+ ", " +null+ ", '1', " +null+ ")" );
            }
        }
    }

    function returnFleetsByOwner( owner, fleet_type, sorted_fleets ){
        switch ( fleet_type ){
            case 'fleet': //default
                sorted_fleets = sorted_fleets.filter( function( fleet ){
                    return fleet.owner == owner && +fleet.garrison !== 1;
                } );
                break;
            case 'garrison':
                sorted_fleets = sorted_fleets.filter( function( fleet ){
                    //return fleet.owner == owner && +fleet.garrison !== 0 && fleet.ico !== null;
                    return fleet.owner == owner && +fleet.garrison !== 0 && +fleet.weight !== 0;
                } );
                break;
        }

        return sorted_fleets;
    }

    function sortFleetsBy( owner, sortby, sorted_fleets ){
        switch ( sortby ) {
            case 'fleet_speed':
                sorted_fleets.sort( sortFleetsBySpeed );
                //TODO: или пусть целые выводит без незначащих нулей (какие расходы на "украшательный" map)?
                sorted_fleets.map( function( fleet ){
                    fleet.fleet_speed = parseFloat( fleet.fleet_speed ).toFixed(2);
                    return fleet;
                } );
                break;
            case 'state':
                if ( owner != 'own' ){ sorted_fleets.sort( sortOtherFleetsByState ); }
                else { sorted_fleets.sort( sortOwnFleetsByState ); }
                break;
            case 'ico': // fleet type
                sorted_fleets.sort( sortFleetsByType );
                break;
            case 'player_name':
                if ( owner == 'other' ) {
                    sorted_fleets.sort( sortFleetsByPlayerName );
                    break;
                }
                sorted_fleets.sort( sortFleetsByFleetName );
                break;
            case 'player_id':
                if ( owner != 'other' ) { break; }
                sorted_fleets.sort( sortFleetsByPlayerId );
                break;
            default:
                sorted_fleets.sort( w.fleetOrder );
                break;
        }

        if ( sortby_flag == sortby ){
            sorted_fleets.reverse();
            sortby_flag = null;
        }
        else {
            sortby_flag = sortby;
        }

        sortby_last = sortby;

        return sorted_fleets;
    }

    function sortOwnFleetsByState( a, b ){
        //TODO: можно переделать через sortNumerically и тернарный оператор?
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

        if ( a.allow_bomb > b.allow_bomb ){
            return 1;
        }
        else if ( a.allow_bomb < b.allow_bomb ){
            return -1;
        }
        else {
            if ( a.allow_invasion > b.allow_invasion ){
                return 1;
            }
            else if ( a.allow_invasion < b.allow_invasion ){
                return -1;
            }
            else {
                if ( a.allow_settle > b.allow_settle ){
                    return 1;
                }
                else if ( a.allow_settle < b.allow_settle ){
                    return -1;
                }
                else {
                    if ( a.allow_explore > b.allow_explore ){
                        return 1;
                    }
                    else if ( a.allow_explore < b.allow_explore ){
                        return -1;
                    }
                    else {
                        if ( a.allow_fly > b.allow_fly ){
                            return 1;
                        }
                        else if ( a.allow_fly < b.allow_fly ){
                            return -1;
                        }
                        else {
                            if ( a.allow_transfer > b.allow_transfer ){
                                return 1;
                            }
                            else if ( a.allow_transfer < b.allow_transfer ){
                                return -1;
                            }
                            else {
                                if ( a.allow_garrison > b.allow_garrison ){
                                    return 1;
                                }
                                else if ( a.allow_garrison < b.allow_garrison ){
                                    return -1;
                                }
                                else {
                                    if ( a.allow_station > b.allow_station ){
                                        return -1;  // изучает аномалию - опускаем ниже
                                    }
                                    else if ( a.allow_station < b.allow_station ){
                                        return 1; // готова изучить или не станция - поднять
                                    }
                                    else {
                                        if ( a.start_turn > b.start_turn ){
                                            return -1;  // будет дольше в полёте - опустить
                                        }
                                        else if ( a.start_turn < b.start_turn ){
                                            return 1;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

            }
        }
    }

    function sortFleetsByFleetName( a, b ){
        return sortAlphabetically( a.fleet_name,b.fleet_name );
    }

    function sortFleetsByPlayerName( a, b ){
        return sortAlphabetically( a.player_name, b.player_name );
    }

    function sortFleetsByType( a, b ){
        return sortAlphabetically( a.ico, b.ico );
    }

    function sortOtherFleetsByState( a, b ){
        return sortNumerically( a.turn, b.turn );
    }

    function sortFleetsBySpeed( a, b ){
        // по убыванию
        return -sortNumerically( a.fleet_speed, b.fleet_speed );
        // или быстрее так? :
        //return sortNumerically( b.fleet_speed, a.fleet_speed );
    }

    function sortFleetsByPlayerId( a, b ){
        // по возрастанию
        return sortNumerically( a.player_id, b.player_id );
    }

    function sortAlphabetically( a, b ){
        let a_cmp = a.toUpperCase();
        let b_cmp = b.toUpperCase();

        return ( a_cmp < b_cmp ) ? -1 : ( a_cmp > b_cmp ) ? 1 : 0;
    }

    function sortNumerically( a, b ){
        a = parseFloat( a, 10 );
        b = parseFloat( b, 10 );

        return a - b;
    }


} )( window );
