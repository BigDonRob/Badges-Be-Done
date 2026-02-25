export const CORNER_STYLE_HINTS = {
    'px-bracket': 'Selected corners get an L-bracket block; unselected corners connect normally.',
    'px-chamfer': 'Selected corners are clipped with a diagonal pixel cut.',
    'px-rivet':   'Selected corners get a contrasting square rivet/pin.',
    'px-open':    'Selected corners are left transparent (gap in the border).',
    'px-pip':     'Selected corners get a small contrasting pip dot.'
};

export const CORNER_STYLES = new Set(Object.keys(CORNER_STYLE_HINTS));

export const SLICE_COLORS = [
    [255,80,80],[80,220,80],[80,120,255],[255,210,40],
    [210,80,255],[40,210,255],[255,140,50],[50,255,160]
];

export const SLICE_HEX_COLORS = [
    '#ff5050','#50dc50','#5078ff','#ffd228',
    '#d250ff','#28d2ff','#ff8c32','#32ffa0'
];

export const BG_STYLE_GROUPS = [
    { label: 'Noise & Organic', options: [
        ['bg1','Cellular Soft Noise'],['bg4','Flow Noise Field'],
        ['bg5','Galaxy Noise Hybrid'],['bg7','Soft Radial Falloff']
    ]},
    { label: 'Wave & Angular', options: [
        ['bg2','Concentric Polygon Rings'],['bg3','Directional Drift Field'],
        ['bg6','Low-Frequency Wave Interference'],['bg8','Spiral Swirl Field'],
        ['bg9','Starburst Harmonic']
    ]},
    { label: 'Geometric', options: [
        ['bg11','Pixel Grid'],['bg12','Diagonal Stripes'],['bg13','Dot Grid']
    ]},
    { label: 'Sparse', options: [
        ['bg10','Starfield Sparse Distribution']
    ]}
];

export const BORDER_STYLE_GROUPS = [
    { label: 'Classic', options: [
        ['solid','Solid'],['dashed','Dashed'],['dotted','Dotted'],
        ['dotdash','Dot-Dash'],['shadow','Drop Shadow'],
        ['checkerboard','Checkerboard'],['multiring','Multi-Color Rings']
    ]},
    { label: 'Math Pattern', options: [
        ['axial','Axial Stripe'],['bitplane','Bitplane Slice'],
        ['constant','Constant Field'],['edge','Edge Gradient Band'],
        ['manhattan','Manhattan Distance'],['parity','Parity Field'],
        ['prime','Prime Modulation'],['radial','Ring Distance Field'],
        ['sawtooth','Sawtooth Edge'],['xor','XOR Interference']
    ]},
    { label: 'Pixel Art', options: [
        ['px-bracket','Px: Corner Brackets'],['px-chamfer','Px: Chamfered Corners'],
        ['px-rivet','Px: Corner Rivets'],['px-open','Px: Open Corners'],
        ['px-pip','Px: Corner Pips'],['px-double','Px: Double Rule'],
        ['px-stitch','Px: Cross-Stitch'],['px-zigzag','Px: Zigzag Teeth'],
        ['px-brick','Px: Brick Course']
    ]}
];
