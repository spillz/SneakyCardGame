class Mission extends BoxLayout {
	mission_level = 1;
	title = '';
	text = '';
	id = 'mission';
	hints = {h:null};
	constructor(props) {
        super();
		this.children = [
			new Label(null, {align:'left', hints:{h:null}, text:(mission)=>mission!=null?mission.title:'', fontSize:0.75}),
			new Label(null, {align:'left', wrap:true, hints:{h:null}, text:(mission)=>mission!=null?mission.text:'', fontSize: 0.5})
		]
	}
	updateProps() {
		for(var k in props) {
			this[k] = props[k];
		}
	}
	setup_events() {
		// pass;
	}
	setup_map() {
		// pass;
	}
}

class ContactMission extends Mission {
	title = 'Contact Mission';
	text = 'Your contact is locked inside the building marked with a gold star. Seek them out! You fail if you are caught by a guard or the event deck is empty at the end of your turn.';
	setup_events() {
		var events = make_event_cards();
		shuffle(events);
		return events;
	}
	setup_map() {
		let app = App.get();
		let w,h;
		[w,h] = app.map_card_size;
		var map_cards = [];
		var lev_add_on = Math.min(this.mission_level / app.map_size[0], 2);
		var lev_thresh = app.map_size [0] - (this.mission_level % app.map_size [0]);
		for(var y = 0; y < app.map_size [1]; y++) {
			for(var x = 0; x < app.map_size [0]; x++) {
				var lev = (1 + x / 2) + (x >= lev_thresh) * lev_add_on;
				map_cards.push(new CityMap(new Rect([0,0,w,h]),{cardLevel: lev}));
			}
		}
		return map_cards;
	}
}

class DeliveryMission extends Mission {
	mission_level = 1;
	setup_events() {
		// pass;
	}
	setup_map() {
		// pass;
	}
}
class AssassinMission extends Mission {
	mission_level = 1;
	setup_events() {
		// pass;
	}
	setup_map() {
		// pass;
	}
}
