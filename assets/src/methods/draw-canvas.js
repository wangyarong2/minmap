import Bezier from 'bezier-js'
import * as refer from '../statics/refer';
import { drawCircle, drawCurve, middlePoint } from '../methods/canvas-functions'

const drawBezier_old = (ctx, from_x, from_y, to_x, to_y) => {
    ctx.moveTo(from_x, from_y);
    ctx.bezierCurveTo(from_x, to_y, 0.9 * to_x + 0.1 * from_x, to_y, to_x, to_y);
};

function pointForward(x1, x2, scale) {
    return x1 + (x2 - x1) * scale
}
// console.log(pointForward(150, 0, .7))
function pointForwardStep(x1, x2, step) {
    const sign = Math.sign(x2 - x1)
    return x1 + step * sign
}
// console.log(pointForwardStep(200, 100, 10))

const drawBezier = (ctx, from_x, from_y, to_x, to_y) => {
    ctx.beginPath();
    from_x = pointForwardStep(from_x, to_x, 0)
    ctx.moveTo(from_x, from_y)
    from_x = pointForwardStep(from_x, to_x, 5)
    ctx.lineTo(
        from_x,
        from_y
    )
    const end_x = pointForwardStep(to_x, from_x, 0)
    to_x = pointForwardStep(to_x, from_x, 5)
    var curve = new Bezier(
        from_x,
        from_y,

        pointForward(from_x, to_x, .5),
        from_y,

        pointForward(from_x, to_x, .5),
        to_y,

        to_x,
        to_y
    )
    drawCurve(ctx, curve)
    ctx.lineTo(
        end_x,
        to_y
    )
    ctx.stroke();
};

const drawLine = (ctx, node, map) => {
    const { id: parent_id, children = [] } = node;
    if (children.length > 0) {
        const [parent_left, parent_right, parent_top, parent_bottom, ___, layer] = map.get(String(parent_id));
        const parent_y = layer > 2 ? parent_bottom - 2 : middlePoint(parent_top, parent_bottom)
        children.forEach(child => {
            const child_data = child && map.get(String(child.id));
            if (child_data) {
                const [child_left, child_right, child_top, child_bottom, child_tag, layer] = child_data;
                const child_y = layer > 2 ? child_bottom - 2 : middlePoint(child_top, child_bottom)
                if (child_tag === refer.LEFT_NODE) {
                    drawBezier(ctx, parent_left, parent_y, child_right, child_y);
                } else {
                    drawBezier(ctx, parent_right, parent_y, child_left, child_y);
                }
                drawLine(ctx, child, map);
            }
        })
    }
};

export const drawLineCanvas = (ctx, theme, mindmap, map) => {
    ctx.lineWidth = '2';
    ctx.strokeStyle = theme.main;
    drawLine(ctx, mindmap, map);
};

export const drawDragCanvas = (ctx, theme, child_id, parent_offset, child_offset, child_left_of_parent) => {

    const virtual_rect_width = 50,
        virtual_rect_height = 20;
    ctx.beginPath();
    ctx.strokeStyle = theme.main;
    ctx.lineWidth = '2';
    ctx.setLineDash([5, 5]);
    let parent_x,
        parent_y = (parent_offset.top + parent_offset.bottom) / 2,
        child_x,
        child_y = (child_offset.top + child_offset.bottom) / 2;
    if (child_left_of_parent) {
        parent_x = parent_offset.left;
        child_x = child_offset.right;
        ctx.strokeRect(child_x - virtual_rect_width, child_y - virtual_rect_height / 2, virtual_rect_width, virtual_rect_height);
    } else {
        parent_x = parent_offset.right;
        child_x = child_offset.left;
        ctx.strokeRect(child_x, child_y - virtual_rect_height / 2, virtual_rect_width, virtual_rect_height);
    }
    drawBezier(ctx, parent_x, parent_y, child_x, child_y);
    ctx.stroke();
    ctx.closePath();
};