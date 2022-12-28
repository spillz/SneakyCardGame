
class App {
    //App is the main object class for a kivy-like UI application
    //to run in the browser. 
    //Currently it is setup in a singleton model allowing one app
    //per html page.
    //The App maintains the HTML5 Canvas and drawing Context
    //It manages the update loop in update method
    //User interaction is handled in the inputHandler instance
    //and it will automatically bubble input events through
    //the widget heirarchy.
    //Every app has a baseWidget and an array of modalWidgets.
    //Global events can be propagated to baseWidget and modalWidgets
    //via the emit method (it will be up to child widgets to
    //emit thos events to tehir own children -- see on_touch_up
    //and on_touch_down implementations).
    //The modalWidgets are drawn over the top of the baseWidget
    //Use App.get() to access the running app instance. The
    //widgets added toh app will also access the running
    //app instance 
    static appInstance = null;
    constructor() {
        if(App.appInstance!=null) return appInstance; //singleton
        App.appInstance = this;
        this.pixelSize = 1;
        this.fillScreen = false;
        this.dimW = this.prefDimW = 32;
        this.dimH = this.prefDimH = 16;
        this.tileSize = this.getTileScale()*this.pixelSize;
        this.canvasName = "canvas";

        this.offsetX = 0;
        this.offsetY = 0;
        this.shakeX = 0;                 
        this.shakeY = 0;      
        this._needsLayout = false;

        // timer container
        this.timer_tick = null;
        this.timers = [];

        // widget container
        this.baseWidget = new Widget(null, {hints:{x:0, y:0, w:1, h:1}});
        this.baseWidget.parent = this;
        // modal widgets
        this.modalWidgets = [];
    }
    addTimer(duration, callback) {
        let t = new Timer(duration, 0, callback);
        this.timers.push(t);
        return t;
    }
    removeTimer(timer) {
        this.timers = this.timers.filter(t=>t!=timer);
    }
    addModal(modal) {
        this.modalWidgets.push(modal);
        this._needsLayout = true;
    }
    removeModal(modal) {
        this.modalWidgets = this.modalWidgets.filter(m => m!=modal);
    }
    static get() { //singleton
        if(!App.appInstance) App.appInstance = new App();
        return App.appInstance;
    }
    start() {
        let that = this;
        window.onresize = (() => that.updateWindowSize());
        this.setupCanvas();
        this.inputHandler = new InputHandler(this);
        this.updateWindowSize();
        this.update();
    }
    emit(event, data, topModalOnly=false) { //TODO: Need to suppress some events for a modal view(e.g., touches)
        if(topModalOnly && this.modalWidgets.length>0) {
            return this.modalWidgets[this.modalWidgets.length-1].emit(event, data);
        } else {
            if(this.baseWidget.emit(event, data)) return true;
            for(let mw of this.modalWidgets) {
                if(mw.emit(event, data)) return true;
            }
            return false;
        }
    }
    *iter(recursive=true, inView=true) {
        yield *this.baseWidget.iter(...arguments);
        for(let mw of this.modalWidgets) {
            yield *mw.iter(...arguments);
        }
    }
    findById(id) {
        for(let w of this.iter(true, false)) {
            if('id' in w && w.id==id) return w;
        }
        return null;
    }
    update() {
        let millis = 15;
        let n_timer_tick = Date.now();
        if(this.timer_tick!=null){
            millis = Math.min(n_timer_tick - this.timer_tick, 30); //maximum of 30 ms refresh
        }
        for(let t of this.timers) {
            t.tick(millis);
        }
        if(this._needsLayout) this.layoutChildren();

        this.baseWidget.update(millis);
        for(let mw of this.modalWidgets) mw.update(millis);

        this.draw(millis);

        window.requestAnimationFrame(() => this.update());
        this.timer_tick = n_timer_tick;
    }
    draw(millis){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeAmount = 0;
        screenshake(this);

        this.baseWidget._draw(millis);
        for(let mw of this.modalWidgets) mw._draw(millis);
    }
    recurseOffsets(offset) {
        return offset;
    }
    setupCanvas(){
        this.canvas = document.querySelector(this.canvasName);

        this.canvas.width = window.innerWidth; //this.tileSize*(this.dimW);
        this.canvas.height = window.innerHeight; //this.tileSize*(this.dimH);
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';

        this.ctx = this.canvas.getContext("2d");
        this.ctx.imageSmoothingEnabled = false;

        this.offsetX = Math.floor((window.innerWidth - this.tileSize*this.dimW)/2);
        this.offsetY =  Math.floor((window.innerHeight - this.tileSize*this.dimH)/2);
    }
    getTileScale() {
        let sh = this.h;
        let sw = this.w;
        let scale;
        scale = Math.min(sh/(this.prefDimH)/this.pixelSize,sw/(this.prefDimW)/this.pixelSize);
        if(!this.fillScreen) { //pixel perfect scaling
            scale = Math.floor(scale);
        }    
        return scale*this.pixelSize;
    }
    fitMaptoTileSize(scale) {
        let sh = window.innerHeight;
        let sw = window.innerWidth;
        this.dimH = Math.floor(sh/scale);
        this.dimW = Math.floor(sw/scale);    
    }
    applyHints(c) {
        let hints = c.hints;
        if('w' in hints) c.w = hints['w']*this.dimW;
        if('h' in hints) c.h = hints['h']*this.dimH;
        if('x' in hints) c.x = hints['x']*this.dimW;
        if('y' in hints) c.y = hints['y']*this.dimH;
        if('center_x' in hints) c.center_x = hints['center_x']*this.dimW;
        if('center_y' in hints) c.center_y = hints['center_y']*this.dimH;
        if('right' in hints) c.right = hints['right']*this.dimW;
        if('bottom' in hints) c.bottom = hints['bottom']*this.dimH;
    }
    updateWindowSize() {
        this.w = window.innerHeight;
        this.h = window.innerWidth;
        this.tileSize = this.getTileScale();
        this.fitMaptoTileSize(this.tileSize);
        this.setupCanvas();

        this._needsLayout = true;
    }
    layoutChildren() {
        //Key concept: 
        //As a general rule, each widget (and the app) controls the placement of its child widgets.
        //Whenever the layout properties (x,y,w,h etc) of any widget (or the app itself) have changed, 
        //all layout properites of the children of that widget will be updated at the next update call. 
        //Each widget has an internal _needsLayout boolean that tracks whether the layoutChildren should 
        //be called in that widget's update routine. That flag gets cleared once the layoutChildren of the 
        //child has been called to prevent multiple unecessary calls.

        // The layout in the app will respect hints but otherwise assume the widgets will control their
        // size and postioning
        this._needsLayout = false;
//        this.baseWidget.rect = new Rect([0, 0, this.dimW, this.dimH])
        this.applyHints(this.baseWidget);
        this.baseWidget.layoutChildren();
        for(let mw of this.modalWidgets) {
//            mw.rect = new Rect([0, 0, this.dimW, this.dimH])
            this.applyHints(mw);
            mw.layoutChildren();
        }
    }
}


class Widget extends Rect {
    bgColor = "black";
    outlineColor = "gray";
    _animation = null;
    hints = {};
    constructor(rect, properties=null) {
        super(rect);
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
                if(['x','y','w','h','children','rect'].includes[name] || name[0]=='_') return Reflect.set(...arguments);
                target[name] = value;
                target.emit(name, value);
                return true;
            }
          });
    }
    set rect(rect) {
        this[0] = rect[0];
        this[1] = rect[1];
        this[2] = rect[2];
        this[3] = rect[3];
        this._needsLayout = true;
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
    findById(id) {
        for(let w of this.iter(true, false)) {
            if('id' in w && w.id==id) return w;
        }
        return null;
    }
    recurseOffsets(offset) {
        return this.parent.recurseOffsets(offset);
    }
    addChild(child, pos=-1) {
        if(pos==-1) {
            this._children.push(child);
        } else {
            this._children = [...this._children.slice(0,pos), child, ...this._children.slice(pos)];
        }
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
            this.emit('child_removed', c);
            c.parent = null;
            this._needsLayout = true;
        }
        this._children = [];
        for(let c of children) {
            this.addChild(c);
        }
    }
    set x(val) {
        this._needsLayout = true;
        this[0] = val;
    }
    set center_x(val) {
        this._needsLayout = true;
        this[0] = val-this[2]/2;
    }
    set right(val) {
        this._needsLayout = true;
        this[0] = val-this[2];
    }
    set y(val) {
        this._needsLayout = true;
        this[1] = val;
    }
    set center_y(val) {
        this._needsLayout = true;
        this[1] = val-this[3]/2;
    }
    set bottom(val) {
        this._needsLayout = true;
        this[1] = val-this[3];
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
    get center_x() {
        return this[0] + this[2]/2;
    }
    get right() {
        return this[0] + this[2];
    }
    get y() {
        return this[1];
    }
    get center_y() {
        return this[1] + this[3]/2;
    }
    get bottom() {
        return this[1] + this[3];
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
    applyHints(c) {
        let hints = c.hints;
        if('w' in hints) c.w = hints['w']*this.w;
        if('h' in hints) c.h = hints['h']*this.h;        
        if('x' in hints) c.x = this.x + hints['x']*this.w;
        if('y' in hints) c.y = this.y + hints['y']*this.h;
        if('center_x' in hints) c.center_x = this.x + hints['center_x']*this.w;
        if('center_y' in hints) c.center_y = this.y + hints['center_y']*this.h;
        if('right' in hints) c.right = this.x + hints['right']*this.w;
        if('bottom' in hints) c.bottom = this.y + hints['bottom']*this.y;
    }
    layoutChildren() { //The default widget has children but does not apply a layout a la kivy FloatLayout
        this._needsLayout = false;
        for(let c of this.children) {
            this.applyHints(c);
            c.layoutChildren();
        }
        //TODO: This should also handle layout of self in case the sizing is being set externally(e.g., to lock an aspect ratio)
        //If so, rename to layoutSelfAndChildren or just layout?
    }
    renderRect() {
        let app = App.get();
        let r = new Rect(this);
        r[0] = r[0] * app.tileSize + app.shakeX + app.offsetX;
        r[1] = r[1] * app.tileSize + app.shakeY + app.offsetY;
        r[2] = r[2] * app.tileSize;
        r[3] = r[3] * app.tileSize;
        return r;        
    }
    localRect() {
        let app = App.get();
        let r = new Rect(this);
        r[0] = (r[0] - app.shakeX - app.offsetX)/app.tileSize;
        r[1] = (r[1] - app.shakeY - app.offsetY)/app.tileSize;
        r[2] = r[2]/app.tileSize;
        r[3] = r[3]/app.tileSize;
        return r;        
    }
    _draw(millis) {
        if(this.draw()=='abort') return;
        for(let c of this.children)
            c._draw(millis);
    }
    draw() {
        //Usually widget should draw itself, then draw children in order
        //TODO: Get rid of the ugly scale transforms
        let r = this.renderRect();
        let app = App.get();
        app.ctx.beginPath();
        app.ctx.rect(r[0], r[1], r[2], r[3]);
        app.ctx.fillStyle = this.bgColor;
        app.ctx.fill();
        app.ctx.lineWidth = 1; //app.tileSize / 16;
        app.ctx.strokeStyle = this.outlineColor;
        app.ctx.stroke();
    }
    update(millis) {
        if(this._animation!=null) this._animation.update(millis);
        if(this._needsLayout) this.layoutChildren();
        for(let c of this.children)
            c.update(millis);
    }
}

class WidgetAnimation {
    stack = [];
    widget = null;
    props = {}
    elapsed = 0;
    constructor() {

    }
    add(props, duration=1000) { 
        this.stack.push([props, duration]);
    }
    update(millis) { //todo: props can be of the form {prop1: 1, prop2: 2, ...} or {prop1: [1,func1], prop2: [2,func2]}
        let targetProps = this.stack[0][0];
        let duration = this.stack[0][1];
        if(this.elapsed==0) {
            this.initProps = {};
            for(let p in targetProps) {
                this.initProps[p] = this.widget[p];
            }
        }
        let skip = Math.max(this.elapsed+millis-duration,0);
        this.elapsed = this.elapsed+millis-skip;
        let wgt = duration==0? 1:this.elapsed/duration;
        for(let p in this.initProps) {
            this.widget[p] = (1-wgt)*this.initProps[p] + wgt*targetProps[p];
        }
        if(skip>=1) {
            this.stack = this.stack.slice(1);
            this.elapsed = skip;
            if(this.stack.length==0) this.cancel();
        }
    }
    start(widget) {
        this.widget = widget;
        widget._animation = this;
    }
    cancel() {
        this.widget._animation = null;
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
        let app = App.get();
        if(this.fontSize==null) {
            fontSize = Math.floor(this.h*app.tileSize/2);
            app.ctx.font = fontSize + "px monospace";
            let scale = r.w/app.ctx.measureText(this.text).width;
            if(scale<1) fontSize *= scale;
        } else {
            fontSize = this.fontSize*app.tileSize;
        }
        app.ctx.font = fontSize + "px monospace";
        if(this.wrap) {
            drawWrappedText(app.ctx, this.text, fontSize, this.align=="center", r, this.color);
        } else {
            drawText(app.ctx, this.text, fontSize, this.align=="center", r, this.color);
        }   
    }
}

class Button extends Label {
    selectColor = colorString([0.7,0.7,0.8]);
    bgColor = colorString([0.5,0.5,0.5]);
    on_touch_down(event, touch) {
        if(this.renderRect().collide(touch.rect)) {
            touch.grab(this);
            return true;
        }
    }
    on_touch_up(event, touch) {
        if(touch.grabbed!=this) return;
        touch.ungrab();
        if(this.renderRect().collide(touch.rect)) {
            this.emit('press', null);
            return true;
        }
    }
    draw() {
        let saved = this.bgColor;
        if(App.get().inputHandler.grabbed==this) this.bgColor = this.selectColor;
        super.draw();
        this.bgColor = saved;
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
        this._needsLayout = false;
        if(this.orientation=='vertical') {
            let num = this.children.length;
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
        this._needsLayout = false;
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
        this._needsLayout = false;
        this.setScrollX(this.scrollX);
        this.setScrollY(this.scrollY);
        if(!this.scrollW) this.children.apply(c=>c.w=this.w);
        if(!this.scrollH) this.children.apply(c=>c.h=this.h);
        for(let c of this.children) {
            c.layoutChildren();
        }
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
    applyHints(c) {
        let hints = c.hints;
        if('w' in hints) c.w = hints['w']*this.w;
        if('h' in hints) c.h = hints['h']*this.h;        
        if('x' in hints) c.x = hints['x']*this.w;
        if('y' in hints) c.y = hints['y']*this.h;
        if('center_x' in hints) c.center_x = hints['center_x']*this.w;
        if('center_y' in hints) c.center_y = hints['center_y']*this.h;
        if('right' in hints) c.right = hints['right']*this.w;
        if('bottom' in hints) c.bottom = hints['bottom']*this.y;
    }
    on_scrollW(event, value) {
        this._needsLayout = true;
        this.scrollX = 0;
    }
    on_scrollH(event, value) {
        this._needsLayout = true;
        this.scrollY = 0;
    }
    on_scrollX(event, value) {
        this._needsLayout = true;
    }
    on_scrollY(event, value) {
        this._needsLayout = true;
    }
    setScrollX(value) {
        this.scrollX = this.children[0].w<=this.w? (this.children[0].w-this.w)/2 : Math.min(Math.max(0, value),this.children[0].w-this.w);
    }
    setScrollY(value) {
        this.scrollY = this.children[0].h<=this.h? (this.children[0].h-this.h)/2 : Math.min(Math.max(0, value),this.children[0].h-this.h);
    }
    recurseOffsets(offset) {
        offset[0] += this.x - this.scrollX;
        offset[1] += this.y - this.scrollY;
        return this.parent.recurseOffsets(offset);
    }
    applyOffset() {
        let app = App.get();
        app.offsetX += (this.x-this.scrollX)*app.tileSize;
        app.offsetY += (this.y-this.scrollY)*app.tileSize;
    }
    offset_emit(c, event, touch) {
        let app = App.get();
        let savedOffset = [app.offsetX, app.offsetY];
        app.offsetX += (this.x-this.scrollX)*app.tileSize;
        app.offsetY += (this.y-this.scrollY)*app.tileSize;
        let result = c.emit(event, touch);
        app.offsetX = savedOffset[0];
        app.offsetY = savedOffset[1];
        return result;
    }
    on_touch_down(event, touch) {
        this.oldTouch = [touch.x, touch.y, touch.identifier];
        let r = touch.rect;
        if(this.renderRect().collide(r)) {
            for(let c of this.children) if(this.offset_emit(c, event, touch)) {
                return true;
            }
        }
        return false;
    }
    on_touch_up(event, touch) {
        this.oldTouch = null;
        let r = touch.rect;
        if(this.renderRect().collide(r)) {
            for(let c of this.children) if(this.offset_emit(c, event, touch)) {
                return true;
            }
        }
        return false;
    }
    on_touch_move(event, touch) {
        let r = touch.rect;
        let app = App.get();
        if(this.renderRect().collide(r)) {
            if(this.oldTouch==null || touch.identifier!=this.oldTouch[2]) {
                this.oldTouch = [touch.x, touch.y, touch.identifier];
            } else {
                if(this.scrollW) {
                    this.setScrollX(this.scrollX + (this.oldTouch[0]-touch.x)/app.tileSize);
                }
                if(this.scrollH) {
                    this.setScrollY(this.scrollY + (this.oldTouch[1]-touch.y)/app.tileSize);
                }
                this.oldTouch = [touch.x, touch.y, touch.identifier];    
            }
            for(let c of this.children) if(this.offset_emit(c, event, touch)) return true;
        }
        return false;
    }
    on_touch_cancel(event, touch) {
        let r = touch.rect;
        for(let c of this.children) if(this.renderRect().collide(r) && this.offset_emit(c, event, touch)) return true;
        return false;
    }
    // on_touch_move(event, touch) {
    //     if(this.renderRect().collide(r)) {
    //         if(this.oldTouch==null || touch.identifier!=this.oldTouch[2]) {
    //             this.oldTouch = [touch.clientX, touch.clientY, touch.identifier];
    //             return;
    //         }
    //         if(this.scrollW) {
    //             this.scrollX += (this.oldTouch[0]-touch.clientX)/app.tileSize;
    //             this.scrollX = Math.max(0, Math.min(this.scrollX, this.children[0].w-this.w))
    //         }
    //         if(this.scrollH) {
    //             this.scrollY += (this.oldTouch[1]-touch.clientY)/app.tileSize; 
    //             this.scrollY = Math.max(0, Math.min(this.scrollY, this.children[0].h-this.h))
    //         }
    //         this.oldTouch = [touch.clientX, touch.clientY, touch.identifier];
    //     }
    // }
    on_mouse_move(event, mouse) {
        let app = App.get();
        let r = this.renderRect();
        if(r.collide(new Rect([mouse.clientX, mouse.clientY,0,0]))) {
            if(this.oldMouse==null || mouse.buttons!=1) {
                this.oldMouse = [mouse.clientX, mouse.clientY];
                return;
            }
            if(this.scrollW) {
                this.scrollX += (this.oldMouse[0]-mouse.clientX)/app.tileSize;
                this.scrollX = Math.max(0, Math.min(this.scrollX, this.children[0].w-this.w))
            }
            if(this.scrollH) {
                this.scrollY += (this.oldMouse[1]-mouse.clientY)/app.tileSize; 
                this.scrollY = Math.max(0, Math.min(this.scrollY, this.children[0].h-this.h))
            }
            this.oldMouse = [mouse.clientX, mouse.clientY];
        }
    }
    on_wheel(event, wheel) {
        let app = App.get();
        if(this.scrollW) {
            this.scrollX += (wheel.deltaX)/app.tileSize;
            this.scrollX = Math.max(0, Math.min(this.scrollX, this.children[0].w-this.w))
        }
        if(this.scrollH) {
            this.scrollY += (wheel.deltaY)/app.tileSize; 
            this.scrollY = Math.max(0, Math.min(this.scrollY, this.children[0].h-this.h))
        }

    }
    _draw() {
        this.draw();
        let r = this.renderRect();
        let app = App.get();
        app.ctx.save();
        app.ctx.beginPath();
        app.ctx.rect(r[0],r[1],r[2],r[3]);
        app.ctx.clip();
        app.ctx.translate((this.x-this.scrollX)*app.tileSize, (this.y-this.scrollY)*app.tileSize);
        this.children[0]._draw()
        app.ctx.restore();
    }
}

class ModalView extends Widget {
    closeOnTouchOutside = true;
    popup() {
        let app = App.get();
        this.parent = app;
        app.addModal(this);
    }
    close(exitVal=0) {
        this.emit('closed',exitVal);
        let app = App.get();
        this.parent = null;
        app.removeModal(this);
    }
}
