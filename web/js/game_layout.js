class Deck extends Widget { //represents a deck/tableau of splayed cards
    orientation = 'down'; //splay down, up, right, or left
	processTouches = true;
    constructor(rect, properties) { //TODO: add card spacing params
        super(rect);
        this.updateProperties(properties);
    }

    layoutChildren() {
        //ASSUMPTION: The cards are already sized equally and will fit within the deck
		if(this._layoutNotify) this.emit('layout', null);
		this._needsLayout = false;
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

class CardSelector extends ModalView {
    orientation = 'vertical'; //splay down, up, right, or left
	selected = [];
	numToPick = 1;
    shownCard = null; 
    shownCardShift = 0; // #proportion of card width or height to shift when card is selected
	hints = {center_x:0.5, center_y:0.5} //, w:0.8, h:0.8};
	prompt = 'Available market cards';
    constructor(cards, properties) { 
		let app = App.get();
        super(new Rect([0, 0, Math.max(cards.length,4)*app.card_size[0], 1.4*app.card_size[1]]));
		cards.map(c=>c.faceUp=true);
        this.updateProperties(properties);
		this.children = [
			new Label(null, {
				id: 'label',
				hints: {center_x:0.5, y:0, w:1, h:0.2/1.4},
				text: this.numToPick==0? 
							this.prompt :
							(this.numToPick==1? 'You may choose a card': `You may choose up to ${this.numToPick} cards`)
			}),
			new CardSplay(null, {
				id: 'cards',
				hints: {center_x:0.5, y:0.2/1.4, w:1, h:1/1.4},
				children: cards,
				cardSpreadScale: 1

			}),
			new Button(null, {
				id: 'button',
				hints: {center_x:0.5, y:1.2/1.4, w:0.5, h:0.2/1.4},
				text: this.numToPick==0?'Close':'Confirm',
				on_press: (e,o,v) => this.on_press(e,o,v)
			})
		]
		this._label = this.findById('label');
		this._cards = this.findById('cards');
    }
	layoutChildren() {
		super.layoutChildren();
	}
	get cards() {
		return this._cards.children;
	}
	on_press(event, button, val) {
		this.close();
	}
	on_touch_down(event, touch) {
		for(let card of this._cards.children) {
			if(card.collide(touch.rect)) {
				touch.grab(this);
				this._touched_card = card;
				return true;
			}
		}
		return super.on_touch_down(...arguments);
	}
	on_touch_up(event, touch) {
		if(touch.grabbed==this) {
			touch.ungrab(this);
			let card = this._touched_card;
			if(!(card.collide(touch.rect))) {
				return true;
			}
			if(this.numToPick > 1) {
				let sel = this._cards.children.filter(c=>c.selected);
				if(sel.length >= this.numToPick) {
					return true;
				}
				card.selected = !(card.selected);
			}
			else if(this.numToPick == 1) {
				for(let c of this._cards.children) {
					if(c == card) {
						c.selected = !(c.selected);
					}
					else {
						c.selected = false;
					}
				}
			}
		}
		return super.on_touch_up(...arguments);
	}
}

class CardSplay extends Widget {
	orientation = 'horizontal';
	canDraw = false;
	shownCard = null;
	shownCardShift = 0;
	faceUp = false;
	selected = [];
	multiSelect = false;
	cardSpreadScale = 0.5;
	text = 'CARDSPLAY';
	bgColor = 'black';
	fontSize=0.5;
	grabbed_child = null;
	_updatedChildren = false;
	constructor(rect, properties) {
		super(rect);
		this.updateProperties(properties);
	}
	on_child_added(event, child) {
		this._updatedChildren = true;
	}
	on_child_removed(event, child) {
		this._updatedChildren = true;
	}
	layoutChildren() {
        if(this._layoutNotify) this.emit('layout', null);
		this._needsLayout = false;
		let app = App.get();
		var cardw = app.card_size[0];
		var cardh = app.card_size[1];
		let f = x=>x;
		var mul = (this.shownCard == null || this.shownCard == this.children[this.children.length-1] || this.children.length <= 1) ? 1 : 2;
		if(this.orientation == 'horizontal') {
			var exp_len = cardw;
			var offset = 0;
			if(this.children.length > 1) {
				var delta = f(Math.max(Math.min(cardw * this.cardSpreadScale, 
					(this.w - cardw * mul) / (this.children.length - mul)), 2/app.tileSize));
			}
			else {
				var delta = 0;
			}
			if(delta == 2/app.tileSize) {
				var max_splay = f((this.w - cardw) / delta);
			}
			else {
				var max_splay = this.children.length;
			}
		}
		else {
			var exp_len = -(cardh);
			var offset = this.h - cardh;
			if(this.children.length > 1) {
				var delta = -(f(Math.max(Math.min(cardh * this.cardSpreadScale, (this.h - cardh * mul) / (this.children.length - mul)), 2/app.tileSize)));
			}
			else {
				var delta = 0;
			}
			if(delta == -2/app.tileSize) {
				var max_splay = f((this.h - cardh) / -delta);
			}
			else {
				var max_splay = this.children.length;
			}
		}
		var i = 0;
		for(var c of this.children) {
			if(this.orientation == 'horizontal') {
				var x = this.x + offset;
				var y = (c != this.shownCard ? this.y : this.y + this.shownCardShift * cardh);
			}
			else {
				var y = this.y + offset;
				var x = (c != this.shownCard ? this.x : this.x + this.shownCardShift * cardw);
			}
			if(this._updatedChildren) {
				c.w = app.card_size[0];
				c.h = app.card_size[1];
				let animc = new WidgetAnimation();
				let time = i<10? (i+1) * 20 : 200;
				animc.add({x: x, y: y}, time);
				animc.start(c);				
			}
			else {
				c.rect = new Rect([x, y, app.card_size[0], app.card_size[1]]);
			}
			if(c == this.shownCard) {
				offset += exp_len;
			}
			else if(i < max_splay) {
				offset += delta;
			}
			c.layoutChildren();
			i++;
		}
		this._updatedChildren = false;
	}
	on_shownCard(exp, card) {
		if(!(this.multiSelect)) {
			for(var c of this.children) {
				c.selected = false;
			}
		}
		if(this.shownCard !== null) {
			this.shownCard.selected = true;
		}
		if(this.shownCard === null && this.multiSelect) {
			for(var c of this.children) {
				c.selected = false;
			}
		}
		this._needsLayout=true;
	}
	do_closeup(event, timer, closeup_card) {
		if(!(closeup_card.faceUp)) {
			var closeup_card = null;
		}
		App.get().inputHandler.ungrab();
		App.get().removeTimer(this._clockev);
		let closeup = new CardSplayCloseup(closeup_card, this.children, !this.faceUp, {hints: {center_x:0.5, center_y:0.5, w:0.8, h:0.8}});
		closeup.bind('close', (event, obj, value)=>this.debug_closeup(event, obj, value))
		closeup.popup();
		this._clockev = null;
	}
	debug_closeup(ev, obj, value) {
		let app=App.get();
		if(value=='debug_select' && obj.closeup_card!=null && obj.closeup_card instanceof PlayerCard) {
			let card = this.children.find(c=>c.name==obj.closeup_card.name)
			this.move_to([card], app.hand);
		}
		if(value=='debug_select' && obj.closeup_card!=null && obj.closeup_card instanceof EventCard) {
			let card = this.children.find(c=>c.name==obj.closeup_card.name)
			this.move_to([card], app.eventdeck);
		}
	}
	on_touch_down(event, touch) {
		for(var c of this.children.slice().reverse()) {
			if(c.collide(touch.rect)) {
				touch.grab(this);
				this.grabbed_child = c;
				this._clockev = App.get().addTimer(500, (e,d) => this.do_closeup(e, d, c));
				return true;
			}
		}
	}
	on_touch_up(event, touch) {
		if(touch.grabbed != this) return;
		touch.ungrab();
		this.grabbed_child = null;
		if(this._clockev != null) {
			App.get().removeTimer(this._clockev);
			this._clockev = null;
			return true;
		}
	}
	move_to(cards, deck, pos=null) {
		let chf = this.children.filter(c => !(cards.includes(c)));
		this.children = this.children.filter(c => !(cards.includes(c)));
		if(pos==null) deck.children = [...deck.children.slice(), ...cards];
		else deck.children = [...deck.children.slice(0,pos), ...cards, ...deck.children.slice(pos)];
	}
}



class Card extends Widget {
    name = 'card name';
	nameColor = 'yellow';
    text = 'card text';
	textColor = 'white';
	lowerText = null;
	lowerTextColor = 'yellow';
	backText = null;
	backTextColor = 'yellow';
    image = null;
    faceUp = false;
	selected = false;
	outlineColor = 'gray';
	bgColorUp = colorString([0.2,0.2,0.2]);
	bgColorDown = colorString([0.5,0.5,0.5]);
	selectedColor = colorString([0.7,0.7,0.7]);
    constructor(rect=null, properties=null) {
        super(rect);
        this.updateProperties(properties);
    }
    draw() {
        if(this.faceUp) {
            //TODO: draw a card background, borders etc
            this.bgColor = this.selected ? this.selectedColor:this.bgColorUp;
            super.draw();
            let r1 = new Rect(this);
            let r2 = new Rect(this);
            let r3 = new Rect(this);
            r1.h = this.h/5;
            r2.y += r1.h;
            r2.h -= 2*r1.h;
			r3.y += r1.h+r2.h;
			r3.h = this.h/5;
			let app=App.get();
            drawWrappedText(app.ctx, this.name, (this.h/12), true, r1, this.nameColor);
            drawWrappedText(app.ctx, this.text, (this.h/14), true, r2, this.textColor);
			if(this.lowerText!=null) {
				drawWrappedText(app.ctx, this.lowerText, (this.h/14), true, r3, this.lowerTextColor);
			}  
        } else {
			this.bgColor = this.bgColorDown;
			this.outlineColor = 'black';
			super.draw();
			if(this.backText!=null) {
				let app = App.get();
				let r1 = new Rect(this);
				drawWrappedText(app.ctx, this.backText, (this.h/12), true, r1, this.backTextColor);
			}
        }
    }
}

class CardSplayCloseup extends ModalView {
	cards = [];
	constructor(closeup_card=null, cards=[], sort=true, props={}) {
		super(new Rect());
		this.updateProperties(props);
		if(sort) cards = cards.sort((a,b)=>a.name>b.name?1:(a.name==b.name?0:-1));
		if(closeup_card == null) {
			closeup_card = cards[0];
		}
		let r = new Rect();
		let app=App.get();
		this.scroll_view = new ScrollView(r, {scrollX:false, hints:{center_x:0.33/2, center_y:0.5, w:0.33, h:1}});
		this.scroll_view.bind('touch_down', (e,o,t)=>this.on_touch_down_sv(e,o,t));
		this.addChild(this.scroll_view);

		this.grid_layout = new GridLayout(r, {numX: 4});
		let ch = cards.map(c=> new c.constructor(r, {faceUp:true}));
		this.grid_layout.children = ch;
		this.scroll_view.addChild(this.grid_layout);
		for(let c of ch) {
			c.faceUp = true;
			if(c == closeup_card) {
				c.selected = true;
			}
			c.bind('touch_up', (e,c,v)=>this.on_touch_up_card(e,c,v));
			c.bind('touch_down', (e,c,v)=>this.on_touch_down_card(e,c,v));
		}
		if(closeup_card != null) {
			this.set_closeup(closeup_card);
		}
	}
	layoutChildren() {
		super.layoutChildren();
		let app = App.get();
		// this.x = 0;
		// this.y = 0;
		// this.w = app.dimW;
		// this.h = app.dimH;

		let aspect = app.card_size[0]/app.card_size[1];
		let ch = this.grid_layout.children;
		let h = this.h;
		let w = this.w*0.67;
		let ph = w / aspect;
		let pw = h * aspect;
		if (w>pw) {
			w = pw;
		} else {
			h = ph;
		}

//		this.closeup_card.hints = {center_x:0.67, center_y:0.5, w:w, h:h};
		this.closeup_card.rect = new Rect([this.x+this.w*0.34+(0.66*this.w-w)/2, this.y+(this.h-h)/2, w, h]);
		this.scroll_view.rect = new Rect([this.x, this.y, this.w*0.34, this.h]);
		this.grid_layout.rect = new Rect([this.x, this.y, this.w*0.34, 
		 				this.w*0.34/this.grid_layout.numX/aspect*Math.ceil(ch.length/this.grid_layout.numX)]);
	}
	set_closeup(closeup_card) {
		let app=App.get();
		if(this.closeup_card != null) {
			this.removeChild(this.closeup_card);
		}
		if(this.grid_layout.children.length > 0) {
			this.closeup_card = this.grid_layout.children[0];
		}
		this.closeup_card = new closeup_card.constructor();
		this.closeup_card.faceUp = true;

		this.addChild(this.closeup_card);
		this._needsLayout = true;
	}
	on_touch_down_card(event, card, touch) {
		if(card.collide(touch.rect)) {
			touch.grab(card);
			return true;
		}
	}
	on_touch_up_card(event, card, touch) {
		if(touch.grabbed == card) {
			touch.ungrab(card);
			for(var c0 of this.grid_layout.children) {
				c0.selected = false;
			}
			card.selected = true;
			this.set_closeup(card);
			return true;
		}
	}
	on_touch_down_sv(event, sv, touch) {
		if(!(this.scroll_view.collide(touch.rect))) {
			this.close();
			return true;
		}
	}
	on_touch_down(event, touch) {
		let app=App.get();
		if(app.debugMode && app.inputHandler.isKeyDown("Control") && this.closeup_card.collide(touch.rect)) {
			this.close('debug_select');
			return true;
		}
		super.on_touch_down(event, touch);
	}
}

class PlayerDiscard extends CardSplay {
	on_child_added(event, c) {
		super.on_child_added(...arguments);
		c.faceUp = true;
	}
}

class Hamburger extends Button {
	color = null;
	colorHighlight = null;
	constructor(rect, props) {
		super(rect);
		this.updateProperties(props);
	}
	draw() {
		let lineColor = this._touching? this.colorHighlight: this.color;
		if(lineColor!=null) {
			let r = this.rect.scaleBorders(0.6);
			let ctx = App.get().ctx;
			ctx.strokeStyle = lineColor;
			let lw = ctx.lineWidth;
			ctx.lineWidth = this.h/10;
			ctx.beginPath();
			ctx.moveTo(r.x,r.y);
			ctx.lineTo(r.right,r.y);
			ctx.moveTo(r.x,r.center_y);
			ctx.lineTo(r.right,r.center_y);
			ctx.moveTo(r.x,r.bottom);
			ctx.lineTo(r.right,r.bottom);
			ctx.stroke();
			ctx.lineWidth = lw;
		}
	}
}

class PlayerPrompt extends BoxLayout {
	text = '';
	id = 'prompt';
	orientation = 'horizontal';
	_layoutNotify = true;
	constructor(rect, props) {
		super(rect);
		this.updateProperties(props);
		this.children = [
			new Label(null, {text:(prompt)=>prompt.text, wrap:true}),
			new Hamburger(null, {color:'gray', colorHighlight:'lightGray', hints:{w:null}, on_press: (e,o,v)=>App.get().stats.popup()}),
		]

	}
	on_layout(event, data) {
		this.children[1].w = this.h;
	}
}

class PlayerDeck extends CardSplay {
	on_child_added(event, c) {
		super.on_child_added(...arguments);
		c.faceUp = false;
	}
	draw_hand() {
		let app=App.get();
		if(app.hand.children.length == 0) {
			var cards_to_draw = app.hand.hand_size;
		}
		else {
			var cards_to_draw = (1 + app.hand.hand_size) - app.hand.children.length;
		}
		this.draw_cards(cards_to_draw);
		app.hand.can_draw = true;
		app.playertraits.can_draw = true;
		app.eventdeck.can_draw = true;
		this.can_draw = false;
		app.board.scroll_to_player();
	}
	draw_cards(n) {
		var sh = n - this.children.length;
		var cards = this.children.slice(-n);
		let app = App.get();
		this.move_to(cards, app.hand);
		if(sh > 0) {
			var discards = app.playerdiscard.children.slice();
			discards = shuffle(discards);
			app.playerdiscard.move_to(discards, this);
			var cards = this.children.slice(-sh);
			this.move_to(cards, app.hand);
		}
	}
}

class PlayerTraits extends CardSplay {
	active_card = null;
	on_child_added(event, c) {
		super.on_child_added(...arguments);
		c.faceUp = true;
	}
	on_touch_up(event, touch) { //rotate through trait cards --TODO: limit once per turn
		super.on_touch_up(...arguments);
		let r = this
		if(this.children.length>0 && r.collide(touch.rect)) {
			this.children = [this.children[this.children.length-1],...this.children.slice(0,-1)];
			this.active_card = this.children[this.children.length-1];
			return true;
		}
	}
}

class ActiveCardSplay extends CardSplay {
	active_card = null;
	on_child_added(event, child) {
		child.selected=false;
		if(this.children.length > 0) {
			this.active_card = this.children [this.children.length-1];
		}
		else {
			this.active_card = null;
		}
	}
	on_child_removed(event, child) {
		if(this.children.length > 0) {
			this.active_card = this.children [this.children.length-1];
		}
		else {
			this.active_card = null;
		}
	}
	on_touch_up(event, touch) {
		super.on_touch_up(...arguments);
		let app = App.get();
		let r = this;
		let stop = false;
		if(this.children.length > 0 && r.collide(touch.rect)) {
			app.hand.cancel_action();
			return true;
		}
	}
	discard_used(unused=0, noise=0, exhaust_on_use=null, tap_on_use=null) {
		let app = App.get();
		if(unused > 0) {
			let cards0 = this.children.slice(0,unused);
			this.move_to(cards0, app.hand);
		}
		if(this.children.length > 0) {
			if(exhaust_on_use !== null) {
				if(exhaust_on_use instanceof TraitCard) {
					app.playertraits.move_to([exhaust_on_use], app.exhausted);
				}
				else {
					this.move_to([exhaust_on_use], app.exhausted);
				}
			}
			if(tap_on_use !== null) {
				if(tap_on_use instanceof TraitCard) {
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
		let r = this;
		if(r.collide(touch.rect)) {
			touch.grab(this);
			this._touching = true;
			return true;
		}
	}
	on_touch_move(event, touch) {
		if(touch.grabbed==this) {
			this._touching = this.collide(touch.rect);
		}
		return super.on_touch_move(event, touch);
	}
	on_touch_up(event, touch) {
		let app=App.get();
		if(touch.grabbed == this) {
			let r = this;
			this._touching = false;
			touch.ungrab();
			if(r.collide(touch.rect)) {
				app.hand.selected_action = this.text;
				this.parent.parent.close();
				return true;
			}
		}
	}
	draw() {
		this.bgColor = this._touching ? colorString([0.75,0.75,0.75]):colorString([0.5,0.5,0.5]);
		super.draw();
	}
}
class ActionSelector extends ModalView {
	constructor(card, actions) {
		let app = App.get();
		let h = Object.keys(actions).length
		super(new Rect([card.x, card.y-h, card.w, h*2]),
			{hints:{center_x:0.5,
					center_y:0.5,
					w:0.5}}); 
		let b = new BoxLayout(null, {orientation:'vertical', hints:{x:0,y:0,w:1,h:1}});
		for(var a in actions) {
			b.addChild(new ActionSelectorOption(new Rect(), {text: a}));
		}
		this.addChild(b);
	}
	on_close(event, value) {
		let hand = App.get().hand;
		hand.action_selector = null;
		if(hand.selected_action=='') {
			hand.clear_selection();
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
		super.on_child_added(...arguments);
		child.faceUp = true;
	}
	on_back_button(event, touch) {
		let app = App.get();
		if(app.stats.parent == null) app.stats.popup();
		else app.stats.close();
	}
	on_touch_up(event, touch) {
		if(touch.grabbed!=this) return super.on_touch_up(...arguments);
		let grabbed_child = this.grabbed_child;
		super.on_touch_up(...arguments);
		let app = App.get();
		if(this.children.length == 0) return true;
		if(this.can_draw == false) return true;
		let c = grabbed_child;
		if(c!=null && c.collide(touch.rect)) {
			if(this.shownCard==c) { //Clear an already selected card
				this.shownCard=null;
				this.clear_selection();
			}
			else if(this.selected_action != '') { //Add card to the currently selected card action
				var action_fn = this.actions [this.selected_action];
				if(action_fn.activate('can_stack', {stacked_card: c})) {
					this.move_to([c], app.activecardsplay, 0);
					action_fn.activate('card_stacked', {stacked_card: c});
					return true;
				}
			}
			else {
				this.shownCard = c; //Change to a new selected
				this.selected_action = '';
				app.board.map_choices = [];
				let actions = c.get_actions(app);
				for(let tc of app.playertraits.children.slice(-1)) {
					let trait_actions = tc.get_actions_for_card(c, app);
					for(let ta in trait_actions) {
						actions[ta] = trait_actions[ta];
					}
				}
				this.show_card_actions(c, actions);
				app.playerprompt.text = 'Select an action for this card';
				return true;
			}
		}
		return true;
	}
	on_selected_action(event, data) {
		if(this.selected_action != '') {
			let app=App.get();
			this.move_to([this.shownCard], app.activecardsplay);
			var action = this.selected_action;
			var action_fn = this.actions[action];
			action_fn.activate('card_action_selected');
		}
	}
	clear_selection() {
		let app = App.get();
		app.playerprompt.text = 'Select a card to play or touch the event deck to end your turn';
		app.board.map_choices = [];
		this.shownCard = null;
		this.children.filter(c=>c.selected).map(c=>c.selected=false);
		this.selected_action = '';
	}
	show_card_actions(card, actions) {
		let app = App.get();
		this.selected_action = '';
		this.actions = actions;
		this.action_selector = new ActionSelector(card, actions);
		this.action_selector.popup();
	}
	cancel_action() {
		if(this.selected_action != '') {
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
		if(this.children.length == 0) app.playerprompt.text = 'Touch the event deck to end your turn';
		else app.playerprompt.text = 'Select a card from your hand to play';
	}
}

class SkillDeck extends CardSplay {
	on_touch_up(event, touch) {
		super.on_touch_up(...arguments);
		let r = this
		if(r.collide(touch.rect)) {
			return true;
		}
	}
	select_draw(num_to_pick=2, num_offered=4) {
		let app = App.get();
		var cards = this.children.slice(-num_offered);
		if(cards.length == 0) {
			return ;
		}
		for(var c of cards) {
			this.removeChild(c);
		}
		let cardselector = new CardSelector(cards, {numToPick: num_to_pick});
		cardselector.bind('close', (e,c,p)=>this.card_picked(e,c,p));
		cardselector.popup();
	}
	card_picked(event, cs, exitVal) {
		let app = App.get();
		for(var c of cs.cards) {
			if(!(c.selected)) {
				c.faceUp = false;
				this.addChild(c,0);
			}
			else {
				app.hand.addChild(c);
				c.faceUp = true;
				c.selected = false;
			}
		}
	}
}

class LootDeck extends CardSplay {
	select_draw(num_to_pick=1, num_offered=1) {
		let app = App.get();
		var cards = this.children.slice(-num_offered);
		for(var c of cards) {
			this.removeChild(c);
		}
		let cardselector = new CardSelector(cards, {numToPick: num_to_pick});
		cardselector.bind('close', (e,c,p)=>this.card_picked(e,c,p));
		cardselector.popup();
	}
	card_picked(event,cs, pressed) {
		let app = App.get();
		for(var c of cs.cards) {
			if(!(c.selected)) {
				c.faceUp = false;
				this.addChild(c, 0); //TODO: add positional arg to addChild def
			}
			else {
				app.hand.addChild(c);
				c.faceUp = true;
				c.selected = false;
			}
		}
		app.stats.loot++;
		app.stats.t_loot++;
	}
}

class MarketDeck extends CardSplay {
	select_draw(num_to_pick=1, num_offered=1, coin=1) {
		let app = App.get();
		let cards = this.children.slice(-num_offered);
		this.children = this.children.slice(0, -num_offered);
		let cardselector = new CardSelector(cards, {numToPick: num_to_pick});
		cardselector.bind('close', (e,c,p)=>this.card_picked(e,c,p));
		cardselector.popup();
//		console.log(cards);
	}
	card_picked(event, cs, press) {
		let app = App.get();
		for(var c of cs.cards) {
			if(!(c.selected)) {
				c.faceUp = false;
				this.addChild(c);
			}
			else {
				app.hand.addChild(c);
				c.faceUp = true;
				c.selected = false;
			}
		}
	}
}

class Exhausted extends CardSplay {
	on_child_added(event, child) {
		super.on_child_added(...arguments);
		child.faceUp=true;
	}
}

class EventDeck extends CardSplay {
	can_draw = false;
	on_child_added(event, card) {
		super.on_child_added(...arguments);
		card.faceUp=false;
	}
	on_touch_up(event, touch) {
		super.on_touch_up(...arguments);
        let r = touch.rect;
		if(this.collide(r)) { // && c.emit(event,touch)
			this.drawCard();
			return true;
		}
	}
	drawCard() {
		let app = App.get();
		if(!(this.can_draw)) {
			return;
		}
		app.hand.cancel_action();
		if(this.children.length == 0) {
			if(app.hand.children.length==0 && app.activecardsplay.children.length==0) {
				app.missionFailed();
			}
			return;
		}
		if(app.board.active_player_clashing()) {
			app.missionFailed()
			return;
		}
		// if(app.clear_and_check_end_game()) {
		// 	return;
		// }
		for(var t of app.board.iter_tokens('G')) { //Unfreeze frozen guards
			t.frozen = false;
		}
		var card = this.children.slice(-1)[0];
		card.faceUp = true;
		for(var c of app.playertraits.children) {
			c.tapped = false;
		}
		this.move_to([card], app.eventdiscard);
		card.activate(app.board);
		app.playerdeck.draw_hand();
		app.board.token_update();
		app.stats.rounds++;
		app.stats.t_rounds++;
	}
}

class EventDiscard extends CardSplay {
	on_child_added(event, card) {
		super.on_child_added(...arguments);
		this.emit('discard', card);
		card.faceUp=true;
	}
}

const hints_fixedH = {h:null};

class Stats extends ModalView {
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
	bgColor = colorString([0,0,0.2]);
	hints = {x:0.1, y:0.2, w:0.8, h:0.6};
	id = 'stats';
	constructor() {
		super(null);
		this.addChild(new BoxLayout(null, {
			children:[new ScrollView(null, {scrollW: false, uiZoom: false,
				children: [new BoxLayout(null, { hints:{h:null},
					children:[
					new Label(null, {id: 'title', text: 'GAME OVER', h:1.5, hints: {h:null}, font_size:0.75}),
					new BoxLayout(null, {id:'mission_container', h:0, hints:{h:null}}),
					new Label(null, {align:'left', h:1.5, hints: {h:null}, text: 'Stats'}),
					new Label(null, {align:'left', h:1, hints: {h:null}, id:'missions', text: (stats)=>`Missions complete: ${stats.missions}`}),
					new Label(null, {align:'left', h:1, hints: {h:null}, id:'kills', text: (stats)=>`Kills: ${stats.kills} / ${stats.t_kills}`}),
					new Label(null, {align:'left', h:1, hints: {h:null}, id:'knockouts', text: (stats)=>`Knockouts: ${stats.knockouts} / ${stats.t_knockouts}`}),
					new Label(null, {align:'left', h:1, hints: {h:null}, id:'contacts', text: (stats)=>`Contacts: ${stats.contacts} / ${stats.t_contacts}`}),
					new Label(null, {align:'left', h:1, hints: {h:null}, id:'loot', text: (stats)=>`Loot: ${stats.loot} / ${stats.t_loot}`}),
					new Label(null, {align:'left', h:1, hints: {h:null}, id:'rounds', text: (stats)=>`Rounds: ${stats.rounds} / ${stats.t_rounds}`}),
					]}),
				]}),
			new BoxLayout(null, {id:'butbox', h:1, hints: {h:null}, paddingX:0.1, spacingX:0.1, orientation:'horizontal',
				children: [
					new Button(null, {text:'CLOSE', id:'close', on_press:(ev,ob,press)=>this.close()}),
					new Button(null, {text:'RESTART', id:'restart', on_press:(ev,ob,press)=>this.restartGame()}),
					new Button(null, {text:'NEXT', id:'next', on_press:()=>this.nextMission(), disable:true}),
				]})
			]}));
		// this.addChild(new BoxLayout(null, {
		// 	hints: {x:0, y:0, w:1, h:1},
		// 	orientation: 'vertical',
		// 	children: [
		// 		new Label(null, {id: 'title', text: 'GAME OVER', h:1.5, hints: {h:null}, font_size:0.75}),
		// 		new ScrollView(null, {id:'mission_container', scrollW:false}),
		// 		new BoxLayout(null, {orientation:'vertical', h:8.5, hints:{h:null},
		// 			children: [
		// 				new Label(null, {align:'left', h:1.5, hints: {h:null}, text: 'Stats'}),
		// 				new Label(null, {align:'left', h:1, hints: {h:null}, id:'missions', text: (stats)=>`Missions complete: ${stats.missions}`}),
		// 				new Label(null, {align:'left', h:1, hints: {h:null}, id:'kills', text: (stats)=>`Kills: ${stats.kills} / ${stats.t_kills}`}),
		// 				new Label(null, {align:'left', h:1, hints: {h:null}, id:'knockouts', text: (stats)=>`Knockouts: ${stats.knockouts} / ${stats.t_knockouts}`}),
		// 				new Label(null, {align:'left', h:1, hints: {h:null}, id:'contacts', text: (stats)=>`Contacts: ${stats.contacts} / ${stats.t_contacts}`}),
		// 				new Label(null, {align:'left', h:1, hints: {h:null}, id:'loot', text: (stats)=>`Loot: ${stats.loot} / ${stats.t_loot}`}),
		// 				new Label(null, {align:'left', h:1, hints: {h:null}, id:'rounds', text: (stats)=>`Rounds: ${stats.rounds} / ${stats.t_rounds}`}),
		// 				new BoxLayout(null, {id:'butbox', h:1, hints: {h:null}, paddingX:0.1, spacingX:0.1, orientation:'horizontal',
		// 					children: [
		// 						new Button(null, {text:'CLOSE', id:'close', on_press:(ev,ob,press)=>this.close()}),
		// 						new Button(null, {text:'RESTART', id:'restart', on_press:(ev,ob,press)=>this.restartGame()}),
		// 						new Button(null, {text:'NEXT', id:'next', disable:true}),
		// 					]})
		// 		]})
		// 	]}));
		this.next = this.findById('next');
		this.title = this.findById('title');
	}
	draw() {
		super.draw();
	}
	on_mission(event, touch) {
		this.findById('mission_container').children = [this.mission];
	}
	restartGame() {
		this.reset();
		App.get().setupNewGame();
		this.close();
	}
	nextMission() {
		App.get().setupNextMission();
		this.close();
	}
	reset(totals=true) {
		this.kills = 0;
		this.knockouts = 0;
		this.contacts = 0;
		this.loot = 0;
		this.rounds = 0;
		this.showing = false;
		if(totals) {
			this.t_kills = 0;
			this.t_knockouts = 0;
			this.t_contacts = 0;
			this.t_loot = 0;
			this.t_rounds = 0;
			this.t_showing = false;
		}		
	}
}


