class Deck extends Widget { //represents a deck/tableau of splayed cards
    orientation = 'down'; //splay down, up, right, or left
	processTouches = true;
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
		return;
		for(let card of this.children) {
			if (card.collide_point (...touch.pos)) {
				touch.grab (card);
				return true;
			}
		}
	}
	on_touch_up(event, touch) {
		return;
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
	bgColor = 'black';
	fontSize=0.5;
	constructor(rect, properties) {
		super(rect);
		this.updateProperties(properties);
	}
	layoutChildren() {
		let app = App.get();
		let anim = false;
		var cardw = app.card_size [0];
		var cardh = app.card_size [1];
		let f = x=>x;
		var mul = (this.shownCard === null || this.shownCard == this.children.slice(-1) || this.children.length <= 1 ? 1 : 2);
		if (this.orientation == 'horizontal') {
			var exp_len = cardw;
			var offset = 0;
			if (this.children.length > 1) {
				var delta = f(Math.max(Math.min(cardw * this.cardSpreadScale, (this.w - cardw * mul) / ((this.children.length + 1) - mul)), 2/app.tileSize));
			}
			else {
				var delta = 0;
			}
			if (delta == 2/app.tileSize) {
				var max_splay = f((this.w - cardw) / (2/app.tileSize));
			}
			else {
				var max_splay = this.children.length;
			}
		}
		else {
			var exp_len = -(cardh);
			var offset = this.h - cardh;
			if (this.children.length > 1) {
				var delta = -(f(Math.max(Math.min(cardh * this.cardSpreadScale, (this.h - cardh * mul) / (this.children.length - mul)), 2/app.tileSize)));
			}
			else {
				var delta = 0;
			}
			if (delta == -2/app.tileSize) {
				var max_splay = f((this.h - cardh) / (2/app.tileSize));
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
				c.rect = new Rect([x, y, app.card_size[0], app.card_size[1]]);
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
		if (!(closeup_card.faceUp)) {
			var closeup_card = null;
		}
		CardSplayCloseup (__kwargtrans__ ({closeup_card: closeup_card, cards: this.children})).open ();
		this._clockev = null;
	}
	on_touch_down1(touch) {
		for (var c of this.children.__getslice__ (0, null, -(1))) {
			if (c.collide_point (...this.to_local (...touch.pos))) {
				touch.grab (self);
				this._clockev = Clock.schedule_once (partial (this.do_closeup, c, touch), 0.5);
				return true;
			}
		}
	}
	on_touch_up1(touch) {
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
		let chf = this.children.filter(c => !(cards.includes(c)));
		this.children = this.children.filter(c => !(cards.includes(c)));
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
    faceUp = false;
	selected = false;
	bgColor = 'black';
	outlineColor = 'gray';
    constructor(rect=null, properties=null) {
        super(rect);
        this.updateProperties(properties);
        // let that = this
        // this.bind('touch_down', (name, obj, t) => that.onTouchDown(name, obj, t));
    }

    draw() {
        if(this.faceUp) {
            //TODO: draw a card background, borders etc
			this.bgColor='black';
			this.outlineColor = 'gray';
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
			this.outlineColor = 'black';
			this.bgColor='gray';
			super.draw();
			// let r = this.renderRect();
			// let app = App.get();
			// app.ctx.beginPath();
			// app.ctx.rect(r[0], r[1], r[2], r[3]);
			// app.ctx.fillStyle = this.bgColor;
			// app.ctx.fillStyle = this.outlineColor;
			// app.ctx.fill();
			// app.ctx.fill();
				//TODO: draw card back
        }
    }

    // on_touch_down(name, touch) {
    //     if(this.renderRect().collide(new Rect([touch.clientX, touch.clientY, 0, 0]))) {
	// 		this.faceUp = !this.faceUp;
	// 		return true;
	// 	}
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
				__accu0__.push(py_typeof (c) ());
			}
			return __accu0__;
		}) ();
		this.aspect = closeup_card.width / closeup_card.height;
		for (var [c, c0] of zip (this.cards, cards)) {
			c.height = c0.height;
			c.width = c0.width;
			c.faceUp = true;
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
		this.closeup_card.faceUp = true;
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
	on_child_added(msg, c) {
		c.faceUp = true;
	}
}
class PlayerDeck extends CardSplay {
	on_child_added(msg, c) {
		c.faceUp = false;
	}
	draw_hand() {
		let app=App.get();
		if (app.hand.children.length == 0) {
			var cards_to_draw = app.hand.hand_size;
		}
		else {
			var cards_to_draw = (1 + app.hand.hand_size) - len (app.hand.cards);
		}
		this.draw_cards(cards_to_draw);
		app.hand.can_draw = true;
		app.playertraits.can_draw = true;
		app.eventdeck.can_draw = true;
		this.can_draw = false;
		app.board.scroll_to_player ();
	}
	draw_cards(n) {
		var shuffle = n - this.children.length;
		var cards = this.children.slice (-n-1, -1);
		let app = App.get();
		this.move_to (cards, app.hand);
		if (shuffle > 0) {
			var discards = app.playerdiscard.cards.slice (0, playerdiscard.cards.length);
			random.shuffle (discards);
			app.playerdiscard.move_to (discards, self);
			var cards = this.children.slice (-shuffle-1, -1);
			this.move_to (cards, app.hand);
		}
	}
}

class PlayerTraits extends CardSplay {
	active_card = null;
	on_child_added(msg, c) {
		c.faceUp = true;
	}
	on_touch_up(touch) {
		return;
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
		return;
		let app = App.get();
		if (this.children.length > 0) {
			app.hand.cancel_action ();
		}
		return true;
	}
	discard_used(unused=0, noise=0, exhaust_on_use=null, tap_on_use=null) {
		let app = App.get();
		if (unused > 0) {
			let cards0 = this.children.slice(0);
			this.move_to (cards0, app.hand);
		}
		if (this.children.length > 0) {
			if (exhaust_on_use !== null) {
				if (exhaust_on_use instanceof cards.TraitCard) {
					app.playertraits.move_to ([exhaust_on_use], app.exhausted);
				}
				else {
					this.move_to ([exhaust_on_use], app.exhausted);
				}
			}
			if (tap_on_use !== null) {
				if (tap_on_use instanceof cards.TraitCard) {
					tap_on_use.tapped = true;
				}
			}
		}
		var cards0 = this.children.slice(0);
		this.move_to(cards0, app.playerdiscard);
		app.hand.clear_selection();
	}
}
class ActionSelectorOption extends Label {
	_touching = false;
	on_touch_down(event, touch) {
		let r = this.renderRect();
		if (r.collide(new Rect([touch.clientX, touch.clientY, 0, 0]))) {
			App.get().inputHandler.grab(this);
			this._touching = true;
			return true;
		}
	}
	on_touch_up(event, touch) {
		let app=App.get();
		let r = this.renderRect();
		if (app.inputHandler.grabbed == this && r.collide(new Rect([touch.clientX, touch.clientY, 0, 0]))) {
			app.inputHandler.ungrab();
			app.hand.selected_action = this.text;
			this._touching = false;
			return true;
		}
	}
	draw() {
		this.bgColor = this._touching ? colorString([0.75,0.75,0.75]):colorString([0.5,0.5,0.5]);
		super.draw();
	}
}
class ActionSelector extends BoxLayout {
	constructor(card, actions) {
		let app = App.get();
		let h = Object.keys(actions).length
		super(new Rect([app.hand.x,app.hand.y-h,app.card_size[0],h])); //TODO: This rect should be set in the layout call of the parent
		for (var a in actions) {
			this.addChild(new ActionSelectorOption(new Rect(), {text: a}));
		}
	}
}

class Hand extends CardSplay {
	selected_action = '';
	actions = {};
	action_selector = null;
	hand_size = 5;
	cardSpreadScale = 1.0;
	on_child_added(event, child) {
		child.faceUp = true;
	}
	on_touch_up(event, touch) {
		let app = App.get();
		if (this.children.length == 0) return true;
		if (this.can_draw == false) return true;
		for (var c of this.children.slice().reverse()) {
			let r = c.renderRect();
			if (r.collide(new Rect([touch.clientX, touch.clientY, 0, 0]))) {
				if (this.shownCard==c) {
					this.shownCard=null;
					this.clear_selection();
				}
				else if (this.selected_action != '') {
					var action_fn = this.actions [this.selected_action];
					if (action_fn.activate('can_stack', {stacked_card: c})) {
						this.move_to ([c], app.activecardsplay, 0);
						action_fn.activate('card_stacked', {stacked_card: c});
						return true;
					}
				}
				else {
					this.shownCard = c;
					this.selected_action = '';
					app.board.map_choices = [];
					let actions = c.get_actions(app);
					for(let tc of app.playertraits.children.slice(-1)) {
						let trait_actions = tc.get_actions_for_card(c, app);
						for (let ta in trait_actions) {
							actions[ta] = trait_actions[ta];
						}
					}
					this.show_card_actions(c, actions);
					app.playerprompt.text = 'Select an action for this card';
					return true;
				}
				break;
			}
		}
		return true;
	}
	on_selected_action(event, data) {
		if (this.selected_action != '') {
			let app=App.get();
			this.move_to([this.shownCard], app.activecardsplay);
			var action = this.selected_action;
			var action_fn = this.actions[action];
			action_fn.activate('card_action_selected');
			this.clear_card_actions();
		}
	}
	clear_selection() {
		let app = App.get();
		app.playerprompt.text = 'Select a card to play or touch the event deck to end your turn';
		app.board.map_choices = [];
		this.children.filter(c=>c.selected).map(c=>c.selected=false);
		this.clear_card_actions();
		this.selected_action = '';
	}
	clear_card_actions() {
		if (this.action_selector !== null) {
			let app=App.get();
			app.baseWidget.removeChild(this.action_selector);
			this.action_selector = null;
		}
	}
	show_card_actions(card, actions) {
		let app = App.get();
		this.clear_card_actions ();
		this.selected_action = '';
		this.actions = actions;
		this.action_selector = new ActionSelector(card, actions);
		app.baseWidget.addChild(this.action_selector);
	}
	cancel_action() {
		if (this.selected_action != '') {
			var action = this.selected_action;
			var action_fn = this.actions[action];
			action_fn.activate('card_action_end');
			this.selected_action = '';
			this.clear_selection();
		}
	}
	allow_stance_select() {
		let app = App.get();
		app.playertraits.can_draw = true;
	}
	on_children(event, data) {
		let app = App.get();
		if (this.children.length == 0) app.playerprompt.text = 'Touch the event deck to end your turn';
		else app.playerprompt.text = 'Select a card from your hand to play';
	}
}

class SkillDeck extends CardSplay {
	on_touch_up(touch) {
		return;
	}
	select_draw(num_to_pick=2, num_offered=4) {
		let app = App.get();
		var cards = this.children.slice (-num_offered);
		if (len (cards) == 0) {
			return ;
		}
		for (var c of cards) {
			this.children.removeChild(c);
		}
		app.cardselector = new CardSelector(new Rect(), {num_to_pick: num_to_pick});
		App.get().addChild(app.cardselector);
		app.cardselector.bind ('but_ok_pressed', this.card_picked);
		app.cardselector.children = cards;
	}
	card_picked(cs, pressed) {
		let app = App.get();
		for (var c of cs.cards) {
			cs.cards.remove (c);
			if (!(c.selected)) {
				c.faceUp = false;
				this.children.insert (0, c);
			}
			else {
				app.hand.cards.push(c);
				c.faceUp = true;
				c.selected = false;
			}
		}
		app.remove_widget (cs);
		app.cardselector = null;
	}
}
class LootDeck extends CardSplay {
	on_touch_up(touch) {
		return;
		__super__ (LootDeck, 'on_touch_up') (self, touch);
	}
	select_draw(num_to_pick=1, num_offered=1) {
		let app = App.get();
		var cards = this.children.slice (-num_offered);
		for (var c of cards) {
			this.children.remove (c);
		}
		app.cardselector = CardSelector (new Rect(), {num_to_pick: num_to_pick});
		app.baseWidget.addChild(app.cardselector);
		app.cardselector.bind('but_ok_pressed', this.card_picked);
		app.cardselector.cards = cards;
	}
	card_picked(cs, pressed) {
		let app = App.get();
		for (var c of cs.cards) {
			cs.cards.remove (c);
			if (!(c.selected)) {
				c.faceUp = false;
				this.children.insert (0, c);
			}
			else {
				app.hand.cards.push(c);
				c.faceUp = true;
				c.selected = false;
			}
		}
		app.remove_widget (cs);
		app.cardselector = null;
		app.stats.loot++;
		app.stats.t_loot++;
	}
}

class MarketDeck extends CardSplay {
	on_touch_up(touch) {
		return;
		return __super__ (MarketDeck, 'on_touch_up') (self, touch);
	}
	select_draw(num_to_pick=1, num_offered=1, coin=1) {
		let app = App.get();
		let cards = this.children.slice (-num_offered);
		this.children = this.children.slice (0, -num_offered);
		app.cardselector = CardSelector (new Rect(), {num_to_pick: num_to_pick});
		app.add_widget (app.cardselector);
		app.cardselector.bind ('but_ok_pressed', this.card_picked);
		app.cardselector.cards = cards;
	}
	card_picked(cs, pressed) {
		let app = App.get();
		let cards = cs.cards.slice(0);
		cs.cards = [];
		for (var c of cards) {
			if (!(c.selected)) {
				c.faceUp = false;
				this.children.push(c);
			}
			else {
				app.hand.cards.push(c);
				c.faceUp = true;
				c.selected = false;
			}
		}
		app.remove_widget (cs);
		app.cardselector = null;
	}
}

class Exhausted extends CardSplay {
	on_child_added(event, child) {
		c.faceUp=true;
	}
}

class EventDeck extends CardSplay {
	can_draw = false;
	on_child_added(event, card) {
		card.faceUp=false;
	}
	on_touch_up(event, touch) {
        let r = new Rect([touch.clientX, touch.clientY, 0, 0]);
		if(this.renderRect().collide(r)) { // && c.emit(event,touch)
			this.drawCard();
			return true;
		}
	}
	drawCard() {
		let app = App.get();
		if (!(this.can_draw)) {
			return;
		}
		if (this.children.length == 0) {
			return;
		}
		// if (app.clear_and_check_end_game ()) {
		// 	return;
		// }
		for (var t of app.board.iter_tokens ('G')) {
			t.frozen = false;
		}
		var card = this.children.slice(-1)[0];
		card.faceUp = true;
		for (var c of app.playertraits.children) {
			c.tapped = false;
		}
		this.move_to ([card], app.eventdiscard);
		card.activate (app.board);
		app.playerdeck.draw_hand ();
		app.stats.rounds++;
		app.stats.t_rounds++;
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
	on_parent1(event, parent) {
		var args = tuple ([].slice.apply (arguments).slice (1));
		let app = App.get();
		if (parent === null) {
			return ;
		}
		this.center_x = Math.floor (-(app.width) / 4);
		this.center_y = Math.floor (-(app.height) / 4);
		this.width = Math.floor (app.width / 4);
		this.h = Math.floor (app.height / 4);
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
		let app = App.get();
		if (touch.grab_current == self) {
			touch.ungrab (this.restart);
			if (this.restart.collide_point (...touch.pos)) {
				app.restart_game ();
				this.reset ();
				app.menu_showing = false;
				return true;
			}
			if (this.py_next.collide_point (...touch.pos)) {
				app.next_level ();
				this.reset (false);
				app.menu_showing = false;
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


