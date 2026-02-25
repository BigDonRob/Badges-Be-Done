// ─── Helpers ──────────────────────────────────────────────────────────────────

function px(ctx, x, y) { ctx.fillRect(x, y, 1, 1); }

function isBorderPx(x, y, w) {
    return x < w || x >= 64-w || y < w || y >= 64-w;
}

function solidBorder(ctx, color, w) {
    ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    for (let x = 0; x < 64; x++) {
        for (let y = 0; y < w; y++) { px(ctx, x, y); px(ctx, x, 64-w+y); }
    }
    for (let y = w; y < 64-w; y++) {
        for (let x = 0; x < w; x++) { px(ctx, x, y); px(ctx, 64-w+x, y); }
    }
}

// ─── Dispatcher ───────────────────────────────────────────────────────────────

export function createSimpleBorder(colors, width, style, rng, corners) {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 64, 64);

    const c0 = colors[0] || [255,255,255];

    switch (style) {
        case 'solid':        solidBorder(ctx, c0, width); break;
        case 'dashed':       dashedBorder(ctx, c0, width); break;
        case 'dotted':       dottedBorder(ctx, c0, width); break;
        case 'checkerboard': checkerBorder(ctx, colors, width); break;
        case 'shadow':       shadowBorder(ctx, c0, width); break;
        case 'multiring':    multiRingBorder(ctx, colors, width); break;
        case 'dotdash':      dotDashBorder(ctx, colors, width); break;
        case 'px-bracket':   pxBracket(ctx, colors, width, corners); break;
        case 'px-chamfer':   pxChamfer(ctx, colors, width, corners); break;
        case 'px-rivet':     pxRivet(ctx, colors, width, corners); break;
        case 'px-open':      pxOpen(ctx, colors, width, corners); break;
        case 'px-pip':       pxPip(ctx, colors, width, corners); break;
        case 'px-double':    pxDouble(ctx, colors, width); break;
        case 'px-stitch':    pxStitch(ctx, colors, width); break;
        case 'px-zigzag':    pxZigzag(ctx, colors, width); break;
        case 'px-brick':     pxBrick(ctx, colors, width); break;
        default:             patternBorder(ctx, colors, width, style, rng); break;
    }

    return canvas;
}

// ─── Classic ──────────────────────────────────────────────────────────────────

function dashedBorder(ctx, color, w) {
    ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    const dash = 8, gap = 4;
    for (let x = 0; x < 64; x += dash + gap)
        for (let y = 0; y < w; y++)
            for (let dx = 0; dx < dash && x+dx < 64; dx++) { px(ctx, x+dx, y); px(ctx, x+dx, 64-w+y); }
    for (let y = w; y < 64-w; y += dash + gap)
        for (let x = 0; x < w; x++)
            for (let dy = 0; dy < dash && y+dy < 64-w; dy++) { px(ctx, x, y+dy); px(ctx, 64-w+x, y+dy); }
}

function dottedBorder(ctx, color, w) {
    ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
    const sp = 6;
    for (let x = sp; x < 64-sp; x += sp)
        for (let y = 0; y < w; y++) { px(ctx, x, y); px(ctx, x, 63-y); }
    for (let y = sp; y < 64-sp; y += sp)
        for (let x = 0; x < w; x++) { px(ctx, x, y); px(ctx, 63-x, y); }
}

function checkerBorder(ctx, colors, w) {
    const c1 = colors[0]||[255,255,255], c2 = colors[1]||[200,200,200];
    for (let x = 0; x < 64; x++) for (let y = 0; y < 64; y++) {
        if (!isBorderPx(x, y, w)) continue;
        const c = (x+y)%2===0 ? c1 : c2;
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        px(ctx, x, y);
    }
}

function shadowBorder(ctx, color, w) {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    for (let x = 0; x < 64; x++)
        for (let y = 0; y < w; y++) { px(ctx, x+2, y+2); px(ctx, x+2, 64-w+y+2); }
    for (let y = w; y < 64-w; y++)
        for (let x = 0; x < w; x++) { px(ctx, x+2, y+2); px(ctx, 64-w+x+2, y+2); }
    solidBorder(ctx, color, w);
}

function multiRingBorder(ctx, colors, w) {
    const rc = [colors[0]||[255,255,255], colors[1]||[200,200,200], colors[2]||[150,150,150]];
    const rpc = Math.ceil(w / 3);
    for (let ring = 0; ring < w; ring++) {
        const c = rc[Math.floor(ring/rpc) % rc.length];
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        for (let x = 0; x < 64; x++) { px(ctx, x, ring); px(ctx, x, 64-w+ring); }
        for (let y = ring+1; y < 64-w+ring; y++) { px(ctx, ring, y); px(ctx, 64-w+ring, y); }
    }
}

function dotDashBorder(ctx, colors, w) {
    const c1 = colors[0]||[255,255,255], c2 = colors[1]||[200,200,200];
    const dot = 3, dash = 6, gap = 3, pat = dot+gap+dash+gap;
    const rowPass = (x, y) => {
        for (let dx = 0; dx < dot && x+dx < 64; dx++) { ctx.fillStyle=`rgb(${c1[0]},${c1[1]},${c1[2]})`; px(ctx,x+dx,y); px(ctx,x+dx,64-w+y); }
        for (let dx = dot+gap; dx < dot+gap+dash && x+dx < 64; dx++) { ctx.fillStyle=`rgb(${c2[0]},${c2[1]},${c2[2]})`; px(ctx,x+dx,y); px(ctx,x+dx,64-w+y); }
    };
    const colPass = (x, y) => {
        for (let dy = 0; dy < dot && y+dy < 64-w; dy++) { ctx.fillStyle=`rgb(${c1[0]},${c1[1]},${c1[2]})`; px(ctx,x,y+dy); px(ctx,64-w+x,y+dy); }
        for (let dy = dot+gap; dy < dot+gap+dash && y+dy < 64-w; dy++) { ctx.fillStyle=`rgb(${c2[0]},${c2[1]},${c2[2]})`; px(ctx,x,y+dy); px(ctx,64-w+x,y+dy); }
    };
    for (let x = 0; x < 64; x += pat) for (let y = 0; y < w; y++) rowPass(x, y);
    for (let y = w; y < 64-w; y += pat) for (let x = 0; x < w; x++) colPass(x, y);
}

// ─── Math Patterns ────────────────────────────────────────────────────────────

function patternBorder(ctx, colors, w, type, rng) {
    const n = colors.length, cx = 31.5, cy = 31.5;
    for (let x = 0; x < 64; x++) for (let y = 0; y < 64; y++) {
        if (!isBorderPx(x, y, w)) continue;
        let ci = 0;
        switch (type) {
            case 'constant':  ci = 0; break;
            case 'axial':     { const ax=Math.floor(rng()*3); ci=ax===0?y%n:ax===1?x%n:(x+y)%n; break; }
            case 'parity':    ci = (x+y)%n; break;
            case 'xor':       ci = (x^y)%n; break;
            case 'radial':    ci = Math.floor(Math.sqrt((x-cx)**2+(y-cy)**2))%n; break;
            case 'manhattan': ci = Math.floor(Math.abs(x-cx)+Math.abs(y-cy))%n; break;
            case 'edge':      ci = Math.min(x,y,63-x,63-y)%n; break;
            case 'sawtooth':  ci = (Math.min(x,y,63-x,63-y)+x+y)%n; break;
            case 'bitplane':  ci = n===2?(((x>>1)&1)^((y>>2)&1)):(((x&1)+2*((y>>1)&1))%n); break;
            case 'prime':     ci = ((x%3)*(y%5))%n; break;
        }
        const c = colors[ci % n];
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        px(ctx, x, y);
    }
}

// ─── Pixel Art ────────────────────────────────────────────────────────────────

function pxBracket(ctx, colors, w, corners) {
    const c = colors[0]||[255,255,255];
    const mid = Math.floor(w/2);
    ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
    for (let x = w; x < 64-w; x++) { px(ctx, x, mid); px(ctx, x, 63-mid); }
    for (let y = w; y < 64-w; y++) { px(ctx, mid, y); px(ctx, 63-mid, y); }
    const corner = (ox, oy) => { for (let dx=0;dx<w;dx++) for (let dy=0;dy<w;dy++) px(ctx, ox+dx, oy+dy); };
    if (corners.tl) corner(0,0);
    if (corners.tr) corner(64-w,0);
    if (corners.bl) corner(0,64-w);
    if (corners.br) corner(64-w,64-w);
}

function pxChamfer(ctx, colors, w, corners) {
    ctx.fillStyle = `rgb(${(colors[0]||[255,255,255])[0]},${(colors[0]||[255,255,255])[1]},${(colors[0]||[255,255,255])[2]})`;
    for (let x = 0; x < 64; x++) for (let y = 0; y < 64; y++) {
        if (!isBorderPx(x, y, w)) continue;
        if (corners.tl && x<w && y<w && (x+y<w-1)) continue;
        if (corners.tr && x>=64-w && y<w && ((63-x)+y<w-1)) continue;
        if (corners.bl && x<w && y>=64-w && (x+(63-y)<w-1)) continue;
        if (corners.br && x>=64-w && y>=64-w && ((63-x)+(63-y)<w-1)) continue;
        px(ctx, x, y);
    }
}

function pxRivet(ctx, colors, w, corners) {
    solidBorder(ctx, colors[0]||[255,255,255], w);
    const rc = colors[1]||colors[0]||[255,220,0];
    const rs = Math.min(w+1, 5);
    ctx.fillStyle = `rgba(${rc[0]},${rc[1]},${rc[2]},1.0)`;
    if (corners.tl) ctx.fillRect(0,0,rs,rs);
    if (corners.tr) ctx.fillRect(64-rs,0,rs,rs);
    if (corners.bl) ctx.fillRect(0,64-rs,rs,rs);
    if (corners.br) ctx.fillRect(64-rs,64-rs,rs,rs);
}

function pxOpen(ctx, colors, w, corners) {
    ctx.fillStyle = `rgb(${(colors[0]||[255,255,255])[0]},${(colors[0]||[255,255,255])[1]},${(colors[0]||[255,255,255])[2]})`;
    for (let x = 0; x < 64; x++) for (let y = 0; y < 64; y++) {
        if (!isBorderPx(x, y, w)) continue;
        if (corners.tl && x<w && y<w) continue;
        if (corners.tr && x>=64-w && y<w) continue;
        if (corners.bl && x<w && y>=64-w) continue;
        if (corners.br && x>=64-w && y>=64-w) continue;
        px(ctx, x, y);
    }
}

function pxPip(ctx, colors, w, corners) {
    solidBorder(ctx, colors[0]||[255,255,255], w);
    const pc = colors[1]||[0,0,0];
    const ps = Math.max(2, Math.floor(w*0.55));
    const off = Math.floor((w-ps)/2);
    ctx.fillStyle = `rgba(${pc[0]},${pc[1]},${pc[2]},1.0)`;
    if (corners.tl) ctx.fillRect(off,off,ps,ps);
    if (corners.tr) ctx.fillRect(64-w+off,off,ps,ps);
    if (corners.bl) ctx.fillRect(off,64-w+off,ps,ps);
    if (corners.br) ctx.fillRect(64-w+off,64-w+off,ps,ps);
}

function pxDouble(ctx, colors, w) {
    const c1 = colors[0]||[255,255,255], c2 = colors[1]||c1;
    ctx.fillStyle = `rgb(${c1[0]},${c1[1]},${c1[2]})`;
    for (let x = 0; x < 64; x++) { px(ctx, x, 0); px(ctx, x, 63); }
    for (let y = 1; y < 63; y++) { px(ctx, 0, y); px(ctx, 63, y); }
    if (w >= 3) {
        const inner = w-1;
        ctx.fillStyle = `rgb(${c2[0]},${c2[1]},${c2[2]})`;
        for (let x = inner; x < 64-inner; x++) { px(ctx, x, inner); px(ctx, x, 63-inner); }
        for (let y = inner+1; y < 63-inner; y++) { px(ctx, inner, y); px(ctx, 63-inner, y); }
    }
}

function pxStitch(ctx, colors, w) {
    const c1 = colors[0]||[255,255,255], c2 = colors[1]||c1;
    for (let x = 0; x < 64; x++) for (let y = 0; y < w; y++) {
        if ((x+y)%2===0) {
            const c = y%2===0 ? c1 : c2;
            ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
            px(ctx, x, y); px(ctx, x, 63-y);
        }
    }
    for (let x = 0; x < w; x++) for (let y = w; y < 64-w; y++) {
        if ((x+y)%2===0) {
            const c = x%2===0 ? c1 : c2;
            ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
            px(ctx, x, y); px(ctx, 63-x, y);
        }
    }
}

function pxZigzag(ctx, colors, w) {
    const c1 = colors[0]||[255,255,255], c2 = colors[1]||c1;
    const period = 4;
    for (let x = 0; x < 64; x++) {
        const t = (Math.floor(x/(period/2))%2===0) ? 0 : 1;
        const h = Math.max(1, w-1+t);
        const c = t ? c2 : c1;
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        for (let y = 0; y < h; y++) { px(ctx, x, y); px(ctx, x, 63-y); }
    }
    for (let y = w; y < 64-w; y++) {
        const t = (Math.floor(y/(period/2))%2===0) ? 0 : 1;
        const ww = Math.max(1, w-1+t);
        const c = t ? c2 : c1;
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        for (let x = 0; x < ww; x++) { px(ctx, x, y); px(ctx, 63-x, y); }
    }
}

function pxBrick(ctx, colors, w) {
    const c1 = colors[0]||[255,255,255], c2 = colors[1]||[160,100,60];
    for (let x = 0; x < 64; x++) for (let y = 0; y < 64; y++) {
        if (!isBorderPx(x, y, w)) continue;
        const row = Math.floor(y/2), offset = (row%2)*4;
        const c = (y%2===1 || (x+offset)%8===7) ? c2 : c1;
        ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
        px(ctx, x, y);
    }
}
