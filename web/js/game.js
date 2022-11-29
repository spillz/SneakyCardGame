

class Game extends App {
    setupWidgets() {
        let deck = new Deck([1,1,4,8], {orientation:'down'});
        for(let i=0; i<52;i++) {
            let card = new Card([1,1,4,6], {name: "CARD "+i, text:"This is a very long string of card text", faceUp:true});
            card.processTouches = true;
            deck.addChild(card);
        }

        let mapboard = new GridLayout([8,1,40,28],{numX:8});
        for(let i = 0; i<32; i++) {
            mapboard.addChild(new CityMap([0,0,5,7], {cardLevel:3}));
        }
        let label = new Label([8,0,6,1], {text:'Sneaky Game'})
        let mapview = new ScrollView([8,1,20,14])
        mapview.addChild(mapboard);
        this.baseWidget.addChild(deck);
        this.baseWidget.addChild(mapview);
        this.baseWidget.addChild(label);

    }
}