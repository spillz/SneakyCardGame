class MapChoice extends BoxLayout {
	__init__() {
		var map_pos = extract_kwarg (kwargs, 'map_pos', tuple ([0, 0]));
		var tp = extract_kwarg (kwargs, 'choice_type', 'info');
		var listener = extract_kwarg (kwargs, 'listener');
		__super__ (MapChoice, '__init__') (self, __kwargtrans__ (kwargs));
		this.map_pos = map_pos;
		this.choice_type = tp;
		this.listener = listener;
	}
	on_touch_down(touch) {
		if (this.collide_point (...touch.pos)) {
			touch.grab (self);
			return true;
		}
	}
	on_touch_up(touch) {
		if (touch.grab_current == self) {
			touch.ungrab (self);
			if (__in__ (this.choice_type, ['touch', 'visible'])) {
				this.listener ('map_choice_selected', __kwargtrans__ ({touch_object: self}));
			}
			return true;
		}
	}
}

class TokenMapChoice extends BoxLayout {
	__init__(kwargs) {
		this.token = extract_kwarg (kwargs, 'token', tuple ([0, 0]));
		this.choice_type = extract_kwarg (kwargs, 'choice_type', 'info');
		this.listener = extract_kwarg (kwargs, 'listener');
		__super__ (TokenMapChoice, '__init__') (self, __kwargtrans__ (kwargs));
	}
	on_touch_down(touch) {
		if (this.collide_point (...touch.pos)) {
			touch.grab (self);
			return true;
		}
	}
	on_touch_up(touch) {
		if (touch.grab_current == self) {
			touch.ungrab (self);
			this.listener ('map_choice_selected', __kwargtrans__ ({touch_object: self}));
			return true;
		}
	}
}

class Map extends GridLayout {
	cards = ListProperty ();
	__init__() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		__super__ (Map, '__init__') (self, ...args, __kwargtrans__ (kwargs));
		this.orientation = 'lr-tb';
		this.size_hint = tuple ([null, null]);
	}
	on_cards() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		for (var c of this.children.__getslice__ (0, null, 1)) {
			if (isinstance (c, cards.Card)) {
				this.remove_widget (c);
			}
		}
		for (var c of this.cards) {
			c.face_up = true;
			c.size_hint = tuple ([1, 1]);
			this.add_widget (c);
		}
	}
	on_touch_up(touch) {
		return ;
	}
}

class Board extends RelativeLayout {
	tokens = ListProperty ();
	map_choices = ListProperty ();
	space_size = ListProperty ();
	w = NumericProperty ();
	h = NumericProperty ();
	token_types = {'G': GuardToken, 'P': PlayerToken, 'T': TargetToken, 'M': MarketToken};
	path_types = ['U', 'L', 'L0', 'L1', 'L2'];
	building_types = ['B', 'B0'];
	on_tokens() {
		var args = tuple ([].slice.apply (arguments).slice (1));
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
		var args = tuple ([].slice.apply (arguments).slice (1));
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
		var pad = tuple ([Math.floor ((this.parent.width - this.active_player_token.width) / 4), Math.floor ((this.parent.height - this.active_player_token.height) / 4)]);
		this.parent.scroll_to (this.active_player_token, __kwargtrans__ ({padding: pad}));
	}
	on_space_size() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		for (var t of this.tokens) {
			t.size = this.space_size;
		}
		for (var c of this.map_choices) {
			c.size = this.space_size;
		}
	}
	on_token_move(token, mp) {
		this.token_update ();
	}
	on_token_state(token, st) {
		this.token_update ();
	}
	token_update() {
		var p = this.active_player_token;
		for (var t of this.iter_tokens ('G')) {
			if (t.map_pos != p.map_pos && !__in__ (t.state, ['dead', 'unconscious']) && !(t.frozen)) {
				if ((1 <= this.dist (t.map_pos, p.map_pos) && this.dist (t.map_pos, p.map_pos) <= 10) && !__in__ (self [p.map_pos], ['U'] + this.building_types)) {
					if (!(this.has_types_between (t.map_pos, p.map_pos, this.building_types))) {
						t.map_pos = p.map_pos;
						t.state = 'alert';
						return ;
					}
				}
			}
		}
		for (var t of this.iter_tokens ('G')) {
			if (t.map_pos == p.map_pos || __in__ (t.state, ['unconscious', 'dead']) || t.frozen) {
				continue;
			}
			var closest = tuple ([100, null]);
			for (var t0 of this.iter_tokens ('G')) {
				if (__in__ (t0.state, ['alert', 'dozing'])) {
					continue;
				}
				if (t0.map_pos == p.map_pos) {
					continue;
				}
				var d = this.dist (t.map_pos, t0.map_pos);
				if ((1 < d && d <= 10) && !__in__ (self [t0.map_pos], ['U'] + this.building_types)) {
					if (!(this.has_types_between (t.map_pos, t0.map_pos, this.building_types))) {
						if (d < closest [0]) {
							var closest = tuple ([d, t0]);
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
			var __left0__ = closest;
			var d = __left0__ [0];
			var t0 = __left0__ [1];
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
				if (tuple (t0.map_pos) == tuple (t1.map_pos)) {
					var p = tuple (t0.map_pos);
					if (__in__ (p, clashes)) {
						clashes [p].add (t0);
						clashes [p].add (t1);
					}
					else {
						clashes [p] = set ([t0, t1]);
					}
				}
			}
		}
		for (var t of this.tokens) {
			if (!__in__ (tuple (t.map_pos), clashes)) {
				t.off = [0, 0];
			}
		}
		for (var p of clashes) {
			for (var [t, o] of zip (clashes [p], [[-(0.25), -(0.25)], [0.25, 0.25], [-(0.25), 0.25], [0.25, -(0.25)]].__getslice__ (0, len (clashes [p]), 1))) {
				t.off = o;
			}
		}
		this.scroll_to_player ();
	}
	__getitem__(pos) {
		var __left0__ = this.get_card_and_pos (pos);
		var card = __left0__ [0];
		var card_pos = __left0__ [1];
		return card.map [card_pos];
	}
	get_card_and_pos(pos) {
		var __left0__ = pos;
		var x = __left0__ [0];
		var y = __left0__ [1];
		var card_x = Math.floor (x / this.map_card_grid_size [0]);
		var card_y = Math.floor (y / this.map_card_grid_size [1]);
		var card_ind = card_x + card_y * this.map.cols;
		var card = this.map.cards [card_ind];
		var card_pos = tuple ([x - card_x * this.map_card_grid_size [0], y - card_y * this.map_card_grid_size [1]]);
		return tuple ([card, card_pos]);
	}
	get_pos_from_card(card, pos) {
		if (typeof pos == 'undefined' || (pos != null && pos.hasOwnProperty ("__kwargtrans__"))) {;
			var pos = tuple ([0, 0]);
		};
		var __left0__ = pos;
		var x = __left0__ [0];
		var y = __left0__ [1];
		var card_ind = this.map.cards.index (card);
		var card_y = Math.floor (card_ind / this.map.cols);
		var card_x = card_ind - card_y * this.map.cols;
		var __left0__ = tuple ([x + card_x * this.map_card_grid_size [0], y + card_y * this.map_card_grid_size [1]]);
		var x = __left0__ [0];
		var y = __left0__ [1];
		return tuple ([x, y]);
	}
	*iter_between(pos1, pos2, off1, off2) {
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
			if (types.includes(self[pos])) yield pos;
		}
	}
	has_types_between(pos1, pos2, types) {
		var bases = [tuple (pos1), tuple (pos2)];
		for (var pos of this.iter_types_between (pos1, pos2, types)) {
			if (bases.includes(pos)) continue;
			return true;
		}
		return false;
	}
	has_line_of_sight(pos1, pos2, types) {
		var bases = [tuple (pos1), tuple (pos2)];
		var e = 0.5;
		for (var add1 of [tuple ([-(e), -(e)]), tuple ([-(e), e]), tuple ([e, -(e)]), tuple ([e, e])]) {
			for (var add2 of [tuple ([-(e), -(e)]), tuple ([-(e), e]), tuple ([e, -(e)]), tuple ([e, e])]) {
				var blockers = (function () {
					var __accu0__ = [];
					for (var p of this.iter_types_between (pos1, pos2, types, add1, add2)) {
						if (!__in__ (p, bases)) {
							__accu0__.append (p);
						}
					}
					return __accu0__;
				}) ();
				if (len (blockers) == 0) {
					return true;
				}
			}
		}
		return false;
	}
	*iter_all(sub_rect) {
		if (typeof sub_rect == 'undefined' || (sub_rect != null && sub_rect.hasOwnProperty ("__kwargtrans__"))) {;
			var sub_rect = null;
		};
		if (sub_rect !== null) {
			for (var x = sub_rect [0]; x < Math.min(this.w, sub_rect [0] + sub_rect [2]); x++) {
				for (var y = sub_rect [1]; y < Math.min(this.h, sub_rect [1] + sub_rect [3]); y++) {
					yield tuple ([x, y]);
				}
			}
		}
		else {
			for (var x = 0; x < this.w; x++) {
				for (var y = 0; y < this.h; y++) {
					yield tuple ([x, y]);
				}
			}
		}
		}
	*iter_types(types, sub_rect) {
		if (typeof sub_rect == 'undefined' || (sub_rect != null && sub_rect.hasOwnProperty ("__kwargtrans__"))) {;
			var sub_rect = null;
		};
		for (var [x0, y0] of this.iter_all (sub_rect)) {
			if (__in__ (this.__getitem__ ([x0, y0]), types)) {
				yield tuple ([x0, y0]);
			}
		}
		}
	*iter_in_range(pos, radius) {
		if (typeof radius == 'undefined' || (radius != null && radius.hasOwnProperty ("__kwargtrans__"))) {;
			var radius = 3;
		};
		var __left0__ = pos;
		var x = __left0__ [0];
		var y = __left0__ [1];
		var rad = math.ceil (radius);
		for (var xoff = -(rad); xoff < rad + 1; xoff++) {
			for (var yoff = -(rad); yoff < rad + 1; yoff++) {
				if (Math.max(Math.abs(xoff), Math.abs(yoff)) + 0.5 * Math.min(Math.abs(xoff), Math.abs(yoff)) <= radius) {
					var x0 = x + xoff;
					var y0 = y + yoff;
					if ((0 <= y0 && y0 < this.h) && (0 <= x0 && x0 < this.w)) {
						yield tuple ([x0, y0]);
					}
				}
			}
		}
		}
	*iter_types_in_range(pos, types, radius, blocker_types) {
		if (typeof radius == 'undefined' || (radius != null && radius.hasOwnProperty ("__kwargtrans__"))) {;
			var radius = 3;
		};
		if (typeof blocker_types == 'undefined' || (blocker_types != null && blocker_types.hasOwnProperty ("__kwargtrans__"))) {;
			var blocker_types = null;
		};
		for (var pos0 of this.iter_in_range (pos, radius)) {
			if (blocker_types !== null && this.has_types_between (pos, pos0, blocker_types)) {
				continue;
			}
			if (__in__ (self [pos0], types)) {
				yield pos0;
			}
		}
		}
	*iter_tokens(token_type) {
		if (typeof token_type == 'undefined' || (token_type != null && token_type.hasOwnProperty ("__kwargtrans__"))) {;
			var token_type = null;
		};
		if (token_type === null) {
			for (var t of this.tokens) {
				yield t;
			}
		}
		else {
			for (var t of this.tokens) {
				if (isinstance (t, this.token_types [token_type])) {
					yield t;
				}
			}
		}
		}
	active_player_clashing() {
		return sum ((function () {
			var __accu0__ = [];
			for (var g of this.iter_tokens ('G')) {
				__accu0__.append (g.map_pos == this.active_player_token.map_pos && __in__ (g.state, ['alert', 'dozing']) && g.frozen == false);
			}
			return __accu0__;
		}) ());
	}
	num_in_range(pos, types, radius, blocker_types) {
		if (typeof radius == 'undefined' || (radius != null && radius.hasOwnProperty ("__kwargtrans__"))) {;
			var radius = 3;
		};
		if (typeof blocker_types == 'undefined' || (blocker_types != null && blocker_types.hasOwnProperty ("__kwargtrans__"))) {;
			var blocker_types = null;
		};
		var num = 0;
		for (var pos0 of this.iter_types_in_range (pos, types, radius, blocker_types)) {
			num++;
		}
		return num;
	}
	*iter_rect(pos, size, must_fit) {
		if (typeof must_fit == 'undefined' || (must_fit != null && must_fit.hasOwnProperty ("__kwargtrans__"))) {;
			var must_fit = true;
		};
		var __left0__ = pos;
		var x = __left0__ [0];
		var y = __left0__ [1];
		var __left0__ = size;
		var w = __left0__ [0];
		var h = __left0__ [1];
		if (must_fit && (x < 0 || y < 0 || x + w > this.w || y + h > this.h)) {
			return ;
		}
		var xl = Math.max(x, 0);
		var xu = Math.min(x + w, this.w);
		var yl = Math.max(y, 0);
		var yu = Math.min(y + h, this.h);
		for (var x0 = xl; x0 < xu; x0++) {
			for (var y0 = yl; y0 < yu; y0++) {
				yield tuple ([x0, y0]);
			}
		}
		}
	num_in_rect(pos, size, targets, must_fit) {
		if (typeof must_fit == 'undefined' || (must_fit != null && must_fit.hasOwnProperty ("__kwargtrans__"))) {;
			var must_fit = true;
		};
		for (var pos of this.iter_rect (pos, size, must_fit)) {
			if (__in__ (self [pos], targets)) {
				yield pos;
			}
		}
		}
	make_choice(map_pos, listener, choice_type) {
		return MapChoice (__kwargtrans__ ({map_pos: map_pos, listener: listener, choice_type: choice_type}));
	}
	make_token_choice(token, listener, choice_type) {
		return TokenMapChoice (__kwargtrans__ ({token: token, listener: listener, choice_type: choice_type}));
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
	hide_light(pos, permanent) {
		if (typeof permanent == 'undefined' || (permanent != null && permanent.hasOwnProperty ("__kwargtrans__"))) {;
			var permanent = false;
		};
		var __left0__ = this.get_card_and_pos (pos);
		var c = __left0__ [0];
		var p = __left0__ [1];
		if (!__in__ (p, c.lights)) {
			return false;
		}
		var ind = c.lights.index (p);
		var lights = c.lights.__getslice__ (0, ind, 1) + c.lights.__getslice__ (ind + 1, null, 1);
		c.light_map (lights);
		c.draw_grid ();
		var relight_fn = function (card) {
			var args = tuple ([].slice.apply (arguments).slice (1));
			card.light_map (card.lights);
			card.draw_grid ();
		};
		this.parent.parent.eventdiscard.bind (__kwargtrans__ ({cards: partial (relight_fn, c)}));
	}
	nearest_guard(map_pos, max_range, states) {
		if (typeof max_range == 'undefined' || (max_range != null && max_range.hasOwnProperty ("__kwargtrans__"))) {;
			var max_range = null;
		};
		if (typeof states == 'undefined' || (states != null && states.hasOwnProperty ("__kwargtrans__"))) {;
			var states = ['dozing', 'alert'];
		};
		var gts = (function () {
			var __accu0__ = [];
			for (var t of this.tokens) {
				if (isinstance (t, GuardToken) && __in__ (t.state, states)) {
					__accu0__.append (t);
				}
			}
			return __accu0__;
		}) ();
		var dists = (function () {
			var __accu0__ = [];
			for (var t of gts) {
				__accu0__.append (this.dist (map_pos, t.map_pos));
			}
			return __accu0__;
		}) ();
		var min_dist = Math.min(dists);
		if (max_range !== null) {
			if (min_dist > max_range) {
				return null;
			}
		}
		return gts [dists.index (min_dist)];
	}
	nearest_waypoint(map_pos, max_range) {
		if (typeof max_range == 'undefined' || (max_range != null && max_range.hasOwnProperty ("__kwargtrans__"))) {;
			var max_range = null;
		};
		var wps = (function () {
			var __accu0__ = [];
			for (var wp of this.iter_waypoints (map_pos)) {
				__accu0__.append (wp);
			}
			return __accu0__;
		}) ();
		var dists = (function () {
			var __accu0__ = [];
			for (var t of wps) {
				__accu0__.append (this.dist (map_pos, t));
			}
			return __accu0__;
		}) ();
		var min_dist = Math.min(dists);
		if (max_range !== null) {
			if (min_dist > max_range) {
				return null;
			}
		}
		return wps [dists.index (min_dist)];
	}
	guard_nearest_move(guard_pos, player_pos, include_player, max_dist) {
		if (typeof include_player == 'undefined' || (include_player != null && include_player.hasOwnProperty ("__kwargtrans__"))) {;
			var include_player = true;
		};
		if (typeof max_dist == 'undefined' || (max_dist != null && max_dist.hasOwnProperty ("__kwargtrans__"))) {;
			var max_dist = 1000;
		};
		var g_to_p_dist = this.dist (player_pos, guard_pos);
		var wps = (function () {
			var __accu0__ = [];
			for (var wp of this.iter_waypoints ()) {
				__accu0__.append (wp);
			}
			return __accu0__;
		}) ();
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
			return candidates [-(1)];
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
			spots [tuple (map_pos)] = 0;
		}
		if (__in__ (self [map_pos], ['U', 'L', 'L0', 'L1', 'L2'])) {
			var walk_costs = {'U': 1, 'L': 1, 'L0': 1, 'L1': 1, 'L2': 1}
		}
		else if (__in__ (self [map_pos], this.building_types)) {
			var walk_costs = {'B': 1, 'B0': 1, 'U': 1, 'L': 1, 'L0': 1, 'L1': 1, 'L2': 1}
		}
		for (var pos of this.iter_in_range (map_pos, 1.5)) {
			if (__in__ (self [pos], walk_costs)) {
				var cur_dist = spots [tuple (map_pos)] + walk_costs [self [pos]] * this.dist (pos, map_pos);
				if (__in__ (tuple (pos), spots) && cur_dist >= spots [pos]) {
					continue;
				}
				if (cur_dist <= dist) {
					spots [tuple (pos)] = cur_dist;
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
