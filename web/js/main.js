// Transcrypt'ed from Python, 2022-11-25 14:48:57
var __name__ = '__main__';

export var scroll_to = function (self, widget, padding, animate) {
	if (typeof padding == 'undefined' || (padding != null && padding.hasOwnProperty ("__kwargtrans__"))) {;
		var padding = 10;
	};
	if (typeof animate == 'undefined' || (animate != null && animate.hasOwnProperty ("__kwargtrans__"))) {;
		var animate = true;
	};
	if (!(this.parent)) {
		return ;
	}
	if (hasattr (this._viewport, 'do_layout')) {
		if (this._viewport._trigger_layout.is_triggered) {
			Clock.schedule_once ((function __lambda__ () {
				var dt = tuple ([].slice.apply (arguments).slice (0));
				return this.scroll_to (widget, padding, animate);
			}));
			return ;
		}
	}
	if (isinstance (padding, tuple ([int, float]))) {
		var padding = tuple ([padding, padding]);
	}
	var pos = this.parent.to_widget (...widget.to_window (...widget.pos));
	var cor = this.parent.to_widget (...widget.to_window (widget.right, widget.top));
	var __left0__ = 0;
	var dx = __left0__;
	var dy = __left0__;
	if (pos [1] < this.y + dp (padding [1])) {
		var dy = (this.y - pos [1]) + dp (padding [1]);
	}
	else if (cor [1] > this.top - dp (padding [1])) {
		var dy = (this.top - cor [1]) - dp (padding [1]);
	}
	if (pos [0] < this.x + dp (padding [0])) {
		var dx = (this.x - pos [0]) + dp (padding [0]);
	}
	else if (cor [0] > this.right - dp (padding [0])) {
		var dx = (this.right - cor [0]) - dp (padding [0]);
	}
	var __left0__ = this.convert_distance_to_scroll (dx, dy);
	var dsx = __left0__ [0];
	var dsy = __left0__ [1];
	var sxp = Math.min(1, Math.max(0, this.scroll_x - dsx));
	var syp = Math.min(1, Math.max(0, this.scroll_y - dsy));
	if (animate) {
		if (animate === true) {
			var animate = {'d': 0.2, 't': 'out_quad'}
		}
		Animation.stop_all (this, 'scroll_x', 'scroll_y');
		Animation (__kwargtrans__ (__mergekwargtrans__ ({scroll_x: sxp, scroll_y: syp}, animate))).start (self);
	}
	else {
		this.scroll_x = sxp;
		this.scroll_y = syp;
	}
};
ScrollView.scroll_to = scroll_to;
class TurnState extends object {
}

class ButLabel extends Label {
	pressed = BooleanProperty (false);
	touching = BooleanProperty (false);
	on_touch_down(touch) {
		if (this.collide_point (...touch.pos)) {
			touch.grab (self);
			this.touching = true;
			return true;
		}
	}
	on_touch_up(touch) {
		if (touch.grab_current == self) {
			touch.ungrab (self);
			if (this.collide_point (...touch.pos)) {
				this.pressed = true;
			}
			this.touching = false;
			return true;
		}
	}
}

class CardSelector extends BoxLayout {
	cards = ListProperty ();
	num_to_pick = NumericProperty ();
	but_ok_pressed = BooleanProperty ();
	card_size = ListProperty ();
	on_cards() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		for (var c of this.card_splay.children.__getslice__ (0, null, 1)) {
			if (isinstance (c, cards.Card)) {
				c.unbind (__kwargtrans__ ({on_touch_up: this.on_touch_up_card}));
				c.unbind (__kwargtrans__ ({on_touch_down: this.on_touch_down_card}));
				this.card_splay.remove_widget (c);
			}
		}
		for (var c of this.cards) {
			this.card_splay.add_widget (c);
			c.bind (__kwargtrans__ ({on_touch_up: this.on_touch_up_card}));
			c.bind (__kwargtrans__ ({on_touch_down: this.on_touch_down_card}));
			c.size = this.card_size;
			c.face_up = true;
		}
	}
	on_touch_down_card(card, touch) {
		if (card.collide_point (...touch.pos)) {
			touch.grab (card);
			return true;
		}
	}
	on_touch_up_card(card, touch) {
		if (touch.grab_current == card) {
			touch.ungrab (card);
			if (!(card.collide_point (...touch.pos))) {
				return true;
			}
			if (this.num_to_pick > 1) {
				var sel = (function () {
					var __accu0__ = [];
					for (var c of this.cards) {
						if (c.selected) {
							__accu0__.append (c);
						}
					}
					return __accu0__;
				}) ();
				if (len (sel) >= this.num_to_pick) {
					return true;
				}
				card.selected = !(card.selected);
			}
			else if (this.num_to_pick == 1) {
				for (var c of this.cards) {
					if (c == card) {
						c.selected = !(c.selected);
					}
					else {
						c.selected = false;
					}
				}
			}
			return true;
		}
	}
	on_parent() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		if (this.parent !== null) {
			this.card_size = this.parent.card_size;
			this.parent.bind (__kwargtrans__ ({card_size: this.setter ('card_size')}));
		}
	}
	on_touch_down(touch) {
		__super__ (CardSelector, 'on_touch_down') (self, touch);
		return true;
	}
	on_touch_up(touch) {
		__super__ (CardSelector, 'on_touch_up') (self, touch);
		return true;
	}
}
class CardSplayCloseup extends ModalView {
	cards = ListProperty ();
	__init__(closeup_card, cards) {
		if (typeof closeup_card == 'undefined' || (closeup_card != null && closeup_card.hasOwnProperty ("__kwargtrans__"))) {;
			var closeup_card = null;
		};
		if (typeof cards == 'undefined' || (cards != null && cards.hasOwnProperty ("__kwargtrans__"))) {;
			var cards = [];
		};
		var args = tuple ([].slice.apply (arguments).slice (3));
		__super__ (CardSplayCloseup, '__init__') (self, ...args, __kwargtrans__ (kwargs));
		this.closeup_card = null;
		if (closeup_card === null) {
			var closeup_card = cards [0];
		}
		this.size_hint = tuple ([0.8, 0.8]);
		this.content = RelativeLayout ();
		this.add_widget (this.content);
		this.scroll_view = ScrollView (__kwargtrans__ ({size_hint: tuple ([null, null])}));
		this.scroll_view.bind (__kwargtrans__ ({on_touch_down: this.on_touch_down_sv}));
		this.content.add_widget (this.scroll_view);
		this.grid_layout = GridLayout (__kwargtrans__ ({cols: 4, size_hint: tuple ([1, null]), spacing: 1, padding: 1}));
		this.grid_layout.bind (__kwargtrans__ ({minimum_height: this.grid_layout.setter ('height')}));
		this.scroll_view.add_widget (this.grid_layout);
		this.cards = (function () {
			var __accu0__ = [];
			for (var c of cards) {
				__accu0__.append (py_typeof (c) ());
			}
			return __accu0__;
		}) ();
		this.aspect = closeup_card.width / closeup_card.height;
		for (var [c, c0] of zip (this.cards, cards)) {
			c.height = c0.height;
			c.width = c0.width;
			c.face_up = true;
			if (c == closeup_card) {
				c.selected = true;
			}
			c.bind (__kwargtrans__ ({on_touch_up: this.on_touch_up_card}));
			c.bind (__kwargtrans__ ({on_touch_down: this.on_touch_down_card}));
			this.grid_layout.add_widget (c);
		}
		if (closeup_card !== null) {
			this.set_closeup (closeup_card);
		}
	}
	set_closeup(closeup_card) {
		if (this.closeup_card !== null) {
			this.content.remove_widget (this.closeup_card);
		}
		if (len (this.cards) > 0) {
			this.closeup_card = this.cards [0];
		}
		this.closeup_card = py_typeof (closeup_card) ();
		this.closeup_card.face_up = true;
		this.content.add_widget (this.closeup_card);
		this.on_size ();
	}
	on_size() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		var pref_width = int (this.height * this.aspect);
		var pref_height = int (this.width / this.aspect);
		var ratio = 1;
		if (pref_width <= this.width) {
			if (len (this.cards) > 0 && pref_width > 0.66 * this.width) {
				var ratio = (0.66 * this.width) / pref_width;
				var pref_width = int (0.66 * this.width);
			}
			this.closeup_card.size = tuple ([pref_width, int (this.height * ratio)]);
			if (len (this.cards) == 0) {
				this.closeup_card.x = Math.floor ((this.width - pref_width) / 2);
				this.scroll_view.width = 1;
				this.scroll_view.height = 1;
				this.scroll_view.pos = tuple ([-(10), -(10)]);
			}
			else {
				this.closeup_card.pos = tuple ([0, 0]);
				this.scroll_view.width = this.width - pref_width;
				this.scroll_view.height = this.height;
				this.scroll_view.pos = tuple ([this.closeup_card.width, 0]);
			}
		}
		else {
			if (len (this.cards) > 0 && pref_height > 0.5 * this.height) {
				var ratio = (0.5 * this.height) / pref_height;
				var pref_height = int (0.5 * this.height);
			}
			this.closeup_card.size = tuple ([this.width * ratio, pref_height]);
			if (len (this.cards) == 0) {
				this.closeup_card.y = Math.floor ((this.height - pref_height) / 2);
				this.scroll_view.width = 1;
				this.scroll_view.height = 1;
				this.scroll_view.pos = tuple ([-(10), -(10)]);
			}
			else {
				this.closeup_card.pos = tuple ([0, 0]);
				this.scroll_view.width = this.width;
				this.scroll_view.height = this.height - pref_height;
				this.scroll_view.pos = tuple ([0, this.closeup_card.height]);
			}
		}
		if (len (this.cards) > 0) {
			this.grid_layout.cols = int (Math.floor (this.scroll_view.width / this.cards [0].width));
		}
		for (var c of this.cards) {
			// pass;
		}
	}
	on_touch_down_card(card, touch) {
		if (card.collide_point (...touch.pos)) {
			touch.grab (card);
			return true;
		}
	}
	on_touch_up_card(card, touch) {
		if (touch.grab_current == card) {
			touch.ungrab (card);
			for (var c0 of this.cards) {
				c0.selected = false;
			}
			card.selected = true;
			this.set_closeup (card);
			return true;
		}
	}
	on_touch_down_sv(sv, touch) {
		if (!(this.scroll_view.collide_point (...touch.pos))) {
			this.dismiss ();
			return true;
		}
	}
}
class CardSplay extends FloatLayout {
	cards = ListProperty ();
	orientation = StringProperty ('horizontal');
	can_draw = BooleanProperty (false);
	shown_card = ObjectProperty (null, __kwargtrans__ ({allownone: true}));
	shown_card_shift = 0;
	selected = BooleanProperty (false);
	multi_select = BooleanProperty (false);
	__init__() {
		if (__in__ ('card_spread_scale', kwargs)) {
			this.card_spread_scale = kwargs ['card_spread_scale'];
			delete kwargs ['card_spread_scale'];
		}
		else {
			this.card_spread_scale = 0.5;
		}
		__super__ (CardSplay, '__init__') (self, __kwargtrans__ (kwargs));
		this.touch_card = null;
		this._clockev = null;
		this._splay_clockev = null;
	}
	on_cards() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		for (var c of this.children.__getslice__ (0, null, 1)) {
			if (isinstance (c, cards.Card)) {
				this.remove_widget (c);
				c.selected = false;
			}
		}
		for (var c of this.cards) {
			this.add_widget (c);
			c.size = this.parent.card_size;
			c.selected = false;
		}
		this.shown_card = null;
		this.splay_cards ();
	}
	on_size() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		this.splay_cards (__kwargtrans__ ({anim: false}));
	}
	splay_cards(anim) {
		if (typeof anim == 'undefined' || (anim != null && anim.hasOwnProperty ("__kwargtrans__"))) {;
			var anim = true;
		};
		if (this._splay_clockev !== null) {
			this._splay_clockev.cancel ();
		}
		this._splay_clockev = Clock.schedule_once (partial (this.do_splay_cards, __kwargtrans__ ({anim: anim})), 0.05);
	}
	do_splay_cards(time, anim) {
		if (typeof anim == 'undefined' || (anim != null && anim.hasOwnProperty ("__kwargtrans__"))) {;
			var anim = true;
		};
		this._splay_clockev = null;
		if (len (this.cards) == 0) {
			return ;
		}
		var cardw = this.parent.card_size [0];
		var cardh = this.parent.card_size [1];
		var mul = (this.shown_card === null || this.shown_card == this.cards [-(1)] || len (this.cards) <= 1 ? 1 : 2);
		if (this.orientation == 'horizontal') {
			var exp_len = cardw;
			var offset = 0;
			if (len (this.cards) > 1) {
				var delta = int (Math.max(Math.min(cardw * this.card_spread_scale, (this.width - cardw * mul) / ((len (this.cards) + 1) - mul)), 2));
			}
			else {
				var delta = 0;
			}
			if (delta == 2) {
				var max_splay = Math.floor ((this.width - cardw) / 2);
			}
			else {
				var max_splay = len (this.cards);
			}
		}
		else {
			var exp_len = -(cardh);
			var offset = this.height - cardh;
			if (len (this.cards) > 1) {
				var delta = -(int (Math.max(Math.min(cardh * this.card_spread_scale, (this.height - cardh * mul) / (len (this.cards) - mul)), 2)));
			}
			else {
				var delta = 0;
			}
			if (delta == -(2)) {
				var max_splay = Math.floor ((this.height - cardh) / 2);
			}
			else {
				var max_splay = len (this.cards);
			}
		}
		var i = 0;
		for (var c of this.cards) {
			if (this.orientation == 'horizontal') {
				var x = this.x + offset;
				var y = (c != this.shown_card ? this.y : this.y + this.shown_card_shift * cardh);
			}
			else {
				var y = this.y + offset;
				var x = (c != this.shown_card ? this.x : this.x + this.shown_card_shift * cardw);
			}
			if (anim) {
				if (len (this.cards) < 10) {
					var animc = Animation (__kwargtrans__ ({pos: c.pos, duration: i * 0.025})) + Animation (__kwargtrans__ ({pos: tuple ([x, y]), duration: 0.2}));
				}
				else {
					var animc = Animation (__kwargtrans__ ({pos: tuple ([x, y]), duration: 0.2}));
				}
				animc.start (c);
			}
			else {
				c.x = x;
				c.y = y;
			}
			if (c == this.shown_card) {
				offset += exp_len;
			}
			else if (i < max_splay) {
				offset += delta;
			}
			i++;
		}
	}
	on_shown_card(exp, card) {
		if (!(this.multi_select)) {
			for (var c of this.cards) {
				c.selected = false;
			}
		}
		if (this.shown_card !== null) {
			this.shown_card.selected = true;
		}
		if (this.shown_card === null && this.multi_select) {
			for (var c of this.cards) {
				c.selected = false;
			}
		}
		this.splay_cards ();
	}
	do_closeup(closeup_card, touch, time) {
		if (!(closeup_card.face_up)) {
			var closeup_card = null;
		}
		CardSplayCloseup (__kwargtrans__ ({closeup_card: closeup_card, cards: this.cards})).open ();
		this._clockev = null;
	}
	on_touch_down(touch) {
		for (var c of this.cards.__getslice__ (0, null, -(1))) {
			if (c.collide_point (...this.to_local (...touch.pos))) {
				touch.grab (self);
				this._clockev = Clock.schedule_once (partial (this.do_closeup, c, touch), 0.5);
				return true;
			}
		}
	}
	on_touch_up(touch) {
		if (touch.grab_current != self) {
			return ;
		}
		touch.ungrab (self);
		if (this._clockev != null) {
			this._clockev.cancel ();
			this._clockev = null;
			return true;
		}
	}
	move_to(cards, deck, pos) {
		if (typeof pos == 'undefined' || (pos != null && pos.hasOwnProperty ("__kwargtrans__"))) {;
			var pos = null;
		};
		this.cards = (function () {
			var __accu0__ = [];
			for (var c of this.cards) {
				if (!__in__ (c, cards)) {
					__accu0__.append (c);
				}
			}
			return __accu0__;
		}) ();
		if (pos !== null) {
			deck.cards = (deck.cards.__getslice__ (0, pos, 1) + cards) + deck.cards.__getslice__ (pos, null, 1);
		}
		else {
			deck.cards = deck.cards.__getslice__ (0, null, 1) + cards;
		}
	}
	__draw_frame() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		this.canvas.after.py_clear ();
		var __withid0__ = this.canvas.after;
		try {
			__withid0__.__enter__ ();
			Color (__kwargtrans__ ({rgba: tuple ([1, 1, 1, 1])}));
			Line (__kwargtrans__ ({width: 1, rectangle: tuple ([this.x, this.y, this.width, this.height])}));
			if (this.can_draw) {
				Color (__kwargtrans__ ({rgba: tuple ([240, 69, 0, 1])}));
				Line (__kwargtrans__ ({width: 1 + Math.floor (this.width / 30), points: tuple ([this.x + Math.floor (this.width / 10), this.y, this.x, this.y, this.x, this.y + Math.floor (this.width / 10)])}));
				Line (__kwargtrans__ ({width: 1 + Math.floor (this.width / 30), points: tuple ([this.right - Math.floor (this.width / 10), this.y, this.right, this.y, this.right, this.y + Math.floor (this.width / 10)])}));
				Line (__kwargtrans__ ({width: 1 + Math.floor (this.width / 30), points: tuple ([this.x + Math.floor (this.width / 10), this.top, this.x, this.top, this.x, this.top - Math.floor (this.width / 10)])}));
				Line (__kwargtrans__ ({width: 1 + Math.floor (this.width / 30), points: tuple ([this.right - Math.floor (this.width / 10), this.top, this.right, this.top, this.right, this.top - Math.floor (this.width / 10)])}));
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
class PlayerDiscard extends CardSplay {
	on_cards() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		for (var c of this.children.__getslice__ (0, null, 1)) {
			if (isinstance (c, cards.Card)) {
				c.face_up = false;
			}
		}
		__super__ (PlayerDiscard, 'on_cards') (self, ...args);
		for (var c of this.cards) {
			c.face_up = true;
		}
	}
}
class PlayerDeck extends CardSplay {
	on_cards() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		__super__ (PlayerDeck, 'on_cards') (self, ...args);
		for (var c of this.cards) {
			c.face_up = false;
		}
	}
	draw_hand() {
		if (len (this.parent.hand.cards) == 0) {
			var cards_to_draw = this.parent.hand.hand_size;
		}
		else {
			var cards_to_draw = (1 + this.parent.hand.hand_size) - len (this.parent.hand.cards);
		}
		this.draw (cards_to_draw);
		this.parent.hand.can_draw = true;
		this.parent.playertraits.can_draw = true;
		this.parent.eventdeck.can_draw = true;
		this.can_draw = false;
		this.parent.board.scroll_to_player ();
	}
	draw(n) {
		var shuffle = n - len (this.cards);
		var cards = this.cards.__getslice__ (-(1), -(n) - 1, -(1));
		this.move_to (cards, this.parent.hand);
		if (shuffle > 0) {
			var discards = this.parent.playerdiscard.cards.__getslice__ (0, null, 1);
			random.shuffle (discards);
			this.parent.playerdiscard.move_to (discards, self);
			var cards = this.cards.__getslice__ (-(1), -(shuffle) - 1, -(1));
			this.move_to (cards, this.parent.hand);
		}
	}
}
class PlayerTraits extends CardSplay {
	active_card = ObjectProperty (null, __kwargtrans__ ({allownone: true}));
	on_touch_up(touch) {
		__super__ (PlayerTraits, 'on_touch_up') (self, touch);
		if (!(this.collide_point (...touch.pos))) {
			return false;
		}
		if (!(this.can_draw)) {
			return false;
		}
		if (len (this.cards) == 0) {
			return false;
		}
		this.cards = [this.cards [-(1)]] + this.cards.__getslice__ (0, -(1), 1);
		return true;
	}
	on_cards() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		for (var c of this.cards) {
			c.face_up = true;
			c.selected = false;
		}
		__super__ (PlayerTraits, 'on_cards') (self, ...args);
		if (len (this.cards) > 0) {
			this.active_card = this.cards [-(1)];
		}
		else {
			this.active_card = null;
		}
	}
}
class ActiveCardSplay extends CardSplay {
	active_card = ObjectProperty (null, __kwargtrans__ ({allownone: true}));
	on_cards() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		__super__ (ActiveCardSplay, 'on_cards') (self, ...args);
		if (len (this.cards) > 0) {
			this.active_card = this.cards [-(1)];
		}
		else {
			this.active_card = null;
		}
	}
	on_touch_up(touch) {
		if (__super__ (ActiveCardSplay, 'on_touch_up') (self, touch) === null) {
			return ;
		}
		if (len (this.cards) > 0) {
			this.parent.hand.cancel_action ();
		}
		return true;
	}
	discard_used(unused, noise, exhaust_on_use, tap_on_use) {
		if (typeof unused == 'undefined' || (unused != null && unused.hasOwnProperty ("__kwargtrans__"))) {;
			var unused = 0;
		};
		if (typeof noise == 'undefined' || (noise != null && noise.hasOwnProperty ("__kwargtrans__"))) {;
			var noise = 0;
		};
		if (typeof exhaust_on_use == 'undefined' || (exhaust_on_use != null && exhaust_on_use.hasOwnProperty ("__kwargtrans__"))) {;
			var exhaust_on_use = null;
		};
		if (typeof tap_on_use == 'undefined' || (tap_on_use != null && tap_on_use.hasOwnProperty ("__kwargtrans__"))) {;
			var tap_on_use = null;
		};
		if (unused > 0) {
			var cards0 = this.cards.__getslice__ (0, unused, 1);
			this.move_to (cards0, this.parent.hand);
		}
		if (len (this.cards) > 0) {
			if (exhaust_on_use !== null) {
				if (isinstance (exhaust_on_use, cards.TraitCard)) {
					this.parent.playertraits.move_to ([exhaust_on_use], this.parent.exhausted);
				}
				else {
					this.move_to ([exhaust_on_use], this.parent.exhausted);
				}
			}
			if (tap_on_use !== null) {
				if (isinstance (tap_on_use, cards.TraitCard)) {
					tap_on_use.tapped = true;
				}
			}
		}
		var cards0 = this.cards.__getslice__ (0, null, 1);
		this.move_to (cards0, this.parent.playerdiscard);
		this.parent.hand.clear_selection ();
	}
}
class ActionSelectorOption extends Label {
	_touching = BooleanProperty (false);
	on_touch_down(touch) {
		if (this.collide_point (...touch.pos)) {
			touch.grab (self);
			this._touching = true;
			return true;
		}
	}
	on_touch_up(touch) {
		if (touch.grab_current == self) {
			touch.ungrab (self);
			this.parent.hand.selected_action = this.text;
			this._touching = false;
			return true;
		}
	}
}
class ActionSelector extends BoxLayout {
	__init__(hand, actions) {
		this.hand = hand;
		__super__ (ActionSelector, '__init__') (self, __kwargtrans__ (__mergekwargtrans__ ({orientation: 'vertical'}, kwargs)));
		for (var a of actions) {
			this.add_widget (ActionSelectorOption (__kwargtrans__ ({text: a})));
		}
	}
}
class Hand extends CardSplay {
	selected_action = StringProperty ('');
	actions = DictProperty ();
	action_selector = ObjectProperty (null, __kwargtrans__ ({allownone: true}));
	hand_size = NumericProperty (5);
	on_selected_action() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		if (this.selected_action != '') {
			this.move_to ([this.shown_card], this.parent.activecardsplay);
			var action = this.selected_action;
			var action_fn = this.actions [action];
			action_fn ('card_action_selected');
			this.clear_card_actions ();
		}
	}
	clear_card_actions() {
		if (this.action_selector !== null) {
			this.parent.remove_widget (this.action_selector);
			this.action_selector = null;
		}
	}
	show_card_actions(card, actions) {
		this.clear_card_actions ();
		var pos = card.pos;
		var sz = card.size;
		var pos = tuple ([pos [0], pos [1] + sz [1]]);
		var sz = tuple ([2 * sz [0], Math.floor ((len (actions) * sz [1]) / 5)]);
		this.selected_action = '';
		this.actions = actions;
		this.action_selector = ActionSelector (self, actions, __kwargtrans__ ({pos: pos, size: sz, size_hint: tuple ([null, null])}));
		this.parent.add_widget (this.action_selector);
	}
	cancel_action() {
		if (this.selected_action != '') {
			var action = this.selected_action;
			var action_fn = this.actions [action];
			action_fn ('card_action_end');
			this.selected_action = '';
			this.clear_selection ();
		}
	}
	on_touch_up(touch) {
		if (__super__ (Hand, 'on_touch_up') (self, touch) === null) {
			return ;
		}
		if (len (this.cards) == 0) {
			return true;
		}
		if (this.can_draw == false) {
			return true;
		}
		for (var c of this.cards.__getslice__ (0, null, -(1))) {
			if (c.collide_point (...this.to_local (...touch.pos))) {
				if (this.shown_card == c) {
					this.clear_selection ();
					this.shown_card = null;
				}
				else if (this.selected_action != '') {
					var action_fn = this.actions [this.selected_action];
					if (action_fn ('can_stack', __kwargtrans__ ({stacked_card: c}))) {
						this.move_to ([c], this.parent.activecardsplay, 0);
						action_fn ('card_stacked', __kwargtrans__ ({stacked_card: c}));
						return true;
					}
				}
				else {
					this.clear_selection ();
					this.shown_card = c;
					this.selected_action = '';
					this.parent.board.map_choices = [];
					var actions = c.get_actions (this.parent);
					for (var tc of this.parent.playertraits.cards) {
						var action_types = (function () {
							var __accu0__ = [];
							for (var a of actions.py_values ()) {
								__accu0__.append (py_typeof (a));
							}
							return __accu0__;
						}) ();
						var trait_actions = tc.get_actions_for_card (c, this.parent);
						for (var ta of trait_actions) {
							if (!__in__ (py_typeof (trait_actions [ta]), action_types)) {
								actions.py_update ([[ta, trait_actions [ta]]]);
							}
						}
					}
					this.show_card_actions (c, actions);
					this.parent.playerprompt.text = 'Select an action for this card';
					return true;
				}
				break;
			}
		}
		return true;
	}
	clear_selection() {
		this.parent.playerprompt.text = 'Select a card to play or touch the event deck to end your turn';
		this.parent.board.map_choices = [];
		for (var c of (function () {
			var __accu0__ = [];
			for (var c of this.cards) {
				if (c.selected) {
					__accu0__.append (c);
				}
			}
			return __accu0__;
		}) ()) {
			c.selected = false;
		}
		this.clear_card_actions ();
		this.selected_action = '';
	}
	allow_stance_select() {
		this.parent.playertraits.can_draw = true;
	}
	on_cards() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		for (var c of this.cards) {
			c.face_up = true;
		}
		__super__ (Hand, 'on_cards') (self, ...args);
		if (len (this.cards) == 0) {
			this.parent.playerprompt.text = 'Touch the event deck to end your turn';
		}
		else {
			this.parent.playerprompt.text = 'Select a card from your hand to play';
		}
	}
}
class SkillDeck extends CardSplay {
	on_touch_up(touch) {
		__super__ (SkillDeck, 'on_touch_up') (self, touch);
	}
	select_draw(num_to_pick, num_offered) {
		if (typeof num_to_pick == 'undefined' || (num_to_pick != null && num_to_pick.hasOwnProperty ("__kwargtrans__"))) {;
			var num_to_pick = 2;
		};
		if (typeof num_offered == 'undefined' || (num_offered != null && num_offered.hasOwnProperty ("__kwargtrans__"))) {;
			var num_offered = 4;
		};
		var cards = this.cards.__getslice__ (-(num_offered), null, 1);
		if (len (cards) == 0) {
			print ('Warning: No skill cards available to pick');
			return ;
		}
		for (var c of cards) {
			this.cards.remove (c);
		}
		this.parent.cardselector = CardSelector (__kwargtrans__ ({num_to_pick: num_to_pick}));
		this.parent.add_widget (this.parent.cardselector);
		this.parent.cardselector.bind (__kwargtrans__ ({but_ok_pressed: this.card_picked}));
		this.parent.cardselector.cards = cards;
	}
	card_picked(cs, pressed) {
		for (var c of cs.cards) {
			cs.cards.remove (c);
			if (!(c.selected)) {
				c.face_up = false;
				this.cards.insert (0, c);
			}
			else {
				this.parent.hand.cards.append (c);
				c.face_up = true;
				c.selected = false;
			}
		}
		this.parent.remove_widget (cs);
		this.parent.cardselector = null;
	}
}
class LootDeck extends CardSplay {
	on_touch_up(touch) {
		__super__ (LootDeck, 'on_touch_up') (self, touch);
	}
	select_draw(num_to_pick, num_offered) {
		if (typeof num_to_pick == 'undefined' || (num_to_pick != null && num_to_pick.hasOwnProperty ("__kwargtrans__"))) {;
			var num_to_pick = 1;
		};
		if (typeof num_offered == 'undefined' || (num_offered != null && num_offered.hasOwnProperty ("__kwargtrans__"))) {;
			var num_offered = 1;
		};
		var cards = this.cards.__getslice__ (-(num_offered), null, 1);
		for (var c of cards) {
			this.cards.remove (c);
		}
		this.parent.cardselector = CardSelector (__kwargtrans__ ({num_to_pick: num_to_pick}));
		this.parent.add_widget (this.parent.cardselector);
		this.parent.cardselector.bind (__kwargtrans__ ({but_ok_pressed: this.card_picked}));
		this.parent.cardselector.cards = cards;
	}
	card_picked(cs, pressed) {
		for (var c of cs.cards) {
			cs.cards.remove (c);
			if (!(c.selected)) {
				c.face_up = false;
				this.cards.insert (0, c);
			}
			else {
				this.parent.hand.cards.append (c);
				c.face_up = true;
				c.selected = false;
			}
		}
		this.parent.remove_widget (cs);
		this.parent.cardselector = null;
		this.parent.stats.loot++;
		this.parent.stats.t_loot++;
	}
}
class MarketDeck extends CardSplay {
	on_touch_up(touch) {
		return __super__ (MarketDeck, 'on_touch_up') (self, touch);
	}
	select_draw(num_to_pick, num_offered, coin) {
		if (typeof num_to_pick == 'undefined' || (num_to_pick != null && num_to_pick.hasOwnProperty ("__kwargtrans__"))) {;
			var num_to_pick = 1;
		};
		if (typeof num_offered == 'undefined' || (num_offered != null && num_offered.hasOwnProperty ("__kwargtrans__"))) {;
			var num_offered = 1;
		};
		if (typeof coin == 'undefined' || (coin != null && coin.hasOwnProperty ("__kwargtrans__"))) {;
			var coin = 1;
		};
		var cards = this.cards.__getslice__ (-(num_offered), null, 1);
		this.cards = this.cards.__getslice__ (0, -(num_offered), 1);
		this.parent.cardselector = CardSelector (__kwargtrans__ ({num_to_pick: num_to_pick}));
		this.parent.add_widget (this.parent.cardselector);
		this.parent.cardselector.bind (__kwargtrans__ ({but_ok_pressed: this.card_picked}));
		this.parent.cardselector.cards = cards;
	}
	card_picked(cs, pressed) {
		var cards = cs.cards.__getslice__ (0, null, 1);
		cs.cards = [];
		for (var c of cards) {
			if (!(c.selected)) {
				c.face_up = false;
				this.cards.append (c);
			}
			else {
				this.parent.hand.cards.append (c);
				c.face_up = true;
				c.selected = false;
			}
		}
		this.parent.remove_widget (cs);
		this.parent.cardselector = null;
	}
}
class Exhausted extends CardSplay {
	on_touch_up(touch) {
		return __super__ (Exhausted, 'on_touch_up') (self, touch);
	}
	on_cards() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		for (var c of this.children.__getslice__ (0, null, 1)) {
			if (isinstance (c, cards.Card)) {
				c.face_up = false;
			}
		}
		__super__ (Exhausted, 'on_cards') (self, ...args);
		for (var c of this.cards) {
			c.face_up = true;
		}
	}
}
class EventDeck extends CardSplay {
	can_draw = BooleanProperty (false);
	on_touch_up(touch) {
		if (__super__ (EventDeck, 'on_touch_up') (self, touch) === null) {
			return ;
		}
		if (!(this.collide_point (...touch.pos))) {
			return true;
		}
		return this.draw ();
	}
	draw() {
		if (!(this.can_draw)) {
			return true;
		}
		if (len (this.cards) == 0) {
			return true;
		}
		if (this.parent.clear_and_check_end_game ()) {
			return true;
		}
		for (var t of this.parent.board.iter_tokens ('G')) {
			t.frozen = false;
		}
		var card = this.cards [-(1)];
		card.face_up = true;
		for (var c of this.parent.playertraits.cards) {
			c.tapped = false;
		}
		this.move_to ([card], this.parent.eventdiscard);
		card.activate (this.parent.board);
		this.parent.playerdeck.draw_hand ();
		this.parent.stats.rounds++;
		this.parent.stats.t_rounds++;
		return true;
	}
}
class EventDiscard extends CardSplay {
	on_touch_up(touch) {
		if (__super__ (EventDiscard, 'on_touch_up') (self, touch) == true) {
			return true;
		}
	}
	on_cards() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		for (var c of this.children.__getslice__ (0, null, 1)) {
			if (isinstance (c, cards.Card)) {
				c.face_up = false;
			}
		}
		__super__ (EventDiscard, 'on_cards') (self, ...args);
		for (var c of this.cards) {
			c.face_up = true;
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
export var extract_kwarg = function (kwargs, py_name, py_default) {
	if (typeof py_default == 'undefined' || (py_default != null && py_default.hasOwnProperty ("__kwargtrans__"))) {;
		var py_default = null;
	};
	if (__in__ (py_name, kwargs)) {
		var ret = kwargs [py_name];
		delete kwargs [py_name];
	}
	else {
		var ret = py_default;
	}
	return ret;
};
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

class TokenMapChoice extends BoxLayout {
	__init__() {
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

class Stats extends BoxLayout {
	kills = NumericProperty ();
	knockouts = NumericProperty ();
	contacts = NumericProperty ();
	loot = NumericProperty ();
	rounds = NumericProperty ();
	missions = NumericProperty ();
	showing = BooleanProperty ();
	t_kills = NumericProperty ();
	t_knockouts = NumericProperty ();
	t_contacts = NumericProperty ();
	t_loot = NumericProperty ();
	t_rounds = NumericProperty ();
	reset(totals) {
		if (typeof totals == 'undefined' || (totals != null && totals.hasOwnProperty ("__kwargtrans__"))) {;
			var totals = true;
		};
		this.kills = 0;
		this.knockouts = 0;
		this.contacts = 0;
		this.loot = 0;
		this.rounds = 0;
		this.showing = false;
		if (totals) {
			this.t_kills = 0;
			this.t_knockouts = 0;
			this.t_contacts = 0;
			this.t_loot = 0;
			this.t_rounds = 0;
			this.t_showing = false;
		}
	}
	on_parent1() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		var parent = this.parent;
		if (parent === null) {
			return ;
		}
		this.center_x = Math.floor (-(this.parent.width) / 4);
		this.center_y = Math.floor (-(this.parent.height) / 4);
		this.width = Math.floor (this.parent.width / 4);
		this.height = Math.floor (this.parent.height / 4);
		var center_x = parent.center_x;
		var center_y = parent.center_y;
		var width = Math.floor ((3 * parent.width) / 4);
		var height = Math.floor ((3 * parent.height) / 4);
		var anim = Animation (__kwargtrans__ ({center_x: center_x, center_y: center_y, width: width, height: height, duration: 0.2}));
		anim.start (self);
	}
	on_touch_down(touch) {
		for (var but of tuple ([this.restart, this.quit, this.py_next])) {
			if (but.collide_point (...touch.pos) && but.active) {
				touch.grab (self);
				return true;
			}
		}
		return true;
	}
	on_touch_up(touch) {
		if (touch.grab_current == self) {
			touch.ungrab (this.restart);
			if (this.restart.collide_point (...touch.pos)) {
				this.parent.restart_game ();
				this.reset ();
				this.parent.menu_showing = false;
				return true;
			}
			if (this.py_next.collide_point (...touch.pos)) {
				this.parent.next_level ();
				this.reset (false);
				this.parent.menu_showing = false;
				return true;
			}
			if (this.quit.collide_point (...touch.pos)) {
				touch.ungrab (this.quit);
				gameapp.stop ();
				return true;
			}
			return true;
		}
	}
}

class PlayArea extends FloatLayout {
	menu_showing = ObjectProperty (false);
	__init__() {
		__super__ (PlayArea, '__init__') (self, __kwargtrans__ (kwargs));
		this.instructions = null;
		this.cardselector = null;
		this.first_start = true;
		this.mission = null;
		this.action_selector = null;
		this.stats = Stats ();
	}
	on_parent() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		this.playercards = cards.make_player_cards (self);
		this.traitcards = cards.make_trait_cards (self);
		this.lootcards = cards.make_loot_cards (self);
		this.marketcards = cards.make_market_cards (self);
		this.skillcards = cards.make_skill_cards (self);
		this.restart_game ();
	}
	card_setup(restart) {
		if (typeof restart == 'undefined' || (restart != null && restart.hasOwnProperty ("__kwargtrans__"))) {;
			var restart = false;
		};
		this.map.cards = [];
		this.exhausted.cards = [];
		this.eventdeck.cards = [];
		this.eventdiscard.cards = [];
		if (!(restart)) {
			var player_cards = ((this.playerdeck.cards + this.playerdiscard.cards) + this.hand.cards) + this.activecardsplay.cards;
		}
		this.hand.cards = [];
		this.playerdeck.cards = [];
		this.playerdiscard.cards = [];
		this.activecardsplay.cards = [];
		if (restart) {
			this.playertraits.cards = [];
			this.loot1.cards = [];
			this.loot2.cards = [];
			this.loot3.cards = [];
			this.marketdeck.cards = [];
			this.skilldeck.cards = [];
		}
		if (restart) {
			random.shuffle (this.playercards);
			this.playerdeck.cards = this.playercards;
			this.playertraits.cards = this.traitcards.__getslice__ (0, null, 1);
			for (var l of this.lootcards) {
				random.shuffle (l);
			}
			this.loot1.cards.__setslice__ (0, null, null, this.lootcards [0].__getslice__ (0, null, 1));
			this.loot2.cards.__setslice__ (0, null, null, this.lootcards [1].__getslice__ (0, null, 1));
			this.loot3.cards.__setslice__ (0, null, null, this.lootcards [2].__getslice__ (0, null, 1));
			random.shuffle (this.marketcards);
			this.marketdeck.cards.__setslice__ (0, null, null, this.marketcards.__getslice__ (0, null, 1));
			random.shuffle (this.skillcards);
			this.skilldeck.cards.__setslice__ (0, null, null, this.skillcards.__getslice__ (0, null, 1));
		}
		else {
			random.shuffle (player_cards);
			this.playerdeck.cards = player_cards;
		}
		this.mission = cards.ContactMission (__kwargtrans__ ({mission_level: this.stats.missions + 1}));
		this.map.cards.__setslice__ (0, null, null, this.mission.setup_map (self));
		this.eventdeck.cards.__setslice__ (0, null, null, this.mission.setup_events (self));
		this.eventdeck.can_draw = true;
	}
	token_setup() {
		var player = PlayerToken (__kwargtrans__ ({map_pos: tuple ([0, 0])}));
		var spawns = [];
		for (var c of this.map.cards) {
			spawns += (function () {
				var __accu0__ = [];
				for (var s of c.spawns) {
					__accu0__.append (this.board.get_pos_from_card (c, s));
				}
				return __accu0__;
			}) ();
		}
		var guards = (function () {
			var __accu0__ = [];
			for (var s of spawns) {
				__accu0__.append (GuardToken (__kwargtrans__ ({map_pos: s})));
			}
			return __accu0__;
		}) ();
		var loot = [];
		for (var c of this.map.cards) {
			loot += (function () {
				var __accu0__ = [];
				for (var s of c.targets) {
					__accu0__.append (this.board.get_pos_from_card (c, s));
				}
				return __accu0__;
			}) ();
		}
		var targets = (function () {
			var __accu0__ = [];
			for (var s of loot.__getslice__ (0, -(1), 1)) {
				__accu0__.append (TargetToken (__kwargtrans__ ({map_pos: s})));
			}
			return __accu0__;
		}) ();
		var objective = ObjectiveToken (__kwargtrans__ ({map_pos: loot [-(1)]}));
		var mkt = [];
		for (var c of this.map.cards) {
			mkt += (function () {
				var __accu0__ = [];
				for (var s of c.markets) {
					__accu0__.append (this.board.get_pos_from_card (c, s));
				}
				return __accu0__;
			}) ();
		}
		var markets = (function () {
			var __accu0__ = [];
			for (var s of mkt) {
				__accu0__.append (MarketToken (__kwargtrans__ ({map_pos: s})));
			}
			return __accu0__;
		}) ();
		this.board.tokens = ((([player] + guards) + targets) + markets) + [objective];
		this.board.scroll_to_player ();
	}
	clear_state() {
		if (this.cardselector !== null) {
			this.cardselector.cards = [];
			this.remove_widget (this.cardselector);
			this.cardselector = null;
		}
		this.hand.clear_card_actions ();
		this.hand.cancel_action ();
		this.board.map_choices = [];
	}
	clear_and_check_end_game() {
		this.clear_state ();
		if (this.board.active_player_clashing ()) {
			this.menu_showing = true;
			this.stats.title.text = 'MISSION FAILED';
			this.hand.can_draw = false;
			return true;
		}
	}
	on_menu_showing() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		if (this.menu_showing) {
			if (!__in__ (this.stats, this.children)) {
				this.add_widget (this.stats);
			}
		}
		else if (__in__ (this.stats, this.children)) {
			this.remove_widget (this.stats);
		}
	}
	restart_game() {
		this.clear_state ();
		this.card_setup (__kwargtrans__ ({restart: true}));
		this.token_setup ();
		this.stats.title.text = 'MISSION IN PROGRESS';
	}
	next_level() {
		this.clear_state ();
		this.card_setup ();
		this.token_setup ();
		this.stats.py_next.active = false;
		this.stats.title.text = 'MISSION IN PROGRESS';
		this.skilldeck.select_draw (2, 4);
	}
	level_complete() {
		this.clear_state ();
		this.stats.py_next.active = true;
		this.menu_showing = true;
		this.hand.can_draw = false;
		this.stats.missions++;
		this.eventdeck.can_draw = false;
		this.stats.title.text = 'MISSION COMPLETED';
	}
	path_state() {
		return os.path.join (get_user_path (), 'gamestate.pickle');
	}
	load_state() {
		var path = this.path_state ();
		if (!(os.path.exists (path))) {
			return false;
		}
		Logger.info ('loading game data');
	}
	save_state() {
		Logger.info ('saved game data');
	}
}

class Instructions extends BoxLayout {
	m_scrollview = ObjectProperty ();
	__init__() {
		__super__ (Instructions, '__init__') (self);
	}
}

