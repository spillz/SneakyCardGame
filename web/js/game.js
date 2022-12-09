

class Game extends App {
    map_card_grid_size = [5,7];
    map_size = [6, 3];
    card_aspect_ratio = 5/7;
    hz_cards = 1; //how many cards we need to fit horizontally in a vertical orientation screen
    vt_cards = 1; //how many cards we need to fit vertically in a horizontal orientation screen
    card_size = [6,4];
    scroll_size = [10,10];
    zoom = 1.0;
    map_scale = 1
    map_card_size = [5,7];
    constructor() {
        super();
    }
    setupWidgets() {
        let r = new Rect();
        this.activecardsplay = new ActiveCardSplay(r, {text: 'ACTIVE\nCARD'})
        this.playertraits = new PlayerTraits(r, {text: 'PLAYER\nTRAITS'})
        this.playerdeck = new PlayerDeck(r, {text: 'PLAYER\nDECK'})
        this.playerdiscard = new PlayerDiscard(r, {text: 'PLAYER\nDISCARD'})
        this.loot1 = new LootDeck(r, {text: 'LOOT1'})
        this.loot2 = new LootDeck(r, {text: 'LOOT2'})
        this.loot3 = new LootDeck(r, {text: 'LOOT3'})
        this.skilldeck = new SkillDeck(r, {text: 'SKILLS'})
        this.exhausted = new Exhausted(r, {text: 'EXHAUSTED\nCARDS PILE'})
        this.marketdeck = new MarketDeck(r, {text: 'MARKET\nDECK'})
        this.eventdeck = new EventDeck(r, {text: 'EVENT\nDECK'})
        this.eventdiscard = new EventDiscard(r, {text: 'EVENT\nDISCARD'})
        this.hand = new Hand(r, {text: 'PLAYER\nHAND'})
        this.sv = new ScrollView(r);
        this.board = new Board([0,0,this.map_card_size[0]*this.map_size[0], this.map_card_size[1]*this.map_size[1]]);
        this.playerprompt = new Label(r, {text: 'Select a card from your hand to play, or tap the event card to end your turn'})

        this.sv.addChild(this.board);
        for(let w of [this.activecardsplay, this.playertraits, this.playerdeck, 
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

        this.mission = new ContactMission({mission_level:this.stats.missions+1});
        this.board.map.children = this.mission.setup_map(this);
        this.eventdeck.children = this.mission.setup_events(this);
        this.eventdeck.can_draw = true;

    }
    updateWindowSize() {
        let f = Math.floor;
        this.prefDimW = 5*this.map_card_grid_size[0]; //Preferred width in tile units (not pixels)
        this.prefDimH = 4.2*this.map_card_grid_size[1]; //Preferred height in tile units (not pixels)

        super.updateWindowSize(); //Sets dimW, dimW and tileSize to best bit the dimensions

        let W = this.dimW;
        let H = this.dimH;
        this.hz_cards = f(W/5); //how many cards we need to fit horizontally in a vertical orientation screen
        this.vt_cards = f(H/4.2); //how many cards we need to fit vertically in a horizontal orientation screen
        let cgx = this.map_card_grid_size[0];
        let cgy = this.map_card_grid_size[1];
        this.card_aspect_ratio = cgx/cgy;

        this.card_size = H>W ? [this.hz_cards,this.hz_cards/this.card_aspect_ratio] : 
                          [this.vt_cards*this.card_aspect_ratio/cgx*cgx,this.vt_cards];
        let cw,ch;
        [cw,ch] = this.card_size;
                                      
        this.scroll_size = H>W ? [W, H-16*f(ch/5)] : 
                            [W-12*f(cw/5), H-6*f(ch/5)];
        this.zoom = 1.0;
        this.map_scale = Math.max(this.scroll_size[1]/(3*ch), 
                             this.scroll_size[0]/(6*cw));
        this.map_card_size = [cw*this.map_scale*f(this.zoom/cgx)*cgx, 
                        ch*this.map_scale*f(this.zoom/cgy)*cgy];
 
        //Layout the widgets
        if(W>H) { //Wide display
            //TODO: Update all of the names root->this, card_size->cx,cy, height->H, width->W
            this.activecardsplay.rect = [0, 0, f(cw*6/5), ch];
            this.playertraits.rect = [0, ch, f(cw*6/5), ch];
            this.playerdeck.rect = [0, H - 2*ch, f(cw*6/5), ch];
            this.playerdiscard.rect = [0, H - ch, f(cw*6/5), ch];
            this.loot1.rect = [W, 0, f(cw*6/5), ch];
            this.loot2.rect = [W, ch, f(cw*6/5), ch];
            this.loot3.rect = [W, 2*ch, f(cw*6/5), ch];
            this.skilldeck.rect = [W, 3*ch, f(cw*6/5), ch];
            this.exhausted.rect = [W, 3*ch, f(cw*6/5), ch];
            this.marketdeck.rect = [W - f(cw*6/5), 0, f(cw*6/5), ch];
            this.eventdeck.rect = [W - cw*6/5, H - 2*ch, f(cw*6/5), ch];
            this.eventdiscard.rect = [W - f(cw*6/5), H - ch, f(cw*6/5), ch];
            this.hand.rect = [f(W-cw*6)/2, 0, Math.min(W,cw*6),ch];
            this.sv.rect = [f(cw*6/5), ch, ...this.scroll_size];
//            this.board = Board([0,0,this.map_card_size[0]*this.map_size[0], this.map_card_size[1]*this.map_size[1]]);
            this.playerprompt.rect = [W/40, H - f(ch/5), W, f(ch/5)]; 
        } else { //Tall display
            this.activecardsplay.rect = [f(cw*6/5), ch, f(cw*6/5), ch];
            this.playertraits.rect = [0, ch, f(cw*6/5), ch];
            this.playerdeck.rect = [0, H - ch, f(cw*6/5), ch];
            this.playerdiscard.rect = [f(cw*6/5), H - ch, f(cw*6/5), ch];
            this.loot1.rect = [W, 0, f(cw*6/5), ch];
            this.loot2.rect = [W, ch, f(cw*6/5), ch];
            this.loot3.rect = [W, 2*ch, f(cw*6/5), ch];
            this.skilldeck.rect = [W, 3*ch, f(cw*6/5), ch];
            this.exhausted.rect = [W, 3*ch, f(cw*6/5), ch];
            this.marketdeck.rect = [W-cw, ch, f(cw*6/5), ch];
            this.eventdeck.rect = [W - cw*6/5, H - ch, f(cw*6/5), ch];
            this.eventdiscard.rect = [W - 2*f(cw*6/5), H - ch, f(cw*6/5), ch];
            this.hand.rect = [0, 0, Math.min(W,cw*6),ch];
            this.sv.rect = [0, 2*ch, ...this.scroll_size];
//            this.board = Board([0,0,this.map_card_size[0]*this.map_size[0], this.map_card_size[1]*this.map_size[1]]);
            this.playerprompt.rect = [W/40, H - f(6*ch/5), W, f(ch/5)];
        }  
    }

}