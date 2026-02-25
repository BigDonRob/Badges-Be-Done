import { state } from './state.js';

// ─── Zone definitions ─────────────────────────────────────────────────────────

const ZONES = [
    { dzId: 'dzResizeSlice',   inputId: 'inputResizeSlice',   countId: 'countResizeSlice',   listId: 'fileListResizeSlice',   clearId: 'clearResizeSlice',   mode: 'resize', slicing: true  },
    { dzId: 'dzCenterSlice',   inputId: 'inputCenterSlice',   countId: 'countCenterSlice',   listId: 'fileListCenterSlice',   clearId: 'clearCenterSlice',   mode: 'center', slicing: true  },
    { dzId: 'dzResizeNoSlice', inputId: 'inputResizeNoSlice', countId: 'countResizeNoSlice', listId: 'fileListResizeNoSlice', clearId: 'clearResizeNoSlice', mode: 'resize', slicing: false },
    { dzId: 'dzCenterNoSlice', inputId: 'inputCenterNoSlice', countId: 'countCenterNoSlice', listId: 'fileListCenterNoSlice', clearId: 'clearCenterNoSlice', mode: 'center', slicing: false },
];

let _onChange = () => {};

// ─── Public ───────────────────────────────────────────────────────────────────

export function initDropZones(onChange) {
    _onChange = onChange || (() => {});

    for (const zone of ZONES) {
        const dz    = document.getElementById(zone.dzId);
        const input = document.getElementById(zone.inputId);
        const clear = document.getElementById(zone.clearId);

        dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag-over'); });
        dz.addEventListener('dragleave', e => { if (!dz.contains(e.relatedTarget)) dz.classList.remove('drag-over'); });
        dz.addEventListener('drop', e => {
            e.preventDefault();
            dz.classList.remove('drag-over');
            addFiles(Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')), zone.mode, zone.slicing);
        });

        input.addEventListener('change', e => {
            addFiles(Array.from(e.target.files), zone.mode, zone.slicing);
            e.target.value = '';
        });

        clear.addEventListener('click', () => {
            state.sourceImages = state.sourceImages.filter(i => !(i.mode === zone.mode && i.slicing === zone.slicing));
            _refreshAll();
            _onChange();
        });
    }
}

// ─── Internal ─────────────────────────────────────────────────────────────────

function addFiles(files, mode, slicing) {
    files.forEach(f => state.sourceImages.push({ file: f, mode, slicing }));
    _refreshAll();
    _onChange();
}

function _refreshAll() {
    const totalEl = document.getElementById('totalFilesInfo');

    for (const zone of ZONES) {
        const matching = state.sourceImages.filter(i => i.mode === zone.mode && i.slicing === zone.slicing);
        const countEl  = document.getElementById(zone.countId);
        const listEl   = document.getElementById(zone.listId);
        const dz       = document.getElementById(zone.dzId);

        countEl.textContent = `${matching.length} file${matching.length !== 1 ? 's' : ''}`;
        dz.classList.toggle('has-files', matching.length > 0);

        listEl.innerHTML = '';
        matching.slice(0, 5).forEach(item => {
            const el = document.createElement('div');
            el.className = 'file-list-item';
            el.textContent = item.file.name;
            listEl.appendChild(el);
        });
        if (matching.length > 5) {
            const more = document.createElement('div');
            more.className = 'file-list-item file-list-more';
            more.textContent = `+${matching.length - 5} more`;
            listEl.appendChild(more);
        }
    }

    const total   = state.sourceImages.length;
    const withSlice    = state.sourceImages.filter(i => i.slicing).length;
    const withoutSlice = total - withSlice;

    if (total > 0) {
        totalEl.style.display = 'block';
        const parts = [];
        if (withSlice)    parts.push(`${withSlice} with slicing`);
        if (withoutSlice) parts.push(`${withoutSlice} without slicing`);
        totalEl.textContent = `Total: ${total} image${total !== 1 ? 's' : ''} queued — ${parts.join(', ')}`;
    } else {
        totalEl.style.display = 'none';
    }
}
