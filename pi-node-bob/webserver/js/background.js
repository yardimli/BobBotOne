/*

	Author: Stephen Bussard
	Twitter: @sbussard

*/

var sin = Math.sin,
    cos = Math.cos,
    tan = Math.tan,
    ln = Math.log,
    log = Math.LOG10E,
    pi = Math.PI,
    sqrt = Math.sqrt,
    rdm = Math.random,
    rnd = Math.round,
    abs = Math.abs,
    canvas, // html canvas element
    ctx, // canvas context
    t, // animation parameter
    X, // a parameter roughly corresponding to path width
    Y, // a parameter roughly corresponding to path height
    W, // document width
    H, // document height
    phases, // phases that are used (to avoid placing two items in the same place)
    EnergyBalls, // a list of EnergyBall objects
    Stars, // a list of Star objects
    i; // dummy variable used for looping

$(document).ready(function () {

    canvas = document.createElement('canvas');
    canvas.width = W = window.innerWidth;
    canvas.height = H = window.innerHeight;
    canvas.style.position = "absolute";
    canvas.style.top = "0px";
    canvas.style.left = "0px";
//    canvas.style.zIndex = 2;
    document.body.prepend(canvas);

    ctx = canvas.getContext("2d");
    t = 0;

    X = -121;
    Y = 336;

    phases = [];

    function f(b) {
        var u = t / 2000 + b.phase;
        return ((W - X) / 2) * (cos(u) * 0.2 + sin(u * 10) * 0.6 + sin(u * 100 / 2) * 0.3) + W / 2;
    }

    function g(b) {
        var u = t / 2000 + b.phase;
        return ((H - Y) / 2) * (sin(u) * 0.2 + cos(u * 10) * 0.6 + cos(u * 100 / 2) * 0.3) + H / 2;
    }

    function Star() {
        this.x = rdm() * W;
        this.y = rdm() * H;

        var h = 0,
            s = 0,
            l = 100,
            a = Math.random() * 0.2;
        this.color = "hsla(" + h + "," + s + "%," + l + "%," + a + ")";
    }

    Star.prototype.draw = function () {
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, 1, Math.PI * 2, false);
        ctx.fill();
    };

    function EnergyBall() {
        var i,
            h = rnd(Math.random() * 30) + 190,
            s,
            l,
            a,
            phs;

        this.radius = rnd(rdm() * 450) / 10 + 50;

        this.energyLevel = rnd(rdm() * 18) + 18;

        //phase offset
        phs = rnd(rdm() * pi * 100);
        while (phases.indexOf(phs) !== -1 && phases.length > 0) {
            phs = rnd(rdm() * 75);
        }
        this.phase = phs;
        phases.push(phs);

        this.enCol = [];
        for (i = 0; i < this.energyLevel; i += 1) {
            s = rnd(Math.random() * 20) + 80;
            l = 20;
            a = rnd(rdm() * 3) / 10 + 0.1;
            this.enCol.push("hsla(" + h + "," + s + "%," + l + "%," + a + ")");
        }

    }

    EnergyBall.prototype.draw = function () {
        var x = f(this),
            y = g(this),
            x1,
            y1,
            i;

        for (i = 1; i < this.energyLevel; i += 1) {
            x1 = x + this.radius * sin(t / 25 + this.phase + i + sin(t / 100 + this.phase + i)) * i / 36;
            y1 = y + this.radius * cos(t / 25 + this.phase + i + cos(t / 100 + this.phase + i)) * i / 36;

            ctx.beginPath();
            ctx.fillStyle = this.enCol[i];
            ctx.arc(x1, y1, this.radius * (i / 12), Math.PI * 2, false);
            ctx.fill();
        }
    };

    function draw() {
        var i,
            b;

        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
        ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = "lighter";

        t += 1;

        for (i = 0; i < Stars.length; i += 1) {
            Stars[i].draw();
        }

        for (i = 0; i < EnergyBalls.length; i += 1) {
            b = EnergyBalls[i];
            b.draw();
        }

        setTimeout(draw, 500);
    }

    //var p = new EnergyBall();
    EnergyBalls = [];
    for (i = 0; i < 3; i += 1) {
        EnergyBalls.push(new EnergyBall());
    }

    Stars = [];
    for (i = 0; i < 1000; i += 1) {
        Stars.push(new Star());
    }

    draw();
});