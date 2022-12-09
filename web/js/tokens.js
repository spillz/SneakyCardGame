class Token extends BoxLayout {
	map_pos = ListProperty ();
	off = ListProperty ();
	__init__() {
		var map_pos = extract_kwarg (kwargs, 'map_pos', tuple ([0, 0]));
		__super__ (Token, '__init__') (self, __kwargtrans__ (kwargs));
		this._old_map_pos = map_pos;
		this.map_pos = map_pos;
		this._a = null;
		this.pos = tuple ([(this.map_pos [0] + this.off [0]) * this.size [0], (this.map_pos [1] + this.off [1]) * this.size [1]]);
		this.bind (__kwargtrans__ ({map_pos: this.func_on_map_pos}));
		this.bind (__kwargtrans__ ({off: this.func_on_off}));
	}
	func_on_map_pos(obj, mp) {
		var pos = tuple ([(this.map_pos [0] + this.off [0]) * this.size [0], (this.map_pos [1] + this.off [1]) * this.size [1]]);
		var dur = 0.1 * cards.dist (this._old_map_pos, this.map_pos);
		this._old_map_pos = this.map_pos;
		this._a = Animation (__kwargtrans__ ({pos: pos, duration: dur}));
		this._a.bind (__kwargtrans__ ({on_complete: this.anim_done}));
		this._a.start (self);
	}
	func_on_off(obj, off) {
		this.func_on_map_pos (obj, off);
	}
	anim_done(obj, val) {
		this._a = null;
		this.pos = tuple ([(this.map_pos [0] + this.off [0]) * this.size [0], (this.map_pos [1] + this.off [1]) * this.size [1]]);
	}
	on_size(obj, sz) {
		if (this._a !== null) {
			this._a.cancel ();
		}
		this.pos = tuple ([(this.map_pos [0] + this.off [0]) * this.size [0], (this.map_pos [1] + this.off [1]) * this.size [1]]);
		this.draw_token ();
	}
	on_parent() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		this.draw_token ();
	}
	on_pos() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		this.draw_token ();
	}
	on_off() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		this.draw_token ();
	}
	draw_token() {
		return ;
	}
}

class PlayerToken extends Token {
}

class TargetToken extends Token {
	lock_level = 1;
	loot_level = 1;
	has_loot = BooleanProperty (true);
	picked = BooleanProperty (false);
	draw_token() {
		this.canvas.after.py_clear ();
		var __withid0__ = this.canvas.after;
		try {
			__withid0__.__enter__ ();
			Color (0.1, 0.3, 0.8, 1);
			var x = this.x + Math.floor (this.width / 5);
			var y = this.y + Math.floor (this.height / 5);
			var __left0__ = tuple ([(Math.floor ((Math.floor ((3 * this.size [0]) / 5)) / 2)) * 2, (Math.floor ((Math.floor ((3 * this.size [1]) / 5)) / 2)) * 2]);
			var w = __left0__ [0];
			var h = __left0__ [1];
			var vertices = [x + Math.floor (w / 2), y, 0, 0, x, y + Math.floor ((2 * h) / 3), 0, 0, x + Math.floor (w / 4), y + h, 0, 0, x + Math.floor ((3 * w) / 4), y + h, 0, 0, x + w, y + Math.floor ((2 * h) / 3), 0, 0];
			var indices = [0, 4, 3, 2, 1];
			Mesh (__kwargtrans__ ({vertices: vertices, indices: indices, mode: 'triangle_fan'}));
			__withid0__.__exit__ ();
		}
		catch (__except0__) {
			if (! (__withid0__.__exit__ (__except0__.name, __except0__, __except0__.stack))) {
				throw __except0__;
			}
		}
	}
}

class MarketToken extends Token {
	lock_level = 1;
	loot_level = 1;
	draw_token() {
		this.canvas.after.py_clear ();
		var __withid0__ = this.canvas.after;
		try {
			__withid0__.__enter__ ();
			Color (0.6, 0.4, 0, 1);
			var x = this.x + Math.floor (this.width / 5);
			var y = this.y + Math.floor (this.height / 5);
			var __left0__ = tuple ([(Math.floor ((Math.floor ((3 * this.size [0]) / 5)) / 2)) * 2, (Math.floor ((Math.floor ((3 * this.size [1]) / 5)) / 2)) * 2]);
			var w = __left0__ [0];
			var h = __left0__ [1];
			Ellipse (__kwargtrans__ ({pos: tuple ([x, y]), size: tuple ([w, h])}));
			__withid0__.__exit__ ();
		}
		catch (__except0__) {
			if (! (__withid0__.__exit__ (__except0__.name, __except0__, __except0__.stack))) {
				throw __except0__;
			}
		}
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
			if (this.collide_point (...touch.pos)) {
				this.parent.parent.parent.marketdeck.select_draw (0, 4, 0);
			}
			return true;
		}
	}
}

class GuardToken extends Token {
	state = 'dozing';
	frozen = false;
	on_state() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		this.draw_token ();
		if (this.state != 'dozing') {
			var stats = this.parent.parent.parent.stats;
			if (this.state == 'dead') {
				stats.kills++;
				stats.t_kills++;
			}
			if (this.state == 'unconscious') {
				stats.knockouts++;
				stats.t_knockouts++;
			}
			if (this.state == 'alert' && this.parent.active_player_token.map_pos == this.map_pos) {
				stats.contacts++;
				stats.t_contacts++;
			}
		}
	}

	draw_token() {
		this.canvas.after.py_clear ();
		var __withid0__ = this.canvas.after;
		try {
			__withid0__.__enter__ ();
			if (__in__ (this.state, ['dozing', 'alert'])) {
				Color (__kwargtrans__ ({rgb: tuple ([0.75, 0, 0])}));
			}
			else {
				Color (__kwargtrans__ ({rgb: tuple ([0.5, 0.1, 0.1])}));
			}
			Ellipse (__kwargtrans__ ({pos: tuple ([this.x + Math.floor (this.width / 10), this.y + Math.floor (this.height / 10)]), size: tuple ([Math.floor ((this.width * 4) / 5), Math.floor ((this.height * 4) / 5)])}));
			if (this.state == 'alert') {
				Color (__kwargtrans__ ({rgb: tuple ([0.4, 0, 0])}));
			}
			else {
				Color (__kwargtrans__ ({rgb: tuple ([0, 0, 0])}));
			}
			if (__in__ (this.state, ['dozing', 'alert'])) {
				Ellipse (__kwargtrans__ ({pos: tuple ([(this.x + Math.floor (this.width / 3)) - Math.floor ((this.width * 3) / 40), (this.y + Math.floor ((this.height * 2) / 5)) - Math.floor ((this.height * 3) / 40)]), size: tuple ([Math.floor ((this.width * 3) / 10), Math.floor ((this.height * 3) / 10)]), angle_start: (this.state == 'dozing' ? 270 : 290), angle_end: (this.state == 'dozing' ? 450 : 470)}));
				Ellipse (__kwargtrans__ ({pos: tuple ([(this.x + Math.floor ((this.width * 2) / 3)) - Math.floor ((this.width * 3) / 40), (this.y + Math.floor ((this.height * 2) / 5)) - Math.floor ((this.height * 3) / 40)]), size: tuple ([Math.floor ((this.width * 3) / 10), Math.floor ((this.height * 3) / 10)]), angle_start: (this.state == 'dozing' ? 270 : 250), angle_end: (this.state == 'dozing' ? 450 : 430)}));
			}
			else if (this.state == 'dead') {
				var eyeleft = (this.x + Math.floor (this.width / 3)) - Math.floor ((this.width * 3) / 40);
				var eyeright = (this.x + Math.floor (this.width / 3)) + Math.floor ((this.width * 3) / 40);
				var eyetop = (this.y + Math.floor (this.height / 2)) - Math.floor ((this.height * 3) / 40);
				var eyebottom = (this.y + Math.floor (this.height / 2)) + Math.floor ((this.height * 3) / 40);
				Line (__kwargtrans__ ({points: tuple ([eyeleft, eyebottom, eyeright, eyetop])}));
				Line (__kwargtrans__ ({points: tuple ([eyeleft, eyetop, eyeright, eyebottom])}));
				var eyeleft = (this.x + Math.floor ((this.width * 2) / 3)) - Math.floor ((this.width * 3) / 40);
				var eyeright = (this.x + Math.floor ((this.width * 2) / 3)) + Math.floor ((this.width * 3) / 40);
				var eyetop = (this.y + Math.floor (this.height / 2)) - Math.floor ((this.height * 3) / 40);
				var eyebottom = (this.y + Math.floor (this.height / 2)) + Math.floor ((this.height * 3) / 40);
				Line (__kwargtrans__ ({points: tuple ([eyeleft, eyebottom, eyeright, eyetop])}));
				Line (__kwargtrans__ ({points: tuple ([eyeleft, eyetop, eyeright, eyebottom])}));
			}
			else {
				var eyeleft = (this.x + Math.floor (this.width / 3)) - Math.floor ((this.width * 3) / 40);
				var eyeright = (this.x + Math.floor (this.width / 3)) + Math.floor ((this.width * 3) / 40);
				var eyemiddle = this.y + Math.floor (this.height / 2);
				Line (__kwargtrans__ ({points: tuple ([eyeleft, eyemiddle, eyeright, eyemiddle])}));
				var eyeleft = (this.x + Math.floor ((this.width * 2) / 3)) - Math.floor ((this.width * 3) / 40);
				var eyeright = (this.x + Math.floor ((this.width * 2) / 3)) + Math.floor ((this.width * 3) / 40);
				var eyemiddle = this.y + Math.floor (this.height / 2);
				Line (__kwargtrans__ ({points: tuple ([eyeleft, eyemiddle, eyeright, eyemiddle])}));
			}
			Color (__kwargtrans__ ({rgb: tuple ([0, 0, 0])}));
			if (this.state == 'dead') {
				Ellipse (__kwargtrans__ ({pos: tuple ([this.x + Math.floor ((this.width * 2) / 5), this.y + Math.floor (this.height / 4)]), size: tuple ([Math.floor (this.width / 5), Math.floor (this.height / 5)])}));
			}
			else {
				Line (__kwargtrans__ ({width: 1 + Math.floor (this.height / 30), points: tuple ([this.x + Math.floor ((this.width * 2) / 5), this.y + Math.floor (this.height / 3), this.x + Math.floor ((this.width * 3) / 5), this.y + Math.floor (this.height / 3)])}));
			}
			__withid0__.__exit__ ();
		}
		catch (__except0__) {
			if (! (__withid0__.__exit__ (__except0__.name, __except0__, __except0__.stack))) {
				throw __except0__;
			}
		}
	}
}

class ObjectiveToken extends TargetToken {
	has_loot = BooleanProperty (false);
	on_picked(obj, value) {
		if (this.picked) {
			var pa = this.parent.parent.parent;
			pa.level_complete ();
		}
	}
	draw_token() {
		this.canvas.after.py_clear ();
		var __withid0__ = this.canvas.after;
		try {
			__withid0__.__enter__ ();
			Color (0.8, 0.8, 0.0, 1);
			var x = this.x + Math.floor (this.width / 5);
			var y = this.y + Math.floor (this.height / 5);
			var __left0__ = tuple ([(Math.floor ((Math.floor ((3 * this.size [0]) / 5)) / 2)) * 2, (Math.floor ((Math.floor ((3 * this.size [1]) / 5)) / 2)) * 2]);
			var w = __left0__ [0];
			var h = __left0__ [1];
			var vertices1 = [x + Math.floor (w / 2), y, 0, 0, x, y + Math.floor ((3 * h) / 4), 0, 0, x + w, y + Math.floor ((3 * h) / 4), 0, 0];
			var vertices2 = [x + Math.floor (w / 2), y + h, 0, 0, x, y + Math.floor (h / 4), 0, 0, x + w, y + Math.floor (h / 4), 0, 0];
			var indices = [0, 1, 2];
			Mesh (__kwargtrans__ ({vertices: vertices1, indices: indices, mode: 'triangle_fan'}));
			Mesh (__kwargtrans__ ({vertices: vertices2, indices: indices, mode: 'triangle_fan'}));
			__withid0__.__exit__ ();
		}
		catch (__except0__) {
			if (! (__withid0__.__exit__ (__except0__.name, __except0__, __except0__.stack))) {
				throw __except0__;
			}
		}
	}
}

