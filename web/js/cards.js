// Transcrypt'ed from Python, 2022-11-25 10:51:43

function dist(pos1, pos2) {
	var dx = Math.abs(pos1 [0] - pos2 [0]);
	var dy = Math.abs(pos1 [1] - pos2 [1]);
	return Math.max(dx, dy) + 0.5 * Math.min(dx, dy);
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
		if(Math.abs(y2 - y1) == 0 && Math.abs(x2 - x1) == 0) {
			return ;
		}
		if(Math.abs(y2 - y1) > Math.abs(x2 - x1)) {
			var slope = (x2 - x1) / (y2 - y1);
			if(y1 > y2) {
				[y1,y2] = [y2, y1];
				[x1,x2] = [x2, x1];
			}
			for(var y = y1 + 1; y < y2; y++) {
				var x = Math.round((x1 + (y - y1) * slope));
				yield [x, y];
			}
		}
		else {
			var slope = (y2 - y1) / (x2 - x1);
			if(x1 > x2) {
				[y1,y2] = [y2, y1];
				[x1,x2] = [x2, x1];
			}
			for(var x = x1 + 1; x < x2; x++) {
				var y = Math.round((y1 + (x - x1) * slope));
				yield [x, y];
			}
		}
	}
	*iter_types_between(pos1, pos2, types) {
		for(var pos of this.iter_between(pos1, pos2)) {
			if(types.includes(this.get(pos))) {
				yield pos;
			}
		}
	}
	has_types_between(pos1, pos2, types) {
		for(var pos of this.iter_types_between(pos1, pos2, types)) {
			return true;
		}
		return false;
	}
	*iter_all(sub_rect=null) {
		if(sub_rect !== null) {
			for(var x = sub_rect [0]; x < Math.min(this.w, sub_rect [0] + sub_rect [2]); x++) {
				for(var y = sub_rect [1]; y < Math.min(this.h, sub_rect [1] + sub_rect [3]); y++) {
					yield [x, y];
				}
			}
		}
		else {
			for(var x = 0; x < this.w; x++) {
				for(var y = 0; y < this.h; y++) {
					yield [x, y];
				}
			}
		}
	}
	*iter_types(types, sub_rect) {
		for(var pos of this.iter_all(sub_rect)) {
			if(types.includes(this.get(pos))) {
				yield pos;
			}
		}
	}
	*iter_in_range(pos, radius) {
		var x, y;
		[x, y] = pos;
		if(radius == null) radius = 3;
		var rad = Math.ceil(radius);
		for(var xoff = -(rad); xoff < rad + 1; xoff++) {
			for(var yoff = -(rad); yoff < rad + 1; yoff++) {
				if(xoff * xoff + yoff * yoff <= radius * radius) {
					var x0 = x + xoff;
					var y0 = y + yoff;
					if((0 <= y0 && y0 < this.h) && (0 <= x0 && x0 < this.w)) {
						yield [x0, y0];
					}
				}
			}
		}
	}
	*iter_types_in_range(pos, types, radius, blocker_types=null) {
		for(var pos0 of this.iter_in_range(pos, radius)){
			if(blocker_types !== null && this.has_types_between(pos, pos0, blocker_types)) continue;
			if(types.includes(this.get(pos0))) yield pos0;
		}
	}
	num_in_range(pos, types, radius, blocker_types=null) {
		var num = 0;
		for(var pos0 of this.iter_types_in_range(pos, types, radius, blocker_types)) {
			num++;
		}
		return num;
	}
	*iter_rect(rect, must_fit=true) {
		if(must_fit && (rect.x < 0 || rect.y < 0 || rect.right > this.w || rect.bottom > this.h)) {
			return ;
		}
		var xl = Math.max(x, 0);
		var xu = Math.min(x + w, this.w);
		var yl = Math.max(y, 0);
		var yu = Math.min(y + h, this.h);
		for(var x0 = xl; x0 < xu; x0++) {
			for(var y0 = yl; y0 < yu; y0++) {
				yield [x0, y0];
			}
		}
	}
	num_in_rect(pos, size, targets, must_fit=true) {
		num = 0;
		for(var pos of this.iter_rect(pos, size, must_fit)) {
			if(targets.includes(this.get(pos))) num++;
		}
		return num;
	}
}


class MapCard extends Widget {
	cardLevel = 1;
	building_types = ['B','B0'];
	faceUp = true;
	outlineColor = colorString([0.3,0.3,0.3]);
	constructor(rect, properties=null) {
		super(rect);
		this.processTouches=true;
		this.updateProperties(properties);
		}
	draw() {
		let app = App.get();
		if(!this.faceUp) {
			super.draw();
			return;
		}
        let rr = this.rect;
		let size = [1 - 1.0/app.tileSize,1 - 1.0/app.tileSize];
//        var size = [rr.w / this.w - 1, rr.h / this.h - 1];
        let color0 = colorString([0,0,0]);
        for(var pos of this.map.iter_all()) {
			var i,j;
			[i,j] = pos;
            var color = colorString(this.building_codes[this.map.get([i,j])][1]);
            var x = rr.x + (i * rr.w) / this.w;
            var y = rr.y + (j * rr.h) / this.h;
			app.ctx.beginPath();
            app.ctx.rect(x, y, size[0], size[1]);
            var tile = this.map.get([i, j]);
            if(!this.building_types.includes(tile)) {
                app.ctx.fillStyle = color;
                app.ctx.fill();    
            } 
            else {
//				let s = size;
                var s = [size[0] + 1.0/app.tileSize, size[1] + 1.0/app.tileSize];
                app.ctx.fillStyle = color;
                app.ctx.fill();    
				app.ctx.strokeStyle = color0;
				app.ctx.lineWidth = 1.0/app.tileSize;
				var cx = x + s [0] / 2;
                var cy = y + s [1] / 2;
                var adj = [...this.map.iter_types_in_range([i, j], this.building_types, 1)]
                var tl=0,tr=0,bl=0,br=0;
				if(this.building_types.includes(this.map.get([i+1,j]))) {
					tr+=this.building_types.includes(this.map.get([i,j+1]));
					br+=this.building_types.includes(this.map.get([i,j-1]));
//                if(adj.includes([i+1,j])) {
					app.ctx.beginPath();
                    app.ctx.moveTo(cx,cy);
                    app.ctx.lineTo(x+s[0], cy);
                    app.ctx.stroke();
//                    tr += adj.includes([i,j+1]);
//                    br += adj.includes([i,j-1]);
                }
                else {
                    br++;
                    tr++;
                }
//                if(adj.includes([i-1,j])) {
				if(this.building_types.includes(this.map.get([i-1,j]))) {
					tl+=this.building_types.includes(this.map.get([i,j+1]));
					bl+=this.building_types.includes(this.map.get([i,j-1]));
					app.ctx.beginPath();
                    app.ctx.moveTo(cx,cy);
                    app.ctx.lineTo(x, cy);
                    app.ctx.stroke();
                    // tl += adj.includes([i,j+1]);
                    // bl += adj.includes([i,j-1]);
                }
                else {
                    bl++;
                    tl++;
                }
//                if(adj.includes([i,j+1])) {
				if(this.building_types.includes(this.map.get([i,j+1]))) {
					tr+=this.building_types.includes(this.map.get([i+1,j]));
					tl+=this.building_types.includes(this.map.get([i-1,j]));
					app.ctx.beginPath();
                    app.ctx.moveTo(cx,cy);
                    app.ctx.lineTo(cx, y+s[1]);
                    app.ctx.stroke();
                    // tr+=addj,includes([i+1,j]);
                    // tl+=addj,includes([i-1,j]);
                }
                else {
                    tl++;
                    tr++;
                }
//                if(adj.includes([i, j - 1])) {
				if(this.building_types.includes(this.map.get([i,j-1]))) {
					br+=this.building_types.includes(this.map.get([i+1,j]));
					bl+=this.building_types.includes(this.map.get([i-1,j]));
					app.ctx.beginPath();
                    app.ctx.moveTo(cx,cy);
                    app.ctx.lineTo(cx, y);
                    app.ctx.stroke();
//                    br+=adj.includes([i+1,j]);
//                    bl+=adj.includes([i-1,j]);
                }
                else {
                    bl++;
                    br++;
                }
                if(bl == 2) {
					app.ctx.beginPath();
                    app.ctx.moveTo(cx,cy);
                    app.ctx.lineTo(x, y);
                    app.ctx.stroke();
                }
                if(br == 2) {
					app.ctx.beginPath();
                    app.ctx.moveTo(cx,cy);
                    app.ctx.lineTo(x+s[0], y);
                    app.ctx.stroke();
                }
                if(tr == 2) {
					app.ctx.beginPath();
                    app.ctx.moveTo(cx,cy);
                    app.ctx.lineTo(x+s[0], y+s[1]);
                    app.ctx.stroke();
                }
                if(tl == 2) {
					app.ctx.beginPath();
                    app.ctx.moveTo(cx,cy);
                    app.ctx.lineTo(x, y+s[1]);
                    app.ctx.stroke();
                }
            }
        }
        app.ctx.fillStyle = colorString([0.8,0.8,0.2]);
        for(var [i, j] of this.lights) {
            var x = rr.x + ((i + 0.4) * rr.w) / this.w;
            var y = rr.y + ((j + 0.4) * rr.h) / this.h;
			app.ctx.beginPath();
            app.ctx.rect(x, y, size[0]/5, size[1]/5);
            app.ctx.fill();    
        }
        app.ctx.fillStyle = colorString([0.9,0.0,0.0]);
        for(var [i, j] of this.spawns) {
            var x = rr.x + ((i + 0.4) * rr.w) / this.w;
            var y = rr.y + ((j + 0.4) * rr.h) / this.h;
			app.ctx.beginPath();
            app.ctx.rect(x, y, size[0]/5, size[1]/5);
            app.ctx.fill();    
        }
        app.ctx.fillStyle = colorString([0.6,0.0,0.0]);
        for(var [i, j] of this.waypoints) {
            var x = rr.x + ((i + 0.4) * rr.w) / this.w;
            var y = rr.y + ((j + 0.4) * rr.h) / this.h;
			app.ctx.beginPath();
            app.ctx.rect(x, y, size[0]/5, size[1]/5);
            app.ctx.fill();    
        }
		if(this.outlineColor!=null) {
			app.ctx.beginPath();
			app.ctx.rect(this.x, this.y, this.w, this.h);
			app.ctx.strokeStyle = this.outlineColor;
			app.ctx.stroke();
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
					'L1': ['Lit Pavement', light(lit, unlit, 0.66)], 
					'L2': ['Lit Pavement', light(lit, unlit, 0.33)], 
					'L3': ['Lit Pavement', light(lit, unlit, 0.15)], 
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
	get(pos) {
		return this.map.get(pos);
	}
	make_map(){
		this.map = new Map(this.w, this.h);
		var density = 0.2+Math.random()*0.55 + 0.05 * this.cardLevel;
		var filled_area = 0;
		var filled_borders = [0, 0, 0, 0];
		var i = 0;
		while(filled_area < (density * this.w) * this.h && i < 100) {
			var orient = getRandomInt(2);
			if(orient == 0) {
				var size = [getRandomInt(2, (this.w - filled_borders [0]) - filled_borders [1]), 1];
			}
			else {
				var size = [1, getRandomInt(2, (this.h - filled_borders [2]) - filled_borders [3])];
			}
			var x = getRandomInt(filled_borders [0], this.w - size [0]);
			var y = getRandomInt(filled_borders [2], this.h - size [1]);
			filled_area += this.place_building([x, y], size, filled_borders);
			i++;
		}
		this.add_lights();
		this.add_spawns();
		this.add_waypoints();
		this.add_targets();
		this.add_markets();
	}
	clamp(pos) {
		return [Math.max(Math.min(pos [0], this.w - 1), 0), Math.max(Math.min(pos [1], this.h - 1), 0)];
	}
	is_adj(pos) {
        var x0,y0;
        [x0,y0] = pos
		for(var [x, y] of [[x0 - 1, y0 - 1], [x0 + 1, y0 - 1], [x0 - 1, y0 + 1], [x0 + 1, y0 + 1]]) {
			if(x < 0 || x >= this.w || y < 0 || y >= this.h) continue;
			if(this.map.get([x,y]) != 'U') return true;
		}
		return false;
	}
	place_building(pos, size, filled_borders, shape='R', orientation=0) {
		if(shape == 'R') {
			for(var x = pos [0]; x < pos [0] + size [0]; x++) {
				for(var y = pos [1]; y < pos [1] + size [1]; y++) {
					if(this.map.num_in_range([x,y], ['B'],  1.5) > 1) return 0;
				}
			}
			for(var r = pos [1]; r < pos [1] + size [1]; r++) {
				if(r == 0) {
					filled_borders [2] = 1;
				}
				if(r == this.h - 1) {
					filled_borders [3] = 1;
				}
				for(var c = pos [0]; c < pos [0] + size [0]; c++) {
					if(c == 0) {
						filled_borders [0] = 1;
					}
					if(c == this.w - 1) {
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
		for(var p of this.map.iter_types(['U'], [1, 1, this.map.w - 1, this.map.h - 1])) {
			var n = this.map.num_in_range(p, ['U'], 2, ['B']);
			if(n > bestn) {
				var bestp = [p];
				var bestn = n;
			}
			else if(n == bestn) {
				bestp.push(p);
			}
		}
		return bestp;
	}
	add_lights() {
		this.lights = [];
		var num_lights = getRandomInt(1, this.cardLevel+1);
		for(var i = 0; i < num_lights; i++) {
			var best_lightables = this.get_best_lightables();
			if(best_lightables.length == 0) break;
			this.lights.push(choose(best_lightables));
			this.light_map(this.lights, false);
		}
	}
	light_map(lights, reset=true) {
		if(reset) {
			for(var p of this.map.iter_all()) {
				if(this.map.get(p)[0] =='L') {
					this.map.set(p,'U');
				}
			}
		}
		for(var l of lights) {
			for(var pos of this.map.iter_types_in_range(l, ['U'], 2, ['B'])) {
				var d = dist(pos, l);
				this.map.set(pos,'L'+Math.floor(d).toString());
			}
		}
	}
    add_spawns() {
		this.spawns = [];
		var num_spawns = getRandomInt(this.cardLevel, this.cardLevel + 2);
		for(var s = 0; s < num_spawns; s++) {
			var new_spawn = null;
			var options = [...this.map.iter_types(this.pavement, [1, 1, this.map.w - 1, this.map.h - 1])];
			shuffle(options);
            new_spawn = options.find(pos => this.spawns.length==0 || Math.min(...this.spawns.map(p=>dist(p, pos)))>6-this.cardLevel);
			if(new_spawn != null) this.spawns.push(new_spawn);
			else break;
		}
	}
	add_waypoints() {
		this.waypoints = [];
		var num_waypoints = ((4 + this.cardLevel) - this.spawns.length) - getRandomInt(2);
		for(var s = 0; s < num_waypoints; s++) {
			var new_wp = null;
			var options = [...this.map.iter_types(this.pavement, [1, 1, this.map.w - 1, this.map.h - 1])];
			shuffle(options);
            new_wp = options.find(pos => this.spawns.length+this.waypoints.length==0 || Math.min(...[...this.spawns,...this.waypoints].map(p=>dist(p, pos)))>3);
			if(new_wp != null) this.waypoints.push(new_wp);
			else break;
		}
	}
	add_targets(){
		this.targets = [];
		var num_targets = getRandomInt(1, 3);
		for(var s = 0; s < num_targets; s++) {
			var new_target = null;
			var options = [...this.map.iter_types('B', [1, 1, this.map.w - 1, this.map.h - 1])];
			shuffle(options);
            new_target = options.find(pos => this.targets.length==0 || Math.min(...this.targets.map(p=>dist(p, pos)))>5);
			if(new_target != null) this.targets.push(new_target);
            else break;
		}
	}
	add_markets() {
		this.markets = [];
		var num_markets = choose([0, 0, 1]);
		for(var s = 0; s < num_markets; s++) {
			var new_market = null;
			var options = [...this.map.iter_types('B', [1, 1, this.map.w - 1, this.map.h - 1])];
			shuffle(options);
            new_market = options.find(pos => this.markets.length==0 || Math.min(...this.markets.map(p=>dist(p, pos)))>5);
			if(new_market != null) this.markets.push(new_market);
            else break;
		}
	}
}

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

class PlayerAction {
	value_per_card = 1;
	base_allowance = 1;
	base_noise = 1;
	noise_per_stack = 0;
	tap_on_use = null;
	exhaust_on_use = null;
	spent = 0;
	constructor(card, props = {}) {
		this.card = card;
		for(let p in props) this[p] = props[p];
	}
	activate(message, props ={}) {
		App.get().playerprompt.text = 'Default action handler. You should not see this text.';
	}
	cards_unused() {
		var num_stacked_cards =  App.get().activecardsplay.children.length - 1;
		if(this.spent == 0) {
			return num_stacked_cards + 1;
		}
		else if(this.spent < this.base_allowance) {
			return num_stacked_cards;
		}
		else {
			return Math.floor((this.value_allowance() - this.spent) / this.value_per_card);
		}
	}
	value_allowance() {
		let num_stacked_cards = App.get().activecardsplay.children.length - 1;
		return this.base_allowance + this.value_per_card * num_stacked_cards;
	}
	rounded_remain() {
		return((this.value_allowance() - this.spent) / 0.5) / 2;
	}
	noise_made() {
		return this.base_noise + this.noise_per_stack * ((App.get().activecardsplay.children.length - 1) - this.cards_unused());
	}
}

class MoveAction extends PlayerAction {
	cloaked = false;
	constructor(card, props) {
		super(card, {});
		for(let p in props) this[p] = props[p];
	}
	activate(message, props ={}) {
		var playarea = App.get();
		var board = playarea.board;
		if(message == 'card_action_end') {
			if(this.cloaked) board.active_player_token.state = 'normal';
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), 
				this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if(message == 'can_stack') {
			return true;
		}
		if(message == 'map_choice_selected') {
			var obj = props ['touch_object'];
			this.spent += dist(obj.map_pos, board.active_player_token.map_pos);
			board.alert_nearby_guards(this.base_noise);
			board.active_player_token.map_pos = obj.map_pos;
		}
		else if(message == 'card_action_selected') {
			if(this.cloaked) board.active_player_token.state = 'cloaked';
			this.spent = 0;
		}
		var moves_left = this.value_allowance() - this.spent;
		var spots = []

		if(!(board.active_player_clashing())) {
			var pp = board.active_player_token.map_pos;
			var spots = board.walkables(pp, moves_left, {});
		}
		board.map_choices = spots.filter(p=>pp[0]!=p[0]||pp[1]!=p[1])
				.map(p=>board.make_choice(p, this, set_choice_type(p, pp, board)));
		if(board.map_choices.length < 1 && this.spent > 0) {
			if(this.cloaked) board.active_player_token.state = 'normal';
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = `Move ${this.rounded_remain()}: Touch the highlighted board spaces to move across the map.`;
		}
	}
}

class GlideAction extends PlayerAction {
	activate(message, props ={}) {
		var playarea = App.get();
		var board = playarea.board;
		if(message == 'card_action_end') {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if(message == 'can_stack') {
			return false;
		}
		if(message == 'map_choice_selected') {
			var obj = props ['touch_object'];
			this.spent += dist(obj.map_pos, board.active_player_token.map_pos);
			board.alert_nearby_guards(this.base_noise);
			board.active_player_token.map_pos = obj.map_pos;
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		else if(message == 'card_action_selected') {
			this.spent = 0;
		}
		var spots = [];
		var pp = board.active_player_token.map_pos;
		if(!(board.active_player_clashing())) {
			if(board.building_types.includes(board.get(board.active_player_token.map_pos))) {
				var spots = [...board.iter_types_in_range(board.active_player_token.map_pos, 
								board.building_types, this.value_allowance())]
								.filter(p=>board.has_types_between(p, pp, board.path_types));
			}
			else {
				var spots = [];
			}
		}
		board.map_choices = spots.filter(p=>p!=pp).map(p=>board.make_choice(p, this, set_choice_type(p, pp, board, this.value_allowance() + 1)));
		if(board.map_choices.length < 1 && this.spent > 0) {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = `Glide ${this.rounded_remain()}: Touch the highlighted board spaces to move building to building.`;
		}
	}
}

class FightAction extends PlayerAction {
	can_loot = true;
	activate(message, props ={}) {
		var playarea = App.get();
		var board = playarea.board;
		if(message == 'card_action_end') {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if(message == 'can_stack') {
			return true;
		}
		if(message == 'map_choice_selected') {
			var obj = props ['touch_object'];
			obj.token.state = 'dead';
			this.spent++;
			board.token_update();
			let c,p;
			[c,p] = board.get_card_and_pos(board.active_player_token.map_pos);
			for(var g of board.iter_tokens('G')) {
				if(g.state == 'dozing') {
					if(board.get_card_and_pos(g.map_pos) [0] == c) {
						g.state = 'alert';
					}
				}
			}
			if(this.can_loot && !board.active_player_clashing()) {
				playarea.loot1.select_draw(1, 1);
			}
		}
		else if(message == 'card_action_selected') {
			this.spent = 0;
		}
		let guard_choices = [...board.iter_tokens('G')].
									filter(t =>  
									['dozing', 'alert'].includes(t.state)
									&& this.rounded_remain()>=1
									&& dist(board.active_player_token.map_pos, t.map_pos) == 0);
		let map_choices = guard_choices.map(t=>board.make_token_choice(t, this, 'touch'));
		board.map_choices = map_choices;
		if(board.map_choices.length < 1 && this.spent != 0) {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = `Fight ${this.rounded_remain()}: Select a highlighted guard to attack.`;
		}
	}
}

class SmokeBombAction extends PlayerAction {
	base_allowance = 1;
	activate(message, props ={}) {
		var playarea = App.get();
		var board = playarea.board;
		if(message == 'card_action_end') {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if(message == 'can_stack') {
			return true;
		}
		if(message == 'map_choice_selected') {
			let obj = props ['touch_object'];
			let guard_choices = [...board.iter_tokens('G')].filter( t=>
						['dozing', 'alert'].includes(t.state)
						&& this.rounded_remain()>=1
						&& dist(obj.map_pos, t.map_pos) == 0);
			guard_choices.map(g=>g.frozen=true);
			this.spent++;
			board.token_update();
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		else if(message == 'card_action_selected') {
			this.spent = 0;
		}
		// let guard_choices = [...board.iter_tokens('G')].filter( 
		// 	['dozing', 'alert'].includes(t.state)
		// 	&& this.rounded_remain()>=1
		// 	&& dist(board.active_player_token.map_pos, t.map_pos) == 0);
		// let map_choices = guard_choices.map(t=>board.make_token_choice(t, this, 'touch'));
		let map_choices = [board.make_choice(board.active_player_token.map_pos, this, 'touch')];
		board.map_choices = map_choices;
		if(board.map_choices.length < 1 && this.spent != 0) {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = `Fight ${this.rounded_remain()}: Select a highlighted guard to attack.`;
		}
	}
}

class ClimbAction extends PlayerAction {
	activate(message, props ={}) {
		var playarea = App.get();
		var board = playarea.board;
		if(message == 'card_action_end') {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if(message == 'can_stack') {
			return false;
		}
		if(message == 'map_choice_selected') {
			var obj = props ['touch_object'];
			board.alert_nearby_guards(this.base_noise);
			playarea.board.active_player_token.map_pos = obj.map_pos;
			this.spent = this.value_allowance();
		}
		else if(message == 'card_action_selected') {
			this.spent = 0;
		}
		var spots = [];
		if(!(board.active_player_clashing())) {
			if(['B','B0'].includes(board.get(board.active_player_token.map_pos))) {
				spots = [...board.iter_types_in_range(board.active_player_token.map_pos, board.path_types, 1)];				
			}
			else {
				spots = [...board.iter_types_in_range(board.active_player_token.map_pos, board.building_types, this.value_allowance())];				
			}
		}
		board.map_choices = spots.map(p => board.make_choice(p, this, 'touch'));
		if(this.spent >= 1) {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = `Climb ${this.rounded_remain()}: Touch the highlighted board spaces to climb an adjacent building.`;
		}
	}
}

class KnockoutAction extends PlayerAction {
	base_noise = 0;
	can_loot = true;
	grapple = false;
	alert = false;
	activate(message, props ={}) {
		var playarea = App.get();
		var board = playarea.board;
		if(message == 'card_action_end') {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if(message == 'can_stack') {
			return false;
		}
		if(message == 'map_choice_selected') {
			var obj = props ['touch_object'];
			obj.token.state = 'unconscious';
			this.spent = playarea.activecardsplay.children.length;
			board.token_update();
		}
		else if(message == 'card_action_selected') {
			this.fight = 1;
			this.spent = 0;
		}
		if(!(board.active_player_clashing()) && this.spent==0) {
			if(this.alert) {
				var guard_choices = board.tokens.filter(t=>t instanceof board.token_types['G'] && ['dozing', 'alert'].includes(t.state));
			}
			else {
				var guard_choices = board.tokens.filter(t=>t instanceof board.token_types['G'] && ['dozing', 'alert'].includes(t.state) 
								&& dist(board.active_player_token.map_pos, t.map_pos) <= 1);
			}
			board.map_choices = guard_choices.map(t=>board.make_token_choice(t, this, 'touch'));
		}
		else {
			board.map_choices = [];
		}
		if(board.map_choices.length < 1 && this.spent != 0) {
			var draw = playarea.activecardsplay.children.length;
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			var pt = board.active_player_token;
			if(board.building_types.includes(board.get(pt.map_pos))) {
				pt.map_pos = obj.token.map_pos;
			}
			else if(this.grapple) {
				obj.token.map_pos = pt.map_pos;
			}
			if(this.can_loot) {
				playarea.loot1.select_draw(1, draw);
			}
		}
		else {
			playarea.playerprompt.text = `Knockout ${this.rounded_remain()}: Select a guard to knockout.`;
		}
	}
}

class ArrowAction extends PlayerAction {
	activate(message, props ={}) {
		var playarea = App.get();
		var board = playarea.board;
		if(message == 'card_action_end') {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if(message == 'can_stack') {
			return true;
		}
		if(message == 'map_choice_selected') {
			board.alert_nearby_guards(this.base_noise);
			var obj = props ['touch_object'];
			obj.token.state = 'dead';
			this.spent = dist(board.active_player_token.map_pos, obj.token.map_pos);
			board.token_update();
		}
		else if(message == 'card_action_selected') {
			this.spent = 0;
		}
		if(!(board.active_player_clashing())) {
			let guard_choices = [...board.iter_tokens('G')].filter(t=>
				['dozing', 'alert'].includes(t.state)
				&& dist(board.active_player_token.map_pos, t.map_pos) <= this.rounded_remain()
				&& dist(board.active_player_token.map_pos, t.map_pos) > 0
				&& board.has_line_of_sight(t.map_pos, board.active_player_token.map_pos, ['B', 'B0']));
			let map_choices = guard_choices.map(t=>board.make_token_choice(t, this, 'touch'));
			board.map_choices = map_choices;
		}
		else {
			board.map_choices = [];
		}
		if(this.spent > 0) {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = `Shoot arrow ${this.rounded_remain()}: Select a guard to shoot.`;
		}
	}
}

class GasAction extends PlayerAction {
	radius = 0;
	activate(message, props ={}) {
		var playarea = App.get();
		var board = playarea.board;
		if(message == 'card_action_end') {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if(message == 'can_stack') {
			return true;
		}
		if(message == 'map_choice_selected') {
			let obj = props['touch_object'];
			let guards_affected = [...board.iter_tokens('G')].filter(t=> 
				['dozing', 'alert'].includes(t.state)
				&& dist(obj.map_pos, t.map_pos) <= this.radius);
			guards_affected.map(g=>g.state = 'unconscious');
			board.token_update();
			this.spent=this.value_allowance();
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		else if(message == 'card_action_selected') {
			this.spent = 0;
		}
		if(!(board.active_player_clashing())) {
			let pp = board.active_player_token.map_pos;
			let map_choices = [...board.iter_types_in_range(pp, board.path_types, this.value_allowance())]
							.filter(t=>board.has_line_of_sight(t, pp, board.building_types)
								&& !arrEq(board.active_player_token.map_pos, t))
							.map(t=>board.make_choice(t, this, 'touch'));
			board.map_choices = map_choices;
		}
		else {
			board.map_choices = [];
		}
		if(this.spent > 0) {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = `Shoot arrow ${this.rounded_remain()}: Select a space to shoot gas arrow.`;
		}
	}
}

class DimmerAction extends PlayerAction {
	radius = 0;
	activate(message, props ={}) {
		var playarea = App.get();
		var board = playarea.board;
		if(message == 'card_action_end') {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if(message == 'can_stack') {
			return true;
		}
		if(message == 'map_choice_selected') {
			board.alert_nearby_guards(this.base_noise);
			var obj = props ['touch_object'];
			this.spent = dist(board.active_player_token.map_pos, obj.map_pos);
			board.hide_light(obj.map_pos);
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		else if(message == 'card_action_selected') {
			this.spent = 0;
		}
		if(!(board.active_player_clashing())) {
			let pp = board.active_player_token.map_pos;
			let map_choices = [...board.iter_lights()]
							.filter(p=>dist(p,pp)<=this.value_allowance()
							&& board.has_line_of_sight(p, pp, board.building_types))
							.map(p=>board.make_choice(p, this, 'touch'));
			board.map_choices = map_choices;
		}
		else {
			board.map_choices = [];
		}
		if(this.spent > 0) {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = `Shoot dimmer arrow ${this.rounded_remain()}: Select a space to shoot gas arrow.`;
		}
	}
}

class LockpickAction extends PlayerAction {
	base_allowance = 1;
	can_loot = true;
	max_loot = 3;
	activate(message, props ={}) {
		var playarea = App.get();
		var board = playarea.board;
		if(message == 'card_action_end') {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if(message == 'can_stack') {
			return true;
		}
		if(message == 'map_choice_selected') {
			let obj = props ['touch_object'];
			let target = [...board.iter_tokens('T')].filter(t=>arrEq(t.map_pos,obj.map_pos));
			if(target.length > 0) {
				let t0 = target[0];
				let pick = this.value_allowance();
				board.alert_nearby_guards(this.base_noise);
				if(pick >= t0.lock_level) {
					t0.picked = true;
					board.tokens = board.tokens.filter(t=>t!=t0);
					this.spent = pick;
					if(t0.has_loot) {
						let loot_decks = [playarea.loot1, playarea.loot2, playarea.loot3];
						loot_decks [t0.loot_level - 1].select_draw(1, (1 + pick) - t0.lock_level);
						this.loot_pos = t0.map_pos;
					}
				}
			}
			else {
				board.alert_nearby_guards(this.base_noise);
				if(this.loot_pos === null) {
					this.spent = 1;
				}
				board.active_player_token.map_pos = obj.map_pos;
				playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
				return ;
			}
		}
		else if(message == 'card_action_selected') {
			this.spent = 0;
			this.loot_pos = null;
		}
		var p = board.active_player_token;
		board.map_choices = [];
		if(!(board.active_player_clashing())) {
			if(this.loot_pos !== null) {
				let move_choices = [...board.iter_types_in_range(this.loot_pos, board.path_types, 1)]
									.filter(m=>dist(this.loot_pos, m)>=1)
									.map(m=>board.make_choice(m, this, set_choice_type(m, p.map_pos, board, 3)));
				board.map_choices = move_choices;
			}
			else if(!board.building_types.includes(board [board.active_player_token.map_pos])) {
				let target_choices = [...board.iter_targets()].filter(t=>dist(p.map_pos,t)==1);
				let move_choices = [];
				for(var b of board.iter_types_in_range(p.map_pos, 'B', 1)) {
					for(var m of board.iter_types_in_range(b, board.path_types, 1)) {
						if(dist(p.map_pos, m) >= 1) {
							move_choices.push(m);
						}
					}
				}
				target_choices = [...target_choices, ...move_choices];
				let map_choices = target_choices.map(t=>board.make_choice(t, this, set_choice_type(t, p.map_pos, board, 3)));
				board.map_choices = map_choices;
			}
		}
		if(board.map_choices.length < 1 && this.spent != 0) {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = `Lockpick ${this.rounded_remain()}: Select a guard to knockout.`;
		}
	}
}

class DecoyAction extends PlayerAction {
	base_allowance = 3;
	activate(message, props ={}) {
		var playarea = App.get();
		var board = playarea.board;
		if(message == 'card_action_end') {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if(message == 'can_stack') {
			return true;
		}
		if(message == 'map_choice_selected') {
			var obj = props ['touch_object'];
			for(var t of board.tokens) {
				if(t instanceof board.token_types['G'] && ['alert', 'dozing'].includes(t.state) && (0 < dist(t.map_pos, obj.map_pos) && dist(t.map_pos, obj.map_pos) <= 10)) {
					if(!(board.has_types_between(t.map_pos, obj.map_pos, board.building_types))) {
						t.map_pos = obj.map_pos;
						if(t.state!='alert') t.state = 'alert';
						t.frozen = true;
					}
				}
			}
			this.spent = dist(obj.map_pos, board.active_player_token.map_pos);
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		else if(message == 'card_action_selected') {
			this.spent = 0;
		}
		if(!(board.active_player_clashing())) {
			let pp = board.active_player_token.map_pos;
			let place_choices = [...board.iter_types_in_range(pp, board.path_types, this.value_allowance())]
							.filter(t=>board.has_line_of_sight(t, pp, board.building_types));
			let map_choices = place_choices.map(t=>board.make_choice(t, this, 'touch'));
			board.map_choices = map_choices;
		}
		else {
			board.map_choices = [];
		}
		if(this.spent != 0) {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = `Shoot decoy ${this.rounded_remain()}: Select a tile to shoot the decoy to.`;
		}
	}
}

class MarketAction extends PlayerAction {
	base_allowance = 1;
	activate(message, props) {
		var app = App.get();
		var board = app.board;
		if(message == 'card_action_end') {
			app.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
			return ;
		}
		if(message == 'can_stack') {
			return(props['stacked_card'] instanceof TreasureCard);
		}
		if(message == 'map_choice_selected') {
			board.alert_nearby_guards(this.base_noise);
			var obj = props['touch_object'];
			var market = [...board.iter_tokens('M')].filter(t=>arrEq(t.map_pos,obj.map_pos));
			if(market.length > 0) {
				this.spent = this.value_allowance();
				this.market_pos = obj.map_pos;
				app.marketdeck.select_draw(1, 4, this.spent);
			}
			else {
				board.active_player_token.map_pos = obj.map_pos;
				app.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
				return ;
			}
		}
		else if(message == 'card_action_selected') {
			this.spent = 0;
			this.market_pos = null;
		}
		let p = board.active_player_token;
		board.map_choices = [];
		if(!(board.active_player_clashing())) {
			if(this.market_pos !== null) {
				let move_choices = [...board.iter_types_in_range(this.market_pos, board.path_types, 1)].filter(m => dist(this.market_pos, m) >= 1);
				let target_choices = [...new Set(move_choices)];
				board.map_choices = target_choices.map(t => board.make_choice(t, this, set_choice_type(t, p.map_pos, board, 3)));
			}
			else if(!board.building_types.includes(board.get(board.active_player_token.map_pos))) {
				let target_choices = [...board.iter_markets()].filter(t=>dist(p.map_pos,t)==1);
				board.map_choices = target_choices.map(t => board.make_choice(t, this, set_choice_type(t, p.map_pos, board, 3)));
			}
		}
		if(board.map_choices.length < 1 && this.spent != 0) {
			app.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			app.playerprompt.text = `Buy ${this.rounded_remain()}: Select a market card to buy.`;
		}
	}
}

class TraitCard extends Card {
	lowerText = 'TRAIT';
	tapped = false;
	exhausted = false;
	get_actions_for_card(card) {
		return {}

	}
	on_tapped(event, data) {
		this.bgColor = this.tapped? colorString([0.5,0.5,0.5]): colorString([0.2,0.2,0.2]);
		this.textColor = this.tapped? 'gray':'white';
		this.nameColor = this.tapped? 'gray':'yellow';
		this.lowerTextColor = this.tapped? 'gray':'yellow';
	}
}

class MoveTrait extends TraitCard {
	name = 'RESOLUTE';
	text = 'Once per round: play hand card as MOVE 1[+1].';
	get_actions_for_card(card, playarea) {
		if(this.tapped || this.exhausted) {
			return {};
		}
		else {
			return {'MOVE 1[+1]': new MoveAction(card, {base_allowance: 1, tap_on_use: this})};
		}
	}
}

class FightTrait extends TraitCard {
	name = 'FIGHTER';
	text = 'Once per round: play hand card as ATTACK 0.5[+0.5]. Alerts all guards on block at end of fight.';
	get_actions_for_card(card, playarea) {
		if(this.tapped || this.exhausted) {
			return {};
		}
		else {
			return {'ATTACK 0.5[+0.5]': new FightAction(card, {base_allowance: 0.5, value_per_card: 0.5, tap_on_use: this})};
		}
	}
}

class ClimbTrait extends TraitCard {
    name = 'CLIMBER'
    text = 'Once per round: play hand card as CLIMB 1.'
	get_actions_for_card(card, playarea) {
		if(this.tapped || this.exhausted) {
			return {};
		}
		else {
			return {'CLIMB 1': new ClimbAction(card, {tap_on_use: true})};
		}
	}
}

class SneakTrait extends TraitCard {
	name = 'SLINKER';
    text = 'Once per round: play hand card as SNEAK 0.5[+0.5] or KNOCKOUT 1';
	get_actions_for_card(card, playarea) {
		if(this.tapped || this.exhausted) {
			return {};
		}
		else {
			return {'KNOCKOUT 1': new KnockoutAction(card, {base_allowance: 1, tap_on_use: true})};
		}
	}
}

class LootTrait extends TraitCard {
    name = 'LOOTER';
    text = 'Once per round: play hand card as LOCKPICK 1[+1]';
	get_actions_for_card(card, playarea) {
		if(this.tapped || this.exhausted) {
			return {};
		}
		else {
			return {'LOCKPICK 1[+1]': new LockpickAction(card, {base_allowance: 1, tap_on_use: true})};
		}
	}
}

class ArcherTrait extends TraitCard {
    name = 'ARCHER';
    text = 'Once per round: fired arrows cards go to discard instead of exhausting';
	get_actions_for_card(card, playarea) {
		if(this.tapped || this.exhausted) {
			return {};
		}
		else {
			return {'ARROW 3[+2]': new ArrowAction(card, {base_allowance: 3, tap_on_use: true})};
		}
	}
}

function stack_all_fn(card) {
	return true;
};

function set_choice_type(pos1, pos2, board, dist_cap=2) {
	if(dist(pos1, pos2) < dist_cap) {
		var visible = false;
		if(!['B', 'U'].includes(board.get(pos1))) {
			visible = [...board.iter_tokens('G')].filter(g=>['alert','dozing'].includes(g.state) && !g.frozen && 
						dist(g.map_pos, pos1)<=10 && !(board.has_types_between(g.map_pos, pos1, 'B'))).length>0;
		}
		return visible? 'visible' : 'touch';
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
	lowerText = 'LOOT';
}

class SkillCard extends PlayerCard {
	lowerText = 'SKILL';
}

class TreasureCard extends LootCard {
    name = 'TREASURE';
    text = 'BUY 1[+1]: Spend 1 crown in the market';
	get_actions() {
		return {'BUY 1[+1]': new MarketAction(this, {base_allowance: 1, value_per_card: 1, exhaust_on_use: this})}
	}
}

class SkeletonKey extends LootCard {
    name = 'SKELETON KEY';
    text = 'LOCKPICK 4[+1]. Draw loot cards equal to the lockpick value minus the lock level and keep 1, discard the rest. Exhausts after use.';
	get_actions() {
		return {'LOCKPICK 4[+1]': new LockpickAction(this, {base_allowance: 4, value_per_card: 1, exhaust_on_use: this})}
	}
}

class MarketCard extends PlayerCard {
	lowerText = 'BLACK MARKET'
}

class GasArrow extends MarketCard {
    name = 'GAS ARROW';
    text = 'Arrow Range 3[+2]. KOs all enemies in the space. Exhausts after use.';
	get_actions() {
		return {'SHOOT GAS 3[+2]': new GasAction(this, {base_allowance: 3, value_per_card: 2, radius: 1, exhaust_on_use: this})}
	}
}

class RopeArrow extends MarketCard {
    name = 'ROPE ARROW';
    text = 'Climb 1.5 on top of a roof or exhaust to traverse 2 spaces from roof to roof. Exhausts after use.';
	get_actions() {
		return {'CLIMB 1.5': new ClimbAction(this, {base_allowance: 1.5, value_per_card: 1, max_height: 2}), 'TRAVERSE 2': new GlideAction(this, {base_allowance: 2, value_per_card: 1, max_height: 2, exhaust_on_use: this})}
	}
}

class DimmerArrow extends MarketCard {
    name = 'DIMMER ARROW';
    text = 'Arrow Range 3[+2]. Temporarily puts out a light in range until the event phase. Exhausts after use.';
	get_actions() {
		return {'SHOOT DIMMER 3[+2]': new DimmerAction(this, {base_allowance: 3, value_per_card: 2, exhaust_on_use: this})}
	}
}

class DecoyArrow extends MarketCard {
    name = 'DECOY ARROW';
    text = 'Arrow Range 3[+2]. Alert or dozing guards in line of sight move to targeted space then freeze. Exhausts after use.';
	get_actions() {
		return {'SHOOT DECOY 3[+2]': new DecoyAction(this, {base_allowance: 3, value_per_card: 2, exhaust_on_use: this})}
	}
}

class SmokeBomb extends MarketCard {
    name = 'SMOKE BOMB';
    text = 'Smoke 1. Enemies in your space cannot see or engage with you until the event phase. Exhausts after use.';
	get_actions() {
		return {'SMOKE BOMB': new SmokeBombAction(this, {base_allowance: 3, value_per_card: 2, exhaust_on_use: this})}
	}
}

class Lure extends MarketCard {
    name = 'LURE';
    text = 'Lure 1. Bring a solitary guard in the player\'s line of sight into your space.';
}

class Hypnotize extends MarketCard {
    name = 'HYPNOTIZE';
    text = 'Move a solitary guard engaged with you to a space up to range 3 away.';
}

class BasicMove extends StartPlayerCard {
    name = 'SWIFT';
    text = 'Move 1.5[+1.5]';
	get_actions() {
		return {'MOVE 1.5[+1.5]': new MoveAction(this, {base_allowance: 1.5, value_per_card: 1.5})}
	}
}

class BasicAttack extends StartPlayerCard {
    name = 'FIGHT';
    text = 'Attack 1[+1]. Alert all guards on block at end of fight.';
	get_actions() {
		return {'ATTACK 1[+1]': new FightAction(this, {base_allowance: 1, value_per_card: 1})}
	}
}

class BasicClimb extends StartPlayerCard {
    name = 'CLIMB';
    text = 'Climb 1';
	get_actions() {
		return {'CLIMB 1': new ClimbAction(this)}
	}
}

class BasicSneak extends StartPlayerCard {
    name = 'SNEAK';
    text = 'Sneak 1[+1]';
	get_actions() {
		return {'SNEAK 1[+1]': new MoveAction(this, {base_allowance: 1, value_per_card: 1, base_noise: 0, noise_per_stack: 0, cloaked:true})}
	}
}

class BasicKnockout extends StartPlayerCard {
    name = 'BLUDGEON';
    text = 'Knockout 1';
	get_actions() {
		return {'KNOCKOUT 1': new KnockoutAction(this)}
	}
}

class BasicArrow extends StartPlayerCard {
    name = 'ARROW';
    text = 'Arrow Range 3[+2]. Exhausts after use.';
	get_actions() {
		return {'SHOOT ARROW 3[+2]': new ArrowAction(this, {base_allowance: 3, value_per_card: 2, exhaust_on_use: this})}
	}
}

class BasicLockpick extends StartPlayerCard {
    name = 'BASIC LOCKPICK';
    text = 'Lockpick 1[+1]';
	get_actions() {
		return {'LOCKPICK 1[+1]': new LockpickAction(this, {base_allowance: 1})}
	}
}

class EfficientMove extends SkillCard {
    name = 'ELUSIVE';
    text = 'Move 2[+2]';
	get_actions() {
		return {'MOVE 2[+2]': new MoveAction(this, {base_allowance: 2, value_per_card: 2})}
	}
}

class EfficientAttack extends SkillCard {
    name = 'ATTACK';
    text = 'Attack 2[+1]. Alert all guards on block at end of fight.';
	get_actions() {
		return {'ATTACK 2[+1]': new FightAction(this, {base_allowance: 2})}
	}
}

class EfficientClimb extends SkillCard {
    name = 'CLIMB';
    text = 'Climb 1.5';
	get_actions() {
		return {'CLIMB 1.5': new ClimbAction(this)}
	}
}

class EfficientSneak extends SkillCard {
    name = 'SNEAK';
    text = 'Sneak 1[+1.5]';
	get_actions() {
		return {'SNEAK 1[+1.5]': new MoveAction(this, {base_allowance: 1, value_per_card: 1.5, base_noise: 0, noise_per_stack: 0})}
	}
}

class EfficientKnockout extends SkillCard {
    name = 'KNOCKOUT';
    text = 'Knockout enemy in range 1. Move into the opponents space if above them.';
	get_actions() {
		return {'KNOCKOUT 1': new KnockoutAction(this)}
	}
}

class EfficientArrow extends SkillCard {
    name = 'STEELHEAD ARROW';
    text = 'Arrow Range 5[+2]';
	get_actions() {
		return {'SHOOT ARROW 5[+2]': new ArrowAction(this, {base_allowance: 5, value_per_card: 2, exhaust_on_use: this})}
	}
}

class EfficientLockpick extends SkillCard {
    name = 'LOCKPICK';
    text = 'Lockpick 2[+1]';
	get_actions() {
		return {'LOCKPICK 2[+1]': new LockpickAction(this, {base_allowance: 2})}
	}
}

class Mission extends BoxLayout {
	mission_level = 1;
	title = '';
	text = '';
	id = 'mission';
	constructor(props) {
        super();
		this.children = [
			new BoxLayout(null, {hints:{h:null},
				children: [
					new Label(null, {align:'left', hints:{h:null}, text:(mission)=>mission!=null?mission.title:'', fontSize:0.75}),
					new Label(null, {align:'left', hints:{h:null}, text:(mission)=>mission!=null?mission.text:'', fontSize: 0.5})
				]})
		]
	}
	updateProps() {
		for(var k in props) {
			this[k] = props[k];
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
	title = 'Contact Mission';
	text = 'Your contact is locked inside the building marked with a gold star. Get to her!';
	setup_events() {
		var events = make_event_cards();
		shuffle(events);
		return events;
	}
	setup_map() {
		let app = App.get();
		let w,h;
		[w,h] = app.map_card_size;
		var map_cards = [];
		var lev_add_on = Math.min(this.mission_level / app.map_size[0], 2);
		var lev_thresh = app.map_size [0] - (this.mission_level % app.map_size [0]);
		for(var y = 0; y < app.map_size [1]; y++) {
			for(var x = 0; x < app.map_size [0]; x++) {
				var lev = (1 + x / 2) + (x >= lev_thresh) * lev_add_on;
				map_cards.push(new CityMap(new Rect([0,0,w,h]),{cardLevel: lev}));
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

function *repeatInstantiate(list, reps=1) {
	for(let i of list) {
		for(let r=0 ; r<reps; r++) {
			yield new i(new Rect());
		}
	}
}

function make_event_cards() {
	return [...repeatInstantiate([SpawnEvent, PatrolEvent, AlertEvent, MoveEvent], 3)];
}

function make_skill_cards() {
	return [...repeatInstantiate([EfficientMove, EfficientAttack, EfficientClimb, 
		EfficientSneak, EfficientKnockout, EfficientArrow, EfficientLockpick], 3)];
}

function make_loot_cards(level=1) {
	switch(level) {
		case 1:
			return [...repeatInstantiate([TreasureCard, SkeletonKey], 8)];
			break;
		case 2:
			return [...repeatInstantiate([TreasureCard, TreasureCard, SkeletonKey], 5)];
			break;
		case 3:
			return [...repeatInstantiate([TreasureCard, TreasureCard, GasArrow, RopeArrow, DimmerArrow, DecoyArrow, 
				SmokeBomb, Lure], 3)];
	}
}

function make_market_cards() {
	return [...repeatInstantiate([GasArrow, RopeArrow, DimmerArrow, DecoyArrow, 
		SmokeBomb, Lure], 3)];
}

function make_player_cards() {
	return [...repeatInstantiate([BasicMove],4), ...repeatInstantiate([BasicAttack, BasicClimb, BasicSneak, 
		BasicKnockout, BasicKnockout, BasicArrow], 1)];
}

function make_trait_cards() {
	return [...repeatInstantiate([MoveTrait, FightTrait])];
};

