

class Game extends App {
    map_card_grid_size = [5,7];
    map_size = [6, 3];
    card_aspect_ratio = 5/7;
    hz_cards = 1; //how many cards we need to fit horizontally in a vertical orientation screen
    vt_cards = 1; //how many cards we need to fit vertically in a horizontal orientation screen
    card_size = [4,6];
    scroll_size = [10,10];
    map_scale = 1;
    map_card_size = [5,7];
    orientation = 'horizontal';
    debugMode = true;
    integerTileSize = false;
    constructor() {
        super();
    }
    setupWidgets() {
        this.activecardsplay = new ActiveCardSplay({text: 'ACTIVE\nCARD'});
        this.playertraits = new PlayerTraits({text: 'PLAYER\nTRAITS'});
        this.playerdeck = new PlayerDeck({text: 'PLAYER\nDECK'});
        this.playerdiscard = new PlayerDiscard({text: 'PLAYER\nDISCARD'});
        this.loot1 = new LootDeck({text: 'LOOT1'});
        this.loot2 = new LootDeck({text: 'LOOT2'});
        this.loot3 = new LootDeck({text: 'LOOT3'});
        this.skilldeck = new SkillDeck({text: 'SKILLS'});
        this.exhausted = new Exhausted({text: 'EXHAUSTED\nCARDS PILE'});
        this.marketdeck = new MarketDeck({text: 'MARKET\nDECK'});
        this.eventdeck = new EventDeck({text: 'EVENT\nDECK'});
        this.eventdiscard = new EventDiscard({text: 'EVENT\nDISCARD'});
        this.hand = new Hand({text: 'PLAYER\nHAND'});
        this.sv = new ScrollView({zoom: 1});
        this.board = new Board({numX: this.map_size[0], 
            rect: [0,0,this.map_card_size[0]*this.map_size[0], 
            this.map_card_size[1]*this.map_size[1]]});
        this.playarea = new Widget({rect:[0,0,this.map_card_size[0]*this.map_size[0], 
            this.map_card_size[1]*this.map_size[1]]});
        this.playerprompt = new PlayerPrompt({ fontSize: 0.5,
                text: 'Tap the event deck to begin.'});

        this.sv.addChild(this.playarea);
        this.playarea.addChild(this.board);
        for(let w of [this.playertraits, this.playerdiscard, this.playerdeck,
                    this.loot1, this.loot2, this.loot3, this.skilldeck, this.exhausted,
                    this.marketdeck, this.eventdiscard, this.eventdeck, this.hand,
                    this.sv, this.playerprompt, this.activecardsplay]) {
            this._baseWidget.addChild(w);
        }

        this.instructions = null;
        this.cardselector = null;
        this.action_selector = null;
        this.stats = new Stats();

        this.makeDecks();
        this.setupNewGame();
        this.stats.popup();
    }
    makeDecks(playercards = true) {
        if(playercards) this.playercards = [...make_player_cards()];
        this.traitcards = make_trait_cards();
        this.lootcards1 = make_loot_cards(1);
        this.lootcards2 = make_loot_cards(2);
        this.lootcards3 = make_loot_cards(3);
        this.marketcards = make_market_cards();
        this.skillcards = make_skill_cards();
    }
    clearState() {
        if(this.cardselector!=null) {
            this.cardselector.close();
            this.cardselector = null;
        }
        if(this.hand.action_selector!=null) {
            this.hand.action_selector.close();
            this.hand.action_selector = null;
        }
        this.hand.cancel_action()
        this.board.map_choices=[]
    }
    setupNewGame() {
        this.clearState();
        this.makeDecks();
        this.stats.next.disable=true;
        this.stats.title.text = 'MISSION IN PROGRESS';
        this.skilldeck.select_draw(2,4);

        this.stats.mission = new ContactMission({mission_level:this.stats.missions+1});
        this.board.children = this.stats.mission.setup_map(this);
        this.eventdiscard.children = [];
        this.eventdeck.children = this.stats.mission.setup_events(this);
        this.eventdeck.can_draw = true;

        this.exhausted.children = [];
        this.hand.children = [];
        this.playerdiscard.children = [];
        this.playerdeck.children = shuffle(this.playercards);
        this.playertraits.children = shuffle(this.traitcards);
        this.loot1.children = shuffle(this.lootcards1);
        this.loot2.children = shuffle(this.lootcards2);
        this.loot3.children = shuffle(this.lootcards3);
        this.marketdeck.children = shuffle(this.marketcards);

        let player = new PlayerToken([0,0]);

        let guards = [...this.board.iter_spawns()].map(s => new GuardToken(s));
        let targets = [...this.board.iter_targets()];
        let objective = new ObjectiveToken(targets.slice(-1)[0]);
        targets = targets.slice(0,-1).map(t => new TargetToken(t));
        let markets = [...this.board.iter_markets()].slice(0,-1).map(t => new MarketToken(t));

        this.board.tokens = [player, ...guards, ...targets, ...markets, objective];
        this.playerprompt.text = 'Tap the event deck to begin';

        this.board.scroll_to_player();
        this.board.token_update();

    }
    setupNextMission() {
        this.clearState();
        this.makeDecks(false);
        this.stats.next.disable=true;
        this.stats.title.text = 'MISSION IN PROGRESS';
        this.skilldeck.select_draw(2,4);

        this.stats.mission = new ContactMission({mission_level:this.stats.missions+1});
        this.board.children = this.stats.mission.setup_map(this);
        this.eventdiscard.children = [];
        this.eventdeck.children = this.stats.mission.setup_events(this);
        this.eventdeck.can_draw = true;
        this.exhausted.children = [];

        let playercards = [...this.playerdiscard.children, ...this.playerdeck.children, ...this.hand.children]
        this.hand.children = [];
        this.playerdiscard.children = [];
        this.playerdeck.children = shuffle(playercards);
        this.playertraits.children = shuffle(this.traitcards);
        this.loot1.children = shuffle(this.lootcards1);
        this.loot2.children = shuffle(this.lootcards2);
        this.loot3.children = shuffle(this.lootcards3);
        this.marketdeck.children = shuffle(this.marketcards);

        let player = new PlayerToken([0,0]);

        let guards = [...this.board.iter_spawns()].map(s => new GuardToken(s));
        let targets = [...this.board.iter_targets()];
        let objective = new ObjectiveToken(targets.slice(-1)[0]);
        targets = targets.slice(0,-1).map(t => new TargetToken(t));
        let markets = [...this.board.iter_markets()].slice(0,-1).map(t => new MarketToken(t));

        this.board.tokens = [player, ...guards, ...targets, ...markets, objective];
        this.playerprompt.text = 'Tap the event deck to begin';

        this.board.scroll_to_player();
        this.board.token_update();
    }
    missionComplete() {
        this.clearState();
        this.stats.next.disable=false;
        this.stats.popup();
        this.hand.can_draw=false;
        this.stats.missions += 1;
        this.eventdeck.can_draw=false;
        this.stats.title.text = 'MISSION COMPLETED';
    }
    missionFailed() {
        this.clearState();
        this.stats.next.disable=true;
        this.stats.popup();
        this.hand.can_draw=false;
        this.eventdeck.can_draw=false;
        this.stats.title.text = 'MISSION FAILED';
    }
    updateWindowSize() {
        this.prefDimW = 4*this.map_card_grid_size[0]; //Preferred width in tile units (not pixels)
        this.prefDimH = 4.2*this.map_card_grid_size[1]; //Preferred height in tile units (not pixels)

        super.updateWindowSize(); //Sets dimW, dimW and tileSize to best fit the preferred dimensions
        this.updateCoreWidgets();
    }
    updateCoreWidgets() {
        let f = x => x;//Math.floor;
 
        let W = this.dimW;
        let H = this.dimH;
        this.vt_cards = f(H/4.5); //how many cards we need to fit vertically in a horizontal orientation screen
        this.hz_cards = f(W/5); //how many cards we need to fit horizontally in a vertical orientation screen
        let cgx = this.map_card_grid_size[0];
        let cgy = this.map_card_grid_size[1];
        this.card_aspect_ratio = cgx/cgy;

        let card_height = H/4.5;
        let card_width = card_height*this.card_aspect_ratio;
        let needed_width = card_width * (5+12/5)
        let orientation = 'horizontal';
        if(W<needed_width) {
            orientation = 'vertical';
            card_width = W/5;
            card_height = card_width/this.card_aspect_ratio;
            let needed_height = card_height*6;
            if(H<needed_height) {
                card_height = H/6;
                card_width = card_height*this.card_aspect_ratio;
            }
        }
        this.orientation = orientation;
        this.card_size = [card_width, card_height];

        let cw,ch;
        [cw,ch] = this.card_size;
                                      
        this.scroll_size = H>W ? [W, H-16*f(ch/5)] : 
                            [W-12*f(cw/5), H-6*f(ch/5)];
        this.map_scale = Math.max(this.scroll_size[1]/(3*ch), 
                             this.scroll_size[0]/(6*cw));
        this.map_card_size = [5,7];

        //TODO: can tweak this a bit to set a minimum comfortable zoom level
        this.sv.zoom = clamp(orientation=='horizontal'? 
            this.scroll_size[0]/this.board.w:this.scroll_size[1]/this.board.h,1,5);
 
        //Layout the widgets
        if(orientation=='horizontal') { //Wide display
            //TODO: Update all of the names root->this, card_size->cx,cy, height->H, width->W
            this.playerprompt.rect = [0, 0, W, ch/5];
            this.activecardsplay.rect = [W-cw*6/5, H-ch, f(cw*6/5), ch];
            this.playertraits.rect = [0, H-ch, f(cw*6/5), ch];
            this.playerdeck.rect = [0, H-2*ch, f(cw*6/5), ch];
            this.playerdiscard.rect = [0, H-3*ch, f(cw*6/5), ch];
            this.loot1.rect = [W+cw, H-ch, f(cw*6/5), ch];
            this.loot2.rect = [W+cw, H-2*ch, f(cw*6/5), ch];
            this.loot3.rect = [W+cw, H-3*ch, f(cw*6/5), ch];
            this.skilldeck.rect = [W+cw, H-4*ch, f(cw*6/5), ch];
            this.exhausted.rect = [W+cw, H-4*ch, f(cw*6/5), ch];
            this.marketdeck.rect = [W + 2*cw, H-ch, f(cw*6/5), ch];
            this.eventdeck.rect = [0, ch/5, f(cw*6/5), ch];
            this.eventdiscard.rect = [0, 6*ch/5, f(cw*6/5), ch];
            this.hand.rect = [Math.max(6*cw/5, (W-cw*6)/2), H-ch, Math.min(W-12*cw/5,cw*6),ch];
            this.sv.rect = [f(cw*6/5), H-ch-this.scroll_size[1], ...this.scroll_size];
        } else { //Tall display
            this.playerprompt.rect = [0, 0, W, ch/5];
            this.activecardsplay.rect = [W-6*cw/5, H-2*ch, f(cw*6/5), ch];
            this.playertraits.rect = [0, H-2*ch, f(cw*6/5), ch];
            this.playerdeck.rect = [W-f(cw*6/5), ch/5, f(cw*6/5), ch];
            this.playerdiscard.rect = [W+cw, ch/5, f(cw*6/5), ch];
            this.loot1.rect = [W+cw, H-ch, f(cw*6/5), ch];
            this.loot2.rect = [W+cw, H-2*ch, f(cw*6/5), ch];
            this.loot3.rect = [W+cw, H-3*ch, f(cw*6/5), ch];
            this.skilldeck.rect = [W+cw, H-2*ch, f(cw*6/5), ch];
            this.exhausted.rect = [W+cw, H-2*ch, f(cw*6/5), ch];
            this.marketdeck.rect = [-2*cw, ch/5, f(cw*6/5), ch];
            this.eventdeck.rect = [0, ch/5, f(cw*6/5), ch];
            this.eventdiscard.rect = [cw*6/5, ch/5, f(cw*6/5), ch];
            this.hand.rect = [0, H-ch, Math.min(W,cw*6),ch];
            this.sv.rect = [0, H-2*ch-this.scroll_size[1], ...this.scroll_size];
        }
        //TODO: Not ideal place to put this but it serves as an initializer for some of the board state
		this.board.token_update();
        this.board.scroll_to_player();
    }
}