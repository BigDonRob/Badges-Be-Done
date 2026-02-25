export function createBackgroundPattern(colors, patternType, rng) {
    const canvas = document.createElement('canvas');
    canvas.width = 64; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    const n = colors.length;
    const cx = 31.5, cy = 31.5;

    const hash = (x, y, s) => {
        const v = Math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453;
        return v - Math.floor(v);
    };

    for (let x = 0; x < 64; x++) {
        for (let y = 0; y < 64; y++) {
            const nx = (x - cx) / 32, ny = (y - cy) / 32;
            const r = Math.sqrt(nx*nx + ny*ny);
            const theta = Math.atan2(ny, nx);
            let ci = 0, v = 0;

            switch (patternType) {
                case 'bg1':  { v = hash(Math.floor(x/8), Math.floor(y/8), Math.floor(rng()*1000)) / 4294967296; ci = Math.floor(v*n); break; }
                case 'bg2':  { const N = 3+(Math.floor(rng()*1000)%6); v = Math.abs(Math.cos(N*theta))+r; ci = Math.floor(v*n)%n; break; }
                case 'bg3':  { const A=3+Math.floor(rng()*4), B=3+Math.floor(rng()*4); v=Math.sin(nx*A+ny*B+Math.floor(rng()*1000)); ci=n===2?(v>0?1:0):Math.floor((v+1)*1.5)%n; break; }
                case 'bg4':  { v = hash(x+hash(y,0,Math.floor(rng()*1000))*16, y+hash(x,0,Math.floor(rng()*1000))*16, Math.floor(rng()*1000))/4294967296; ci=Math.floor(v*n); break; }
                case 'bg5':  { const k=4+(Math.floor(rng()*1000)%5); v=Math.sin(theta*k+r*6+hash(x,y,Math.floor(rng()*1000))*2); ci=n===2?(v>0?1:0):Math.floor((v+2)/1.3)%n; break; }
                case 'bg6':  { const A=3+Math.floor(rng()*4), B=3+Math.floor(rng()*4); v=Math.sin(nx*A+Math.floor(rng()*1000))+Math.cos(ny*B-Math.floor(rng()*1000)); ci=n===2?(v>0?1:0):Math.floor((v+2)/1.5)%n; break; }
                case 'bg7':  { v = r+hash(x,y,Math.floor(rng()*1000))*0.08; ci=Math.floor(v*n)%n; break; }
                case 'bg8':  { const k=4+(Math.floor(rng()*1000)%5); v=theta+r*k; ci=Math.floor(v*n)%n; break; }
                case 'bg9':  { const nv=4+(Math.floor(rng()*1000)%5); v=Math.cos(nv*theta); ci=n===2?(v>0?1:0):Math.floor((v+1)*1.5)%n; break; }
                case 'bg10': { v=hash(x,y,Math.floor(rng()*1000))/4294967296; if(n===2){ci=v>0.92?1:0;}else{if(v>0.97)ci=2;else if(v>0.92)ci=1;else ci=0;} break; }
                case 'bg11': { const gx=x%8, gy=y%8; ci=(gx===0||gy===0)?1%n:0; break; }
                case 'bg12': { ci=Math.floor(((x+y)%16)/(16/n))%n; break; }
                case 'bg13': { const dx=(x%8)-4, dy=(y%8)-4; ci=(dx*dx+dy*dy<=4)?1%n:0; break; }
            }

            const c = colors[ci % colors.length];
            ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
            ctx.fillRect(x, y, 1, 1);
        }
    }

    return canvas;
}
