// Transcrypt'ed from Python, 2022-11-25 10:51:43

var __name__ = '__main__';
function dist(pos1, pos2) {
	var dx = Math.abs (pos1 [0] - pos2 [0]);
	var dy = Math.abs (pos1 [1] - pos2 [1]);
	return Math.max (dx, dy) + 0.5 * Math.min (dx, dy);
};


class Map {
	constructor(w, h) {
		this.w = w;
		this.h = h;
		this._data = [...new Array(w)].map(() => [...new Array(h)].map(() => 'U'));
	}
	get(pos) {
		try {
			return this._data[pos[0]][pos[1]];
		}
		catch {
			return null;
		}
	}
	set(pos, val) {
		this._data[pos[0]][pos[1]] = val;
	}
	*iter_between(pos1, pos2){
		var x1,y1,x2,y2;
		[x1,y1] = pos1;
		[x2,y2] = pos2;
		if (Math.abs (y2 - y1) == 0 && Math.abs (x2 - x1) == 0) {
			return ;
		}
		if (Math.abs (y2 - y1) > Math.abs (x2 - x1)) {
			var slope = (x2 - x1) / (y2 - y1);
			if (y1 > y2) {
				[y1,y2] = [y2, y1];
				[x1,x2] = [x2, x1];
			}
			for (var y = y1 + 1; y < y2; y++) {
				var x = Math.round((x1 + (y - y1) * slope));
				yield [x, y];
			}
		}
		else {
			var slope = (y2 - y1) / (x2 - x1);
			if (x1 > x2) {
				[y1,y2] = [y2, y1];
				[x1,x2] = [x2, x1];
			}
			for (var x = x1 + 1; x < x2; x++) {
				var y = Math.round((y1 + (x - x1) * slope));
				yield [x, y];
			}
		}
	}
	*iter_types_between(pos1, pos2, types) {
		for (var pos of this.iter_between (pos1, pos2)) {
			if (types.includes(this.get(pos))) {
				yield pos;
			}
		}
	}
	has_types_between(pos1, pos2, types) {
		for (var pos of this.iter_types_between (pos1, pos2, types)) {
			return true;
		}
		return false;
	}
	*iter_all(sub_rect=null) {
		if (sub_rect !== null) {
			for (var x = sub_rect [0]; x < Math.min (this.w, sub_rect [0] + sub_rect [2]); x++) {
				for (var y = sub_rect [1]; y < Math.min (this.h, sub_rect [1] + sub_rect [3]); y++) {
					yield [x, y];
				}
			}
		}
		else {
			for (var x = 0; x < this.w; x++) {
				for (var y = 0; y < this.h; y++) {
					yield [x, y];
				}
			}
		}
	}
	*iter_types(types, sub_rect) {
		for (var pos of this.iter_all (sub_rect)) {
			if (types.includes(this.get(pos))) {
				yield pos;
			}
		}
	}
	*iter_in_range(pos, radius) {
		var x, y;
		[x, y] = pos;
		if(radius == null) radius = 3;
		var rad = Math.ceil (radius);
		for (var xoff = -(rad); xoff < rad + 1; xoff++) {
			for (var yoff = -(rad); yoff < rad + 1; yoff++) {
				if (xoff * xoff + yoff * yoff <= radius * radius) {
					var x0 = x + xoff;
					var y0 = y + yoff;
					if ((0 <= y0 && y0 < this.h) && (0 <= x0 && x0 < this.w)) {
						yield [x0, y0];
					}
				}
			}
		}
	}
	*iter_types_in_range(pos, types, radius, blocker_types=null) {
		for(var pos0 of this.iter_in_range(pos, radius)){
			if (blocker_types !== null && this.has_types_between (pos, pos0, blocker_types)) continue;
			if (types.includes(this.get(pos0))) yield pos0;
		}
	}
	num_in_range(pos, types, radius, blocker_types=null) {
		var num = 0;
		for (var pos0 of this.iter_types_in_range (pos, types, radius, blocker_types)) {
			num++;
		}
		return num;
	}
	*iter_rect(rect, must_fit=true) {
		if (must_fit && (rect.x < 0 || rect.y < 0 || rect.right > this.w || rect.bottom > this.h)) {
			return ;
		}
		var xl = Math.max (x, 0);
		var xu = Math.min (x + w, this.w);
		var yl = Math.max (y, 0);
		var yu = Math.min (y + h, this.h);
		for (var x0 = xl; x0 < xu; x0++) {
			for (var y0 = yl; y0 < yu; y0++) {
				yield [x0, y0];
			}
		}
	}
	num_in_rect(pos, size, targets, must_fit=true) {
		num = 0;
		for (var pos of this.iter_rect (pos, size, must_fit)) {
			if (targets.includes(this.get(pos))) num++;
		}
		return num;
	}
}


class MapCard extends Widget {
	cardLevel = 1;
	buildingTypes = ['B','B0'];
	faceUp = true;
	constructor(rect, properties=null) {
		super(rect);
		this.processTouches=true;
		this.updateProperties(properties);
		}
	on_touch_up(event, touch) {
        if(this.renderRect().collide(new Rect([touch.clientX, touch.clientY, 0, 0]))) this.faceUp = !this.faceUp;
	}
	on_mouse_up(event, touch) {
        if(this.renderRect().collide(new Rect([touch.clientX, touch.clientY, 0, 0]))) this.faceUp = !this.faceUp;
	}
	draw() {
		if(!this.faceUp) {
			super.draw();
			return;
		}
        let rr = this.renderRect();
        var size = [rr.w / this.w - 1, rr.h / this.h - 1];
        let color0 = colorString([0,0,0]);
        for (var pos of this.map.iter_all ()) {
			var i,j;
			[i,j] = pos;
            var color = colorString(this.building_codes[this.map.get([i,j])][1]);
            var x = rr.x + (i * rr.w) / this.w;
            var y = rr.y + (j * rr.h) / this.h;
			game.ctx.beginPath();
            game.ctx.rect(x, y, size[0], size[1]);
            var tile = this.map.get([i, j]);
            if(!this.buildingTypes.includes(tile)) {
                game.ctx.fillStyle = color;
                game.ctx.fill();    
            } 
            else {
                var s = [size [0] + 1, size [1] + 1];
                game.ctx.fillStyle = color;
                game.ctx.fill();    
				game.ctx.strokeStyle = color0;
				var cx = x + s [0] / 2;
                var cy = y + s [1] / 2;
                var adj = [...this.map.iter_types_in_range ([i, j], this.buildingTypes, 1)]
                var tl=0,tr=0,bl=0,br=0;
				if(this.buildingTypes.includes(this.map.get([i+1,j]))) {
					tr+=this.buildingTypes.includes(this.map.get([i,j+1]));
					br+=this.buildingTypes.includes(this.map.get([i,j-1]));
//                if (adj.includes([i+1,j])) {
					game.ctx.beginPath();
                    game.ctx.moveTo(cx,cy);
                    game.ctx.lineTo(x+s[0], cy);
                    game.ctx.stroke();
//                    tr += adj.includes([i,j+1]);
//                    br += adj.includes([i,j-1]);
                }
                else {
                    br++;
                    tr++;
                }
//                if (adj.includes([i-1,j])) {
				if(this.buildingTypes.includes(this.map.get([i-1,j]))) {
					tl+=this.buildingTypes.includes(this.map.get([i,j+1]));
					bl+=this.buildingTypes.includes(this.map.get([i,j-1]));
					game.ctx.beginPath();
                    game.ctx.moveTo(cx,cy);
                    game.ctx.lineTo(x, cy);
                    game.ctx.stroke();
                    // tl += adj.includes([i,j+1]);
                    // bl += adj.includes([i,j-1]);
                }
                else {
                    bl++;
                    tl++;
                }
//                if (adj.includes([i,j+1])) {
				if(this.buildingTypes.includes(this.map.get([i,j+1]))) {
					tr+=this.buildingTypes.includes(this.map.get([i+1,j]));
					tl+=this.buildingTypes.includes(this.map.get([i-1,j]));
					game.ctx.beginPath();
                    game.ctx.moveTo(cx,cy);
                    game.ctx.lineTo(cx, y+s[1]);
                    game.ctx.stroke();
                    // tr+=addj,includes([i+1,j]);
                    // tl+=addj,includes([i-1,j]);
                }
                else {
                    tl++;
                    tr++;
                }
//                if (adj.includes([i, j - 1])) {
				if(this.buildingTypes.includes(this.map.get([i,j-1]))) {
					br+=this.buildingTypes.includes(this.map.get([i+1,j]));
					bl+=this.buildingTypes.includes(this.map.get([i-1,j]));
					game.ctx.beginPath();
                    game.ctx.moveTo(cx,cy);
                    game.ctx.lineTo(cx, y);
                    game.ctx.stroke();
//                    br+=adj.includes([i+1,j]);
//                    bl+=adj.includes([i-1,j]);
                }
                else {
                    bl++;
                    br++;
                }
                if (bl == 2) {
					game.ctx.beginPath();
                    game.ctx.moveTo(cx,cy);
                    game.ctx.lineTo(x, y);
                    game.ctx.stroke();
                }
                if (br == 2) {
					game.ctx.beginPath();
                    game.ctx.moveTo(cx,cy);
                    game.ctx.lineTo(x+s[0], y);
                    game.ctx.stroke();
                }
                if (tr == 2) {
					game.ctx.beginPath();
                    game.ctx.moveTo(cx,cy);
                    game.ctx.lineTo(x+s[0], y+s[1]);
                    game.ctx.stroke();
                }
                if (tl == 2) {
					game.ctx.beginPath();
                    game.ctx.moveTo(cx,cy);
                    game.ctx.lineTo(x, y+s[1]);
                    game.ctx.stroke();
                }
            }
        }
        game.ctx.fillStyle = colorString([0.8,0.8,0.2]);
        for (var [i, j] of this.lights) {
            var x = rr.x + ((i + 0.4) * rr.w) / this.w;
            var y = rr.y + ((j + 0.4) * rr.h) / this.h;
			game.ctx.beginPath();
            game.ctx.rect(x, y, size[0]/5, size[1]/5);
            game.ctx.fill();    
        }
        game.ctx.fillStyle = colorString([0.9,0.0,0.0]);
        for (var [i, j] of this.spawns) {
            var x = rr.x + ((i + 0.4) * rr.w) / this.w;
            var y = rr.y + ((j + 0.4) * rr.h) / this.h;
			game.ctx.beginPath();
            game.ctx.rect(x, y, size[0]/5, size[1]/5);
            game.ctx.fill();    
        }
        game.ctx.fillStyle = colorString([0.6,0.0,0.0]);
        for (var [i, j] of this.waypoints) {
            var x = rr.x + ((i + 0.4) * rr.w) / this.w;
            var y = rr.y + ((j + 0.4) * rr.h) / this.h;
			game.ctx.beginPath();
            game.ctx.rect(x, y, size[0]/5, size[1]/5);
            game.ctx.fill();    
        }
    }
}

var unlit = [0.1, 0.1, 0.1, 1];
var lit = [0.3, 0.3, 0.35, 1];
function light(lit, unlit, wt) {
	var wl = new MathArray(lit).mul(wt);
	var wu = new MathArray(unlit).mul(1-wt);
	return wl.add(wu);
};
function colorString(vec) {
	let r,g,b;
	[r,g,b] = new MathArray(vec).mul(255).map(x=>Math.floor(x));
	return '#'+r.toString(16).padStart(2,'0')+g.toString(16).padStart(2,'0')+b.toString(16).padStart(2,'0');
}

class CityMap extends MapCard {
	building_codes = {'B': ['Building rooftop', [0.35, 0.15, 0.15, 1]], 
					'U': ['Unlit Pavement', unlit], 
					'L0': ['Lit Pavement', lit], 
					'L1': ['Lit Pavement', light (lit, unlit, 0.66)], 
					'L2': ['Lit Pavement', light (lit, unlit, 0.33)], 
					'L3': ['Lit Pavement', light (lit, unlit, 0.15)], 
					'G': ['Guard', [0.4, 0.4, 0.8, 1]], 
					'S': ['Guard search and spawn point', [0.9, 0.6, 0.6, 1]], 
					'Z': ['Loot Zone', [0.6, 0.6, 0.6, 1]], 
					'M': ['Market', [0.6, 0.9, 0.6, 1]]};
	pavement = ['U','L0','L1','L2'];
	constructor(rect, properties=null) {
		super(rect);
		this.updateProperties(properties);
		this.make_map();
	}
	make_map(){
		this.map = new Map (this.w, this.h);
		var density = 0.2+Math.random()*0.55 + 0.05 * this.cardLevel;
		var filled_area = 0;
		var filled_borders = [0, 0, 0, 0];
		var i = 0;
		while (filled_area < (density * this.w) * this.h && i < 100) {
			var orient = getRandomInt(2);
			if (orient == 0) {
				var size = [getRandomInt(2, (this.w - filled_borders [0]) - filled_borders [1]), 1];
			}
			else {
				var size = [1, getRandomInt(2, (this.h - filled_borders [2]) - filled_borders [3])];
			}
			var x = getRandomInt(filled_borders [0], this.w - size [0]);
			var y = getRandomInt(filled_borders [2], this.h - size [1]);
			filled_area += this.place_building ([x, y], size, filled_borders);
			i++;
		}
		this.add_lights ();
		this.add_spawns ();
		this.add_waypoints ();
		this.add_targets ();
		this.add_markets ();
	}
	clamp(pos) {
		return [Math.max (Math.min (pos [0], this.w - 1), 0), Math.max (Math.min (pos [1], this.h - 1), 0)];
	}
	is_adj(pos) {
        var x0,y0;
        [x0,y0] = pos
		for (var [x, y] of [[x0 - 1, y0 - 1], [x0 + 1, y0 - 1], [x0 - 1, y0 + 1], [x0 + 1, y0 + 1]]) {
			if (x < 0 || x >= this.w || y < 0 || y >= this.h) continue;
			if (this.map.get([x,y]) != 'U') return true;
		}
		return false;
	}
	place_building(pos, size, filled_borders, shape='R', orientation=0) {
		if (shape == 'R') {
			for (var x = pos [0]; x < pos [0] + size [0]; x++) {
				for (var y = pos [1]; y < pos [1] + size [1]; y++) {
					if (this.map.num_in_range([x,y], ['B'],  1.5) > 1) return 0;
				}
			}
			for (var r = pos [1]; r < pos [1] + size [1]; r++) {
				if (r == 0) {
					filled_borders [2] = 1;
				}
				if (r == this.h - 1) {
					filled_borders [3] = 1;
				}
				for (var c = pos [0]; c < pos [0] + size [0]; c++) {
					if (c == 0) {
						filled_borders [0] = 1;
					}
					if (c == this.w - 1) {
						filled_borders [1] = 1;
					}
					this.map.set([c, r], 'B');
				}
			}
			return size [0] * size [1];
		}
	}
	get_best_lightables() {
		var bestn = 0;
		var bestp = [];
		for (var p of this.map.iter_types(['U'], [1, 1, this.map.w - 1, this.map.h - 1])) {
			var n = this.map.num_in_range (p, ['U'], 2, ['B']);
			if (n > bestn) {
				var bestp = [p];
				var bestn = n;
			}
			else if (n == bestn) {
				bestp.push(p);
			}
		}
		return bestp;
	}
	add_lights() {
		this.lights = [];
		var num_lights = getRandomInt(1, this.cardLevel+1);
		for (var i = 0; i < num_lights; i++) {
			var best_lightables = this.get_best_lightables();
			if (best_lightables.length == 0) break;
			this.lights.push (choose(best_lightables));
			this.light_map(this.lights, false);
		}
	}
	light_map(lights, reset=true) {
		if (reset) {
			for (var p of this.map.iter_all ()) {
				if (this.map.get(p)[0] =='L') {
					this.map.set(p,'U');
				}
			}
		}
		for (var l of lights) {
			for (var pos of this.map.iter_types_in_range(l, ['U'], 2, ['B'])) {
				var d = dist (pos, l);
				this.map.set(pos,'L'+Math.floor(d).toString());
			}
		}
	}
    add_spawns() {
		this.spawns = [];
		var num_spawns = getRandomInt(this.cardLevel, this.cardLevel + 2);
		for (var s = 0; s < num_spawns; s++) {
			var new_spawn = null;
			var options = [...this.map.iter_types (this.pavement, [1, 1, this.map.w - 1, this.map.h - 1])];
			shuffle(options);
            new_spawn = options.find(pos => this.spawns.length==0 || Math.min(...this.spawns.map(p=>dist(p, pos)))>6-this.cardLevel);
			if (new_spawn != null) this.spawns.push(new_spawn);
			else break;
		}
	}
	add_waypoints() {
		this.waypoints = [];
		var num_waypoints = ((4 + this.cardLevel) - this.spawns.length) - getRandomInt(2);
		for (var s = 0; s < num_waypoints; s++) {
			var new_wp = null;
			var options = [...this.map.iter_types (this.pavement, [1, 1, this.map.w - 1, this.map.h - 1])];
			shuffle (options);
            new_wp = options.find(pos => this.spawns.length+this.waypoints.length==0 || Math.min(...[...this.spawns,...this.waypoints].map(p=>dist(p, pos)))>3);
			if (new_wp != null) this.waypoints.push(new_wp);
			else break;
		}
	}
	add_targets(){
		this.targets = [];
		var num_targets = getRandomInt(1, 3);
		for (var s = 0; s < num_targets; s++) {
			var new_target = null;
			var options = [...this.map.iter_types('B', [1, 1, this.map.w - 1, this.map.h - 1])];
			shuffle (options);
            new_target = options.find(pos => this.targets.length==0 || Math.min(...this.targets.map(p=>dist(p, pos)))>5);
			if (new_target != null) this.targets.push(new_target);
            else break;
		}
	}
	add_markets() {
		this.markets = [];
		var num_markets = choose([0, 0, 1]);
		for (var s = 0; s < num_markets; s++) {
			var new_market = null;
			var options = [...this.map.iter_types ('B', [1, 1, this.map.w - 1, this.map.h - 1])];
			shuffle(options);
            new_market = options.find(pos => this.markets.length==0 || Math.min(...this.markets.map(p=>dist(p, pos)))>5);
			if (new_market != null) this.markets.push(new_market);
            else break;
		}
	}
}

class EventCard extends Card {
	activate(board) {
		// pass;
	}
}

class SpawnEvent extends EventCard {
    activate(board) {
		this.board = board;
        var card,pos
        [card,pos] = board.get_card_and_pos (this.board.active_player_token.map_pos);
		var mind = 1000;
		var bests = null;
		for (var s of [...card.spawns, ...card.waypoints]) {
			var d = dist (pos, s);
			if (d < mind) {
				var mind = d;
				var bests = s;
			}
		}
		if (bests !== null) {
			var np = board.get_pos_from_card (card, bests);
			var g = board.token_types ['G']();
			board.tokens.append (g);
			g.map_pos = np;
		}
	}
}

class PatrolEvent extends EventCard {
	activate(board) {
		this.board = board;
        var pcard,ppos
        [pcard,ppos] = board.get_card_and_pos (this.board.active_player_token.map_pos);
		for (var g of board.tokens) {
			if (!(g instanceof board.token_types ['G'])) continue;
            if (['dead', 'unconscious'].includes(g.state)) continue;
            var card,pos
            [card,pos] = board.get_card_and_pos (g.map_pos);
			if (gcard != pcard) continue;
			if (gpos == ppos) continue;
			var pts = [...gcard.spawns, ...gcard.waypoints];
            var ind = pts.findIndex(gpos);
			ind = (ind > 0 ? ind - 1 : pts.length - 1);
			g.map_pos = board.get_pos_from_card (gcard, pts [ind]);
		}
	}
}

class AlertEvent extends EventCard {
	activate(board) {
		this.board = board;
        var pcard, ppos;
		[pcard,ppos] = board.get_card_and_pos (this.board.active_player_token.map_pos);
		for (var g of board.tokens) {
			if (!(isinstance (g, board.token_types ['G']))) {
				continue;
			}
            var gcard,gpos
			[gcard, gpos] = board.get_card_and_pos (g.map_pos);
			if (gcard != pcard) continue;
			if (g.state == 'dozing') {
				g.state = 'alert';
			}
		}
	}
}

class MoveEvent extends EventCard {
	activate(board) {
		this.board = board;
		var guard = this.board.nearest_guard (this.board.active_player_token.map_pos);
		if (guard === null) {
			return true;
		}
        inc_player = ['U','B'].includes(this.board [this.board.active_player_token.map_pos]);
		var new_pos = this.board.guard_nearest_move (guard.map_pos, this.board.active_player_token.map_pos, inc_player);
		guard.map_pos = new_pos;
	}
}

class PlayerAction {
	constructor(card, playarea) {
		this.spent = 0;
		this.card = card;
		this.playarea = playarea;
        value_per_card: 1;
        base_allowance: 1;
        base_noise: 1;
        noise_per_stack: 0;
        tap_on_use: null;
        exhaust_on_use: null;
    
        for (var k of kwargs) {
			this.__dict__ [k] = kwargs [k];
		}
	}
	__call__(message) {
		this.playarea.playerprompt.text = 'Default action handler. You should not see this text.'.format ();
	}
	cards_unused() {
		var num_stacked_cards =  this.playarea.activecardsplay.cards.length - 1;
		if (this.spent == 0) {
			return num_stacked_cards + 1;
		}
		else if (this.spent < this.base_allowance) {
			return num_stacked_cards;
		}
		else {
			return int ((this.value_allowance () - this.spent) / this.value_per_card);
		}
	}
	value_allowance() {
		var num_stacked_cards = this.playarea.activecardsplay.cards.length - 1;
		return this.base_allowance + this.value_per_card * num_stacked_cards;
	}
	rounded_remain() {
		return ((this.value_allowance () - this.spent) / 0.5) / 2;
	}
	noise_made() {
		return this.base_noise + this.noise_per_stack * ((this.playarea.activecardsplay.cards.length - 1) - this.cards_unused ());
	}
}

class MoveAction extends PlayerAction {
	__call__(message) {
		var playarea = this.playarea;
		var board = playarea.board;
		if (message == 'card_action_end') {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if (message == 'can_stack') {
			return true;
		}
		if (message == 'map_choice_selected') {
			var obj = kwargs ['touch_object'];
			this.spent += dist (obj.map_pos, board.active_player_token.map_pos);
			board.alert_nearby_guards (this.base_noise);
			board.active_player_token.map_pos = obj.map_pos;
		}
		else if (message == 'card_action_selected') {
			this.spent = 0;
		}
		var moves_left = this.value_allowance () - this.spent;
		var spots = {}

		if (!(board.active_player_clashing ())) {
			var pp = board.active_player_token.map_pos;
			var spots = board.walkable_spots (pp, __kwargtrans__ ({dist: moves_left, spots: {}}));
		}
		board.map_choices = (function () {
			var __accu0__ = [];
			for (var p of spots) {
				if (tuple (p) != tuple (pp)) {
					__accu0__.append (board.make_choice (p, self, set_choice_type (p, pp, board)));
				}
			}
			return __accu0__;
		}) ();
		if (board.map_choices.length < 1 && this.spent > 0) {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = 'Move {}: Touch the highlighted board spaces to move across the map.'.format (this.rounded_remain ());
		}
	}
}

class GlideAction extends PlayerAction {
	__call__(message) {
		var playarea = this.playarea;
		var board = playarea.board;
		if (message == 'card_action_end') {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if (message == 'can_stack') {
			return false;
		}
		if (message == 'map_choice_selected') {
			var obj = kwargs ['touch_object'];
			this.spent += dist (obj.map_pos, board.active_player_token.map_pos);
			board.alert_nearby_guards (this.base_noise);
			board.active_player_token.map_pos = obj.map_pos;
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		else if (message == 'card_action_selected') {
			this.spent = 0;
		}
		var spots = [];
		var pp = board.active_player_token.map_pos;
		if (!(board.active_player_clashing ())) {
			if (__in__ (board [board.active_player_token.map_pos], board.buildingTypes)) {
				var spots = (function () {
					var __accu0__ = [];
					for (var p of board.iter_types_in_range (board.active_player_token.map_pos, board.buildingTypes, __kwargtrans__ ({radius: this.value_allowance ()}))) {
						if (board.has_types_between (p, pp, board.path_types)) {
							__accu0__.append (p);
						}
					}
					return __accu0__;
				}) ();
			}
			else {
				var spots = [];
			}
		}
		board.map_choices = (function () {
			var __accu0__ = [];
			for (var p of spots) {
				if (tuple (p) != tuple (pp)) {
					__accu0__.append (board.make_choice (p, self, set_choice_type (p, pp, board, this.value_allowance () + 1)));
				}
			}
			return __accu0__;
		}) ();
		if (board.map_choices.length < 1 && this.spent > 0) {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = 'Glide {}: Touch the highlighted board spaces to move building to building.'.format (this.rounded_remain ());
		}
	}
}

class FightAction extends PlayerAction {
	noise_per_stack = 1;
	base_allowance = 1;
	__call__(message) {
		var playarea = this.playarea;
		var board = playarea.board;
		if (message == 'card_action_end') {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if (message == 'can_stack') {
			return true;
		}
		if (message == 'map_choice_selected') {
			var obj = kwargs ['touch_object'];
			obj.token.state = 'dead';
			this.spent++;
			board.token_update ();
			var __left0__ = board.get_card_and_pos (board.active_player_token.map_pos);
			var c = __left0__ [0];
			var p = __left0__ [1];
			for (var g of board.iter_tokens ('G')) {
				if (g.state == 'dozing') {
					if (board.get_card_and_pos (g.map_pos) [0] == c) {
						g.state = 'alert';
					}
				}
			}
		}
		else if (message == 'card_action_selected') {
			this.spent = 0;
		}
		var guard_choices = (function () {
			var __accu0__ = [];
			for (var t of board.tokens) {
				if (isinstance (t, board.token_types ['G']) && __in__ (t.state, ['dozing', 'alert']) && this.rounded_remain () >= 1 && dist (board.active_player_token.map_pos, t.map_pos) == 0) {
					__accu0__.append (t);
				}
			}
			return __accu0__;
		}) ();
		var map_choices = (function () {
			var __accu0__ = [];
			for (var t of guard_choices) {
				__accu0__.append (board.make_token_choice (t, self, 'touch'));
			}
			return __accu0__;
		}) ();
		board.map_choices = map_choices;
		if (board.map_choices.length < 1 && this.spent != 0) {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = 'Fight {}: Select a highlighted guard to attack.'.format (this.rounded_remain ());
		}
	}
}

class SmokeBombAction extends PlayerAction {
	base_allowance = 1;
	__call__(message) {
		var playarea = this.playarea;
		var board = playarea.board;
		if (message == 'card_action_end') {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if (message == 'can_stack') {
			return true;
		}
		if (message == 'map_choice_selected') {
			var obj = kwargs ['touch_object'];
			var guard_choices = (function () {
				var __accu0__ = [];
				for (var t of board.iter_tokens ('G')) {
					if (__in__ (t.state, ['dozing', 'alert']) && this.rounded_remain () >= 1 && dist (obj.map_pos, t.map_pos) == 0) {
						__accu0__.append (t);
					}
				}
				return __accu0__;
			}) ();
			for (var g of guard_choices) {
				g.frozen = true;
			}
			this.spent++;
			board.token_update ();
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		else if (message == 'card_action_selected') {
			this.spent = 0;
		}
		var guard_choices = (function () {
			var __accu0__ = [];
			for (var t of board.iter_tokens ('G')) {
				if (__in__ (t.state, ['dozing', 'alert']) && this.rounded_remain () >= 1 && dist (board.active_player_token.map_pos, t.map_pos) == 0) {
					__accu0__.append (t);
				}
			}
			return __accu0__;
		}) ();
		var map_choices = [board.make_choice (board.active_player_token.map_pos, self, 'touch')];
		board.map_choices = map_choices;
		if (board.map_choices.length < 1 && this.spent != 0) {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = 'Fight {}: Select a highlighted guard to attack.'.format (this.rounded_remain ());
		}
	}
}

class ClimbAction extends PlayerAction {
	__call__(message) {
		var playarea = this.playarea;
		var board = playarea.board;
		if (message == 'card_action_end') {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if (message == 'can_stack') {
			return false;
		}
		if (message == 'map_choice_selected') {
			var obj = kwargs ['touch_object'];
			board.alert_nearby_guards (this.base_noise);
			playarea.board.active_player_token.map_pos = obj.map_pos;
			this.spent = this.value_allowance ();
		}
		else if (message == 'card_action_selected') {
			this.spent = 0;
		}
		var spots = [];
		if (!(board.active_player_clashing ())) {
			if (!__in__ (board [board.active_player_token.map_pos], ['B', 'B0'])) {
				var spots = (function () {
					var __accu0__ = [];
					for (var p of board.iter_types_in_range (board.active_player_token.map_pos, board.buildingTypes, this.value_allowance ())) {
						__accu0__.append (p);
					}
					return __accu0__;
				}) ();
			}
			else {
				var spots = (function () {
					var __accu0__ = [];
					for (var p of board.iter_types_in_range (board.active_player_token.map_pos, board.path_types, 1)) {
						__accu0__.append (p);
					}
					return __accu0__;
				}) ();
			}
		}
		board.map_choices = (function () {
			var __accu0__ = [];
			for (var p of spots) {
				__accu0__.append (board.make_choice (p, self, 'touch'));
			}
			return __accu0__;
		}) ();
		if (this.spent >= 1) {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = 'Climb {}: Touch the highlighted board spaces to climb an adjacent building.'.format (this.rounded_remain ());
		}
	}
}

class KnockoutAction extends PlayerAction {
	base_noise = 0;
	can_loot = true;
	grapple = false;
	alert = false;
	__call__(message) {
		var playarea = this.playarea;
		var board = playarea.board;
		if (message == 'card_action_end') {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if (message == 'can_stack') {
			return false;
		}
		if (message == 'map_choice_selected') {
			var obj = kwargs ['touch_object'];
			obj.token.state = 'unconscious';
			this.spent = playarea.activecardsplay.cards.length;
			board.token_update ();
		}
		else if (message == 'card_action_selected') {
			this.fight = 1;
			this.spent = 0;
		}
		if (!(board.active_player_clashing ())) {
			if (this.alert) {
				var guard_choices = (function () {
					var __accu0__ = [];
					for (var t of board.tokens) {
						if (isinstance (t, board.token_types ['G']) && __in__ (t.state, ['dozing', 'alert']) && dist (board.active_player_token.map_pos, t.map_pos) <= 1) {
							__accu0__.append (t);
						}
					}
					return __accu0__;
				}) ();
			}
			else {
				var guard_choices = (function () {
					var __accu0__ = [];
					for (var t of board.tokens) {
						if (isinstance (t, board.token_types ['G']) && __in__ (t.state, ['dozing']) && dist (board.active_player_token.map_pos, t.map_pos) <= 1) {
							__accu0__.append (t);
						}
					}
					return __accu0__;
				}) ();
			}
			var map_choices = (function () {
				var __accu0__ = [];
				for (var t of guard_choices) {
					__accu0__.append (board.make_token_choice (t, self, 'touch'));
				}
				return __accu0__;
			}) ();
			board.map_choices = map_choices;
		}
		else {
			board.map_choices = [];
		}
		if (board.map_choices.length < 1 && this.spent != 0) {
			var draw = playarea.activecardsplay.cards.length;
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			var pt = board.active_player_token;
			if (__in__ (board [pt.map_pos], board.buildingTypes)) {
				pt.map_pos = obj.token.map_pos;
			}
			else if (this.grapple) {
				obj.token.map_pos = pt.map_pos;
			}
			if (this.can_loot) {
				playarea.loot1.select_draw (1, draw);
			}
		}
		else {
			playarea.playerprompt.text = 'Knockout {}: Select a guard to knockout.'.format (this.rounded_remain ());
		}
	}
}

class ArrowAction extends PlayerAction {
	__call__(message) {
		var playarea = this.playarea;
		var board = playarea.board;
		if (message == 'card_action_end') {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if (message == 'can_stack') {
			return true;
		}
		if (message == 'map_choice_selected') {
			board.alert_nearby_guards (this.base_noise);
			var obj = kwargs ['touch_object'];
			obj.token.state = 'dead';
			this.spent = dist (board.active_player_token.map_pos, obj.token.map_pos);
			board.token_update ();
		}
		else if (message == 'card_action_selected') {
			this.spent = 0;
		}
		if (!(board.active_player_clashing ())) {
			var guard_choices = (function () {
				var __accu0__ = [];
				for (var t of board.tokens) {
					if (isinstance (t, board.token_types ['G']) && __in__ (t.state, ['dozing', 'alert']) && (0 < dist (board.active_player_token.map_pos, t.map_pos) && dist (board.active_player_token.map_pos, t.map_pos) <= this.value_allowance ()) && board.has_line_of_sight (t.map_pos, board.active_player_token.map_pos, ['B', 'B0'])) {
						__accu0__.append (t);
					}
				}
				return __accu0__;
			}) ();
			var map_choices = (function () {
				var __accu0__ = [];
				for (var t of guard_choices) {
					__accu0__.append (board.make_token_choice (t, self, 'touch'));
				}
				return __accu0__;
			}) ();
			board.map_choices = map_choices;
		}
		else {
			board.map_choices = [];
		}
		if (this.spent > 0) {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = 'Shoot arrow {}: Select a guard to shoot.'.format (this.rounded_remain ());
		}
	}
}

class GasAction extends PlayerAction {
	radius = 0;
	__call__(message) {
		var playarea = this.playarea;
		var board = playarea.board;
		if (message == 'card_action_end') {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if (message == 'can_stack') {
			return true;
		}
		if (message == 'map_choice_selected') {
			board.alert_nearby_guards (this.base_noise);
			var obj = kwargs ['touch_object'];
			this.spent = dist (board.active_player_token.map_pos, obj.map_pos);
			var guards_affected = (function () {
				var __accu0__ = [];
				for (var t of board.iter_tokens ('G')) {
					if (__in__ (t.state, ['dozing', 'alert']) && (0 <= dist (obj.map_pos, t.map_pos) && dist (obj.map_pos, t.map_pos) <= this.radius)) {
						__accu0__.append (t);
					}
				}
				return __accu0__;
			}) ();
			for (var g of guards_affected) {
				g.state = 'unconscious';
			}
			board.token_update ();
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		else if (message == 'card_action_selected') {
			this.spent = 0;
		}
		if (!(board.active_player_clashing ())) {
			var pp = board.active_player_token.map_pos;
			var map_choices = (function () {
				var __accu0__ = [];
				for (var t of board.iter_types_in_range (pp, board.path_types, __kwargtrans__ ({radius: this.value_allowance ()}))) {
					if (board.has_line_of_sight (t, pp, board.buildingTypes)) {
						__accu0__.append (board.make_choice (t, self, 'touch'));
					}
				}
				return __accu0__;
			}) ();
			board.map_choices = map_choices;
		}
		else {
			board.map_choices = [];
		}
		if (this.spent > 0) {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = 'Shoot arrow {}: Select a space to shoot gas arrow.'.format (this.rounded_remain ());
		}
	}
}

class DimmerAction extends PlayerAction {
	radius = 0;
	__call__(message) {
		var playarea = this.playarea;
		var board = playarea.board;
		if (message == 'card_action_end') {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if (message == 'can_stack') {
			return true;
		}
		if (message == 'map_choice_selected') {
			board.alert_nearby_guards (this.base_noise);
			var obj = kwargs ['touch_object'];
			this.spent = dist (board.active_player_token.map_pos, obj.map_pos);
			board.hide_light (obj.map_pos);
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		else if (message == 'card_action_selected') {
			this.spent = 0;
		}
		if (!(board.active_player_clashing ())) {
			var pp = board.active_player_token.map_pos;
			var map_choices = (function () {
				var __accu0__ = [];
				for (var p of board.iter_lights ()) {
					if ((0 <= dist (p, pp) && dist (p, pp) <= this.value_allowance ()) && board.has_line_of_sight (p, pp, board.buildingTypes)) {
						__accu0__.append (board.make_choice (p, self, 'touch'));
					}
				}
				return __accu0__;
			}) ();
			board.map_choices = map_choices;
		}
		else {
			board.map_choices = [];
		}
		if (this.spent > 0) {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = 'Shoot dimmer arrow {}: Select a space to shoot gas arrow.'.format (this.rounded_remain ());
		}
	}
}

class LockpickAction extends PlayerAction {
	base_allowance = 1;
	can_loot = true;
	max_loot = 3;
	__call__(message) {
		var playarea = this.playarea;
		var board = playarea.board;
		if (message == 'card_action_end') {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if (message == 'can_stack') {
			return true;
		}
		if (message == 'map_choice_selected') {
			var obj = kwargs ['touch_object'];
			var target = (function () {
				var __accu0__ = [];
				for (var t of board.iter_tokens (__kwargtrans__ ({token_type: 'T'}))) {
					if (t.map_pos == obj.map_pos) {
						__accu0__.append (t);
					}
				}
				return __accu0__;
			}) ();
			if (target.length > 0) {
				var target = target [0];
				var pick = this.value_allowance ();
				board.alert_nearby_guards (this.base_noise);
				if (pick >= target.lock_level) {
					target.picked = true;
					board.tokens.remove (target);
					this.spent = pick;
					if (target.has_loot) {
						var loot_decks = [playarea.loot1, playarea.loot2, playarea.loot3];
						loot_decks [target.loot_level - 1].select_draw (1, (1 + pick) - target.lock_level);
						this.loot_pos = target.map_pos;
					}
				}
			}
			else {
				board.alert_nearby_guards (this.base_noise);
				if (this.loot_pos === null) {
					this.spent = 1;
				}
				board.active_player_token.map_pos = obj.map_pos;
				playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
				return ;
			}
		}
		else if (message == 'card_action_selected') {
			this.spent = 0;
			this.loot_pos = null;
		}
		var p = board.active_player_token;
		board.map_choices = [];
		if (!(board.active_player_clashing ())) {
			if (this.loot_pos !== null) {
				var move_choices = (function () {
					var __accu0__ = [];
					for (var m of board.iter_types_in_range (this.loot_pos, board.path_types, __kwargtrans__ ({radius: 1}))) {
						if (dist (this.loot_pos, m) >= 1) {
							__accu0__.append (m);
						}
					}
					return __accu0__;
				}) ();
				var target_choices = list (set (move_choices));
				var map_choices = (function () {
					var __accu0__ = [];
					for (var t of target_choices) {
						__accu0__.append (board.make_choice (t, self, set_choice_type (t, p.map_pos, board, 3)));
					}
					return __accu0__;
				}) ();
				board.map_choices = map_choices;
			}
			else if (!__in__ (board [board.active_player_token.map_pos], board.buildingTypes)) {
				var target_choices = (function () {
					var __accu0__ = [];
					for (var t of board.iter_targets ()) {
						if (dist (p.map_pos, t) == 1) {
							__accu0__.append (t);
						}
					}
					return __accu0__;
				}) ();
				var move_choices = (function () {
					var __accu0__ = [];
					for (var b of board.iter_types_in_range (p.map_pos, 'B', __kwargtrans__ ({radius: 1}))) {
						for (var m of board.iter_types_in_range (b, board.path_types, __kwargtrans__ ({radius: 1}))) {
							if (dist (p.map_pos, m) >= 1) {
								__accu0__.append (m);
							}
						}
					}
					return __accu0__;
				}) ();
				target_choices += list (set (move_choices));
				var map_choices = (function () {
					var __accu0__ = [];
					for (var t of target_choices) {
						__accu0__.append (board.make_choice (t, self, set_choice_type (t, p.map_pos, board, 3)));
					}
					return __accu0__;
				}) ();
				board.map_choices = map_choices;
			}
		}
		if (board.map_choices.length < 1 && this.spent != 0) {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = 'Lockpick {}: Select a guard to knockout.'.format (this.rounded_remain ());
		}
	}
}

class DecoyAction extends PlayerAction {
	base_allowance = 3;
	__call__(message) {
		var playarea = this.playarea;
		var board = playarea.board;
		if (message == 'card_action_end') {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if (message == 'can_stack') {
			return true;
		}
		if (message == 'map_choice_selected') {
			var obj = kwargs ['touch_object'];
			for (var t of board.tokens) {
				if (isinstance (t, board.token_types ['G']) && __in__ (t.state, ['alert', 'dozing']) && (0 < dist (t.map_pos, obj.map_pos) && dist (t.map_pos, obj.map_pos) <= 10)) {
					if (!(board.has_types_between (t.map_pos, obj.map_pos, board.buildingTypes))) {
						t.map_pos = obj.map_pos;
						t.state = 'alert';
					}
				}
			}
			this.spent = dist (obj.map_pos, board.active_player_token.map_pos);
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		else if (message == 'card_action_selected') {
			this.spent = 0;
		}
		if (!(board.active_player_clashing ())) {
			var pp = board.active_player_token.map_pos;
			var place_choices = (function () {
				var __accu0__ = [];
				for (var t of board.iter_types_in_range (pp, board.path_types, this.value_allowance ())) {
					if (board.has_line_of_sight (t, pp, board.buildingTypes)) {
						__accu0__.append (t);
					}
				}
				return __accu0__;
			}) ();
			var map_choices = (function () {
				var __accu0__ = [];
				for (var t of place_choices) {
					__accu0__.append (board.make_choice (t, self, 'touch'));
				}
				return __accu0__;
			}) ();
			board.map_choices = map_choices;
		}
		else {
			board.map_choices = [];
		}
		if (this.spent != 0) {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = 'Shoot decoy {}: Select a tile to shoot the decoy to.'.format (this.rounded_remain ());
		}
	}
}

class MarketAction extends PlayerAction {
	base_allowance = 1;
	__call__(message) {
		var playarea = this.playarea;
		var board = playarea.board;
		if (message == 'card_action_end') {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if (message == 'can_stack') {
			return isinstance (kwargs ['stacked_card'], TreasureCard);
		}
		if (message == 'map_choice_selected') {
			board.alert_nearby_guards (this.base_noise);
			var obj = kwargs ['touch_object'];
			var market = (function () {
				var __accu0__ = [];
				for (var t of board.iter_tokens (__kwargtrans__ ({token_type: 'M'}))) {
					if (t.map_pos == obj.map_pos) {
						__accu0__.append (t);
					}
				}
				return __accu0__;
			}) ();
			if (market.length > 0) {
				this.spent = this.value_allowance ();
				this.market_pos = obj.map_pos;
				playarea.marketdeck.select_draw (1, 4, this.spent);
			}
			else {
				board.active_player_token.map_pos = obj.map_pos;
				playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
				return ;
			}
		}
		else if (message == 'card_action_selected') {
			this.spent = 0;
			this.market_pos = null;
		}
		var p = board.active_player_token;
		board.map_choices = [];
		if (!(board.active_player_clashing ())) {
			if (this.market_pos !== null) {
				var move_choices = (function () {
					var __accu0__ = [];
					for (var m of board.iter_types_in_range (this.market_pos, board.path_types, __kwargtrans__ ({radius: 1}))) {
						if (dist (this.market_pos, m) >= 1) {
							__accu0__.append (m);
						}
					}
					return __accu0__;
				}) ();
				var target_choices = list (set (move_choices));
				var map_choices = (function () {
					var __accu0__ = [];
					for (var t of target_choices) {
						__accu0__.append (board.make_choice (t, self, set_choice_type (t, p.map_pos, board, 3)));
					}
					return __accu0__;
				}) ();
				board.map_choices = map_choices;
			}
			else if (!__in__ (board [board.active_player_token.map_pos], board.buildingTypes)) {
				var target_choices = (function () {
					var __accu0__ = [];
					for (var t of board.iter_markets ()) {
						if (dist (p.map_pos, t) == 1) {
							__accu0__.append (t);
						}
					}
					return __accu0__;
				}) ();
				var map_choices = (function () {
					var __accu0__ = [];
					for (var t of target_choices) {
						__accu0__.append (board.make_choice (t, self, set_choice_type (t, p.map_pos, board, 3)));
					}
					return __accu0__;
				}) ();
				board.map_choices = map_choices;
			}
		}
		if (board.map_choices.length < 1 && this.spent != 0) {
			playarea.activecardsplay.discard_used (this.cards_unused (), this.noise_made (), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = 'Buy {}: Select a market card to buy.'.format (this.rounded_remain ());
		}
	}
}

class TraitCard extends Card {
	tapped = BooleanProperty (false);
	exhausted = BooleanProperty (false);
	get_actions_for_card(card) {
		return {}

	}
}

class MoveTrait extends TraitCard {
	get_actions_for_card(card, playarea) {
		if (this.tapped || this.exhausted) {
			return {}

		}
		else {
			return {'MOVE 1+': MoveAction (card, playarea, __kwargtrans__ ({base_allowance: 1, tap_on_use: self}))}

		}
	}
}

class FightTrait extends TraitCard {
	get_actions_for_card(card, playarea) {
		if (this.tapped || this.exhausted) {
			return {}

		}
		else {
			return {'ATTACK 0.5+': FightAction (card, playarea, __kwargtrans__ ({base_allowance: 0.5, value_per_card: 0.5, tap_on_use: self}))}

		}
	}
}

class ClimbTrait extends TraitCard {
	get_actions_for_card(card, playarea) {
		if (this.tapped || this.exhausted) {
			return {}

		}
		else {
			return {'CLIMB 1': ClimbAction (card, playarea, __kwargtrans__ ({tap_on_use: true}))}

		}
	}
}

class SneakTrait extends TraitCard {
	get_actions_for_card(card, playarea) {
		if (this.tapped || this.exhausted) {
			return {}

		}
		else {
			return {'KNOCKOUT': KnockoutAction (card, playarea, __kwargtrans__ ({base_allowance: 1, tap_on_use: true}))}

		}
	}
}

class LootTrait extends TraitCard {
	get_actions_for_card(card, playarea) {
		if (this.tapped || this.exhausted) {
			return {}

		}
		else {
			return {'LOCKPICK 1+': LockpickAction (card, playarea, __kwargtrans__ ({base_allowance: 1, tap_on_use: true}))}

		}
	}
}

class ArcherTrait extends TraitCard {
	get_actions_for_card(card, playarea) {
		if (this.tapped || this.exhausted) {
			return {}

		}
		else {
			return {'ARROW 3+': ArrowAction (card, playarea, __kwargtrans__ ({base_allowance: 3, tap_on_use: true}))}

		}
	}
}

function stack_all_fn(card) {
	return true;
};

function set_choice_type(pos1, pos2, board, dist_cap) {
	if (typeof dist_cap == 'undefined' || (dist_cap != null && dist_cap.hasOwnProperty ("__kwargtrans__"))) {;
		var dist_cap = 2;
	};
	if (dist (pos1, pos2) < dist_cap) {
		var visible = false;
		if (!__in__ (board [pos1], ['B', 'U'])) {
			var visible = len ((function () {
				var __accu0__ = [];
				for (var g of board.iter_tokens ('G')) {
					if (__in__ (g.state, ['alert', 'dozing']) && !(g.frozen) && dist (g.map_pos, pos1) <= 10 && !(board.has_types_between (g.map_pos, pos1, 'B'))) {
						__accu0__.append (g);
					}
				}
				return __accu0__;
			}) ()) > 0;
		}
		if (visible) {
			return 'visible';
		}
		else {
			return 'touch';
		}
	}
	return 'info';
};

class PlayerCard extends Card {
	get_actions(playarea) {
		return {}

	}
}

class StartPlayerCard extends PlayerCard {
}

class LootCard extends PlayerCard {
}

class SkillCard extends PlayerCard {
}

class TreasureCard extends LootCard {
	get_actions(playarea) {
		return {'BUY 1+': MarketAction (self, playarea, __kwargtrans__ ({base_allowance: 1, value_per_card: 1, exhaust_on_use: self}))}

	}
}

class SkeletonKey extends LootCard {
	get_actions(playarea) {
		return {'LOCKPICK 4+': LockpickAction (self, playarea, __kwargtrans__ ({base_allowance: 4, value_per_card: 1, exhaust_on_use: self}))}

	}
}

class MarketCard extends PlayerCard {
}

class GasArrow extends MarketCard {
	get_actions(playarea) {
		return {'SHOOT GAS 3+': GasAction (self, playarea, __kwargtrans__ ({base_allowance: 3, value_per_card: 2, radius: 1, exhaust_on_use: self}))}

	}
}

class RopeArrow extends MarketCard {
	get_actions(playarea) {
		return {'CLIMB 1.5': ClimbAction (self, playarea, __kwargtrans__ ({base_allowance: 1.5, value_per_card: 1, max_height: 2})), 'TRAVERSE 2': GlideAction (self, playarea, __kwargtrans__ ({base_allowance: 2, value_per_card: 1, max_height: 2, exhaust_on_use: self}))}

	}
}

class DimmerArrow extends MarketCard {
	get_actions(playarea) {
		return {'SHOOT DIMMER 3+': DimmerAction (self, playarea, __kwargtrans__ ({base_allowance: 3, value_per_card: 2, exhaust_on_use: self}))}

	}
}

class DecoyArrow extends MarketCard {
	get_actions(playarea) {
		return {'SHOOT DECOY 3+': DecoyAction (self, playarea, __kwargtrans__ ({base_allowance: 3, value_per_card: 2, exhaust_on_use: self}))}

	}
}

class SmokeBomb extends MarketCard {
	get_actions(playarea) {
		return {'SMOKE BOMB': SmokeBombAction (self, playarea, __kwargtrans__ ({base_allowance: 3, value_per_card: 2, exhaust_on_use: self}))}

	}
}

class Lure extends MarketCard {
}

class BasicMove extends StartPlayerCard {
	get_actions(playarea) {
		return {'MOVE 1.5+': MoveAction (self, playarea, __kwargtrans__ ({base_allowance: 1.5, value_per_card: 1.5}))}

	}
}

class BasicAttack extends StartPlayerCard {
	get_actions(playarea) {
		return {'ATTACK 1+': FightAction (self, playarea, __kwargtrans__ ({base_allowance: 2}))}

	}
}

class BasicClimb extends StartPlayerCard {
	get_actions(playarea) {
		return {'CLIMB 1': ClimbAction (self, playarea)}

	}
}

class BasicSneak extends StartPlayerCard {
	get_actions(playarea) {
		return {'SNEAK 1+': MoveAction (self, playarea, __kwargtrans__ ({base_allowance: 1, value_per_card: 1, base_noise: 0, noise_per_stack: 0}))}

	}
}

class BasicKockout extends StartPlayerCard {
	get_actions(playarea) {
		return {'KNOCKOUT': KnockoutAction (self, playarea)}

	}
}

class BasicArrow extends StartPlayerCard {
	get_actions(playarea) {
		return {'SHOOT ARROW 3': ArrowAction (self, playarea, __kwargtrans__ ({base_allowance: 3, value_per_card: 2, exhaust_on_use: self}))}

	}
}

class BasicLockpick extends StartPlayerCard {
	get_actions(playarea) {
		return {'LOCKPICK 1+': LockpickAction (self, playarea, __kwargtrans__ ({base_allowance: 1}))}

	}
}

class EfficientMove extends SkillCard {
	get_actions(playarea) {
		return {'MOVE 2+': MoveAction (self, playarea, __kwargtrans__ ({base_allowance: 2, value_per_card: 2}))}

	}
}

class EfficientAttack extends SkillCard {
	get_actions(playarea) {
		return {'ATTACK 2+': FightAction (self, playarea, __kwargtrans__ ({base_allowance: 2}))}

	}
}

class EfficientClimb extends SkillCard {
	get_actions(playarea) {
		return {'CLIMB 1.5': ClimbAction (self, playarea)}

	}
}

class EfficientSneak extends SkillCard {
	get_actions(playarea) {
		return {'SNEAK 1.5+': MoveAction (self, playarea, __kwargtrans__ ({base_allowance: 1, value_per_card: 1.5, base_noise: 0, noise_per_stack: 0}))}

	}
}

class EfficientKockout extends SkillCard {
	get_actions(playarea) {
		return {'KNOCKOUT': KnockoutAction (self, playarea)}

	}
}

class EfficientArrow extends SkillCard {
	get_actions(playarea) {
		return {'SHOOT ARROW 5': ArrowAction (self, playarea, __kwargtrans__ ({base_allowance: 5, value_per_card: 2, exhaust_on_use: self}))}

	}
}

class EfficientLockpick extends SkillCard {
	get_actions(playarea) {
		return {'LOCKPICK 2+': LockpickAction (self, playarea, __kwargtrans__ ({base_allowance: 2}))}

	}
}

class Mission extends Card {
	mission_level = 1;
	constructor(kwargs) {
        super();
		for (var k of kwargs) {
			this[k] = kwargs[k];
		}
	}
	setup_events() {
		// pass;
	}
	setup_map() {
		// pass;
	}
}

class ContactMission extends Mission {
	setup_events(playarea) {
		var events = make_event_cards (playarea);
		shuffle (events);
		return events;
	}
	setup_map(playarea) {
		var __left0__ = playarea.map_card_grid_size;
		var w = __left0__ [0];
		var h = __left0__ [1];
		var map_cards = [];
		var lev_add_on = Math.min (this.mission_level / playarea.map_size [0], 2);
		var lev_thresh = playarea.map_size [0] - __mod__ (this.mission_level, playarea.map_size [0]);
		for (var y = 0; y < playarea.map_size [1]; y++) {
			for (var x = 0; x < playarea.map_size [0]; x++) {
				var lev = (1 + x / 2) + (x >= lev_thresh) * lev_add_on;
				map_cards.append (CityMap (__kwargtrans__ ({pa: playarea, w: w, h: h, cardLevel: lev})));
			}
		}
		return map_cards;
	}
}

class DeliveryMission extends Mission {
	mission_level = 1;
	setup_events() {
		// pass;
	}
	setup_map() {
		// pass;
	}
}
class AssassinMission extends Mission {
	mission_level = 1;
	setup_events() {
		// pass;
	}
	setup_map() {
		// pass;
	}
}

function make_map_cards(pa, w, h, n) {
	return (function () {
		var __accu0__ = [];
		for (var m of MapCard.__subclasses__ ()) {
			for (var i = 0; i < n; i++) {
				__accu0__.append (m (__kwargtrans__ ({pa: pa, w: w, h: h})));
			}
		}
		return __accu0__;
	}) ();
};
function make_event_cards(pa) {
	return (function () {
		var __accu0__ = [];
		for (var m of EventCard.__subclasses__ ()) {
			for (var i = 0; i < 3; i++) {
				__accu0__.append (m (__kwargtrans__ ({pa: pa})));
			}
		}
		return __accu0__;
	}) ();
};
function make_skill_cards(pa) {
	return (function () {
		var __accu0__ = [];
		for (var h of SkillCard.__subclasses__ ()) {
			for (var j = 0; j < 10; j++) {
				__accu0__.append (h (__kwargtrans__ ({pa: pa})));
			}
		}
		return __accu0__;
	}) ();
};
function make_loot_cards(pa) {
	return (function () {
		var __accu0__ = [];
		for (var i = 0; i < 3; i++) {
			__accu0__.append ((function () {
				var __accu1__ = [];
				for (var h of LootCard.__subclasses__ ()) {
					for (var j = 0; j < 10; j++) {
						__accu1__.append (h (__kwargtrans__ ({pa: pa})));
					}
				}
				return __accu1__;
			}) ());
		}
		return __accu0__;
	}) ();
};
function make_market_cards(pa) {
	return (function () {
		var __accu0__ = [];
		for (var h of MarketCard.__subclasses__ ()) {
			for (var i = 0; i < 20; i++) {
				__accu0__.append (h (__kwargtrans__ ({pa: pa})));
			}
		}
		return __accu0__;
	}) ();
};
function make_player_cards(pa) {
	return (function () {
		var __accu0__ = [];
		for (var m of StartPlayerCard.__subclasses__ ()) {
			for (var i = 0; i < 2; i++) {
				__accu0__.append (m (__kwargtrans__ ({pa: pa})));
			}
		}
		return __accu0__;
	}) () + (function () {
		var __accu0__ = [];
		for (var m of [DecoyArrow, RopeArrow, GasArrow, SmokeBomb, DimmerArrow]) {
			__accu0__.append (m (__kwargtrans__ ({pa: pa})));
		}
		return __accu0__;
	}) ();
};
function make_trait_cards(pa) {
	return (function () {
		var __accu0__ = [];
		for (var m of [MoveTrait, FightTrait]) {
			__accu0__.append (m (__kwargtrans__ ({pa: pa})));
		}
		return __accu0__;
	}) ();
};
