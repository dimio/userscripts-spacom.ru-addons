// ==UserScript==
// @name         Spacom.ru::Addons::Fleets::Sort
// @namespace    http://tampermonkey.net/
// @version      0.0.4
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

    // so:
    document.getElementsByClassName('navi_menu_item')[2].setAttribute( 'onclick', "showFleetsSortedBy('other', 'weight', '0'); return false;" );
    // or so (jquery):
    $('#navi > div:nth-child(2)').attr( 'onclick', "showFleetsSortedBy('own', 'weight', '0'); return false;" );
    w.createNaviBarButton( 'Пираты', "showFleetsSortedBy('pirate', 'weight', '0')" );

    var sortby_flag = null;

    w.showFleetsSortedBy = function( owner, sortby, redraw ){
        if ( sub_menu == 'otherFleets_' +owner && redraw == '0' ){
            sortby_flag = null;
            sub_menu = false;
            $("#items_list").html('');
        }
        else {
            sub_menu = 'otherFleets_' +owner;
            map.clearInfo();

            var sorted_fleets = map.fleets.slice();
            sorted_fleets = sortFleetsBy( owner, sortby, sorted_fleets );

            if ( ( sorted_fleets ) && ( sorted_fleets.filter( function(value){ return value !== undefined && value.garrison == '0'; } ).length > 0 ) )
            {
                $("#items_list").append(tmpl("fleets_title", sorted_fleets));
                for ( let i in sorted_fleets ){
                    var fleet = sorted_fleets[i];
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
                    divs.speed = $("#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_speed")[0];
                    divs.player_name = $("#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_name")[0];
                    divs.state = $("#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_state")[0];
                    divs.type = $("#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_ico_list")[0];

                    if ( Object.keys(divs).length > 0 ){
                        clearInterval( timerID );
                        makeClickableSortingIcons(divs, owner);
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

    function makeClickableSortingIcons(divs, owner){
        //TODO: как вызывать w.makeElementClickable универсально (а именно - заголовок)
        for ( let i in divs ){ // i = div type
            let div = divs[i];
            w.makeElementClickable( div, 'fa-sort', 'Отсортировать',
                                   "showFleetsSortedBy('" +owner+ "', '" +i+ "', '1')" );
            if ( owner == 'other' && i == 'player_name' ){ // а надо в принципе по id сортировать?
                w.appendElemClickableIcon( div, 'fa-id-badge', 'Отсортировать по ID владельца',
                                      "showFleetsSortedBy('" +owner+ "', 'player_id', '1')" );
            }
        }
        //TODO: add a "filter: show only" button (filtering by state): fa-filter
    }

    function sortFleetsBy( owner, sortby, sorted_fleets ){
        switch ( owner ) {
            case 'own':
                sorted_fleets = sorted_fleets.filter( function( fleet ){
                    return fleet.owner == 'own' && fleet.garrison != '1';
                } );
                break;
            case 'pirate':
                sorted_fleets = sorted_fleets.filter( function( fleet ){
                    return fleet.owner == 'pirate';
                } );
                break;
            case 'other':
                sorted_fleets = sorted_fleets.filter( function( fleet ){
                    return fleet.owner == 'other';
                } );
                break;
            default:
                break;
        }

        switch ( sortby ) {
            case 'weight':
                sorted_fleets.sort( w.fleetOrder );
                break;
            case 'speed':
                sorted_fleets.sort( sortFleetsBySpeed );
                //TODO: или пусть целые выводит без незначащих нулей (какие расходы на "украшательный" map)?
                sorted_fleets.map( function( fleet ){
                    fleet.fleet_speed = parseFloat( fleet.fleet_speed ).toFixed(2);
                    return fleet;
                } );
                if ( sortby_flag == sortby ){
                    sorted_fleets.reverse();
                    sortby_flag = null;
                    break;
                }
                sortby_flag = sortby;
                break;
            case 'state':
                if ( owner != 'own' ){ sorted_fleets.sort( sortOtherFleetsByState ); }
                else { sorted_fleets.sort( sortOwnFleetsByState ); }
                if ( sortby_flag === null ){
                    sorted_fleets.reverse();
                    sortby_flag = sortby;
                    break;
                }
                sortby_flag = null;
                console.log( sorted_fleets );
                break;
            case 'type':
                sorted_fleets.sort( sortFleetsByType );
                if ( sortby_flag == sortby ){
                    sorted_fleets.reverse();
                    sortby_flag = null;
                    break;
                }
                sortby_flag = sortby;
                break;
            case 'player_name':
                if ( owner != 'other' ) { break; }
                sorted_fleets.sort( sortFleetsByPlayerName );
                if ( sortby_flag == sortby ){
                    sorted_fleets.reverse();
                    sortby_flag = null;
                    break;
                }
                sortby_flag = sortby;
                break;
            case 'player_id':
                if ( owner != 'other' ) { break; }
                sorted_fleets.sort( sortFleetsByPlayerId );
                if ( sortby_flag == sortby ){
                    sorted_fleets.reverse();
                    sortby_flag = null;
                    break;
                }
                sortby_flag = sortby;
                break;
            default:
                sorted_fleets.sort( w.fleetOrder );
                break;
        }

        return sorted_fleets;
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
