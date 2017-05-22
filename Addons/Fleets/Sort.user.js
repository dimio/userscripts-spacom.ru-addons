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
//TODO: фильтр для своих флотов с "показать только" и галка "исключить орбит. станции" (с сохр. состояния в local storage)

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
    // в "главные" кнопки флотов - передавать sortby_last, в кнопки сортировки - null
    // тогда при переключении по окнам флотов будет сохр. сортировка, а при новой сортировке - не мешать ей

    // so:
    document.getElementsByClassName('navi_menu_item')[2].setAttribute( 'onclick', "showFleets('other',  " +null+ ", " +null+ ", " +sortby_last+ ", '0'); return false;" );
    // or so (jquery):
    $('#navi > div:nth-child(2)').attr( 'onclick', "showFleets('own',  " +null+ ", "  +null+ ", " +sortby_last+ ", '0'); return false;" );
    w.createNaviBarButton( 'Пираты', "showFleets('pirate',  " +null+ ", " +null+ ", " +sortby_last+ ", '0')" );


    w.showFleets = function( owner, sortby, filterby, sortby_last, redraw ){
        if ( sub_menu == 'otherFleets_' +owner && redraw == '0' ){
            sortby_last = null;
            sortby_flag = null;
            filtered_fleets = null;
            sub_menu = false;
            $("#items_list").html('');
        }
        else {
            sub_menu = 'otherFleets_' +owner;
            map.clearInfo();

            var sorted_fleets = map.fleets.slice();

            if ( sorted_fleets.length > 0 ){
                sorted_fleets = returnFleetsByOwner( owner, sorted_fleets );
            }
            else {
                $("#items_list").html('<div class="player_fleet_title">Нет флотов</div>');
                return false;
            }

            if ( sortby_last !== null ){
                sortby = sortby_last;
            }

            if ( sortby === null && filterby === null ){
                sorted_fleets.sort( w.fleetOrder );
            }
            else if ( sortby !== null && filterby === null ){
                if ( filtered_fleets.length > 0 ){
                    sorted_fleets = filtered_fleets;
                }
                sorted_fleets = sortFleetsBy( owner, sortby, sorted_fleets );
            }
            else if ( sortby === null && filterby !== null ){
                let filter_keys = {};
                for ( let i in sorted_fleets ){
                    // $keys{$key->$sorted_fleets->[$fleet]->{$filterby}} = $player_name
                    filter_keys[ sorted_fleets[i][filterby] ] = sorted_fleets[i][filterby];
                }
                console.log( filter_keys );

                if ( Object.keys( filter_keys ).length > 0 ){
                    //показать меню кнопки
                    let filter_key = 'AVL1'; // dbg
                    console.log( 'filter key: ' +filter_key );
                    //sorted_fleets = filterFleetsBy( owner, filterby, sorted_fleets );
                    sorted_fleets = sorted_fleets.filter( function( fleet ){
                        //console.log( fleet );
                        //console.log( filterby );
                        //console.log( fleet[filterby] );
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
                    if ( fleet.garrison != 1 ){
                        map.showBlockFleet( fleet, fleet.owner );
                    }
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

                var timerID = setInterval( function(){
                    var divs = {};
                    divs.fleet_speed = $("#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_speed")[0];
                    divs.player_name = $("#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_name")[0];
                    divs.state = $("#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_state")[0];
                    divs.ico = $("#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_ico_list")[0];

                    if ( Object.keys(divs).length > 0 ){
                        clearInterval( timerID );
                        makeClickableSortingIcons(divs, owner);
                        makeClickableFilteringIcons(divs, owner);
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

    function makeClickableFilteringIcons(divs, owner){
        for ( let i in divs ){ // i = div type
            let div = divs[i];
            if ( i == 'player_name' && owner != 'other' ){ continue; }

            w.appendElemClickableIcon( div, 'fa-filter', 'Отфильтровать',
                                      "showFleets('" +owner+ "', " +null+ ", '" +i+ "', " +null+ ", '1')" );

        }
    }

    function makeClickableSortingIcons(divs, owner){
        //TODO: как вызывать w.makeElementClickable универсально (а именно - заголовок)
        for ( let i in divs ){ // i = div type
            let div = divs[i];
            w.makeElementClickable( div, 'fa-sort', 'Отсортировать',
                                   "showFleets('" +owner+ "', '" +i+ "', " +null+ ", " +null+ ", '1')" );
            if ( owner == 'other' && i == 'player_name' ){ // а надо в принципе по id сортировать?
                w.appendElemClickableIcon( div, 'fa-id-badge', 'Отсортировать по ID владельца',
                                          "showFleets('" +owner+ "', 'player_id', " +null+ ", " +null+ ", '1')" );
            }
        }
    }

    /*function filterFleetsBy( owner, filterby, sorted_fleets ){
        switch ( filterby ) {
            case 'weight':
                sorted_fleets.sort( w.fleetOrder );
                break;
        }

        return sorted_fleets;
    }*/

    function returnFleetsByOwner( owner, sorted_fleets ){
        sorted_fleets = sorted_fleets.filter( function( fleet ){
            return fleet.owner == owner && +fleet.garrison !== 1;
        } );
      
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

    function sortFleetsByFleetName( a, b ){
        let a_cmp = a.fleet_name.toUpperCase();
        let b_cmp = b.fleet_name.toUpperCase();

        return ( a_cmp < b_cmp ) ? -1 : ( a_cmp > b_cmp ) ? 1 : 0;
    }

    function sortFleetsByPlayerName( a, b ){
        let a_cmp = a.player_name.toUpperCase();
        let b_cmp = b.player_name.toUpperCase();

        return ( a_cmp < b_cmp ) ? -1 : ( a_cmp > b_cmp ) ? 1 : 0;
    }

    function sortFleetsByType( a, b ){
        let a_cmp = a.ico.toUpperCase();
        let b_cmp = b.ico.toUpperCase();

        return ( a_cmp < b_cmp ) ? -1 : ( a_cmp > b_cmp ) ? 1 : 0;
    }

    function sortOwnFleetsByState( a, b ){
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

    function sortOtherFleetsByState( a, b ) {
        a.turn = parseInt( a.turn, 10 );
        b.turn = parseInt( b.turn, 10 );

        return a.turn - b.turn;
    }

    function sortFleetsBySpeed( a, b ) {
        // по убыванию
        a.fleet_speed = parseFloat( a.fleet_speed, 10 );
        b.fleet_speed = parseFloat( b.fleet_speed, 10 );

        return b.fleet_speed - a.fleet_speed;
    }

    function sortFleetsByPlayerId( a, b ) {
        // по возрастанию
        a.player_id = parseInt( a.player_id, 10 );
        b.player_id = parseInt( b.player_id, 10 );

        return a.player_id - b.player_id;
    }


} )( window );
