class MapChoice extends BoxLayout {
	map_pos = null;
	choice_type = 'info';
	listener = null;
	constructor(rect, properties=null) {
		super(rect);
		this.updateProperties(properties);
	}
	on_map_pos(event, data) {
		if(this.map_pos==null) return;
		this.x = this.map_pos[0];
		this.y = this.map_pos[1];
		this.w = 1;
		this.h = 1;
	}
	on_touch_down(event, touch) {
		let r = this;
		if(r.collide(touch.rect)) {
			App.get().inputHandler.grab(this);
			return true;
		}
	}
	on_touch_up(event, touch) {
		let r = this;
		App.get().inputHandler.ungrab();
		if(r.collide(touch.rect)) {
			if(['touch', 'visible'].includes(this.choice_type)) {
				this.listener.activate('map_choice_selected', {touch_object: this});
			}
			return true;
		}
	}
	on_touch_cancel(event, touch) {
		App.get().inputHandler.ungrab();
	}
	draw() {
		let app=App.get();
		let ctx = app.ctx;
		let r = this.rect;

		const colors = {'touch': colorString([0.8,0.8,0]), 'visible': colorString([192/255,0,0]), 'info': colorString([170/255,170/255,170/255])}
		// const colors = {'touch': colorString([240/255,69/255,0]), 'visible': colorString([192/255,0,0]), 'info': colorString([170/255,170/255,170/255])}
		// ctx.fillStyle = colors[this.choice_type];

		let x = r.x+r.w/5;
		let y = r.y+r.h/5;
		let w = 3*r.w/5;
		let h = 3*r.h/5;
		ctx.strokeStyle = colors[this.choice_type];
		ctx.lineWidth = 2.0/app.tileSize;

		ctx.beginPath();
		ctx.moveTo(r.x + r.w / 10, r.y);
		ctx.lineTo(r.x, r.y);
		ctx.lineTo(r.x, r.y + r.h/10);
		// ctx.stroke();

		// ctx.beginPath();
		ctx.moveTo(r.right - r.w / 10, r.y);
		ctx.lineTo(r.right, r.y);
		ctx.lineTo(r.right, r.y + r.h/10);
		// ctx.stroke();

		// ctx.beginPath();
		ctx.moveTo(r.x + r.w / 10, r.bottom);
		ctx.lineTo(r.x, r.bottom);
		ctx.lineTo(r.x, r.bottom - r.h/10);
		// ctx.stroke();

		// ctx.beginPath();
		ctx.moveTo(r.right - r.w / 10, r.bottom);
		ctx.lineTo(r.right, r.bottom);
		ctx.lineTo(r.right, r.bottom - r.h/10);
		ctx.stroke();

	}
}

class TokenMapChoice extends MapChoice {
	constructor(rect, properties=null) {
		super(rect);
		if(properties==null) properties = {};
		properties['map_pos'] = properties['token'].map_pos
		this.updateProperties(properties);
	}
	on_touch_down(event, touch) {
		let r = this;
		if(r.collide(touch.rect)) {
			App.get().inputHandler.grab(this);
			return true;
		}
	}
	on_touch_up(event, touch) {
		let r = this;
		App.get().inputHandler.ungrab();
		if(r.collide(touch.rect)) {
			this.listener.activate('map_choice_selected', {touch_object: this});
			return true;
		}
	}
}

class Board extends GridLayout {
	tokens = [];
	map_choices = [];
	active_player_token = null;
	space_size = [];
	dimW = -1;
	dimH = -1;
	token_types = {'G': GuardToken, 'P': PlayerToken, 'T': TargetToken, 'M': MarketToken};
	path_types = ['U', 'L', 'L0', 'L1', 'L2'];
	building_types = ['B', 'B0'];
	onCh() {
		let c = this.children[0];
		if(this.numX>0) {
			this.dimW = this.numX*c.w;
			this.dimH = Math.ceil(this.children.length/this.numX)*c.h;
		}
		if(this.numY>0) {
			this.dimH = this.numY*c.h;
			this.dimW = Math.ceil(this.children.length/this.numY)*c.w;
		}
	}
	on_child_added(event, data) {
		this.onCh();
	}
	on_child_removed(event, data) {
		this.onCh();
	}
	on_tokens(event, data) {
		let app = App.get();
		this.active_player_token = this.tokens.find(t => t instanceof PlayerToken);
		app.playarea.children = [...app.playarea.children.filter(t=>!(t instanceof Token)&&!(t instanceof MapChoice)), ...this.map_choices, ...this.tokens];
	}
	on_map_choices(event, data) {
		let app = App.get();
		app.playarea.children = [...app.playarea.children.filter(t=>!(t instanceof Token)&&!(t instanceof MapChoice)), ...this.map_choices, ...this.tokens];
//		app.playarea.children = [...app.playarea.children.filter(t=>!(t instanceof MapChoice)), ...this.map_choices];
	}
	scroll_to_player() {
		if(this.active_player_token==null) return;
		let app = App.get();
		let mp = new Rect([...this.active_player_token.map_pos, 1, 1]);
		let sx = Math.min(Math.max(mp.center_x-app.sv.w/app.sv.zoom/2,0),app.sv.children[0].w-app.sv.w/app.sv.zoom);
		let sy = Math.min(Math.max(mp.center_y-app.sv.h/app.sv.zoom/2,0),app.sv.children[0].h-app.sv.h/app.sv.zoom)
		let anim = new WidgetAnimation();
		anim.add({scrollX:sx, scrollY:sy}, 100);
		anim.start(app.sv);
	}
	on_token_move(event, token, mp) {
		this.token_update();
	}
	on_token_state(token, st) {
		this.token_update();
	}
	token_update() {
		//TODO: This seems very complicated. can it be simplified?
		let p = this.active_player_token;
		//move guards that can see player to the player
		for(let t of this.iter_tokens('G')) {
			if(arrEq(t.map_pos, p.map_pos) || ['dead', 'unconscious'].includes(t.state) || t.frozen) continue; 
			if(1 <= this.dist(t.map_pos, p.map_pos) && this.dist(t.map_pos, p.map_pos) <= 10 
			&& !['U',...this.building_types].includes(this.get(p.map_pos))) {
				if(!(this.has_types_between(t.map_pos, p.map_pos, this.building_types))) {
					t.map_pos = [...p.map_pos];
					if(t.state!='alert') {
						t.state = 'alert';
					}
					return ;
				}
			}
		}
		//alert guards
		for(let t of this.iter_tokens('G')) {
			if(arrEq(t.map_pos,p.map_pos)) {
				if(t.state=='dozing') {
					t.state = 'alert';
				}
				else {
					continue;
				}
			}
			if(['unconscious', 'dead'].includes(t.state) || t.frozen) continue;
			var closest = [100, null];
			for(let t0 of this.iter_tokens('G')) {
				if(['alert', 'dozing'].includes(t0.state)) continue;
				if(arrEq(t0.map_pos, p.map_pos)) continue;
				let d = this.dist(t.map_pos, t0.map_pos);
				if((1 < d && d <= 10) && !['U', ...this.building_types].includes(this.get(t0.map_pos))) {
					if(!(this.has_types_between(t.map_pos, t0.map_pos, this.building_types))) {
						if(d < closest [0]) {
							closest = [d, t0];
						}
					}
				}
				else if(d == 0) {
					if(t.state != 'alert') {
						t.state = 'alert';
						return ;
					}
				}
			}
			let d,t0;
			[d,t0] = closest;
			if(t0 !== null && !arrEq(t.map_pos, t0.map_pos) && t.state != 'alert') {
				t.map_pos = [...t0.map_pos];
				t.state = 'alert';
				return ;
			}
		}
		var clashes = {}
		for(var t0 of this.tokens) {
			for(var t1 of this.tokens) {
				if(t0 === t1) {
					continue;
				}
				if(arrEq(t0.map_pos, t1.map_pos)) {
					let p = t0.map_pos.toString();
					if(p in clashes) {
						if(!clashes[p].includes(t0)) clashes[p].push(t0);
						if(!clashes[p].includes(t1)) clashes[p].push(t1);
					}
					else {
						clashes[p] = [t0, t1];
					}
				}
			}
		}
		for(var t of this.tokens) {
			if(!(t.map_pos.toString() in clashes)) t.off = [0, 0];
		}
		let offsets = [[-0.25, -0.25], [0.25, 0.25], [-0.25, 0.25], [0.25, -0.25],[0,0.25],[0.25,0],[0,-0.25],[-0.25,0]];
		for(let c in clashes) {
			for(let i=0;i<Math.min(clashes[c].length,offsets.length);i++) {
				clashes[c][i].off = [...offsets[i]];
			}
		}
		this.scroll_to_player();
	}
	get(pos) {
		let card, card_pos;
		[card, card_pos] = this.get_card_and_pos(pos);
		return card.map.get(card_pos);
	}
	get_card_and_pos(pos) {
		let app = App.get();
		let x,y;
		[x,y] = pos;
		var card_x = Math.floor(x / app.map_card_grid_size [0]);
		var card_y = Math.floor(y / app.map_card_grid_size [1]);
		var card_ind = card_x + card_y * this.numX;
		var card = this.children[card_ind];
		var card_pos = [x - card_x * app.map_card_grid_size [0], y - card_y * app.map_card_grid_size [1]];
		return [card, card_pos];
	}
	get_pos_from_card(card, pos=[0,0]) {
		let x,y;
		[x,y] = pos;
		var card_ind = this.children.indexOf(card);
		var card_y = Math.floor(card_ind / this.numX);
		var card_x = card_ind - card_y * this.numX;
		[x,y] = [x + card_x * card.w, y + card_y * card.h];
		return [x, y];
	}
	*iter_between(pos1, pos2, off1, off2) {
		let x1,y1,x2,y2,ox1,oy1,ox2,oy2,x1a,x2a,y1a,y2a;
		pos1 = new Vec2(pos1);
		pos2 = new Vec2(pos2);
		off1 = new Vec2(off1);
		off2 = new Vec2(off2);
		[x1,y1]=pos1;
		[x2,y2]=pos2;
		[ox1,oy1]=off1;
		[ox2,oy2]=off2;
		[x1a,y1a]=pos1.add(off1);
		[x2a,y2a]=pos2.add(off2);
		if(Math.abs(y2 - y1) == 0 && Math.abs(x2 - x1) == 0) return;
		if(Math.abs(y2a - y1a) == 0 && Math.abs(x2a - x1a) == 0) return;
		if(Math.abs(y2a - y1a) > Math.abs(x2a - x1a)) {
			var slope = (x2a - x1a) / (y2a - y1a);
			if(y1a > y2a) {
				[y1,y2] = [y2,y1];
				[x1,x2] = [x2,x1];
				[y1a,y2a] = [y2a,y1a];
				[x1a,x2a] = [x2a,x1a];
			}
			var y = Math.floor(y1);
			while(y < y2) {
				var yo = y + 0.5;
				var xo = x1a + (yo - y1a) * slope;
				var x = Math.floor(xo);
				if(xo - x <= 0.5) {
					if((0 <= x && x < this.dimW)) {
						yield [x, y];
						yield [x, y + 1];
					}
				}
				if(xo - x >= 0.5) {
					if((0 <= x + 1 && x + 1 < this.dimW)) {
						yield [x + 1, y];
						yield [x + 1, y + 1];
					}
				}
				y++;
			}
		}
		else {
			var slope = (y2a - y1a) / (x2a - x1a);
			if(x1a > x2a) {
				[y1,y2] = [y2,y1];
				[x1,x2] = [x2,x1];
				[y1a,y2a] = [y2a,y1a];
				[x1a,x2a] = [x2a,x1a];
			}
			var x = Math.floor(x1);
			while(x < x2) {
				var xo = x + 0.5;
				var yo = y1a + (xo - x1a) * slope;
				var y = Math.floor(yo);
				if(yo - y <= 0.5 + 0.0001) {
					if((0 <= y && y < this.dimH)) {
						yield [x, y];
						yield [x + 1, y];
					}
				}
				if(yo - y >= 0.5 - 0.0001) {
					if((0 <= y + 1 && y + 1 < this.dimH)) {
						yield [x, y + 1];
						yield [x + 1, y + 1];
					}
				}
				x++;
			}
		}
		}
	*iter_types_between(pos1, pos2, types, off1=[0,0], off2=[0,0]) {
		for(var pos of this.iter_between(pos1, pos2, off1, off2)) {
			if(types.includes(this.get(pos))) yield pos;
		}
	}
	has_types_between(pos1, pos2, types) {
		var bases = [pos1, pos2];
		for(var pos of this.iter_types_between(pos1, pos2, types)) {
			if(bases.includes(pos)) continue;
			return true;
		}
		return false;
	}
	has_line_of_sight(pos1, pos2, types) {
		var e = 0.5;
		for(var add1 of [[-e, -e], [-e, e], [e, -e], [e, e]]) {
			for(var add2 of [[-e, -e], [-e, e], [e, -e], [e, e]]) {
				var blockers = [...this.iter_types_between(pos1, pos2, types, add1, add2)].filter(p=>!arrEq(p,pos1) && !arrEq(p,pos2));
				if(blockers.length == 0) return true;
			}
		}
		return false;
	}
	*iter_all(sub_rect=null) {
		if(sub_rect !== null) {
			for(var x = sub_rect [0]; x < Math.min(this.dimW, sub_rect [0] + sub_rect [2]); x++) {
				for(var y = sub_rect [1]; y < Math.min(this.dimH, sub_rect [1] + sub_rect [3]); y++) {
					yield [x, y];
				}
			}
		}
		else {
			for(var x = 0; x < this.dimW; x++) {
				for(var y = 0; y < this.dimH; y++) {
					yield [x, y];
				}
			}
		}
	}
	*iter_types(types, sub_rect=null) {
		for(var [x0, y0] of this.iter_all(sub_rect)) {
			if(types.includes(this.get([x0,y0]))) yield [x0, y0];
		}
	}
	*iter_in_range(pos, radius=3) {
		let x,y;
		[x,y] = pos;
		var rad = Math.ceil(radius);
		for(var xoff = -(rad); xoff < rad + 1; xoff++) {
			for(var yoff = -(rad); yoff < rad + 1; yoff++) {
				if(Math.max(Math.abs(xoff), Math.abs(yoff)) + 0.5 * Math.min(Math.abs(xoff), Math.abs(yoff)) <= radius) {
					var x0 = x + xoff;
					var y0 = y + yoff;
					if((0 <= y0 && y0 < this.dimH) && (0 <= x0 && x0 < this.dimW)) {
						yield [x0, y0];
					}
				}
			}
		}
		}
	*iter_types_in_range(pos, types, radius=3, blocker_types=null) {
		for(var pos0 of this.iter_in_range(pos, radius)) {
			if(blocker_types !== null && this.has_types_between(pos, pos0, blocker_types)) continue;
			if(types.includes(this.get(pos0))) yield pos0;
		}
		}
	*iter_tokens(token_type=null) {
		if(token_type === null) {
			for(var t of this.tokens) {
				yield t;
			}
		}
		else {
			for(var t of this.tokens) {
				if(t instanceof this.token_types [token_type]) {
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
		return [...this.iter_types_in_range(pos, types, radius, blocker_types)].reduce(p,c => p+c)
	}
	*iter_rect(pos, size, must_fit=true) {
		let x,y,w,h;
		[x,y] = pos;
		[w,h] = size;
		if(must_fit && (x < 0 || y < 0 || x + w > this.dimW || y + h > this.dimH)) {
			return ;
		}
		var xl = Math.max(x, 0);
		var xu = Math.min(x + w, this.dimW);
		var yl = Math.max(y, 0);
		var yu = Math.min(y + h, this.dimH);
		for(var x0 = xl; x0 < xu; x0++) {
			for(var y0 = yl; y0 < yu; y0++) {
				yield [x0, y0];
			}
		}
	}
	num_in_rect(pos, size, targets, must_fit=true) {
		return [...this.iter_rect(pos, size, must_fit)].filter(p=>targets.includes(this.get(pos))).length;
	}
	make_choice(map_pos, listener, choice_type) {
		return new MapChoice(new Rect(), {map_pos: map_pos, listener: listener, choice_type: choice_type});
	}
	make_token_choice(token, listener, choice_type) {
		return new TokenMapChoice(new Rect(), {token: token, listener: listener, choice_type: choice_type});
	}
	*iter_spawns() {
		for(var c of this.children) {
			for(var s of c.spawns) {
				yield this.get_pos_from_card(c, s);
			}
		}
	}
	*iter_waypoints() {
		for(var c of this.children) {
			for(var w of [...c.spawns, ...c.waypoints]) {
				yield this.get_pos_from_card(c, w);
			}
		}
	}
	*iter_targets() {
		for(var c of this.children) {
			for(var t of c.targets) {
				yield this.get_pos_from_card(c, t);
			}
		}
	}
	*iter_markets() {
		for(var c of this.children) {
			for(var m of c.markets) {
				yield this.get_pos_from_card(c, m);
			}
		}
	}
	*iter_lights() {
		for(var c of this.children) {
			for(var l of c.lights) {
				yield this.get_pos_from_card(c, l);
			}
		}
	}
	hide_light(pos, permanent=false) {
		let app=App.get()
		let c,p;
		[c,p] = this.get_card_and_pos(pos);
		let light = (c.lights.find(l => l[0]==p[0] && l[1]==p[1]));
		if(light == undefined) return false;
		let lights = c.lights.filter(l=>l!=light);
		c.light_map(lights);
		if(!permanent) {
			app.eventdiscard.bind('discard', (event, deck,  card) => {
					c.light_map(c.lights);
					this.token_update();
				});
		}
	}
	nearest_guard(map_pos, max_range=null, states=['dozing','alert']) {
		var gts = [...this.tokens].filter(t=> t instanceof GuardToken && states.includes(t.state));
		var dists = gts.map(t => this.dist(map_pos, t.map_pos));
		var min_dist = Math.min(...dists);
		if(max_range !== null && min_dist > max_range) return null;
		return gts [dists.indexOf(min_dist)];
	}
	nearest_waypoint(map_pos, max_range=null) {
		var wps = [...this.iter_waypoints()];
		var dists = wps.map(t => this.dist(map_pos, t.map_pos));
		var min_dist = Math.min(dists);
		if(max_range != null && min_dist > max_range) return null;
		return wps [dists.indexOf(min_dist)];
	}
	guard_nearest_move(guard_pos, player_pos, include_player=true, max_dist=1000) {
		var g_to_p_dist = this.dist(player_pos, guard_pos);
		var wps = [...this.iter_waypoints()];
		var candidates = [];
		var smallest_dist = max_dist;
		for(var wp of wps) {
			var p_to_wp_dist = this.dist(wp, player_pos);
			var g_to_wp_dist = this.dist(wp, guard_pos);
			if((p_to_wp_dist < g_to_p_dist || !(include_player)) && p_to_wp_dist <= smallest_dist) {
				var smallest_dist = p_to_wp_dist;
				candidates.push(wp);
			}
		}
		if(include_player && candidates.length == 0) return player_pos;
		else if(candidates.length == 0) return guard_pos;
		else return candidates[candidates.length-1];
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
		//todo: this is very clunky
		if(Object.keys(spots).length == 0) {
			spots [map_pos.toString()] = 0;
		}
		let walk_costs = {}
		if(['U', 'L', 'L0', 'L1', 'L2'].includes(this.get(map_pos))) {
			walk_costs = {'U': 1, 'L': 1, 'L0': 1, 'L1': 1, 'L2': 1}
		}
		else if(this.building_types.includes(this.get(map_pos))) {
			walk_costs = {'B': 1, 'B0': 1, 'U': 1, 'L': 1, 'L0': 1, 'L1': 1, 'L2': 1}
		}
		for(var pos of this.iter_in_range(map_pos, 1.5)) {
			if(this.get(map_pos) in walk_costs) {
				var cur_dist = spots[map_pos.toString()] + walk_costs[this.get(pos)] * this.dist(pos, map_pos);
				if((pos.toString() in spots) && cur_dist >= spots[pos.toString()]) {
					continue;
				}
				if(cur_dist <= dist) {
						spots[pos.toString()] = cur_dist;
					this.walkable_spots(pos, dist, spots);
				}
			}
		}
		return spots;
	}
	walkables(map_pos, dist, spots) {
		spots = this.walkable_spots(map_pos, dist, spots)
		spots = Object.keys(spots).map(s=>s.split(',').map(v=>parseInt(v)));
		return spots;
	}
	alert_nearby_guards(radius) {
		var p = this.active_player_token;
		for(var g of this.iter_tokens('G')) {
			if(g.state == 'dozing') {
				if(this.dist(g.map_pos, p.map_pos) <= radius) {
					g.state = 'alert';
				}
			}
		}
	}
}
