class InputHandler {
    constructor() {
        this.canvas = document.getElementById("canvas");
        let canvas = this.canvas
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
        canvas.addEventListener('mousedown', function(ev){that.process_mouse(ev, 'touch_down');}, true);
        canvas.addEventListener('mousemove', function(ev){that.process_mouse(ev, 'touch_move');}, true);
        canvas.addEventListener('mouseout', function(ev){that.process_mouse(ev, 'touch_cancel');}, true);
        canvas.addEventListener('mouseup', function(ev){that.process_mouse(ev, 'touch_up');}, true);
//        document.addEventListener('onmouseover', function(ev){that.process_mouseover(ev);}, true);

        canvas.addEventListener('touchstart', function(ev){that.process_touch(ev, 'touch_down');}, false);
        canvas.addEventListener('touchmove', function(ev){that.process_touch(ev, 'touch_move');}, false);
        canvas.addEventListener('touchcancel', function(ev){that.process_touch(ev, 'touch_cancel');}, false);
        canvas.addEventListener('touchend', function(ev){that.process_touch(ev, 'touch_up');}, false);
        document.addEventListener('backbutton', function(ev){that.process_back(ev);}, true);

    }
    process_back(ev) {
        console.log('Back pressed', ev)
        let state = true;
        this.set("menu", state); //TODO: true or false depend on ev state
    }
    // touchstart handler
    process_touch(ev, name) {
        // Use the event's data to call out to the appropriate gesture handlers
        let canvas = this.canvas;
        for(let t of ev.changedTouches) { 
            //t.identifier, t.clientX, t.clientY
            for(let w of game.board.iter()) {
                if(w.processTouches) {
                    if(w.emit(name, t)) break;
                }
            }
        }   
        ev.preventDefault();
    }
    process_mouse(ev, name) {
        // Use the event's data to call out to the appropriate gesture handlers
        let canvas = this.canvas;
        //t.identifier, t.clientX, t.clientY
        for(let w of game.board.iter()) {
            if(w.processTouches) {
                if(w.emit(name, ev)) break;
            }
        }
        ev.preventDefault();
    }

    vibrate(intensity1, intensity2, duration) {
        window.navigator.vibrate(duration); //default vibration does not support intensity -- could simulate by staggering pulses over the duration
    }
}
