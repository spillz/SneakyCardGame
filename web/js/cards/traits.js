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
    text = 'Once per round: play hand card as UNLOCK 1[+1]';
	get_actions_for_card(card, playarea) {
		if(this.tapped || this.exhausted) {
			return {};
		}
		else {
			return {'UNLOCK 1[+1]': new UnlockAction(card, {base_allowance: 1, tap_on_use: true})};
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
