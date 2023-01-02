class Token extends Widget {
	map_pos = [0,0];
	off = [0,0];
	constructor(map_pos) {
		super(new Rect([0,0,1,1]), {});
		this.off = new Vec2([0,0]);
		this.map_pos = new Vec2(map_pos);
		this.bind('off', (event, obj, data) => this.update_rect(event, obj, data));
		this.bind('map_pos', (event, obj, data) => this.update_rect(event, obj, data));
		this.rect = new Rect([this.map_pos[0]+this.off[0], this.map_pos[1]+this.off[1], 1, 1]);
	}
	update_rect(msg, obj, data) {
		let app=App.get();
		let anim = new WidgetAnimation();
		let d = app.board.dist([this.x,this.y],[this.map_pos[0]+this.off[0], this.map_pos[1]+this.off[1]])
		if(d>0) {
			anim.add({x: this.map_pos[0]+this.off[0], y: this.map_pos[1]+this.off[1]}, 50+50*d);
			anim.start(this);	
		} else {
			this.rect = [this.map_pos[0]+this.off[0], this.map_pos[1]+this.off[1], 1, 1];
		}
//		this.rect = new Rect([this.map_pos[0]+this.off[0], this.map_pos[1]+this.off[1], 1, 1]);
	}
	on_map_pos(event, data) {
		App.get().board.token_update();
	}
}

class PlayerToken extends Token {
	draw() {
		let app = App.get();
		let r = this.rect;

		//Draw head
		app.ctx.fillStyle = colorString([0.65,0.65,0.75]);
		app.ctx.beginPath();
		app.ctx.ellipse(r.x+r.w/2, r.y+r.h/2, 2*r.w/5, 2*r.h/5, 0, 0, 2*Math.PI);
		app.ctx.closePath();
		app.ctx.fill();

		// Color:
        //     rgb: 0.5,0.5,0.5
        // Ellipse:
        //     pos: self.x+(self.width)//10,self.y+(self.height)//10
        //     size: root.width*4//5, root.height*4//5
        // Color:
        //     rgb: 0,0,0
        // Ellipse:
        //     pos: self.x+(self.width)//3-root.width*3//40,self.y+(self.height)//2-root.height*3//40
        //     size: root.width*3//10, root.height*3//10
        //     angle_start: 90
        //     angle_end: 270
        // Ellipse:
        //     pos: self.x+(self.width)*2//3-root.width*3//40,self.y+(self.height)//2-root.height*3//40
        //     size: root.width*3//10, root.height*3//10
        //     angle_start: 90
        //     angle_end: 270
        // Line:
        //     width: 1+root.height//30
        //     points: self.x+(self.width)*2//5,self.y+(self.height)//3,self.x+(self.width)*3//5,self.y+(self.height)//3

	}

}

class TargetToken extends Token {
	lock_level = 1;
	loot_level = 1;
	has_loot = true;
	picked = false;
	draw() {
		let app = App.get();
		let ctx = app.ctx;
		let color = colorString([0.1,0.3,0.8]);
		let r = this.rect;
		var x = r.x + (r.w / 5);
		var y = r.y + (r.h / 5);
		var w = 3*r.w/5;
		var h = 3*r.h/5;
		ctx.beginPath();
		ctx.moveTo(x + w/2, y + h);
		ctx.lineTo(x, y + h - 2*h/3);
		ctx.lineTo(x + w/4, y);
		ctx.lineTo(x + 3*w/4, y);
		ctx.lineTo(x + w, y + h - 2*h/3);
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();	
	}
}

class MarketToken extends Token {
	lock_level = 1;
	loot_level = 1;
	draw() {
		let app = App.get();
		let ctx = app.ctx;
		let color = colorString([0.6, 0.4, 0]);
		let r = this.rect;
		var x = r.x + r.w/5; //Math.floor(r.w / 5);
		var y = r.y + r.h/5; //Math.floor(r.h / 5);
		var w = 3*r.w/5; // Math.floor((Math.floor(3 * r.w / 5)) / 2) * 2;
		var h = 3*r.h/5; //Math.floor((Math.floor(3 * r.h / 5)) / 2) * 2;

		ctx.beginPath();
		ctx.ellipse(r.center_x, r.center_y, w/2, h/2, 0, 0, 2*Math.PI);
		ctx.closePath();
		ctx.fillStyle = color;
		ctx.fill();	
	}
	on_touch_down(event, touch) {
		if(this.collide(touch.rect)) {
			touch.grab(this);
			return true;
		}
	}
	on_touch_up(event, touch) {
		let app=App.get();
		if(touch.grabbed != this) return; 
		touch.ungrab();
		if(this.collide(touch.rect)) {
			app.marketdeck.select_draw(0, 4, 0);
			return true;
		}
	}
}

class GuardToken extends Token {
	state = 'dozing';
	frozen = false;
	on_state(event, data) {
		let app = App.get();
		if(this.state != 'dozing') {
			var stats = app.stats;
			if(this.state == 'dead') {
				stats.kills++;
				stats.t_kills++;
			}
			if(this.state == 'unconscious') {
				stats.knockouts++;
				stats.t_knockouts++;
			}
			if(this.state == 'alert' && arrEq(app.board.active_player_token.map_pos, this.map_pos)) {
				stats.contacts++;
				stats.t_contacts++;
			}
		}
	}

	draw() {
		let app=App.get();
		let r = this.rect;

		//Draw head
		app.ctx.fillStyle = ['dozing','alert'].includes(this.state)? colorString([0.75,0,0]) : colorString([0.5,0.1,0.1]);
		app.ctx.beginPath();
		app.ctx.ellipse(r.center_x, r.center_y, 2*r.w/5, 2*r.h/5, 0, 0, 2*Math.PI);
		app.ctx.fill();

		//Draw eyes
		app.ctx.fillStyle = this.state=='alert' ? colorString([0.4,0,0]) : colorString([0,0,0]);
		app.ctx.strokeStyle = app.ctx.fillStyle;
		if(['dozing','alert'].includes(this.state)) {
			app.ctx.beginPath();
			app.ctx.ellipse(r.center_x - r.w/6, r.center_y, r.w*3/40, r.h*3/40, 
							0, (this.state == 'dozing' ? rads(180) : rads(200)), (this.state == 'dozing' ? rads(360) : rads(380)) );
			app.ctx.closePath();
			app.ctx.fill();
			app.ctx.beginPath();
			app.ctx.ellipse(r.center_x + r.w/6, r.center_y, r.w*3/40, r.h*3/40, 
							0, (this.state == 'dozing' ? rads(180) : rads(160)), (this.state == 'dozing' ? rads(360) : rads(340)) );
			app.ctx.closePath();
			app.ctx.fill();
		} 
		else if(this.state == 'dead') {
				//dead eyes
				var eyeleft = r.center_x - r.w/6 - r.h*3/40;
				var eyeright = r.center_x - r.w/6 + r.h*3/40;
				var eyetop = r.center_y - r.h*3/40;
				var eyebottom = r.center_y + r.h*3/40;
				app.ctx.lineWidth = r.w/40;
				app.ctx.beginPath();
				app.ctx.moveTo(eyeleft, eyebottom);
				app.ctx.lineTo(eyeright, eyetop);
				app.ctx.moveTo(eyeleft, eyetop);
				app.ctx.lineTo(eyeright, eyebottom);
				app.ctx.stroke()
				
				var eyeleft = r.center_x + r.w/6 - r.h*3/40;
				var eyeright = r.center_x + r.w/6 + r.h*3/40;
				var eyetop = r.center_y - r.h*3/40;
				var eyebottom = r.center_y + r.h*3/40;
				app.ctx.lineWidth = r.w/40;
				app.ctx.beginPath();
				app.ctx.moveTo(eyeleft, eyebottom);
				app.ctx.lineTo(eyeright, eyetop);
				app.ctx.moveTo(eyeleft, eyetop);
				app.ctx.lineTo(eyeright, eyebottom);
				app.ctx.stroke()
		}
		else {
				//KO eyes
				var eyeleft = r.x + r.w / 3 - this.w*3/40;
				var eyeright = r.x + r.w / 3 + this.w*3/40;
				var eyemiddle = r.center_y;
				app.ctx.lineWidth = r.w/40;
				app.ctx.beginPath();
				app.ctx.moveTo(eyeleft, eyemiddle);
				app.ctx.lineTo(eyeright, eyemiddle);
				app.ctx.stroke()

				var eyeleft = r.x + r.w*2/3 - this.w*3/40;
				var eyeright = r.x + r.w*2/3 + this.w*3/40;
				var eyemiddle = r.center_y;
				app.ctx.beginPath();
				app.ctx.moveTo(eyeleft, eyemiddle);
				app.ctx.lineTo(eyeright, eyemiddle);
				app.ctx.stroke()
		}
		//mouth
		app.ctx.fillStyle = colorString([0,0,0]);
		app.ctx.strokeStyle = app.ctx.fillStyle;
		if(this.state == 'dead') {
			app.ctx.beginPath();
			app.ctx.ellipse(r.center_x, r.y+2*r.h/3, r.w/10, r.h/10, 0, 0, 2*Math.PI);
			app.ctx.fill()
		}
		else {
			app.ctx.beginPath();
			app.ctx.moveTo(r.x+r.w*2/5, r.y+2*r.h/3);
			app.ctx.lineTo(r.x+r.w*3/5, r.y+2*r.h/3);
			app.ctx.stroke();
		}
	}
}

class ObjectiveToken extends TargetToken {
	has_loot = false;
	picked = false;
	on_picked(obj, value) {
		if(this.picked) {
			var app = App.get();
			app.level_complete();
		}
	}
	draw() {
		let app=App.get();
		let ctx = app.ctx;
		let r = this.rect;

		let x = r.x+r.w/5;
		let y = r.y+r.h/5;
		let w = 3*r.w/5;
		let h = 3*r.h/5;
		ctx.fillStyle = colorString([0.8,0.8,0]);

		ctx.beginPath();
		ctx.moveTo(x + w / 2, y);
		ctx.lineTo(x, y + 3*h/4);
		ctx.lineTo(x + w, y + 3*h/4);
		ctx.closePath();
		ctx.fill();

		ctx.beginPath();
		ctx.moveTo(x + w/2, y + h);
		ctx.lineTo(x, y + h/4);
		ctx.lineTo(x + w, y + h/4);
		ctx.closePath();
		ctx.fill();

	}
}

