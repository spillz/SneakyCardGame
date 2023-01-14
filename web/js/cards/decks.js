function *repeatInstantiate(list, reps=1) {
	for(let i of list) {
		for(let r=0 ; r<reps; r++) {
			yield new i();
		}
	}
}

function make_event_cards() {
	return [...repeatInstantiate([SpawnEvent, PatrolEvent, AlertEvent, MoveEvent], 3)];
}

function make_skill_cards() {
	return [...repeatInstantiate([EfficientMove, EfficientAttack, EfficientClimb, 
		EfficientSneak, EfficientKnockout, EfficientArrow, EfficientLockpick], 3)];
}

function make_loot_cards(level=1) {
	switch(level) {
		case 1:
			return [...repeatInstantiate([TreasureCard, SkeletonKey], 8)];
			break;
		case 2:
			return [...repeatInstantiate([TreasureCard, TreasureCard, SkeletonKey], 5)];
			break;
		case 3:
			return [...repeatInstantiate([TreasureCard, TreasureCard, GasArrow, RopeArrow, DimmerArrow, DecoyArrow, 
				SmokeBomb], 3)];
	}
}

function make_market_cards() {
	return [...repeatInstantiate([GasArrow, RopeArrow, DimmerArrow, DecoyArrow, 
		SmokeBomb], 3)];
}

function make_player_cards() {
	return [...repeatInstantiate([BasicMove],4), ...repeatInstantiate([BasicAttack, BasicClimb, BasicSneak, 
		BasicKnockout, BasicKnockout, BasicArrow], 1)];
}

function make_trait_cards() {
	return [...repeatInstantiate([MoveTrait, FightTrait])];
};

