class Map {
	constructor(w, h) {
		this.w = w;
		this.h = h;
		this._data = [...new Array(w)].map(() => [...new Array(h)].map(() => 'U'));
	}
	get(pos) {
		try {
			return this._data[pos[0]][pos[1]];
		}
		catch {
			return null;
		}
	}
	set(pos, val) {
		this._data[pos[0]][pos[1]] = val;
	}
	*iter_between(pos1, pos2){
		var x1,y1,x2,y2;
		[x1,y1] = pos1;
		[x2,y2] = pos2;
		if(Math.abs(y2 - y1) == 0 && Math.abs(x2 - x1) == 0) {
			return ;
		}
		if(Math.abs(y2 - y1) > Math.abs(x2 - x1)) {
			var slope = (x2 - x1) / (y2 - y1);
			if(y1 > y2) {
				[y1,y2] = [y2, y1];
				[x1,x2] = [x2, x1];
			}
			for(var y = y1 + 1; y < y2; y++) {
				var x = Math.round((x1 + (y - y1) * slope));
				yield [x, y];
			}
		}
		else {
			var slope = (y2 - y1) / (x2 - x1);
			if(x1 > x2) {
				[y1,y2] = [y2, y1];
				[x1,x2] = [x2, x1];
			}
			for(var x = x1 + 1; x < x2; x++) {
				var y = Math.round((y1 + (x - x1) * slope));
				yield [x, y];
			}
		}
	}
	*iter_types_between(pos1, pos2, types) {
		for(var pos of this.iter_between(pos1, pos2)) {
			if(types.includes(this.get(pos))) {
				yield pos;
			}
		}
	}
	has_types_between(pos1, pos2, types) {
		for(var pos of this.iter_types_between(pos1, pos2, types)) {
			return true;
		}
		return false;
	}
	*iter_all(sub_rect=null) {
		if(sub_rect !== null) {
			for(var x = sub_rect [0]; x < Math.min(this.w, sub_rect [0] + sub_rect [2]); x++) {
				for(var y = sub_rect [1]; y < Math.min(this.h, sub_rect [1] + sub_rect [3]); y++) {
					yield [x, y];
				}
			}
		}
		else {
			for(var x = 0; x < this.w; x++) {
				for(var y = 0; y < this.h; y++) {
					yield [x, y];
				}
			}
		}
	}
	*iter_types(types, sub_rect) {
		for(var pos of this.iter_all(sub_rect)) {
			if(types.includes(this.get(pos))) {
				yield pos;
			}
		}
	}
	*iter_in_range(pos, radius) {
		var x, y;
		[x, y] = pos;
		if(radius == null) radius = 3;
		var rad = Math.ceil(radius);
		for(var xoff = -(rad); xoff < rad + 1; xoff++) {
			for(var yoff = -(rad); yoff < rad + 1; yoff++) {
				if(xoff * xoff + yoff * yoff <= radius * radius) {
					var x0 = x + xoff;
					var y0 = y + yoff;
					if((0 <= y0 && y0 < this.h) && (0 <= x0 && x0 < this.w)) {
						yield [x0, y0];
					}
				}
			}
		}
	}
	*iter_types_in_range(pos, types, radius, blocker_types=null) {
		for(var pos0 of this.iter_in_range(pos, radius)){
			if(blocker_types !== null && this.has_types_between(pos, pos0, blocker_types)) continue;
			if(types.includes(this.get(pos0))) yield pos0;
		}
	}
	num_in_range(pos, types, radius, blocker_types=null) {
		var num = 0;
		for(var pos0 of this.iter_types_in_range(pos, types, radius, blocker_types)) {
			num++;
		}
		return num;
	}
	*iter_rect(rect, must_fit=true) {
		if(must_fit && (rect.x < 0 || rect.y < 0 || rect.right > this.w || rect.bottom > this.h)) {
			return ;
		}
		var xl = Math.max(x, 0);
		var xu = Math.min(x + w, this.w);
		var yl = Math.max(y, 0);
		var yu = Math.min(y + h, this.h);
		for(var x0 = xl; x0 < xu; x0++) {
			for(var y0 = yl; y0 < yu; y0++) {
				yield [x0, y0];
			}
		}
	}
	num_in_rect(pos, size, targets, must_fit=true) {
		num = 0;
		for(var pos of this.iter_rect(pos, size, must_fit)) {
			if(targets.includes(this.get(pos))) num++;
		}
		return num;
	}
}


class MapCard extends Widget {
	cardLevel = 1;
	building_types = ['B','B0'];
	faceUp = true;
	outlineColor = colorString([0.3,0.3,0.3]);
	constructor(properties=null) {
		super();
		this.updateProperties(properties);
		}
	draw() {
		let app = App.get();
		if(!this.faceUp) {
			super.draw();
			return;
		}
		let lw = app.ctx.lineWidth;
        let rr = this.rect;
		let size = [1 - 1.0/40,1 - 1.0/40];
        let color0 = colorString([0,0,0]);
        for(var pos of this.map.iter_all()) {
			var i,j;
			[i,j] = pos;
            var color = colorString(this.building_codes[this.map.get([i,j])][1]);
            var x = rr.x + (i * rr.w) / this.w;
            var y = rr.y + (j * rr.h) / this.h;
			app.ctx.beginPath();
            app.ctx.rect(x, y, size[0], size[1]);
            var tile = this.map.get([i, j]);
            if(!this.building_types.includes(tile)) {
                app.ctx.fillStyle = color;
                app.ctx.fill();    
            } 
            else {
//				let s = size;
                var s = [size[0] + 1.0/40, size[1] + 1.0/40];
                app.ctx.fillStyle = color;
                app.ctx.fill();    
				app.ctx.strokeStyle = color0;
				app.ctx.lineWidth = 1.0/40 //app.tileSize;
				var cx = x + s [0]/2;
                var cy = y + s [1]/2;
                var adj = [...this.map.iter_types_in_range([i, j], this.building_types, 1)]
                var tl=0,tr=0,bl=0,br=0;
				if(this.building_types.includes(this.map.get([i+1,j]))) {
					tr+=this.building_types.includes(this.map.get([i,j+1]));
					br+=this.building_types.includes(this.map.get([i,j-1]));
//                if(adj.includes([i+1,j])) {
					app.ctx.beginPath();
                    app.ctx.moveTo(cx,cy);
                    app.ctx.lineTo(x+s[0], cy);
                    app.ctx.stroke();
//                    tr += adj.includes([i,j+1]);
//                    br += adj.includes([i,j-1]);
                }
                else {
                    br++;
                    tr++;
                }
//                if(adj.includes([i-1,j])) {
				if(this.building_types.includes(this.map.get([i-1,j]))) {
					tl+=this.building_types.includes(this.map.get([i,j+1]));
					bl+=this.building_types.includes(this.map.get([i,j-1]));
					app.ctx.beginPath();
                    app.ctx.moveTo(cx,cy);
                    app.ctx.lineTo(x, cy);
                    app.ctx.stroke();
                    // tl += adj.includes([i,j+1]);
                    // bl += adj.includes([i,j-1]);
                }
                else {
                    bl++;
                    tl++;
                }
//                if(adj.includes([i,j+1])) {
				if(this.building_types.includes(this.map.get([i,j+1]))) {
					tr+=this.building_types.includes(this.map.get([i+1,j]));
					tl+=this.building_types.includes(this.map.get([i-1,j]));
					app.ctx.beginPath();
                    app.ctx.moveTo(cx,cy);
                    app.ctx.lineTo(cx, y+s[1]);
                    app.ctx.stroke();
                    // tr+=addj,includes([i+1,j]);
                    // tl+=addj,includes([i-1,j]);
                }
                else {
                    tl++;
                    tr++;
                }
//                if(adj.includes([i, j - 1])) {
				if(this.building_types.includes(this.map.get([i,j-1]))) {
					br+=this.building_types.includes(this.map.get([i+1,j]));
					bl+=this.building_types.includes(this.map.get([i-1,j]));
					app.ctx.beginPath();
                    app.ctx.moveTo(cx,cy);
                    app.ctx.lineTo(cx, y);
                    app.ctx.stroke();
//                    br+=adj.includes([i+1,j]);
//                    bl+=adj.includes([i-1,j]);
                }
                else {
                    bl++;
                    br++;
                }
                if(bl == 2) {
					app.ctx.beginPath();
                    app.ctx.moveTo(cx,cy);
                    app.ctx.lineTo(x, y);
                    app.ctx.stroke();
                }
                if(br == 2) {
					app.ctx.beginPath();
                    app.ctx.moveTo(cx,cy);
                    app.ctx.lineTo(x+s[0], y);
                    app.ctx.stroke();
                }
                if(tr == 2) {
					app.ctx.beginPath();
                    app.ctx.moveTo(cx,cy);
                    app.ctx.lineTo(x+s[0], y+s[1]);
                    app.ctx.stroke();
                }
                if(tl == 2) {
					app.ctx.beginPath();
                    app.ctx.moveTo(cx,cy);
                    app.ctx.lineTo(x, y+s[1]);
                    app.ctx.stroke();
                }
            }
        }
//		app.ctx.lineWidth = 1.0/app.tileSize;
        app.ctx.fillStyle = colorString([0.8,0.8,0.2]);
        for(var [i, j] of this.lights) {
            var x = rr.x + ((i + 0.4) * rr.w) / this.w;
            var y = rr.y + ((j + 0.4) * rr.h) / this.h;
			app.ctx.beginPath();
            app.ctx.rect(x, y, size[0]/5, size[1]/5);
            app.ctx.fill();    
        }
        app.ctx.fillStyle = colorString([0.9,0.0,0.0]);
        for(var [i, j] of this.spawns) {
            var x = rr.x + ((i + 0.4) * rr.w) / this.w;
            var y = rr.y + ((j + 0.4) * rr.h) / this.h;
			app.ctx.beginPath();
            app.ctx.rect(x, y, size[0]/5, size[1]/5);
            app.ctx.fill();    
        }
        app.ctx.fillStyle = colorString([0.6,0.0,0.0]);
        for(var [i, j] of this.waypoints) {
            var x = rr.x + ((i + 0.4) * rr.w) / this.w;
            var y = rr.y + ((j + 0.4) * rr.h) / this.h;
			app.ctx.beginPath();
            app.ctx.rect(x, y, size[0]/5, size[1]/5);
            app.ctx.fill();    
        }
		if(this.outlineColor!=null) {
			app.ctx.beginPath();
			app.ctx.rect(this.x, this.y, this.w, this.h);
			app.ctx.strokeStyle = this.outlineColor;
			app.ctx.stroke();
		}
    }
}

var unlit = [0.1, 0.1, 0.1, 1];
var lit = [0.3, 0.3, 0.35, 1];
function light(lit, unlit, wt) {
	var wl = new MathArray(lit).mul(wt);
	var wu = new MathArray(unlit).mul(1-wt);
	return wl.add(wu);
};
function colorString(vec) {
	let r,g,b;
	[r,g,b] = new MathArray(vec).mul(255).map(x=>Math.floor(x));
	return '#'+r.toString(16).padStart(2,'0')+g.toString(16).padStart(2,'0')+b.toString(16).padStart(2,'0');
}

class CityMap extends MapCard {
	building_codes = {'B': ['Building rooftop', [0.35, 0.15, 0.15, 1]], 
					'U': ['Unlit Pavement', unlit], 
					'L0': ['Lit Pavement', lit], 
					'L1': ['Lit Pavement', light(lit, unlit, 0.66)], 
					'L2': ['Lit Pavement', light(lit, unlit, 0.33)], 
					'L3': ['Lit Pavement', light(lit, unlit, 0.15)], 
					'G': ['Guard', [0.4, 0.4, 0.8, 1]], 
					'S': ['Guard search and spawn point', [0.9, 0.6, 0.6, 1]], 
					'Z': ['Loot Zone', [0.6, 0.6, 0.6, 1]], 
					'M': ['Market', [0.6, 0.9, 0.6, 1]]};
	pavement = ['U','L0','L1','L2'];
	constructor(properties=null) {
		super();
		this.updateProperties(properties);
		this.make_map();
	}
	get(pos) {
		return this.map.get(pos);
	}
	make_map(){
		this.map = new Map(this.w, this.h);
		var density = 0.2+Math.random()*0.55 + 0.05 * this.cardLevel;
		var filled_area = 0;
		var filled_borders = [0, 0, 0, 0];
		var i = 0;
		while(filled_area < (density * this.w) * this.h && i < 100) {
			var orient = getRandomInt(2);
			if(orient == 0) {
				var size = [getRandomInt(2, (this.w - filled_borders [0]) - filled_borders [1]), 1];
			}
			else {
				var size = [1, getRandomInt(2, (this.h - filled_borders [2]) - filled_borders [3])];
			}
			var x = getRandomInt(filled_borders [0], this.w - size [0]);
			var y = getRandomInt(filled_borders [2], this.h - size [1]);
			filled_area += this.place_building([x, y], size, filled_borders);
			i++;
		}
		this.add_lights();
		this.add_spawns();
		this.add_waypoints();
		this.add_targets();
		this.add_markets();
	}
	clamp(pos) {
		return [Math.max(Math.min(pos [0], this.w - 1), 0), Math.max(Math.min(pos [1], this.h - 1), 0)];
	}
	is_adj(pos) {
        var x0,y0;
        [x0,y0] = pos
		for(var [x, y] of [[x0 - 1, y0 - 1], [x0 + 1, y0 - 1], [x0 - 1, y0 + 1], [x0 + 1, y0 + 1]]) {
			if(x < 0 || x >= this.w || y < 0 || y >= this.h) continue;
			if(this.map.get([x,y]) != 'U') return true;
		}
		return false;
	}
	place_building(pos, size, filled_borders, shape='R', orientation=0) {
		if(shape == 'R') {
			for(var x = pos [0]; x < pos [0] + size [0]; x++) {
				for(var y = pos [1]; y < pos [1] + size [1]; y++) {
					if(this.map.num_in_range([x,y], ['B'],  1.5) > 1) return 0;
				}
			}
			for(var r = pos [1]; r < pos [1] + size [1]; r++) {
				if(r == 0) {
					filled_borders [2] = 1;
				}
				if(r == this.h - 1) {
					filled_borders [3] = 1;
				}
				for(var c = pos [0]; c < pos [0] + size [0]; c++) {
					if(c == 0) {
						filled_borders [0] = 1;
					}
					if(c == this.w - 1) {
						filled_borders [1] = 1;
					}
					this.map.set([c, r], 'B');
				}
			}
			return size [0] * size [1];
		}
	}
	get_best_lightables() {
		var bestn = 0;
		var bestp = [];
		for(var p of this.map.iter_types(['U'], [1, 1, this.map.w - 1, this.map.h - 1])) {
			var n = this.map.num_in_range(p, ['U'], 2, ['B']);
			if(n > bestn) {
				var bestp = [p];
				var bestn = n;
			}
			else if(n == bestn) {
				bestp.push(p);
			}
		}
		return bestp;
	}
	add_lights() {
		this.lights = [];
		var num_lights = getRandomInt(1, this.cardLevel+1);
		for(var i = 0; i < num_lights; i++) {
			var best_lightables = this.get_best_lightables();
			if(best_lightables.length == 0) break;
			this.lights.push(choose(best_lightables));
			this.light_map(this.lights, false);
		}
	}
	light_map(lights, reset=true) {
		if(reset) {
			for(var p of this.map.iter_all()) {
				if(this.map.get(p)[0] =='L') {
					this.map.set(p,'U');
				}
			}
		}
		for(var l of lights) {
			for(var pos of this.map.iter_types_in_range(l, ['U'], 2, ['B'])) {
				var d = adist(pos, l);
				this.map.set(pos,'L'+Math.floor(d).toString());
			}
		}
	}
    add_spawns() {
		this.spawns = [];
		var num_spawns = getRandomInt(this.cardLevel, this.cardLevel + 2);
		for(var s = 0; s < num_spawns; s++) {
			var new_spawn = null;
			var options = [...this.map.iter_types(this.pavement, [1, 1, this.map.w - 1, this.map.h - 1])];
			shuffle(options);
            new_spawn = options.find(pos => this.spawns.length==0 || Math.min(...this.spawns.map(p=>adist(p, pos)))>6-this.cardLevel);
			if(new_spawn != null) this.spawns.push(new_spawn);
			else break;
		}
	}
	add_waypoints() {
		this.waypoints = [];
		var num_waypoints = ((4 + this.cardLevel) - this.spawns.length) - getRandomInt(2);
		for(var s = 0; s < num_waypoints; s++) {
			var new_wp = null;
			var options = [...this.map.iter_types(this.pavement, [1, 1, this.map.w - 1, this.map.h - 1])];
			shuffle(options);
            new_wp = options.find(pos => this.spawns.length+this.waypoints.length==0 || Math.min(...[...this.spawns,...this.waypoints].map(p=>adist(p, pos)))>3);
			if(new_wp != null) this.waypoints.push(new_wp);
			else break;
		}
	}
	add_targets(){
		this.targets = [];
		var num_targets = getRandomInt(1, 3);
		for(var s = 0; s < num_targets; s++) {
			var new_target = null;
			var options = [...this.map.iter_types('B', [1, 1, this.map.w - 1, this.map.h - 1])];
			shuffle(options);
            new_target = options.find(pos => this.targets.length==0 || Math.min(...this.targets.map(p=>adist(p, pos)))>5);
			if(new_target != null) this.targets.push(new_target);
            else break;
		}
	}
	add_markets() {
		this.markets = [];
		var num_markets = choose([0, 0, 1]);
		for(var s = 0; s < num_markets; s++) {
			var new_market = null;
			var options = [...this.map.iter_types('B', [1, 1, this.map.w - 1, this.map.h - 1])];
			shuffle(options);
            new_market = options.find(pos => this.markets.length==0 || Math.min(...this.markets.map(p=>adist(p, pos)))>5);
			if(new_market != null) this.markets.push(new_market);
            else break;
		}
	}
}
