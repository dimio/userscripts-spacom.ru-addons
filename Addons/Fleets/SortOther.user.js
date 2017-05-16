// ==UserScript==
// @name         Spacom.ru::Addons::Fleets::Sort::Other
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  none
// @author       dimio
// @license      MIT
// @homepage     https://github.com/dimio/userscripts-spacom.ru-addons
// @supportURL   dimio.org, dimio@dimio.org
// @encoding     utf-8
// @match        http*://spacom.ru/?act=map
// @run-at       document-end
// ==/UserScript==
console.log( 'Spacom.ru::Addons::Fleets::Sort::Other booted' );

(function( window, undefined ) {
    'use strict';
    window.unsafeWindow = window.unsafeWindow || window;
    var w = unsafeWindow;

    if ( w.self != w.top ) {
        return;
    }

    document.getElementsByClassName('navi_menu_item')[2].setAttribute( 'onclick', "showOtherFleetsOnlyWith('other', 'weight', '0'); return false;" );
    w.createNaviBarButton( 'Пираты', "showOtherFleetsOnlyWith('pirate', 'weight', '0')" );

    var sortby_flag;

    w.showOtherFleetsOnlyWith = function( owner, sortby, redraw ){
        if ( sub_menu == 'otherFleets_' +owner && redraw == '0' ){
        	sortby_flag = null;
            sub_menu = false;
            $("#items_list").html('');
        }
        else {
            sub_menu = 'otherFleets_' +owner;
            map.clearInfo();

            var sorted_fleets = map.fleets.slice();

            switch ( owner ) {
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
                    if ( sortby_flag == 'speed' ){
                        sorted_fleets.reverse();
                        sortby_flag = null;
                        break;
                    }
                    sortby_flag = 'speed';
                    break;
                case 'player_id':
                    if ( owner == 'pirate' ) { break; }
                    // sort by player id
                    break;
                default:
                    sorted_fleets.sort( w.fleetOrder );
                    break;
            }

            if ( ( sorted_fleets ) && ( sorted_fleets.filter( function(value){ return value !== undefined && value.garrison == '0'; } ).length > 0 ) )
            {
                $("#items_list").append(tmpl("fleets_title", sorted_fleets));
                for (var i in sorted_fleets) {
                    var fleet = sorted_fleets[i];
                    if (fleet.garrison != 1) {
                        map.showBlockFleet(fleet, fleet.owner);
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
                    let div_speed = $("#items_list > div.row.player_fleet_title > div.col-xs-4.col-md-2.fleet_speed")[0];
                    //let div_owner = ;
                    if ( div_speed !== undefined ){
                        clearInterval( timerID );
                        w.makeElementClickable( div_speed, 'fa-sort', 'Отсортировать по скорости',
                        	"showOtherFleetsOnlyWith('" +owner+ "', 'speed', '1')" );
                        //w.makeElementClickable( div_owner, 'fa-sort', 'Отсортировать по владельцу (id)',
                        //	"showOtherFleetsOnlyWith('" +owner+ "', 'player_id', '1')" );
                    }
                }, 0 );
            }
            else {
                $("#items_list").html('<div class="player_fleet_title">Нет видимых чужих флотов</div>');
            }
        }
    };

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

/*
function fleetOrderByOwnerName(a, b) {
	switch (a.owner) {
		case "pirate":
			switch (b.owner) {
				case "other":
					return -1;
				case "pirate":
					return 0;
				default:
					return -1;
			}
			break;
		case "other":
			if ( a.player_name == b.player_name ){
				return 0;
			}
			else if ( a.owner.player_name < b.owner.player_name ){
				return 1;
			}
			else {
				return -1;
			}
			break;
	}
}
*/
