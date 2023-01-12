class PlayerCard extends Card {
	get_actions(playarea) {
		return {}

	}
}

class StartPlayerCard extends PlayerCard {
}

class LootCard extends PlayerCard {
	lowerText = 'LOOT';
}

class SkillCard extends PlayerCard {
	lowerText = 'SKILL';
}

class TreasureCard extends LootCard {
    name = 'TREASURE';
    text = 'BUY 1[+1]: Spend 1 crown in the market';
	get_actions() {
		return {'BUY 1[+1]': new MarketAction(this, {base_allowance: 1, value_per_card: 1, exhaust_on_use: this})}
	}
}

class SkeletonKey extends LootCard {
    name = 'SKELETON KEY';
    text = 'LOCKPICK 4[+1]. Draw loot cards equal to the lockpick value minus the lock level and keep 1, discard the rest. Exhausts after use.';
	get_actions() {
		return {'LOCKPICK 4[+1]': new LockpickAction(this, {base_allowance: 4, value_per_card: 1, exhaust_on_use: this})}
	}
}

class MarketCard extends PlayerCard {
	lowerText = 'BLACK MARKET'
}

class GasArrow extends MarketCard {
    name = 'GAS ARROW';
    text = 'Arrow Range 3[+2]. KOs all enemies in the space. Exhausts after use.';
	get_actions() {
		return {'SHOOT GAS 3[+2]': new GasAction(this, {base_allowance: 3, value_per_card: 2, radius: 1, exhaust_on_use: this})}
	}
}

class RopeArrow extends MarketCard {
    name = 'ROPE ARROW';
    text = 'Climb 1.5 on top of a roof or exhaust to traverse 2 spaces from roof to roof. Exhausts after use.';
	get_actions() {
		return {'CLIMB 1.5': new ClimbAction(this, {base_allowance: 1.5, value_per_card: 1, max_height: 2}), 'TRAVERSE 2': new GlideAction(this, {base_allowance: 2, value_per_card: 1, max_height: 2, exhaust_on_use: this})}
	}
}

class DimmerArrow extends MarketCard {
    name = 'DIMMER ARROW';
    text = 'Arrow Range 3[+2]. Temporarily puts out a light in range until the event phase. Exhausts after use.';
	get_actions() {
		return {'SHOOT DIMMER 3[+2]': new DimmerAction(this, {base_allowance: 3, value_per_card: 2, exhaust_on_use: this})}
	}
}

class DecoyArrow extends MarketCard {
    name = 'DECOY ARROW';
    text = 'Arrow Range 3[+2]. Alert or dozing guards in line of sight move to targeted space then freeze. Exhausts after use.';
	get_actions() {
		return {'SHOOT DECOY 3[+2]': new DecoyAction(this, {base_allowance: 3, value_per_card: 2, exhaust_on_use: this})}
	}
}

class SmokeBomb extends MarketCard {
    name = 'SMOKE BOMB';
    text = 'Smoke 1. Enemies in your space cannot see or engage with you until the event phase. Exhausts after use.';
	get_actions() {
		return {'SMOKE BOMB': new SmokeBombAction(this, {base_allowance: 3, value_per_card: 2, exhaust_on_use: this})}
	}
}

class Lure extends MarketCard {
    name = 'LURE';
    text = 'Lure 1. Bring a solitary guard in the player\'s line of sight into your space.';
}

class Hypnotize extends MarketCard {
    name = 'HYPNOTIZE';
    text = 'Move a solitary guard engaged with you to a space up to range 3 away.';
}

class BasicMove extends StartPlayerCard {
    name = 'SWIFT';
    text = 'Move 1.5[+1.5]';
	get_actions() {
		return {'MOVE 1.5[+1.5]': new MoveAction(this, {base_allowance: 1.5, value_per_card: 1.5})}
	}
}

class BasicAttack extends StartPlayerCard {
    name = 'FIGHT';
    text = 'Attack 1[+1]. Alert all guards on block at end of fight.';
	get_actions() {
		return {'ATTACK 1[+1]': new FightAction(this, {base_allowance: 1, value_per_card: 1})}
	}
}

class BasicClimb extends StartPlayerCard {
    name = 'CLIMB';
    text = 'Climb 1';
	get_actions() {
		return {'CLIMB 1': new ClimbAction(this)}
	}
}

class BasicSneak extends StartPlayerCard {
    name = 'SNEAK';
    text = 'Sneak 1[+1]';
	get_actions() {
		return {'SNEAK 1[+1]': new MoveAction(this, {base_allowance: 1, value_per_card: 1, base_noise: 0, noise_per_stack: 0, cloaked:true})}
	}
}

class BasicKnockout extends StartPlayerCard {
    name = 'BLUDGEON';
    text = 'Knockout 1';
	get_actions() {
		return {'KNOCKOUT 1': new KnockoutAction(this)}
	}
}

class BasicArrow extends StartPlayerCard {
    name = 'ARROW';
    text = 'Arrow Range 3[+2]. Exhausts after use.';
	get_actions() {
		return {'SHOOT ARROW 3[+2]': new ArrowAction(this, {base_allowance: 3, value_per_card: 2, exhaust_on_use: this})}
	}
}

class BasicLockpick extends StartPlayerCard {
    name = 'BASIC LOCKPICK';
    text = 'Lockpick 1[+1]';
	get_actions() {
		return {'LOCKPICK 1[+1]': new LockpickAction(this, {base_allowance: 1})}
	}
}

class EfficientMove extends SkillCard {
    name = 'ELUSIVE';
    text = 'Move 2[+2]';
	get_actions() {
		return {'MOVE 2[+2]': new MoveAction(this, {base_allowance: 2, value_per_card: 2})}
	}
}

class EfficientAttack extends SkillCard {
    name = 'ATTACK';
    text = 'Attack 2[+1]. Alert all guards on block at end of fight.';
	get_actions() {
		return {'ATTACK 2[+1]': new FightAction(this, {base_allowance: 2})}
	}
}

class EfficientClimb extends SkillCard {
    name = 'CLIMB';
    text = 'Climb 1.5';
	get_actions() {
		return {'CLIMB 1.5': new ClimbAction(this)}
	}
}

class EfficientSneak extends SkillCard {
    name = 'SNEAK';
    text = 'Sneak 1[+1.5]';
	get_actions() {
		return {'SNEAK 1[+1.5]': new MoveAction(this, {base_allowance: 1, value_per_card: 1.5, base_noise: 0, noise_per_stack: 0})}
	}
}

class EfficientKnockout extends SkillCard {
    name = 'KNOCKOUT';
    text = 'Knockout enemy in range 1. Move into the opponents space if above them.';
	get_actions() {
		return {'KNOCKOUT 1': new KnockoutAction(this)}
	}
}

class EfficientArrow extends SkillCard {
    name = 'STEELHEAD ARROW';
    text = 'Arrow Range 5[+2]';
	get_actions() {
		return {'SHOOT ARROW 5[+2]': new ArrowAction(this, {base_allowance: 5, value_per_card: 2, exhaust_on_use: this})}
	}
}

class EfficientLockpick extends SkillCard {
    name = 'LOCKPICK';
    text = 'Lockpick 2[+1]';
	get_actions() {
		return {'LOCKPICK 2[+1]': new LockpickAction(this, {base_allowance: 2})}
	}
}
