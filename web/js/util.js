
const clamp = (num, min, max) => Math.min(Math.max(num, min), max);

function arrEq(array1, array2) {
    return array1.length == array2.length && array1.every((value, index) => value == array2[index])
}

function rads(degrees) {
    return degrees*Math.PI/180
}

class MathArray extends Array {
    constructor(...arr) {
        if(arr.length==1 && arr[0] instanceof Array) {
            super(...arr[0]);
        } else {
            super(...arr);
        }
    }
    sum() {
        let s=0;
        this.forEach(el => s+=el);
        return s;
    }
    mean() {
        return this.sum()/this.length;
    }
    max() {
        return Math.max.apply(null, this);
    }
    min() {
        return Math.min.apply(null, this);
    }
    vars() { //sample variance
        let s=0;
        this.forEach(el => s+=el*el);
        return(s - this.length*this.mean()^2)/(this.length-1);
    }
    var() { //population variance
        let s=0;
        this.forEach(el => s+=el*el);
        return s/this.length - this.mean()^2;
    }
    std() { //population standard deviation
        return Math.sqrt(this.var());
    }
    add(arr2) {
        let a = new MathArray(this);
        if(arr2 instanceof Array || arr2 instanceof MathArray) {
            for(let i=0;i<this.length;i++) {
                a[i] += arr2[i];
            }
        } else {
            for(let i=0;i<this.length;i++) {
                a[i]+=arr2;
            }
        }
        return a;
    }
    mul(arr2) {
        let a = new MathArray(this);
        if(arr2 instanceof Array || arr2 instanceof MathArray) {
            for(let i=0;i<this.length;i++) {
                a[i] *= arr2[i];
            }
        } else {
            for(let i=0;i<this.length;i++) {
                a[i]*=arr2;
            }
        }
        return a;
    }
    dot(arr2) {
        return this.mul(arr2).sum();
    }
    abs() {
        return Math.abs.apply(null, this);
    }
    shift(k) { //lag operator
        let a = new MathArray();
        for(let i=-k;i<this.length-k;i++) {
            if(i<0 || i>=this.length) {
                a.push(NaN);
            } else {
                a.push(this[i]);
            }
        }
        return a;
    }
    filter(func) {
        return new MathArray(super.filter(func));
    }
    dropNaN() {
        return this.filter(el => el!=NaN);
    }
}

function screenshake(app){
    if(app.shakeAmount){
        app.shakeAmount--;
    }
    let shakeAngle = Math.random()*Math.PI*2;
    app.shakeX = Math.round(Math.cos(shakeAngle)*app.shakeAmount);
    app.shakeY = Math.round(Math.sin(shakeAngle)*app.shakeAmount);
}

function drawText(ctx, text, size, centered, rect, color){
    ctx.fillStyle = color;
    ctx.font = size + "px monospace";
    let textX = rect.x;
    let textY = rect.y+rect.h-(rect.h-size)/2;
    if(centered){
        textX += (rect.w-ctx.measureText(text).width)/2;
    }
    ctx.fillText(text, textX, textY);
}

function drawWrappedText(ctx, text, size, centered, rect, color){
    //TODO: handle explicit newlines in text
    ctx.fillStyle = color;
    ctx.font = size + "px monospace";

    let y = rect.y+size;
    while(text!="") {
        let x = rect.x;
        let rowsNeeded = ctx.measureText(text).width / rect.w;
        let maxletters = Math.floor(text.length/rowsNeeded);
        let substr = text.substring(0,maxletters);
        let lastIndex = substr.lastIndexOf(" ");
        if(lastIndex<0 || substr.length==text.length) {
            lastIndex = substr.length;
        }
        substr = substr.substring(0, lastIndex);
        text = text.substring(lastIndex+1);

        if(centered) {
            let w = ctx.measureText(substr).width;
            x = x + (rect.w - w)/2
        }
        ctx.fillText(substr, x, y);

        y += size;
    }
}

function getRandomInt(m1, m2=0) {
    if(m2!=0)
        return m1 + Math.floor(Math.random() * (m2-m1));
    else
        return Math.floor(Math.random() * m1);
  }

function getRandomPos(max1, max2) {
    return [getRandomInt(max1), getRandomInt(max2)];
}

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle...
    while(currentIndex != 0) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

function choose(array) {
    return array[Math.floor(Math.random() * array.length)];    
}

class Vec2 extends Array {
    constructor(vec){
        super();
        this[0] = vec[0];
        this[1] = vec[1];
    }
    static random(vec) {
        return new Vec2(getRandomPos(vec[0],vec[1]));
    }
    add(vec) {
        return new Vec2([this[0]+vec[0],this[1]+vec[1]]);
    }
    scale(scalar) {
        return new Vec2([this[0]*scalar,this[1]*scalar]);
    }
    mul(vec) {
        return new Vec2([this[0]*vec[0],this[1]*vec[1]]);
    }
    dot(vec) {
        return this[0]*vec[0]+this[1]*vec[1];
    }
    dist(vec) {
        return Math.hypot(this[0]-vec[0],this[1]-vec[1]);
    }
    set x(val) {
        this[0] = val;
    }
    set y(val) {
        this[1] = val;
    }
    get x() {
        return this[0];
    }
    get y() {
        return this[1];
    }
}

class Rect extends Array {
    constructor(rect=null){
        super()
        if(rect==null) {
            this[0] = 0;
            this[1] = 0;
            this[2] = 0;
            this[3] = 0;
            return;
        }
        this[0] = rect[0];
        this[1] = rect[1];
        this[2] = rect[2];
        this[3] = rect[3];
    }
    set x(val) {
        this[0] = val;
    }
    set y(val) {
        this[1] = val;
    }
    set w(val) {
        this[2] = val;
    }
    set h(val) {
        this[3] = val;
    }
    set pos(vec) {
        this[0] = vec[0];
        this[1] = vec[1];
    }
    get pos() {
        return new Vec2([this[0],this[1]]);
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
    get right() {
        return this[0]+this[2];        
    }    
    get bottom() {
        return this[1]+this[3];
    }    
    get center_x() {
        return this[0]+this[2]/2;        
    }
    get center_y() {
        return this[1]+this[3]/2;        
    }
    get center() {
        return new Vec2(this.center_x, this.center_y);
    }
    shift(pos) {
        return new Rect([this.x+pos[0],this.y+pos[1],this.w,this.h]);
    }
    shrinkBorders(value) {
        return new Rect([this.x+value, this.y+value, this.w-value*2, this.h-value*2]);
    }
    mult(scalar) {
        return new Rect([
            this[0]*scalar,
            this[1]*scalar,
            this[2]*scalar,
            this[3]*scalar,
        ])        
    }
    scale(scalar, centered=true) {
        if(centered){
            let news = [this[2]*scalar, this[3]*scalar];
            return new Rect([
                    this[0] + 0.5*(this[2]-news[0]), 
                    this[1] + 0.5*(this[3]-news[1]),
                    news[0],
                    news[1]
                ]);
        } else {
            let news = [this[2]*scalar, this[3]*scalar];
            return new Rect([
                    this[0],
                    this[1],
                    news[0],
                    news[1]
                ]);

        }
    }
    collide(rect) {
        if(this.x < rect.x + rect.w &&
            this.x + this.w > rect.x &&
            this.y < rect.y + rect.h &&
            this.h + this.y > rect.y)
            return true;
        return false;
    }
    contains(rect) {
        return this.x <= rect.x && this.y<= rect.y && this.x+this.w>=rect.x+rect.w && this.y+this.h>=rect.y+rect.h;
    }
    contact(rect) {
        if(this.x <= rect.x + rect.w &&
            this.x + this.w >= rect.x &&
            this.y <= rect.y + rect.h &&
            this.h + this.y >= rect.y)
            return true;
        return false;
    }
}


function randomRange(min, max){
    return Math.floor(Math.random()*(max-min+1))+min;
}

function shuffle(arr){
    let temp, r;
    for(let i = 1; i < arr.length; i++) {
        r = randomRange(0,i);
        temp = arr[i];
        arr[i] = arr[r];
        arr[r] = temp;
    }
    return arr;
}

function rightPad(textArray){
    let finalText = "";
    textArray.forEach(text => {
        text+="";
        for(let i=text.length;i<10;i++){
            text+=" ";
        }
        finalText += text;
    });
    return finalText;
}

class Timer {
    constructor(time, elapsed=0) {
        this.elapsed = 0; //elapsed time on timer
        this.timer = time; //time when timer will be triggered
        this.triggered = false; //true on the frame when the elapsed exceeds the timer
        if(elapsed>0) {
            this.tick(elapsed);
        }
    }
    finished() {
        return this.elapsed>=this.timer;
    }
    tick(millis) {
        if(this.elapsed>=this.timer) {
            if(this.triggered) this.triggered = false; // No longer show a triggered state
            return false;
        }
        this.elapsed+=millis;
        if(this.elapsed>=this.timer) {
            this.triggered = true;
            return true;
        }
        return false;
    }
    reset(time=-1, elapsed=0) {
        this.elapsed=elapsed;
        this.triggered = false;
        if(time>=0) this.timer=time;
    }
}

class TimerUnlimited {
    constructor() {
        this.elapsed = 0;
    }
    tick(millis) {
        this.elapsed+=millis;
        return this.elapsed;
    }
    reset(elapsed=0) {
        this.elapsed = elapsed;
    }
}

