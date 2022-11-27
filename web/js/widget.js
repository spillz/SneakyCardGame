

class Widget extends Rect {
    //TODO: Do we want pos_hint, size_hint a la kivy (hint dict)?
    //TODO: Touch / mouse event handling (i.e., emits when touched)
    constructor(rect) {
        super(rect);
        this.vel = new Vec2([0, 0]);
        this.parent = null;
        this.processTouches = false;
        this._children = []; //widget has arbitrarily many children
        this._needsLayout = true;
        this._layoutHint = {};
        this._events = {'child_added': [], 
                        'child_removed': []};
    }
    bind(event, func) {
        if(!(event in this._events)) this._events[event] = [];
        this._events[event].push(func);
    }
    unbind(event, func) {
        this._events[event] = this._events[event].filter(b => b!=func);
    }
    emit(event, data) {
        if(!(event in this._events)) return;
        let listeners = this._events[event];
        for(let func of listeners)
            func(event, this, data);
    }
    *iter(recursive=true) {
        yield this;
        if(!recursive) return;
        for(let c of this._children) {
            yield *c.iter(recursive);
        }
    }
    addChild(child) {
        this._children.push(child);
        this.emit('child_added', child);
        child.parent = this;
        this._needsLayout = true;
        this._layoutHint['children_added'] = true;
    }
    removeChild(child) {
        this._children = this.children.filter(c => c!=child);
        this.emit('child_removed', child);
        child.parent = null;
        this._needsLayout = true;
        this._layoutHint['children_removed'] = true;
    }
    get children() {
        return this._children;
    }
    set children(children) {
        for(let c of this._children) {
            this.emit('child_removed', child);
            child.parent = null;
            this._needsLayout = true;
            this._layoutHint['children_removed'] = true;
        }
        this._children = []
        for(let c of children) {
            this.addChild(c);
        }
    }
    set x(val) {
        this._needsLayout = true;
        this._layoutHint['x'] = this.x;
        this[0] = val;
    }
    set y(val) {
        this._needsLayout = true;
        this._layoutHint['y'] = this.y;
        this[1] = val;
    }
    set w(val) {
        this._needsLayout = true;
        this._layoutHint['w'] = this.w;
        this[2] = val;
    }
    set h(val) {
        this._needsLayout = true;
        this._layoutHint['h'] = this.h;
        this[3] = val;
    }
    get x() {
        return this[0];
    }
    get y() {
        return this[1];
    }
    get w() {
        return this[2];
    }
    get h() {
        return this[3];
    }
    layoutChildren() { //The default widget does not layout it's children, a la kivy FloatLayout
        //TODO: This should also handle layout of self in case the sizing is being set externally (e.g., to lock an aspect ratio)
        //If so, rename to layoutSelfAndChildren or just layout?
    }
    renderRect() {
        let r = new Rect(this);
        r[0] = r[0] * game.tileSize + game.shakeX + game.gameOffsetX;
        r[1] = r[1] * game.tileSize + game.shakeY + game.gameOffsetY;
        r[2] = r[2] * game.tileSize;
        r[3] = r[3] * game.tileSize;
        return r;        
    }
    localRect() {
        let r = new Rect(this);
        r[0] = (r[0] - game.shakeX - game.gameOffsetX)/game.tileSize;
        r[1] = (r[1] - game.shakeY - game.gameOffsetY)/game.tileSize;
        r[2] = r[2]/game.tileSize;
        r[3] = r[3]/game.tileSize;
        return r;        
    }
    draw() {
//        game.sprites.entitiesItems.draw(this.sprite, this.getDisplayX(), this.getDisplayY(), this.getFlipped());
        //Usually widget should draw itself, then draw children in order
        //TODO: Get rid of the ugly scale transforms
        let r = this.renderRect();
        game.ctx.beginPath();
        game.ctx.rect(r[0], r[1], r[2], r[3]);
        game.ctx.fillStyle = '#404040';
        game.ctx.fill();
        game.ctx.lineWidth = game.tileSize / 16;
        game.ctx.strokeStyle = '#BAC3D9';
        game.ctx.stroke();

        for(let c of this.children)
            c.draw();
    }
    update(millis) {
        this.pos = this.pos.add(this.vel.scale(millis));
        if(this._needsLayout) {
            this.layoutChildren();
            this._needsLayout = false;
            this._layoutHints = {};
        }
        for(let c of this.children)
            c.update(millis);
    }
}

//ADD BASIC LABEL/BUTTON STYLE WIDGETS
//class Label
//class Button

//ADD CONTAINERS
//BoxLayout?
//GridLayout?
//Popup? Is it needed?
//Scrollable ...

class Scrollable extends Widget {
    constructor(rect, scrollW, scrollH) {
        super(rect);
        this.scrollW = scrollW;
        this.scrollH = scrollH;
        this.scrollPos = new Vec2[0,0];
    }
    layoutChildren() {
        if(!this.scrollW) this.children[0].w = this.w;
        if(!this.scrollH) this.children[0].h = this.h;
    }
    update(millis) {
        //handle updating of scroll pos
    }
}

class Deck extends Widget { //represents a deck/tableau of splayed cards
    constructor(rect, orientation='down') { //TODO: add card spacing params
        super(rect);
        this.orientation = orientation;
    }

    layoutChildren() {
        //ASSUMPTION: The cards are already sized equally and will fit within the deck
        if(this.children.length==0) return;
        let c = this.children[0];
        if(this.orientation=='down') {
            let step = (this.h-c.h)/(this.children.length-1);
            let y = this.y;
            let x = this.x;
            for(let c of this.children) {
                c.y = Math.min(y, this.y+this.h-c.h);
                c.x = x;
                console.log('c.y',c.y, c.name);
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
                x+=step;
            }    
        }
    }

}

class Card extends Widget {
    constructor(rect, name, text, image, faceUp=false) {
        super(rect);
        this.name = name; //card header
        this.text = text; //card text
        this.image = image; // card image
        this.faceUp = faceUp; // cards start face down
        let that = this
        this.bind('touch_down', (name, obj, t) => that.onTouchDown(name, obj, t));
    }

    draw() {
        //        game.sprites.entitiesItems.draw(this.sprite, this.getDisplayX(), this.getDisplayY(), this.getFlipped());
                //Usually widget should draw itself, then draw children in order
        if(this.faceUp) {
            //TODO: draw a card background, borders etc
            super.draw();
            let r1 = new Rect(this);
            let r2 = new Rect(this);
            r1.h = this.h/5; 
            r2.y += r1.h;
            r2.h -= r1.h;
            //TODO: Get rid of the ugly scale transforms
            drawWrappedText(this.name, this.h/12*game.tileSize, true, r1.mult(game.tileSize).shift([game.gameOffsetX,game.gameOffsetY]), "yellow");
            drawWrappedText(this.text, this.h/18*game.tileSize, true, r2.mult(game.tileSize).shift([game.gameOffsetX,game.gameOffsetY]), "white");    
        } else {
            super.draw();
            //TODO: draw card back
        }
    }

    onTouchDown(name, obj, touch) {
        if(this.renderRect().collide(new Rect([touch.clientX, touch.clientY, 0, 0]))) this.faceUp = !this.faceUp;
    }

}

class CardGrid extends Widget {
//Display cards in a grid arrangement
}

class MapCardGrid extends Widget {
    //Display map cards in a grid arrangement that allows the individual spaces on 
    //each card to be accessed with x,y coordinates
    at(pos) {

    }
    to_card_coords(card, pos) {

    }
    to_map_coords(card, pos) {

    }
}
    

// class MapCard extends Widget {
//     constructor(rect, dimW, dimH) {
//         this.mapSpaces = [];
//         this.faceup = false;
//         this.dim = new Vec2([dimW, dimH]);

//         this.lights = [];
//         this.guardSpawns = [];
//         this.guardWaypoints = [];
//         this.lootSites = [];
//         this.markets = [];
//         this.targets = [];
//     }
//     at(pos) {

//     }
//     draw() {

//     }
// }

class Token extends Widget {
    constructor(rect) {
        super(rect);
    }
}

//class PlayerToken
//class GuardToken
//other tokens

//MapChoice
//TokenChoice 