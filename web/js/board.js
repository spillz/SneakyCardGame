class MapChoice extends BoxLayout {
	map_pos = new Vec2();
	choice_type = 'info';
	listener = null;
	constructor(rect, properties=null) {
		super(rect);
		this.updateProperties(properties);
	}
	on_touch_down(touch) {
		let r = this.renderRect();
		if (r.collidePoint(touch.pos)) {
			touch.grab (this);
			return true;
		}
	}
	on_touch_up(touch) {
		if (touch.grab_current == this) {
			touch.ungrab (this);
			if(['touch', 'visible'].includes(this.choice_type)) {
				this.listener ('map_choice_selected', {touch_object: this});
			}
			return true;
		}
	}
}

class TokenMapChoice extends BoxLayout {
	constructor(rect, properties=null) {
		super(rect);
		this.updateProperties(properties);
	}
	on_touch_down(touch) {
		let r = this.renderRect();
		if (r.collide([touch.clientX, touch.clientY,0,0])) {
			touch.grab (this);
			return true;
		}
	}
	on_touch_up(touch) {
		if (touch.grab_current == this) {
			touch.ungrab (this);
			this.listener ('map_choice_selected', {touch_object: this});
			return true;
		}
	}
}

class Board extends Widget {
	tokens = [];
	map_choices = [];
	space_size = [];
	dimW = -1;
	dimH = -1;
	token_types = {'G': GuardToken, 'P': PlayerToken, 'T': TargetToken, 'M': MarketToken};
	path_types = ['U', 'L', 'L0', 'L1', 'L2'];
	building_types = ['B', 'B0'];
	onCh() {
		let c = this.children[0];
		if(this.numX>0) {
			this.dimW = this.numW*c.w;
			this.dimH = Math.ceil(this.children.length/this.dimW)*c.h;
		}
		if(this.numY>0) {
			this.dimH = this.numH*c.h;
			this.dimW = Math.ceil(this.children.length/this.dimW)*c.w;
		}
	}
	on_addChild(event, data) {
		this.onCh();
	}
	on_removeChild(event, data) {
		this.onCh();
	}
	on_tokens() {
		//TODO: fixme -- very messy
		this.active_player_token = null;
		for (var t of this.children.__getslice__ (0, null, 1)) {
			if (isinstance (t, Token)) {
				t.unbind (__kwargtrans__ ({map_pos: this.on_token_move}));
				if (isinstance (t, GuardToken)) {
					t.unbind (__kwargtrans__ ({state: this.on_token_state}));
				}
				this.remove_widget (t);
			}
		}
		for (var t of this.tokens) {
			if (isinstance (t, Token)) {
				t.bind (__kwargtrans__ ({map_pos: this.on_token_move}));
				if (isinstance (t, GuardToken)) {
					t.bind (__kwargtrans__ ({state: this.on_token_state}));
				}
				this.add_widget (t);
				t.size = this.space_size;
			}
			if (isinstance (t, PlayerToken)) {
				this.active_player_token = t;
			}
		}
	}
	on_map_choices() {
    	//TODO: fixme -- very messy
	    for (var t of this.children.__getslice__ (0, null, 1)) {
			if (isinstance (t, MapChoice) || isinstance (t, TokenMapChoice)) {
				this.remove_widget (t);
			}
		}
		for (var t of this.map_choices) {
			if (isinstance (t, MapChoice) || isinstance (t, TokenMapChoice)) {
				this.add_widget (t);
				t.size = this.space_size;
			}
		}
		this.scroll_to_player ();
	}
	scroll_to_player() {
		//TOOD: fixme
		this.parent.scrollX = this.active_player_token.center_x-this.parent.w/2;
		this.parent.scrollY = this.active_player_token.center_y-this.parent.h/2;
	}
	on_token_move(token, mp) {
		this.token_update ();
	}
	on_token_state(token, st) {
		this.token_update ();
	}
	token_update() {
		//TODO: This seems very complicated. can it be simplified?
		let p = this.active_player_token;
		for (let t of this.iter_tokens ('G')) {
			if (t.map_pos != p.map_pos && ['dead', 'unconscious'].includes(t.state) && !(t.frozen)) {
				if ((1 <= this.dist (t.map_pos, p.map_pos) && this.dist (t.map_pos, p.map_pos) <= 10) 
				&& !(['U'] + this.building_types).includes(this [p.map_pos])) {
					if (!(this.has_types_between (t.map_pos, p.map_pos, this.building_types))) {
						t.map_pos = p.map_pos;
						t.state = 'alert';
						return ;
					}
				}
			}
		}
		for (let t of this.iter_tokens ('G')) {
			if (t.map_pos == p.map_pos || ['unconscious', 'dead'].includes(t.state) || t.frozen) continue;
			var closest = [100, null];
			for (let t0 of this.iter_tokens ('G')) {
				if (['alert', 'dozing'].includes(t0.state)) continue;
				if (t0.map_pos == p.map_pos) continue;
				let d = this.dist (t.map_pos, t0.map_pos);
				if ((1 < d && d <= 10) && !(['U'] + this.building_types).includes(this.get(t0.map_pos))) {
					if (!(this.has_types_between (t.map_pos, t0.map_pos, this.building_types))) {
						if (d < closest [0]) {
							closest = [d, t0];
						}
					}
				}
				else if (d == 0) {
					if (t.state != 'alert') {
						t.state = 'alert';
						return ;
					}
				}
			}
			let d,t0;
			[d,t0] = closest;
			if (t0 !== null && t.map_pos != t0.map_pos && t.state != 'alert') {
				t.map_pos = t0.map_pos;
				t.state = 'alert';
				return ;
			}
		}
		var clashes = {}
		for (var t0 of this.tokens) {
			for (var t1 of this.tokens) {
				if (t0 == t1) {
					continue;
				}
				if (t0.map_pos[0] == t1.map_pos[0] && t0.map_pos[1] == t1.map_pos[1]) {
					let p = t0.map_pos.toString();
					if (clashes.includes(p)) {
						if(!clashes.find(t0)) clashes[p] = t0;
						if(!clashes.find(t1)) clashes[p] = t1;
					}
					else {
						clashes [p] = [t0, t1];
					}
				}
			}
		}
		for (var t of this.tokens) {
			if (!t.map_pos.toString() in clashes) t.off = [0, 0];
		}
		//TODO: FIXME, no zip, __slice__
		for (let c of clashes) {
			for (var [t, o] of zip (clashes[c], [[-(0.25), -(0.25)], [0.25, 0.25], [-(0.25), 0.25], [0.25, -(0.25)]].__getslice__ (0, len (clashes [p]), 1))) {
				t.off = o;
			}
		}
		this.scroll_to_player ();
	}
	get(pos) {
		let card, card_pos;
		[card, card_pos] = this.get_card_and_pos (pos);
		return card.map[card_pos];
	}
	get_card_and_pos(pos) {
		let x,y;
		[x,y] = pos;
		var card_x = Math.floor (x / this.map_card_grid_size [0]);
		var card_y = Math.floor (y / this.map_card_grid_size [1]);
		var card_ind = card_x + card_y * this.map.cols;
		var card = this.map.cards [card_ind];
		var card_pos = [x - card_x * this.map_card_grid_size [0], y - card_y * this.map_card_grid_size [1]];
		return [card, card_pos];
	}
	get_pos_from_card(card, pos=[0,0]) {
		let x,y;
		[x,y] = pos;
		var card_ind = this.map.children.indexOf(card);
		var card_y = Math.floor (card_ind / this.map.numW);
		var card_x = card_ind - card_y * this.map.numW;
		[x,y] = [x + card_x * card.w, y + card_y * card.h];
		return [x, y];
	}
	*iter_between(pos1, pos2, off1, off2) {
		let x1,y1,x2,y2,ox1,oy1,ox2,oy2;
		pos1 = new Vec2(pos1);
		pos2 = new Vec2(pos2);
		off1 = new Vec2(off1);
		off2 = new Vec2(off2);
		[x1,y1]=pos1;
		[x2,y2]=pos2;
		[ox1,oy1]=off1;
		[ox2,oy2]=off2;
		[x1,y1]=pos1.add(off1);
		[x2,y2]=pos2.add(off1);
		if (Math.abs(y2 - y1) == 0 && Math.abs(x2 - x1) == 0) return;
		if (Math.abs(y2a - y1a) == 0 && Math.abs(x2a - x1a) == 0) return;
		if (Math.abs(y2a - y1a) > Math.abs(x2a - x1a)) {
			var slope = (x2a - x1a) / (y2a - y1a);
			if (y1a > y2a) {
				[y1,y2] = [y2,y1];
				[x1,x2] = [x2,x1];
				[y1a,y2a] = [y2a,y1a];
				[x1a,x2a] = [x2a,x1a];
			}
			var y = int (y1);
			while (y < y2) {
				var yo = y + 0.5;
				var xo = x1a + (yo - y1a) * slope;
				var x = int (xo);
				if (xo - x <= 0.5) {
					if ((0 <= x && x < this.w)) {
						yield [x, y];
						yield [x, y + 1];
					}
				}
				if (xo - x >= 0.5) {
					if ((0 <= x + 1 && x + 1 < this.w)) {
						yield [x + 1, y];
						yield [x + 1, y + 1];
					}
				}
				y++;
			}
		}
		else {
			var slope = (y2a - y1a) / (x2a - x1a);
			if (x1a > x2a) {
				[y1,y2] = [y2,y1];
				[x1,x2] = [x2,x1];
				[y1a,y2a] = [y2a,y1a];
				[x1a,x2a] = [x2a,x1a];
			}
			var x = int (x1);
			while (x < x2) {
				var xo = x + 0.5;
				var yo = y1a + (xo - x1a) * slope;
				var y = int (yo);
				if (yo - y <= 0.5 + 0.0001) {
					if ((0 <= y && y < this.h)) {
						yield [x, y];
						yield [x + 1, y];
					}
				}
				if (yo - y >= 0.5 - 0.0001) {
					if ((0 <= y + 1 && y + 1 < this.h)) {
						yield [x, y + 1];
						yield [x + 1, y + 1];
					}
				}
				x++;
			}
		}
		}
	*iter_types_between(pos1, pos2, types, off1, off2) {
		for (var pos of this.iter_between (pos1, pos2, off1, off2)) {
			if (types.includes(this[pos])) yield pos;
		}
	}
	has_types_between(pos1, pos2, types) {
		var bases = [pos1, pos2];
		for (var pos of this.iter_types_between (pos1, pos2, types)) {
			if (bases.includes(pos)) continue;
			return true;
		}
		return false;
	}
	has_line_of_sight(pos1, pos2, types) {
		var bases = [pos1, pos2];
		var e = 0.5;
		for (var add1 of [[-(e), -(e)], [-(e), e], [e, -(e)], [e, e]]) {
			for (var add2 of [[-(e), -(e)], [-(e), e], [e, -(e)], [e, e]]) {
				var blockers = this.iter_types_between (pos1, pos2, types, add1, add2).filter(p=>!bases.includes(p));
				if (blockers.length == 0) return true;
			}
		}
		return false;
	}
	*iter_all(sub_rect=null) {
		if (sub_rect !== null) {
			for (var x = sub_rect [0]; x < Math.min(this.dimW, sub_rect [0] + sub_rect [2]); x++) {
				for (var y = sub_rect [1]; y < Math.min(this.h, sub_rect [1] + sub_rect [3]); y++) {
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
	*iter_types(types, sub_rect=null) {
		for (var [x0, y0] of this.iter_all (sub_rect)) {
			if(types.includes(this.get([x0,y0]))) yield [x0, y0];
		}
	}
	*iter_in_range(pos, radius=3) {
		let x,y;
		[x,y] = pos;
		var rad = math.ceil (radius);
		for (var xoff = -(rad); xoff < rad + 1; xoff++) {
			for (var yoff = -(rad); yoff < rad + 1; yoff++) {
				if (Math.max(Math.abs(xoff), Math.abs(yoff)) + 0.5 * Math.min(Math.abs(xoff), Math.abs(yoff)) <= radius) {
					var x0 = x + xoff;
					var y0 = y + yoff;
					if ((0 <= y0 && y0 < this.h) && (0 <= x0 && x0 < this.dimW)) {
						yield [x0, y0];
					}
				}
			}
		}
		}
	*iter_types_in_range(pos, types, radius=3, blocker_types=null) {
		for (var pos0 of this.iter_in_range (pos, radius)) {
			if (blocker_types !== null && this.has_types_between (pos, pos0, blocker_types)) continue;
			if (types.includes(this.get(pos0))) yield pos0;
		}
		}
	*iter_tokens(token_type=null) {
		if (token_type === null) {
			for (var t of this.tokens) {
				yield t;
			}
		}
		else {
			for (var t of this.tokens) {
				if (t instanceof this.token_types [token_type]) {
					yield t;
				}
			}
		}
		}
	active_player_clashing() {
		return [...this.iter_tokens('G')].find(g => 
			g.map_pos.toString() == this.active_player_token.map_pos.toString() 
			&& ['alert', 'dozing'].includes(g.state) && !g.frozen);
	}
	num_in_range(pos, types, radius=3, blocker_types=null) {
		return [...this.iter_types_in_range (pos, types, radius, blocker_types)].reduce(p,c => p+c)
	}
	*iter_rect(pos, size, must_fit=true) {
		let x,y,w,h;
		[x,y] = pos;
		[w,h] = size;
		if (must_fit && (x < 0 || y < 0 || x + w > this.w || y + h > this.h)) {
			return ;
		}
		var xl = Math.max(x, 0);
		var xu = Math.min(x + w, this.w);
		var yl = Math.max(y, 0);
		var yu = Math.min(y + h, this.h);
		for (var x0 = xl; x0 < xu; x0++) {
			for (var y0 = yl; y0 < yu; y0++) {
				yield [x0, y0];
			}
		}
	}
	num_in_rect(pos, size, targets, must_fit=true) {
		return [...this.iter_rect (pos, size, must_fit)].filter(p=>targets.includes(this.get(pos))).length;
	}
	make_choice(map_pos, listener, choice_type) {
		return MapChoice({map_pos: map_pos, listener: listener, choice_type: choice_type});
	}
	make_token_choice(token, listener, choice_type) {
		return TokenMapChoice({token: token, listener: listener, choice_type: choice_type});
	}
	*iter_spawns() {
		for (var c of this.map.cards) {
			for (var s of c.spawns) {
				yield this.get_pos_from_card (c, s);
			}
		}
		}
	*iter_waypoints() {
		for (var c of this.map.cards) {
			for (var w of c.spawns + c.waypoints) {
				yield this.get_pos_from_card (c, w);
			}
		}
		}
	*iter_targets() {
		for (var c of this.map.cards) {
			for (var t of c.targets) {
				yield this.get_pos_from_card (c, t);
			}
		}
		}
	*iter_markets() {
		for (var c of this.map.cards) {
			for (var m of c.markets) {
				yield this.get_pos_from_card (c, m);
			}
		}
		}
	*iter_lights() {
		for (var c of this.map.cards) {
			for (var l of c.lights) {
				yield this.get_pos_from_card (c, l);
			}
		}
		}
	hide_light(pos, permanent=false) {
		let c,p;
		[c,p] = this.get_card_and_pos (pos);
		let light = (c.lights.find(l => l[0]==p[0] && l[1]==p[1]));
		if(light == undefined) return false;
		let lights = c.lights.filter(light);
		c.light_map (lights);
		c.draw_grid ();
		var relight_fn = function (event, card) {
			card.light_map (card.lights);
			card.draw_grid ();
		};
		this.parent.parent.eventdiscard.bind ('discard', c);
	}
	nearest_guard(map_pos, max_range=null, states=['dozing','alert']) {
		var gts = [...this.tokens].filter(t=> t instanceof GuardToken && states.includes(t.state));
		var dists = gts.map(t => this.dist(map_pos, t.map_pos));
		var min_dist = Math.min(dists);
		if (max_range !== null && min_dist > max_range) return null;
		return gts [dists.indexOf(min_dist)];
	}
	nearest_waypoint(map_pos, max_range=null) {
		var wps = [...this.iter_waypoints()];
		var dists = wps.map(t => this.dist(map_pos, t.map_pos));
		var min_dist = Math.min(dists);
		if (max_range != null && min_dist > max_range) return null;
		return wps [dists.indexOf(min_dist)];
	}
	guard_nearest_move(guard_pos, player_pos, include_player=true, max_dist=1000) {
		var g_to_p_dist = this.dist (player_pos, guard_pos);
		var wps = [...this.iter_waypoints()];
		var candidates = [];
		var smallest_dist = max_dist;
		for (var wp of wps) {
			var p_to_wp_dist = this.dist (wp, player_pos);
			var g_to_wp_dist = this.dist (wp, guard_pos);
			if ((p_to_wp_dist < g_to_p_dist || !(include_player)) && p_to_wp_dist <= smallest_dist) {
				var smallest_dist = p_to_wp_dist;
				candidates.append (wp);
			}
		}
		if (include_player && len (candidates) == 0) {
			return player_pos;
		}
		else if (len (candidates) == 0) {
			return guard_pos;
		}
		else {
			return candidates[candidates.length-1];
		}
	}
	walkable_dist(map_pos1, map_pos2) {
		// pass;
	}
	dist(map_pos1, map_pos2) {
		var d0 = Math.abs(map_pos1 [0] - map_pos2 [0]);
		var d1 = Math.abs(map_pos1 [1] - map_pos2 [1]);
		return Math.max(d0, d1) + 0.5 * Math.min(d0, d1);
	}
	walkable_spots(map_pos, dist, spots) {
		if (len (spots) == 0) {
			spots [map_pos.toString()] = 0;
		}
		if (['U', 'L', 'L0', 'L1', 'L2'].includes(this.get(map_pos))) {
			var walk_costs = {'U': 1, 'L': 1, 'L0': 1, 'L1': 1, 'L2': 1}
		}
		else if (this.building_types.includes(this.get(map_pos))) {
			var walk_costs = {'B': 1, 'B0': 1, 'U': 1, 'L': 1, 'L0': 1, 'L1': 1, 'L2': 1}
		}
		for (var pos of this.iter_in_range (map_pos, 1.5)) {
			if (walk_costs.includes(this.get(map_pos))) {
				var cur_dist = spots[map_pos.toString()] + walk_costs[this.get(pos)] * this.dist (pos, map_pos);
				if ((pos.toString() in spots) && cur_dist >= spots[pos.toString()]) {
					continue;
				}
				if (cur_dist <= dist) {
					spots[pos.toString()] = cur_dist;
					this.walkable_spots (pos, dist, spots);
				}
			}
		}
		return spots;
	}
	alert_nearby_guards(radius) {
		var p = this.active_player_token;
		for (var g of this.iter_tokens ('G')) {
			if (g.state == 'dozing') {
				if (this.dist (g.map_pos, p.map_pos) <= radius) {
					g.state = 'alert';
				}
			}
		}
	}
}
