class EventCard extends Card {
	backText = 'EVENT';
	activate(board) {
		// pass;
	}
}

class SpawnEvent extends EventCard {
    name = 'SPAWN';
    text = 'Spawn a guard at the nearest waypoint to the player';
    activate(board) {
		this.board = board;
        var card,pos
        [card,pos] = board.get_card_and_pos(this.board.active_player_token.map_pos);
		var mind = 1000;
		var bests = null;
		for(var s of [...card.spawns, ...card.waypoints]) {
			var d = dist(pos, s);
			if(d < mind) {
				var mind = d;
				var bests = s;
			}
		}
		if(bests !== null) {
			var np = board.get_pos_from_card(card, bests);
			var g = new board.token_types['G'](np);
			board.tokens = [...board.tokens, g];
			g.map_pos = np;
		}
	}
}

class PatrolEvent extends EventCard {
    name = 'PATROL';
    text = "All guards on the player's map card move to the next waypoint";
	activate(board) {
		this.board = board;
        let pcard,ppos
        [pcard,ppos] = board.get_card_and_pos(this.board.active_player_token.map_pos);
		for(let g of board.tokens) {
			if(!(g instanceof board.token_types ['G'])) continue;
            if(['dead', 'unconscious'].includes(g.state)) continue;
            let gcard,gpos;
            [gcard,gpos] = board.get_card_and_pos(g.map_pos);
			if(gcard != pcard) continue;
			if(gpos == ppos) continue;
			var pts = [...gcard.spawns, ...gcard.waypoints];
            var pt = pts.indexOf(p => arrEq(p, gpos));
			if(pt==undefined) pt = 0;
			else pt = pt<pts.length-1?pt+1:0;
			g.map_pos = board.get_pos_from_card(gcard, pts[pt]);
		}
	}
}

class AlertEvent extends EventCard {
    name = 'ALERT';
    text = "All guards on the player's map card become alert";
	activate(board) {
		this.board = board;
        var pcard, ppos;
		[pcard,ppos] = board.get_card_and_pos(this.board.active_player_token.map_pos);
		for(var g of board.tokens) {
			if(!(g instanceof board.token_types ['G'])) continue;
            var gcard,gpos;
			[gcard, gpos] = board.get_card_and_pos(g.map_pos);
			if(gcard != pcard) continue;
			if(g.state == 'dozing') {
				g.state = 'alert';
			}
		}
	}
}

class MoveEvent extends EventCard {
    name = 'MOVE';
    text = "The nearest guard moves to a waypoint closer to the player. If already at the closest waypoint, guard moves to player standing on a lit tile.";
	activate(board) {
		this.board = board;
		let p = this.board.active_player_token;
		var guard = this.board.nearest_guard(p.map_pos);
		if(guard === null) {
			return true;
		}
        let inc_player = !['U','B'].includes(this.board.get(p.map_pos));
		var new_pos = this.board.guard_nearest_move(guard.map_pos, p.map_pos, inc_player);
		guard.map_pos = new_pos;
	}
}
