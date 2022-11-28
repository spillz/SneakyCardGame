
class App {
    constructor() {
        this.pixelSize = 1;
        this.fillScreen = false;
        this.dimW = this.prefDimW = 32;
        this.dimH = this.prefDimH = 16;
        this.tileSize = this.getTileScale()*this.pixelSize;

        this.gameOffsetX = 0;
        this.gameOffsetY = 0;
        this.inputHandler = new InputHandler();
        this.shakeX = 0;                 
        this.shakeY = 0;      

        this.baseWidget = null; // widget container
    }

    start() {
        let that = this;
        window.onresize = (() => that.updateWindowSize());
        this.setupCanvas();

        this.baseWidget = new Widget(new Rect([0, 0, this.dimW, this.dimH]));

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
        this.board.addChild(deck);
        this.board.addChild(mapview);
        this.board.addChild(label);

        this.update();
    }

    update() {
        let millis = 15;
        let n_timer_tick = Date.now();
        if(this.timer_tick!=null){
            millis = Math.min(n_timer_tick - this.timer_tick, 30); //maximum of 30 ms refresh
        }
        this.baseWidget.update(millis);
        this.draw(millis);

        let that = this;
        window.requestAnimationFrame(() => that.update());
    }
    
    draw(millis){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.shakeX = 0;
        this.shakeY = 0;
//        screenshake();

        this.bsaeWidget.draw();
    }
        
    setupCanvas(){
        this.canvas = document.querySelector("canvas");
    
        this.canvas.width = window.innerWidth; //this.tileSize*(this.dimW);
        this.canvas.height = window.innerHeight; //this.tileSize*(this.dimH);
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';

        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;

        this.gameOffsetX = Math.floor((window.innerWidth - this.tileSize*this.dimW)/2);
        this.gameOffsetY =  Math.floor((window.innerHeight - this.tileSize*this.dimH)/2);
   
    }

    getTileScale() {
        let sh = window.innerHeight;
        let sw = window.innerWidth;
        let scale;
        scale = Math.min(sh/(this.prefDimH)/this.pixelSize,sw/(this.prefDimW)/this.pixelSize);
        if(!this.fillScreen) { //pixel perfect scaling
            scale = Math.floor(scale);
        }    
        return scale;
    }
    
    fitMaptoTileSize(scale) {
        let sh = window.innerHeight;
        let sw = window.innerWidth;
        this.dimH = Math.floor(sh/scale);
        this.dimW = Math.floor(sw/scale);    
    }
    
    updateWindowSize() {
        this.tileSize = this.getTileScale()*this.pixelSize;
        this.fitMaptoTileSize(this.tileSize);
        this.setupCanvas();
    }

}


class Widget extends Rect {
    //TODO: Do we want pos_hint, size_hint a la kivy (hint dict)?
    //TODO: Touch / mouse event handling (i.e., emits when touched)
    bgColor = "black";
    outlineColor = "gray";
    constructor(rect, properties=null) {
        super(rect);
        this.vel = new Vec2([0, 0]);
        this.parent = null;
        this.processTouches = false;
        this._children = []; //widget has arbitrarily many children
        this._needsLayout = true;
        this._events = {
        };
        if(properties!=null) {
            this.updateProperties(properties);
        }
        return new Proxy(this, {
            set(target, name, value) {
                if(['x','y','w','h','children','_children','_needsLayout','_events'].includes[name]) return Reflect.set(...arguments);
                target[name] = value;
                target.emit(name, value);
                return true;
            }
          });
    }
    updateProperties(properties) {
        for(let p in properties) {
            this[p] = properties[p];
        }    
    }
    bind(event, func) {
        if(!(event in this._events)) this._events[event] = [];
        this._events[event].push(func);
    }
    unbind(event, func) {
        this._events[event] = this._events[event].filter(b => b!=func);
    }
    emit(event, data) {
        if('on_'+event in this) {
            if(this['on_'+event](event, data)) return true;
        }
        if(!(event in this._events)) return;
        let listeners = this._events[event];
        for(let func of listeners)
            if(func(event, this, data)) return true;
        return false;
    }
    *iter(recursive=true, inView=true) {
        yield this;
        if(!recursive) return;
        for(let c of this._children) {
            yield *c.iter(...arguments);
        }
    }
    addChild(child) {
        this._children.push(child);
        this.emit('child_added', child);
        child.parent = this;
        this._needsLayout = true;
    }
    removeChild(child) {
        this._children = this.children.filter(c => c!=child);
        this.emit('child_removed', child);
        child.parent = null;
        this._needsLayout = true;
    }
    get children() {
        return this._children;
    }
    set children(children) {
        for(let c of this._children) {
            this.emit('child_removed', child);
            child.parent = null;
            this._needsLayout = true;
        }
        this._children = []
        for(let c of children) {
            this.addChild(c);
        }
    }
    set x(val) {
        this._needsLayout = true;
        this[0] = val;
    }
    set y(val) {
        this._needsLayout = true;
        this[1] = val;
    }
    set w(val) {
        this._needsLayout = true;
        this[2] = val;
    }
    set h(val) {
        this._needsLayout = true;
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
    on_touch_down(event, touch) {
        for(let c of this.children) if(c.emit(event, touch)) return true;
        return false;
    }
    on_touch_up(event, touch) {
        for(let c of this.children) if(c.emit(event, touch)) return true;
        return false;
    }
    on_touch_move(event, touch) {
        for(let c of this.children) if(c.emit(event, touch)) return true;
        return false;
    }
    on_touch_cancel(event, touch) {
        for(let c of this.children) if(c.emit(event, touch)) return true;
        return false;
    }
    layoutChildren() { //The default widget does not layout it's children, a la kivy FloatLayout
        for(let c of this.children) c.layoutChildren();
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
        game.ctx.fillStyle = this.bgColor;
        game.ctx.fill();
        game.ctx.lineWidth = game.tileSize / 16;
        game.ctx.strokeStyle = this.outlineColor;
        game.ctx.stroke();

        for(let c of this.children)
            c.draw();
    }
    update(millis) {
        this.pos = this.pos.add(this.vel.scale(millis));
        if(this._needsLayout) {
            this.layoutChildren();
            this._needsLayout = false;
//            this._layoutHints = {};
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

class Label extends Widget {
    fontSize = null;
    text = '';
    fontSize = null;
    wrap = false;
    align = 'center';
    color = "white";
    constructor(rect, properties) {
        super(...arguments);
        // this.text = '';
        // this.fontSize = null;
        // this.wrap = false;
        // this.align = 'center';
        // this.color = "white";
        this.updateProperties(properties)
        }
    draw() {
        super.draw();
        let r = this.renderRect();
        let fontSize;
        if(this.fontSize==null) {
            fontSize = this.h*game.tileSize/2;
            game.ctx.font = fontSize + "px monospace";
            let scale = r.w/game.ctx.measureText(this.text).width;
            if(scale<1) fontSize *= scale;
        } else {
            fontSize = this.fontSize*game.tileSize;
        }
        game.ctx.font = fontSize + "px monospace";
        if(this.wrap) {
            drawWrappedText(this.text, fontSize, this.align=="center", r, this.color);
        } else {
            drawText(this.text, fontSize, this.align=="center", r, this.color);
        }   
    }
}

class Image extends Widget {

}

class BoxLayout extends Widget {
    spacingX = 0;
    spacingY = 0;
    paddingX = 0;
    paddingY = 0;
    orientation = 'vertical';
    constructor(rect, properties=null) {
        super(rect, properties);
    }
    on_numX() {
        this._needsLayout = true;
    }
    on_numY() {
        this._needsLayout = true;
    }
    on_spacingX() {
        this._needsLayout = true;
    }
    on_spacingY() {
        this._needsLayout = true;
    }
    on_paddingX() {
        this._needsLayout = true;
    }
    on_paddingY() {
        this._needsLayout = true;
    }
    layoutChildren() {
        if(this.orientation=='vertical') {
            num = this.children.length;
            let h = this.h - this.spacingY*num - 2*this.paddingY;
            let w = this.w - 2*this.paddingX;
            let ch = h/num;
            let cw = w;
            let y = this.y+this.paddingY;
            let x = this.x+this.paddingX;
            for(let i=0;i<this.children.length;i++) {
                this.children[i].x=x;
                this.children[i].y=y;
                this.children[i].w=cw;
                this.children[i].h=ch;
                this.children[i].layoutChildren();
                y+=this.spacingY+ch;
            }
            return;
        }
        if(this.orientation=='horizontal') {
            num = this.children.length;
            let h = this.h - 2*this.paddingY;
            let w = this.w - this.spacingX*num - 2*this.paddingX;
            let ch = h;
            let cw = w/num;
            let y = this.y+this.paddingY;
            let x = this.x+this.paddingX;
            for(let i=0;i<this.children.length;i++) {
                this.children[i].x=x;
                this.children[i].y=y;
                this.children[i].w=cw;
                this.children[i].h=ch;
                this.children[i].layoutChildren();
                x+=this.spacingX+cw;
            }

        }
    }
}


class GridLayout extends Widget {
    numX = 1;
    numY = -1;
    spacingX = 0;
    spacingY = 0;
    paddingX = 0;
    paddingY = 0;
    constructor(rect, properties) {
        super(rect);
        this.updateProperties(properties);
    }
    on_numX() {
        this._needsLayout = true;
    }
    on_numY() {
        this._needsLayout = true;
    }
    on_spacingX() {
        this._needsLayout = true;
    }
    on_spacingY() {
        this._needsLayout = true;
    }
    on_paddingX() {
        this._needsLayout = true;
    }
    on_paddingY() {
        this._needsLayout = true;
    }
    layoutChildren() {
        if(this.numX>0) {
            let numX = this.numX;
            let numY = Math.ceil(this.children.length/this.numX);
            let h = this.h - this.spacingY*numY - 2*this.paddingY;
            let w = this.w - this.spacingX*numX - 2*this.paddingX;
            let ch = h/numY;
            let cw = w/numX;
            let y = this.y+this.paddingY;
            let x = this.x+this.paddingX;
            for(let i=0;i<this.children.length;i++) {
                this.children[i].x=x;
                this.children[i].y=y;
                this.children[i].w=cw;
                this.children[i].h=ch;
                this.children[i].layoutChildren();
                if((i+1)%numX == 0) {
                    x = this.x + this.paddingX;
                    y += this.spacingY+ch;
                } else {
                    x+=this.spacingX+cw;
                }
            }
            return;
        }
        if(this.numY>0) {
            let numX = Math.ceil(this.children.length/this.numY);
            let numY = this.numY;
            let h = this.h - this.spacingY*numY - 2*this.paddingY;
            let w = this.w - this.spacingX*numX - 2*this.paddingX;
            let ch = h/numY;
            let cw = w/numX;
            let y = this.y+this.paddingY;
            let x = this.x+this.paddingX;
            for(let i=0;i<this.children.length;i++) {
                this.children[i].x=x;
                this.children[i].y=y;
                this.children[i].w=cw;
                this.children[i].h=ch;
                this.children[i].layoutChildren();
                if((i+1)%numX == 0) {
                    x += this.spacingX+cw;
                    y = this.y + this.paddingY;
                } else {
                    y+=this.spacingY+ch;
                }                
            }

        }
    }
}

class ScrollView extends Widget {
    scrollW = true;
    scrollH = true;
    scrollX = 0;
    scrollY = 0;
    constructor(rect, properties) {
        super(rect);
        this.updateProperties(true);
        this.processTouches = true;
        this.oldTouch = null;
        this.oldMouse = null;
    }
    layoutChildren() {
        if(!this.scrollW) this.children[0].w = this.w;
        if(!this.scrollH) this.children[0].h = this.h;
        this.children[0].x = this.x-this.scrollX;
        this.children[0].y = this.y-this.scrollY;
        this.children[0].layoutChildren();
    }
    *iter(recursive=true, inView=true) {
        yield this;
        if(!recursive) return;
        if(inView) {
            for(let c of this._children) {
                if(this.contains(c)) yield *c.iter(...arguments);
            }
        } else {
            for(let c of this._children) {
                yield *c.iter(...arguments);
            }
        }
    }
    on_scrollW(event, value) {
        this._needsLayout = true;
    }
    on_scrollH(event, value) {
        this._needsLayout = true;
    }
    on_scrollX(event, value) {
        this._needsLayout = true;
    }
    on_scrollY(event, value) {
        this._needsLayout = true;
    }
    on_touch_down(event, touch) {
        this.oldTouch = [touch.clientX, touch.clientY, touch.identifier];
        let r = new Rect([touch.clientX, touch.clientY, 0, 0]);
        for(let c of this.children) if(this.renderRect().collide(r) && c.emit(event, touch)) return true;
        return false;
    }
    on_touch_up(event, touch) {
        this.oldTouch = null;
        let r = new Rect([touch.clientX, touch.clientY, 0, 0]);
        for(let c of this.children) if(this.renderRect().collide(r) && c.emit(event, touch)) return true;
        return false;
    }
    on_touch_move(event, touch) {
        let r = new Rect([touch.clientX, touch.clientY, 0, 0]);
        if(this.renderRect().collide(r)) {
            if(this.oldTouch==null || touch.identifier!=this.oldTouch[2]) {
                this.oldTouch = [touch.clientX, touch.clientY, touch.identifier];
            } else {
                if(this.scrollW) {
                    this.scrollX += (this.oldTouch[0]-touch.clientX)/game.tileSize;
                    this.scrollX = Math.max(0, Math.min(this.scrollX, this.children[0].w-this.w))
                }
                if(this.scrollH) {
                    this.scrollY += (this.oldTouch[1]-touch.clientY)/game.tileSize; 
                    this.scrollY = Math.max(0, Math.min(this.scrollY, this.children[0].h-this.h))
                }
                this.oldTouch = [touch.clientX, touch.clientY, touch.identifier];    
            }
            for(let c of this.children) if(c.emit(event, touch)) return true;
        }
        return false;
    }
    on_touch_cancel(event, touch) {
        let r = new Rect([touch.clientX, touch.clientY, 0, 0]);
        for(let c of this.children) if(this.renderRect().collide(r) && c.emit(event, touch)) return true;
        return false;
    }
    // on_touch_move(event, touch) {
    //     if(this.renderRect().collide(r)) {
    //         if(this.oldTouch==null || touch.identifier!=this.oldTouch[2]) {
    //             this.oldTouch = [touch.clientX, touch.clientY, touch.identifier];
    //             return;
    //         }
    //         if(this.scrollW) {
    //             this.scrollX += (this.oldTouch[0]-touch.clientX)/game.tileSize;
    //             this.scrollX = Math.max(0, Math.min(this.scrollX, this.children[0].w-this.w))
    //         }
    //         if(this.scrollH) {
    //             this.scrollY += (this.oldTouch[1]-touch.clientY)/game.tileSize; 
    //             this.scrollY = Math.max(0, Math.min(this.scrollY, this.children[0].h-this.h))
    //         }
    //         this.oldTouch = [touch.clientX, touch.clientY, touch.identifier];
    //     }
    // }
    on_mouse_move(event, mouse) {
        let r = this.renderRect();
        if(r.collide(new Rect([mouse.clientX, mouse.clientY,0,0]))) {
            if(this.oldMouse==null || mouse.buttons!=1) {
                this.oldMouse = [mouse.clientX, mouse.clientY];
                return;
            }
            if(this.scrollW) {
                this.scrollX += (this.oldMouse[0]-mouse.clientX)/game.tileSize;
                this.scrollX = Math.max(0, Math.min(this.scrollX, this.children[0].w-this.w))
            }
            if(this.scrollH) {
                this.scrollY += (this.oldMouse[1]-mouse.clientY)/game.tileSize; 
                this.scrollY = Math.max(0, Math.min(this.scrollY, this.children[0].h-this.h))
            }
            this.oldMouse = [mouse.clientX, mouse.clientY];
        }
    }
    on_wheel(event, wheel) {
        if(this.scrollW) {
            this.scrollX += (wheel.deltaX)/game.tileSize;
            this.scrollX = Math.max(0, Math.min(this.scrollX, this.children[0].w-this.w))
        }
        if(this.scrollH) {
            this.scrollY += (wheel.deltaY)/game.tileSize; 
            this.scrollY = Math.max(0, Math.min(this.scrollY, this.children[0].h-this.h))
        }

    }
    draw() {
        let r = this.renderRect();
        game.ctx.save();
        game.ctx.beginPath();
        game.ctx.rect(r[0],r[1],r[2],r[3]);
        game.ctx.clip();
        this.children[0].draw()
        game.ctx.restore();
    }
}

class ModalView extends Widget {

}
