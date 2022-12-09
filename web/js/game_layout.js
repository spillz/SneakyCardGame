
var scroll_to = function (self, widget, padding, animate) {
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


class Deck extends Widget { //represents a deck/tableau of splayed cards
    orientation = 'down'; //splay down, up, right, or left
    constructor(rect, properties) { //TODO: add card spacing params
        super(rect);
        this.updateProperties(properties);
    }

    layoutChildren() {
        //ASSUMPTION: The cards are already sized equally and will fit within the deck
        if(this.children.length==0) return;
        let c = this.children[0];
        if(this.orientation=='down') {
            let step = (this.h-c.h)/(this.children.length-1);
            let y = this.y;
            let x = this.x;
            for(let c of this.children) {
                c.y = Math.min(y, this.y+this.h-c.h);
                c.x = x;
				c.layoutChildren()
                y+=step;
            }    
        }
        if(this.orientation=='right') {
            let step = (this.w-c.w)/(this.children.length-1);
            let y = this.y;
            let x = this.x;
            for(let c of this.children) {
                c.x = Math.min(x, this.x+this.w-c.w);
                c.y = y;
				c.layoutChildren()
                x+=step;
            }    
        }
    }
}

class CardSelector extends Widget {
    orientation = 'down'; //splay down, up, right, or left
	selected = [];
	numToPick = 1;
    shownCard = null; 
    shownCardShift = 0; // #proportion of card width or heigh to shift when card is selected
    constructor(rect, properties) { //TODO: add card spacing params
        super(rect);
        this.updateProperties(properties);
    }

    layoutChildren() {
        //ASSUMPTION: The cards are already sized equally and will fit within the deck
        if(this.children.length==0) return;
        let c = this.children[0];
        if(this.orientation=='down') {
            let step = (this.h-c.h)/(this.children.length-1);
            let y = this.y;
            let x = this.x;
            for(let c of this.children) {
                c.y = Math.min(y, this.y+this.h-c.h);
                c.x = x;
				c.layoutChildren()
                y+=step;
            }    
        }
        if(this.orientation=='right') {
            let step = (this.w-c.w)/(this.children.length-1);
            let y = this.y;
            let x = this.x;
            for(let c of this.children) {
                c.x = Math.min(x, this.x+this.w-c.w);
                c.y = y;
				c.layoutChildren()
                x+=step;
            }    
        }
    }
	on_touch_down(event, touch) {
		for(let card of this.children) {
			if (card.collide_point (...touch.pos)) {
				touch.grab (card);
				return true;
			}
		}
	}
	on_touch_up(event, touch) {
		let card = touch.grab_current;
		if (this.children.includes(card)) {
			touch.ungrab (card);
			if (!(card.collide_point (...touch.pos))) {
				return true;
			}
			if (this.numToPick > 1) {
				let sel = this.children.filter(c.selected);
				if (len (sel) >= this.numToPick) {
					return true;
				}
				card.selected = !(card.selected);
			}
			else if (this.numToPick == 1) {
				for (let c of this.children) {
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
}

class CardSplay extends Label {
	orientation = 'horizontal';
	canDraw = false;
	shownCard = null;
	shownCardShift = 0;
	selected = [];
	multiSelect = false;
	cardSpreadScale = 0.5;
	text = 'CARDSPLAY';
	constructor(rect, properties) {
		super(rect);
		this.updateProperties(properties);
	}
	layoutChildren() {
		let app = App.get();
		let anim = false;
		var cardw = app.card_size [0];
		var cardh = app.card_size [1];
		var mul = (this.shownCard === null || this.shownCard == this.children [-(1)] || this.children.length <= 1 ? 1 : 2);
		if (this.orientation == 'horizontal') {
			var exp_len = cardw;
			var offset = 0;
			if (this.children.length > 1) {
				var delta = Math.floor (Math.max(Math.min(cardw * this.cardSpreadScale, (this.w - cardw * mul) / ((this.children.length + 1) - mul)), 2));
			}
			else {
				var delta = 0;
			}
			if (delta == 2) {
				var max_splay = Math.floor ((this.w - cardw) / 2);
			}
			else {
				var max_splay = this.children.length;
			}
		}
		else {
			var exp_len = -(cardh);
			var offset = this.h - cardh;
			if (this.children.length > 1) {
				var delta = -(Math.floor (Math.max(Math.min(cardh * this.cardSpreadScale, (this.h - cardh * mul) / (this.children.length - mul)), 2)));
			}
			else {
				var delta = 0;
			}
			if (delta == -(2)) {
				var max_splay = Math.floor ((this.h - cardh) / 2);
			}
			else {
				var max_splay = this.children.length;
			}
		}
		var i = 0;
		for (var c of this.children) {
			if (this.orientation == 'horizontal') {
				var x = this.x + offset;
				var y = (c != this.shownCard ? this.y : this.y + this.shownCardShift * cardh);
			}
			else {
				var y = this.y + offset;
				var x = (c != this.shownCard ? this.x : this.x + this.shownCardShift * cardw);
			}
			if (anim) {
				if (this.children.length < 10) {
					var animc = Animation ({pos: c.pos, duration: i * 0.025}).add(Animation ({pos: tuple ([x, y]), duration: 0.2}));
				}
				else {
					var animc = Animation ({pos: tuple ([x, y]), duration: 0.2});
				}
				animc.start (c);
			}
			else {
				c.x = x;
				c.y = y;
			}
			if (c == this.shownCard) {
				offset += exp_len;
			}
			else if (i < max_splay) {
				offset += delta;
			}
			c.layoutChildren();
			i++;
		}
	}
	on_shownCard(exp, card) {
		if (!(this.multiSelect)) {
			for (var c of this.children) {
				c.selected = false;
			}
		}
		if (this.shownCard !== null) {
			this.shownCard.selected = true;
		}
		if (this.shownCard === null && this.multiSelect) {
			for (var c of this.children) {
				c.selected = false;
			}
		}
		this.layoutChildren();
	}
	do_closeup(closeup_card, touch, time) {
		if (!(closeup_card.face_up)) {
			var closeup_card = null;
		}
		CardSplayCloseup (__kwargtrans__ ({closeup_card: closeup_card, cards: this.children})).open ();
		this._clockev = null;
	}
	on_touch_down(touch) {
		for (var c of this.children.__getslice__ (0, null, -(1))) {
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
	move_to(cards, deck, pos=null) {
		this.children = this.children.filter(c => cards.includes(c));
		deck.children = [...deck.children.slice(0,pos), ...cards, ...deck.children.slice(pos)];
	}
	__draw_frame() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		this.canvas.after.py_clear ();
		var __withid0__ = this.canvas.after;
		try {
			__withid0__.__enter__ ();
			Color (__kwargtrans__ ({rgba: tuple ([1, 1, 1, 1])}));
			Line (__kwargtrans__ ({width: 1, rectangle: tuple ([this.x, this.y, this.width, this.h])}));
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



class Card extends Widget {
    name = 'card name';
    text = 'card text';
    image = null;
    faceUp = true;
	selected = false;
    constructor(rect=null, properties=null) {
        super(rect);
        this.updateProperties(properties);
        // let that = this
        // this.bind('touch_down', (name, obj, t) => that.onTouchDown(name, obj, t));
    }

    draw() {
        if(this.faceUp) {
            //TODO: draw a card background, borders etc
            super.draw();
            let r1 = new Rect(this);
            let r2 = new Rect(this);
            r1.h = this.h/5; 
            r2.y += r1.h;
            r2.h -= r1.h;
            //TODO: Get rid of the ugly scale transforms
			let app=App.get();
            drawWrappedText(app.ctx, this.name, this.h/12*app.tileSize, true, r1.mult(app.tileSize).shift([app.offsetX,app.offsetY]), "yellow");
            drawWrappedText(app.ctx, this.text, this.h/18*app.tileSize, true, r2.mult(app.tileSize).shift([app.offsetX,app.offsetY]), "white");    
        } else {
//            super.draw();
			let r = this.renderRect();
			let app = App.get();
			app.ctx.beginPath();
			app.ctx.rect(r[0], r[1], r[2], r[3]);
			app.ctx.fillStyle = 'gray';
			app.ctx.fill();
				//TODO: draw card back
        }
    }

    on_touch_down(name, touch) {
        if(this.renderRect().collide(new Rect([touch.clientX, touch.clientY, 0, 0]))) {
			this.faceUp = !this.faceUp;
			return true;
		}
    }

    // onTouchDown(name, obj, touch) {
    //     if(this.renderRect().collide(new Rect([touch.clientX, touch.clientY, 0, 0]))) this.faceUp = !this.faceUp;
    // }

}

class CardGrid extends Widget {
//Display cards in a grid arrangement
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

class CardSplayCloseup extends ModalView {
	cards = [];
	constructor(closeup_card=null, cards=[], args) {
		var args = tuple ([].slice.apply (arguments).slice (3));
		super(new Rect(), args);
		this.closeup_card = null;
		if (closeup_card === null) {
			closeup_card = cards[0];
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
		if (this.children.length > 0) {
			this.closeup_card = this.cards [0];
		}
		this.closeup_card = py_typeof (closeup_card) ();
		this.closeup_card.face_up = true;
		this.content.add_widget (this.closeup_card);
		this.on_size ();
	}
	on_size() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		var pref_width = int (this.h * this.aspect);
		var pref_height = int (this.width / this.aspect);
		var ratio = 1;
		if (pref_width <= this.width) {
			if (this.children.length > 0 && pref_width > 0.66 * this.width) {
				var ratio = (0.66 * this.width) / pref_width;
				var pref_width = int (0.66 * this.width);
			}
			this.closeup_card.size = tuple ([pref_width, int (this.h * ratio)]);
			if (this.children.length == 0) {
				this.closeup_card.x = Math.floor ((this.width - pref_width) / 2);
				this.scroll_view.width = 1;
				this.scroll_view.height = 1;
				this.scroll_view.pos = tuple ([-(10), -(10)]);
			}
			else {
				this.closeup_card.pos = tuple ([0, 0]);
				this.scroll_view.width = this.width - pref_width;
				this.scroll_view.height = this.h;
				this.scroll_view.pos = tuple ([this.closeup_card.width, 0]);
			}
		}
		else {
			if (this.children.length > 0 && pref_height > 0.5 * this.h) {
				var ratio = (0.5 * this.h) / pref_height;
				var pref_height = int (0.5 * this.h);
			}
			this.closeup_card.size = tuple ([this.width * ratio, pref_height]);
			if (this.children.length == 0) {
				this.closeup_card.y = Math.floor ((this.h - pref_height) / 2);
				this.scroll_view.width = 1;
				this.scroll_view.height = 1;
				this.scroll_view.pos = tuple ([-(10), -(10)]);
			}
			else {
				this.closeup_card.pos = tuple ([0, 0]);
				this.scroll_view.width = this.width;
				this.scroll_view.height = this.h - pref_height;
				this.scroll_view.pos = tuple ([0, this.closeup_card.height]);
			}
		}
		if (this.children.length > 0) {
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
	draw() {
		super.draw();
	}
}


class PlayerDiscard extends CardSplay {
	on_cards() {
		for (var c of this.children.slice(0, null, 1)) {
			if (isinstance (c, cards.Card)) {
				c.face_up = false;
			}
		}
		for (var c of this.children) {
			c.face_up = true;
		}
	}
}
class PlayerDeck extends CardSplay {
	on_cards() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		for (var c of this.children) {
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
	drawCard(n) {
		var shuffle = n - this.children.length;
		var cards = this.children.slice (-n-1, -1);
		this.move_to (cards, this.parent.hand);
		if (shuffle > 0) {
			var discards = this.parent.playerdiscard.cards.slice (0, playerdiscard.cards.length);
			random.shuffle (discards);
			this.parent.playerdiscard.move_to (discards, self);
			var cards = this.children.slice (-shuffle-1, -1);
			this.move_to (cards, this.parent.hand);
		}
	}
}
class PlayerTraits extends CardSplay {
	active_card = null;
	on_touch_up(touch) {
		if (!(this.collide_point (...touch.pos))) {
			return false;
		}
		if (!(this.can_draw)) {
			return false;
		}
		if (this.children.length == 0) {
			return false;
		}
		this.children = [this.children[-1]].concat(this.children.slice (0, -1)); //rotate through cards
		return true;
	}
}

class ActiveCardSplay extends CardSplay {
	active_card = null;
	on_cards() {
		if (this.children.length > 0) {
			this.active_card = this.children [-(1)];
		}
		else {
			this.active_card = null;
		}
	}
	on_touch_up(touch) {
		if (this.children.length > 0) {
			this.parent.hand.cancel_action ();
		}
		return true;
	}
	discard_used(unused=0, noise=0, exhaust_on_use=null, tap_on_use=null) {
		if (unused > 0) {
			let cards0 = this.children.slice(0);
			this.move_to (cards0, this.parent.hand);
		}
		if (this.children.length > 0) {
			if (exhaust_on_use !== null) {
				if (exhaust_on_use instanceof cards.TraitCard) {
					this.parent.playertraits.move_to ([exhaust_on_use], this.parent.exhausted);
				}
				else {
					this.move_to ([exhaust_on_use], this.parent.exhausted);
				}
			}
			if (tap_on_use !== null) {
				if (tap_on_use instanceof cards.TraitCard) {
					tap_on_use.tapped = true;
				}
			}
		}
		var cards0 = this.children.slice (0);
		this.move_to (cards0, this.parent.playerdiscard);
		this.parent.hand.clear_selection ();
	}
}
class ActionSelectorOption extends Label {
	_touching = false;
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
	constructor(hand, actions) {
		super(new Rect(0,0,5,1));
		this.hand = hand;
		for (var a of actions) {
			this.addChild (new ActionSelectorOption (new Rect(), {text: a}));
		}
	}
}

class Hand extends CardSplay {
	selected_action = '';
	actions = {};
	action_selector = null;
	hand_size = 5;
	on_selected_action() {
		var args = tuple ([].slice.apply (arguments).slice (1));
		if (this.selected_action != '') {
			this.move_to ([this.shownCard], this.parent.activecardsplay);
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
		if (this.children.length == 0) {
			return true;
		}
		if (this.can_draw == false) {
			return true;
		}
		for (var c of this.children.reverse()) {
			if (c.collide_point (...this.to_local (...touch.pos))) {
				if (this.shownCard == c) {
					this.clear_selection ();
					this.shownCard = null;
				}
				else if (this.selected_action != '') {
					var action_fn = this.actions [this.selected_action];
					if (action_fn.activate('can_stack', {stacked_card: c})) {
						this.move_to ([c], this.parent.activecardsplay, 0);
						action_fn.activate('card_stacked', {stacked_card: c});
						return true;
					}
				}
				else {
					this.clear_selection ();
					this.shownCard = c;
					this.selected_action = '';
					this.parent.board.map_choices = [];
					var actions = c.get_actions (this.parent);
					for(let tc of parent.playertraits.children.slice(-1)) {
						let trait_actions = tc.get_actions_for_card (c, this.parent);
						for (var ta of trait_actions) {
							actions[ta] = trait_actions[ta];
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
		this.children.filter(c=>c.selected).apply(c=>c.selected=false);
		this.clear_card_actions ();
		this.selected_action = '';
	}
	allow_stance_select() {
		this.parent.playertraits.can_draw = true;
	}
	on_cards() {
		for (var c of this.children) {
			c.face_up = true;
		}
		this.super();
		if (this.children.length == 0) {
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
	select_draw(num_to_pick=2, num_offered=4) {
		var cards = this.children.slice (-num_offered);
		if (len (cards) == 0) {
			return ;
		}
		for (var c of cards) {
			this.children.removeChild(c);
		}
		this.parent.cardselector = new CardSelector(new Rect(), {num_to_pick: num_to_pick});
		App.get().addChild(this.parent.cardselector);
		this.parent.cardselector.bind ('but_ok_pressed', this.card_picked);
		this.parent.cardselector.children = cards;
	}
	card_picked(cs, pressed) {
		for (var c of cs.cards) {
			cs.cards.remove (c);
			if (!(c.selected)) {
				c.face_up = false;
				this.children.insert (0, c);
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
		var cards = this.children.slice (-num_offered);
		for (var c of cards) {
			this.children.remove (c);
		}
		this.parent.cardselector = CardSelector (new Rect(), {num_to_pick: num_to_pick});
		this.parent.add_widget (this.parent.cardselector);
		this.parent.cardselector.bind ('but_ok_pressed', this.card_picked);
		this.parent.cardselector.cards = cards;
	}
	card_picked(cs, pressed) {
		for (var c of cs.cards) {
			cs.cards.remove (c);
			if (!(c.selected)) {
				c.face_up = false;
				this.children.insert (0, c);
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
	select_draw(num_to_pick=1, num_offered=1, coin=1) {
		var cards = this.children.slice (-num_offered);
		this.children = this.children.slice (0, -num_offered);
		this.parent.cardselector = CardSelector (new Rect(), {num_to_pick: num_to_pick});
		this.parent.add_widget (this.parent.cardselector);
		this.parent.cardselector.bind ('but_ok_pressed', this.card_picked);
		this.parent.cardselector.cards = cards;
	}
	card_picked(cs, pressed) {
		var cards = cs.cards.slice(0);
		cs.cards = [];
		for (var c of cards) {
			if (!(c.selected)) {
				c.face_up = false;
				this.children.append (c);
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
	on_child_added(event, child) {
		c.faceUp=true;
	}
}
class EventDeck extends CardSplay {
	can_draw = false;
	on_touch_up(touch) {
		if (!(this.collide_point (...touch.pos))) {
			return true;
		}
		return this.draw ();
	}
	drawCard() {
		if (!(this.can_draw)) {
			return true;
		}
		if (this.children.length == 0) {
			return true;
		}
		if (this.parent.clear_and_check_end_game ()) {
			return true;
		}
		for (var t of this.parent.board.iter_tokens ('G')) {
			t.frozen = false;
		}
		var card = this.children [-(1)];
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
	on_child_added(event, card) {
		card.faceUp=true;
	}
}

class Stats extends BoxLayout {
	kills = 0;
	knockouts = 0;
	contacts = 0;
	loot = 0;
	rounds = 0;
	missions = 0;
	showing = false;
	t_kills = 0;
	t_knockouts = 0;
	t_contacts = 0;
	t_loot = 0;
	t_rounds = 0;
	reset(totals=true) {
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
		this.h = Math.floor (this.parent.height / 4);
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
				App.get().stop ();
				return true;
			}
			return true;
		}
	}
}


