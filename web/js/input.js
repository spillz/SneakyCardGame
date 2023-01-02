class Touch {
    pos = [0,0];
    state = 'touch_up'; // one of 'touch_up', 'touch_down', 'touch_move', 'touch_cancel'
    device = 'touch' //source of touch: touch, mouse or keyboard
    nativeObject = null;
    nativeEvent = null;
    constructor(props = {}) {
        for(let p in props) {
            this[p] = props[p];
        }
    }
    copy() {
        return new Touch({pos:[...this.pos], state:this.state, device:this.device, nativeObject:this.nativeObject, nativeEvent:this.nativeEvent});
    }
    local(widget) {
        return new Touch({pos:[...widget.to_local(this.pos)], state:this.state, device:this.device, nativeObject:this.nativeObject, nativeEvent:this.nativeEvent});
    }
    get rect() {
        return new Rect([...this.pos, 0, 0]);
    }
    set x(value) {
        this.pos[0] = value;
    }
    set y(value) {
        this.pos[1] = value;
    }
    get x() {
        return this.pos[0];
    }
    get y() {
        return this.pos[1];
    }
    get grabbed() {
        return App.get().inputHandler.grabbed;
    }
    grab(widget) {
        return App.get().inputHandler.grab(widget);
    }
    ungrab() {
        return App.get().inputHandler.ungrab();
    }
}


class InputHandler {
    grabbed = null;
    mouseTouchEmulation = true;
    constructor(app) {
        this.app = app;
        this.canvas = app.canvas;
        let canvas = this.canvas;
        // Register touch event handlers
        let that = this;

        // onclick	The event occurs when the user clicks on an element
        // oncontextmenu	The event occurs when the user right-clicks on an element to open a context menu
        // ondblclick	The event occurs when the user double-clicks on an element
        // onmousedown	The event occurs when the user presses a mouse button over an element
        // onmouseenter	The event occurs when the pointer is moved onto an element
        // onmouseleave	The event occurs when the pointer is moved out of an element
        // onmousemove	The event occurs when the pointer is moving while it is over an element
        // onmouseout	The event occurs when a user moves the mouse pointer out of an element, or out of one of its children
        // onmouseover	The event occurs when the pointer is moved onto an element, or onto one of its children
        // onmouseup	The event occurs when a user releases a mouse button over an element

//        document.addEventListener('onclick', function(ev){that.process_click(ev);}, true);
//        document.addEventListener('oncontextmenu', function(ev){that.process_contextmenu(ev);}, true);
//        document.addEventListener('ondblclick', function(ev){that.process_dblclick(ev);}, true);
//        document.addEventListener('onmouseenter', function(ev){that.process_mouseenter(ev);}, true);
//        document.addEventListener('onmouseleave', function(ev){that.process_mouseleave(ev);}, true);
        canvas.addEventListener('mousedown', function(ev){that.process_mouse(ev, 'mouse_down');}, true);
        canvas.addEventListener('mousemove', function(ev){that.process_mouse(ev, 'mouse_move');}, true);
        canvas.addEventListener('mouseout', function(ev){that.process_mouse(ev, 'mouse_cancel');}, true);
        canvas.addEventListener('mouseup', function(ev){that.process_mouse(ev, 'mouse_up');}, true);
//        document.addEventListener('onmouseover', function(ev){that.process_mouseover(ev);}, true);
        canvas.addEventListener('touchstart', function(ev){that.process_touch(ev, 'touch_down');}, false);
        canvas.addEventListener('touchmove', function(ev){that.process_touch(ev, 'touch_move');}, false);
        canvas.addEventListener('touchcancel', function(ev){that.process_touch(ev, 'touch_cancel');}, false);
        canvas.addEventListener('touchend', function(ev){that.process_touch(ev, 'touch_up');}, false);
        document.addEventListener('backbutton', function(ev){that.process_back(ev);}, true);
        canvas.addEventListener('wheel', function(ev){that.process_wheel(ev, 'wheel');}, false);
    }
    grab(widget) {
        this.grabbed = widget;
    }
    ungrab() {
        this.grabbed = null;
    }
    process_back(ev) {
        //TODO: This is not working
        let state = true;
        this.set("menu", state); //TODO: true or false depend on ev state
    }
    // touchstart handler
    process_touch(ev, name) {
        // Use the event's data to call out to the appropriate gesture handlers
        if(this.grabbed != null) {
            for(let to of ev.changedTouches) { 
                let pos0 = [to.clientX, to.clientY];
                let pos = [...this.grabbed.iterParents()].reverse().reduce((prev,cur)=>cur.to_local(prev), pos0);
                let t = new Touch({pos:pos, state:name, nativeObject:to, nativeEvent:ev});
                this.grabbed.emit(name, t);
            }
        } else {
            for(let to of ev.changedTouches) { 
                let t = new Touch({pos:this.app.to_local([to.clientX, to.clientY]), state:name, nativeObject:to, nativeEvent:ev});
                this.app.emit(name, t, true);
            }
        }
        ev.preventDefault();
    }
    process_mouse(ev, name) {
        // Use the event's data to call out to the appropriate gesture handlers
        //t.identifier, t.clientX, t.clientY
        ev.preventDefault();
        if(this.mouseTouchEmulation) {
            let mapping = {'mouse_up':'touch_up','mouse_down':'touch_down','mouse_move':'touch_move','mouse_cancel':'touch_cancel'}
            if(ev.buttons!=1 && name!='mouse_up') return;
            if(this.grabbed != null) {
                let pos0 = [ev.clientX, ev.clientY];
                let pos = [...this.grabbed.iterParents()].reverse().reduce((prev,cur)=>cur.to_local(prev), pos0);
                let t = new Touch({pos:pos, state:mapping[name], nativeObject:ev});
                this.grabbed.emit(mapping[name], t);
            } else {
                let t = new Touch({pos:this.app.to_local([ev.clientX, ev.clientY]), state:mapping[name], nativeObject:ev});
                this.app.emit(mapping[name], t, true);
            }
        } else {
            if(this.grabbed != null) {
                this.grabbed.emit(name, ev);
            } else {
                this.app.emit(name, ev, true);
            }
        }
    }
    process_wheel(ev, name) {
        // Use the event's data to call out to the appropriate gesture handlers
        if(this.grabbed != null) {
            return this.grabbed.emit(name, ev);
        } else {
            this.app.emit(name, ev, true);
        }
        ev.preventDefault();
    }

    vibrate(intensity1, intensity2, duration) {
        window.navigator.vibrate(duration); //default vibration does not support intensity -- could simulate by staggering pulses over the duration
    }
}
