

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
    constructor() {
        super();
    }
    setupWidgets() {
        let r = new Rect();
        this.activecardsplay = new ActiveCardSplay(r, {text: 'ACTIVE\nCARD'});
        this.playertraits = new PlayerTraits(r, {text: 'PLAYER\nTRAITS'});
        this.playerdeck = new PlayerDeck(r, {text: 'PLAYER\nDECK'});
        this.playerdiscard = new PlayerDiscard(r, {text: 'PLAYER\nDISCARD'});
        this.loot1 = new LootDeck(r, {text: 'LOOT1'});
        this.loot2 = new LootDeck(r, {text: 'LOOT2'});
        this.loot3 = new LootDeck(r, {text: 'LOOT3'});
        this.skilldeck = new SkillDeck(r, {text: 'SKILLS'});
        this.exhausted = new Exhausted(r, {text: 'EXHAUSTED\nCARDS PILE'});
        this.marketdeck = new MarketDeck(r, {text: 'MARKET\nDECK'});
        this.eventdeck = new EventDeck(r, {text: 'EVENT\nDECK'});
        this.eventdiscard = new EventDiscard(r, {text: 'EVENT\nDISCARD'});
        this.hand = new Hand(r, {text: 'PLAYER\nHAND'});
        this.sv = new ScrollView(r, {zoom: 1});
        this.board = new Board([0,0,this.map_card_size[0]*this.map_size[0], 
            this.map_card_size[1]*this.map_size[1]],
            {numX: this.map_size[0]});
        this.playarea = new Widget([0,0,this.map_card_size[0]*this.map_size[0], 
            this.map_card_size[1]*this.map_size[1]]);
        this.playerprompt = new PlayerPrompt(r, { fontSize: 0.5,
                text: 'Select a card from your hand to play, or tap the event card to end your turn'});

        this.sv.addChild(this.playarea);
        this.playarea.addChild(this.board);
        for(let w of [this.activecardsplay, this.playertraits, this.playerdeck, this.playerdiscard,
                    this.loot1, this.loot2, this.loot3, this.skilldeck, this.exhausted,
                    this.marketdeck, this.eventdeck, this.eventdiscard, this.hand,
                    this.sv, this.playerprompt]) {
            this.baseWidget.addChild(w);
        }

        this.instructions = null;
        this.cardselector = null;
        this.action_selector = null;
        this.stats = new Stats();

        this.playercards = make_player_cards(this);
        this.traitcards = make_trait_cards(this);
        this.lootcards = make_loot_cards(this);
        this.marketcards = make_market_cards(this);
        this.skillcards = make_skill_cards(this);

        this.setupNewGame();
    }
    clear_state(self) {
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
        this.clear_state();
        this.stats.next.disable=true;
        this.stats.title.text = 'MISSION IN PROGRESS';
        this.skilldeck.select_draw(2,4);

        this.mission = new ContactMission({mission_level:this.stats.missions+1});
        this.board.children = this.mission.setup_map(this);
        this.eventdiscard.children = [];
        this.eventdeck.children = this.mission.setup_events(this);
        this.eventdeck.can_draw = true;

        this.playerdiscard.children = [];
        this.playerdeck.children = shuffle(this.playercards);
        this.playertraits.children = shuffle(this.traitcards);
        this.loot1.children = shuffle(this.lootcards);
        this.marketdeck.children = shuffle(this.marketcards);

        let player = new PlayerToken([0,0]);

        let guards = [...this.board.iter_spawns()].map(s => new GuardToken(s));
        let targets = [...this.board.iter_targets()];
        let objective = new ObjectiveToken(targets.slice(-1)[0]);
        targets = targets.slice(0,-1).map(t => new TargetToken(t));
        let markets = [...this.board.iter_markets()].slice(0,-1).map(t => new MarketToken(t));

        this.board.tokens = [player, ...guards, ...targets, ...markets, objective];
    }
    setupNextLevel() {
        this.clear_state();
        this.stats.next.disable=true;
        this.stats.title.text = 'MISSION IN PROGRESS';
        this.skilldeck.select_draw(2,4);

        this.mission = new ContactMission({mission_level:this.stats.missions+1});
        this.board.children = this.mission.setup_map(this);
        this.eventdiscard.children = [];
        this.eventdeck.children = this.mission.setup_events(this);
        this.eventdeck.can_draw = true;

        let playercards = [...this.playerdiscard.children, ...this.playerdeck, ...this.hand]
        this.playerdiscard.children = [];
        this.hand.children = [];
        this.playerdeck.children = shuffle(playercards);
        this.playertraits.children = shuffle(this.traitcards);
        this.loot1.children = shuffle(this.lootcards);
        this.marketdeck.children = shuffle(this.marketcards);

        let player = new PlayerToken([0,0]);

        let guards = [...this.board.iter_spawns()].map(s => new GuardToken(s));
        let targets = [...this.board.iter_targets()];
        let objective = new ObjectiveToken(targets.slice(-1)[0]);
        targets = targets.slice(0,-1).map(t => new TargetToken(t));
        let markets = [...this.board.iter_markets()].slice(0,-1).map(t => new MarketToken(t));

        this.board.tokens = [player, ...guards, ...targets, ...markets, objective];

    }
    missionComplete() {
        this.clear_state();
        this.stats.next.disable=false;
        this.stats.popup();
        this.hand.can_draw=false;
        this.stats.missions += 1;
        this.eventdeck.can_draw=false;
        this.stats.title.text = 'MISSION COMPLETED';
    }
    missionFailed() {
        this.clear_state();
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
        this.hz_cards = f(W/4); //how many cards we need to fit horizontally in a vertical orientation screen
        this.vt_cards = f(H/4.2); //how many cards we need to fit vertically in a horizontal orientation screen
        let cgx = this.map_card_grid_size[0];
        let cgy = this.map_card_grid_size[1];
        this.card_aspect_ratio = cgx/cgy;

        this.card_size = H>W ? [this.hz_cards,this.hz_cards/this.card_aspect_ratio] : 
                          [this.vt_cards*this.card_aspect_ratio,this.vt_cards];
        let cw,ch;
        [cw,ch] = this.card_size;
                                      
        this.scroll_size = H>W ? [W, H-16*f(ch/5)] : 
                            [W-12*f(cw/5), H-6*f(ch/5)];
        this.map_scale = Math.max(this.scroll_size[1]/(3*ch), 
                             this.scroll_size[0]/(6*cw));
        this.map_card_size = [5,7];
        // this.map_card_size = [cw*this.map_scale*f(this.zoom/cgx)*cgx, 
        //                 ch*this.map_scale*f(this.zoom/cgy)*cgy];
 
        //Layout the widgets
        if(W>H) { //Wide display
            //TODO: Update all of the names root->this, card_size->cx,cy, height->H, width->W
            this.playerprompt.rect = [cw*6/5, 0, W-2*cw*6/5, ch/5];
            this.activecardsplay.rect = [0, H-ch, f(cw*6/5), ch];
            this.playertraits.rect = [0, H-2*ch, f(cw*6/5), ch];
            this.playerdeck.rect = [0, ch, f(cw*6/5), ch];
            this.playerdiscard.rect = [0, 0, f(cw*6/5), ch];
            this.loot1.rect = [W+cw, H-ch, f(cw*6/5), ch];
            this.loot2.rect = [W+cw, H-2*ch, f(cw*6/5), ch];
            this.loot3.rect = [W+cw, H-3*ch, f(cw*6/5), ch];
            this.skilldeck.rect = [W+cw, H-4*ch, f(cw*6/5), ch];
            this.exhausted.rect = [W+cw, H-4*ch, f(cw*6/5), ch];
            this.marketdeck.rect = [W - f(cw*6/5), H-ch, f(cw*6/5), ch];
            this.eventdeck.rect = [W - cw*6/5, ch, f(cw*6/5), ch];
            this.eventdiscard.rect = [W - f(cw*6/5), 0, f(cw*6/5), ch];
            this.hand.rect = [f(W-cw*6)/2, H-ch, Math.min(W,cw*6),ch];
            this.sv.rect = [f(cw*6/5), H-ch-this.scroll_size[1], ...this.scroll_size];
        } else { //Tall display
            this.playerprompt.rect = [0, 0, W, ch/5];
            this.activecardsplay.rect = [f(cw*6/5), H-2*ch, f(cw*6/5), ch];
            this.playertraits.rect = [0, H-2*ch, f(cw*6/5), ch];
            this.playerdeck.rect = [W-f(cw*6/5), H - 2*ch, f(cw*6/5), ch];
            this.playerdiscard.rect = [W-2*f(cw*6/5), H - 2*ch, f(cw*6/5), ch];
            this.loot1.rect = [W, H-ch, f(cw*6/5), ch];
            this.loot2.rect = [W, H-2*ch, f(cw*6/5), ch];
            this.loot3.rect = [W, H-3*ch, f(cw*6/5), ch];
            this.skilldeck.rect = [W, H-2*ch, f(cw*6/5), ch];
            this.exhausted.rect = [W, H-2*ch, f(cw*6/5), ch];
            this.marketdeck.rect = [0, ch/5, f(cw*6/5), ch];
            this.eventdeck.rect = [W - cw*6/5, ch/5, f(cw*6/5), ch];
            this.eventdiscard.rect = [W - 2*f(cw*6/5), ch/5, f(cw*6/5), ch];
            this.hand.rect = [0, H-ch, Math.min(W,cw*6),ch];
            this.sv.rect = [0, H-2*ch-this.scroll_size[1], ...this.scroll_size];
        }
        this.board.scroll_to_player();
    }
}