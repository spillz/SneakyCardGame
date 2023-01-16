function stack_all_fn(card) {
	return true;
};

function set_choice_type(pos1, pos2, board, dist_cap=2) {
	if(adist(pos1, pos2) < dist_cap) {
		var visible = false;
		if(!['B', 'U'].includes(board.get(pos1))) {
			visible = [...board.iter_tokens('G')].filter(g=>['alert','dozing'].includes(g.state) && !g.frozen && 
						adist(g.map_pos, pos1)<=10 && !(board.has_types_between(g.map_pos, pos1, 'B'))).length>0;
		}
		return visible? 'visible' : 'touch';
	}
	return 'info';
};

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
			this.spent += adist(obj.map_pos, board.active_player_token.map_pos);
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
			playarea.playerprompt.text = `Move ${this.rounded_remain()}: Touch the highlighted board spaces to move across the map. Add a handcard for [+${this.value_per_card}] move.`;
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
			this.spent += adist(obj.map_pos, board.active_player_token.map_pos);
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
			playarea.playerprompt.text = `Glide ${this.rounded_remain()}: Touch the highlighted board spaces to move building to building.  Add a handcard for [+${this.value_per_card}]`;
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
									&& adist(board.active_player_token.map_pos, t.map_pos) == 0);
		let map_choices = guard_choices.map(t=>board.make_token_choice(t, this, 'touch'));
		board.map_choices = map_choices;
		if(board.map_choices.length < 1 && this.spent != 0) {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = `Fight ${this.rounded_remain()}: Select a highlighted guard to attack.  Add a handcard for [+${this.value_per_card}]`;
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
						&& adist(obj.map_pos, t.map_pos) == 0);
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
		// 	&& adist(board.active_player_token.map_pos, t.map_pos) == 0);
		// let map_choices = guard_choices.map(t=>board.make_token_choice(t, this, 'touch'));
		let map_choices = [board.make_choice(board.active_player_token.map_pos, this, 'touch')];
		board.map_choices = map_choices;
		if(board.map_choices.length < 1 && this.spent != 0) {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			playarea.playerprompt.text = `Smokebomb ${this.rounded_remain()}: Select a highlighted guard to attack.`;
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
				var guard_choices = board.tokens.filter(t=>t instanceof board.token_types['G'] && t.state=='dozing' 
								&& adist(board.active_player_token.map_pos, t.map_pos) <= 1);
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
			this.spent = adist(board.active_player_token.map_pos, obj.token.map_pos);
			board.token_update();
		}
		else if(message == 'card_action_selected') {
			this.spent = 0;
		}
		if(!(board.active_player_clashing())) {
			let guard_choices = [...board.iter_tokens('G')].filter(t=>
				['dozing', 'alert'].includes(t.state)
				&& adist(board.active_player_token.map_pos, t.map_pos) <= this.rounded_remain()
				&& adist(board.active_player_token.map_pos, t.map_pos) > 0
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
			playarea.playerprompt.text = `Shoot arrow ${this.rounded_remain()}: Select a guard to shoot.  Add a handcard for [+${this.value_per_card}] range.`;
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
				&& adist(obj.map_pos, t.map_pos) <= this.radius);
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
			playarea.playerprompt.text = `Shoot arrow ${this.rounded_remain()}: Select a space to shoot gas arrow.  Add a handcard for [+${this.value_per_card}] range.`;
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
			this.spent = adist(board.active_player_token.map_pos, obj.map_pos);
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
							.filter(p=>adist(p,pp)<=this.value_allowance()
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
			playarea.playerprompt.text = `Shoot dimmer arrow ${this.rounded_remain()}: Select a space to shoot gas arrow.  Add a handcard for [+${this.value_per_card}] range.`;
		}
	}
}

class UnlockAction extends PlayerAction {
	base_allowance = 1;
	can_loot = true;
	max_loot = 3;
	constructor(card, props) {
		super(card, {});
		for(let p in props) this[p] = props[p];
	}
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
				let pick = this.rounded_remain();
				board.alert_nearby_guards(this.base_noise);
				if(pick >= t0.lock_level) {
					t0.picked = true;
					board.tokens = board.tokens.filter(t=>t!=t0);
					this.spent = pick;
					if(t0.has_loot) {
						let loot_decks = [playarea.loot1, playarea.loot2, playarea.loot3];
						loot_decks[t0.loot_level - 1].select_draw(1, (1 + pick) - t0.lock_level);
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
									.filter(m=>adist(this.loot_pos, m)>=1)
									.map(m=>board.make_choice(m, this, set_choice_type(m, p.map_pos, board, 3)));
				board.map_choices = move_choices;
			}
			else if(!board.building_types.includes(board [board.active_player_token.map_pos])) {
				let target_choices = [...board.iter_tokens('T')]
						.filter(t=>adist(p.map_pos,t.map_pos)==1 && this.rounded_remain()>=t.lock_level)
						.map(t=>t.map_pos);
				let move_choices = [];
				if(this.rounded_remain()>=1) {
					for(var b of board.iter_types_in_range(p.map_pos, 'B', 1)) {
						if([...board.iter_tokens('T')].find(t=>arrEq(b,t.map_pos))) continue;
						for(var m of board.iter_types_in_range(b, board.path_types, 1)) {
							if(adist(p.map_pos, m) >= 1) {
								move_choices.push(m);
							}
						}
					}	
				}
				target_choices = [...target_choices, ...move_choices];
				let map_choices = target_choices.map(t=>board.make_choice(t, this, set_choice_type(t, p.map_pos, board, 3)));
				board.map_choices = map_choices;
			}
		}
		if(board.map_choices.length < 1 && this.spent > 0) {
			playarea.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			if(this.lootpos!=null) {
				playarea.playerprompt.text = `Select an exit.`;
			}
			else {
				playarea.playerprompt.text = `Unlock ${this.rounded_remain()}: Select a target to loot or a destination. Add a handcard for [+${this.value_per_card}] loot choice.`;
			}
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
				if(t instanceof board.token_types['G'] && ['alert', 'dozing'].includes(t.state) && (0 < adist(t.map_pos, obj.map_pos) && adist(t.map_pos, obj.map_pos) <= 10)) {
					if(!(board.has_types_between(t.map_pos, obj.map_pos, board.building_types))) {
						t.map_pos = obj.map_pos;
						if(t.state!='alert') t.state = 'alert';
						t.frozen = true;
					}
				}
			}
			this.spent = adist(obj.map_pos, board.active_player_token.map_pos);
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
			playarea.playerprompt.text = `Shoot decoy ${this.rounded_remain()}: Select a tile to shoot the decoy to. Add a handcard for [+${this.value_per_card}] range.`;
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
				let move_choices = [...board.iter_types_in_range(this.market_pos, board.path_types, 1)].filter(m => adist(this.market_pos, m) >= 1);
				let target_choices = [...new Set(move_choices)];
				board.map_choices = target_choices.map(t => board.make_choice(t, this, set_choice_type(t, p.map_pos, board, 3)));
			}
			else if(!board.building_types.includes(board.get(board.active_player_token.map_pos))) {
				let target_choices = [...board.iter_markets()].filter(t=>adist(p.map_pos,t)==1);
				board.map_choices = target_choices.map(t => board.make_choice(t, this, set_choice_type(t, p.map_pos, board, 3)));
			}
		}
		if(board.map_choices.length < 1 && this.spent != 0) {
			app.activecardsplay.discard_used(this.cards_unused(), this.noise_made(), this.exhaust_on_use, this.tap_on_use);
		}
		else {
			if(this.market_pos==null) {
				app.playerprompt.text = `Buy ${this.rounded_remain()}: Select a market to enter.`;
			} else {
				app.playerprompt.text = 'Select an exit.'
			}
		}
	}
}
