// https://www.html5rocks.com/en/tutorials/canvas/hidpi/
export function setupCanvas(canvas, rect) {
    // Get the device pixel ratio, falling back to 1.
    var dpr = window.devicePixelRatio || 1;
    // Get the size of the canvas in CSS pixels.
    // var {width, height} = canvas.getBoundingClientRect();
    var {width, height} = canvas
    // console.log('rect', width, height)
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    // Give the canvas pixel dimensions of their CSS
    // size * the device pixel ratio.
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    var ctx = canvas.getContext('2d');
    // Scale all drawing operations by the dpr, so you
    // don't have to worry about the difference.
    ctx.scale(dpr, dpr);
    return ctx;
}

export function middlePoint (a, b, pos = .5) {
  return a + (b - a) * pos
}

export function drawCurve (ctx, curve, offset) {
    offset = offset || { x:0, y:0 };
    var ox = offset.x;
    var oy = offset.y;
    var p = curve.points, i;
    ctx.moveTo(p[0].x + ox, p[0].y + oy);
    if(p.length === 3) {
      ctx.quadraticCurveTo(
        p[1].x + ox, p[1].y + oy,
        p[2].x + ox, p[2].y + oy
      );
    }
    if(p.length === 4) {
      ctx.bezierCurveTo(
        p[1].x + ox, p[1].y + oy,
        p[2].x + ox, p[2].y + oy,
        p[3].x + ox, p[3].y + oy
      );
    }
}

export function drawCircle (ctx, p, r, offset) {
    offset = offset || { x:0, y:0 };
    var ox = offset.x;
    var oy = offset.y;
    ctx.arc(p.x + ox, p.y + oy, r, 0, 2*Math.PI);
}

export function drawArc (ctx, p, offset) {
    offset = offset || { x:0, y:0 };
    var ox = offset.x;
    var oy = offset.y;
    ctx.moveTo(p.x + ox, p.y + oy);
    ctx.arc(p.x + ox, p.y + oy, p.r, p.s, p.e);
    ctx.lineTo(p.x + ox, p.y + oy);
}

export function drawLine (ctx, p1, p2, offset) {
    offset = offset || { x:0, y:0 };
    var ox = offset.x;
    var oy = offset.y;
    ctx.moveTo(p1.x + ox,p1.y + oy);
    ctx.lineTo(p2.x + ox,p2.y + oy);
}

export function drawShape (ctx, shape, offset) {
    offset = offset || { x:0, y:0 };
    var order = shape.forward.points.length - 1;
    ctx.moveTo(offset.x + shape.startcap.points[0].x, offset.y + shape.startcap.points[0].y);
    ctx.lineTo(offset.x + shape.startcap.points[3].x, offset.y + shape.startcap.points[3].y);
    if(order === 3) {
      ctx.bezierCurveTo(
        offset.x + shape.forward.points[1].x, offset.y + shape.forward.points[1].y,
        offset.x + shape.forward.points[2].x, offset.y + shape.forward.points[2].y,
        offset.x + shape.forward.points[3].x, offset.y + shape.forward.points[3].y
      );
    } else {
      ctx.quadraticCurveTo(
        offset.x + shape.forward.points[1].x, offset.y + shape.forward.points[1].y,
        offset.x + shape.forward.points[2].x, offset.y + shape.forward.points[2].y
      );
    }
    ctx.lineTo(offset.x + shape.endcap.points[3].x, offset.y + shape.endcap.points[3].y);
    if(order === 3) {
      ctx.bezierCurveTo(
        offset.x + shape.back.points[1].x, offset.y + shape.back.points[1].y,
        offset.x + shape.back.points[2].x, offset.y + shape.back.points[2].y,
        offset.x + shape.back.points[3].x, offset.y + shape.back.points[3].y
      );
    } else {
      ctx.quadraticCurveTo(
        offset.x + shape.back.points[1].x, offset.y + shape.back.points[1].y,
        offset.x + shape.back.points[2].x, offset.y + shape.back.points[2].y
      );
    }
}
