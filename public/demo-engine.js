/**
 * demo-engine.js — Shared interactive demo engine
 *
 * Requires the following globals defined in an inline <script> BEFORE this file:
 *   - STEPS   : Array of step objects { title, badge, file?, lines[], html }
 *   - EXPLAINS: Array of HTML strings (one per step)
 *
 * Wires: step counter, progress bar, code block, explain panel, preview panel,
 *        bar-chart animation, prev/next buttons, step dots, autoplay with
 *        countdown ring, keyboard navigation (← → Space), nav toggle.
 */

let current = 0;
const total  = STEPS.length;

function render(idx) {
    const s = STEPS[idx];

    document.getElementById('stepNum').textContent   = idx + 1;
    document.getElementById('stepTotal').textContent = total;
    document.getElementById('stepTitle').textContent = s.title;
    document.getElementById('stepBadge').textContent = s.badge;

    // Optional file-name label (only pages with a #codeFileName element)
    const fileEl = document.getElementById('codeFileName');
    if (fileEl && s.file) fileEl.textContent = s.file;

    document.getElementById('progressFill').style.width = ((idx + 1) / total * 100) + '%';

    // Code block — render ALL steps with past / current / future visual states
    let html = '';
    for (let si = 0; si < total; si++) {
        const isCurrent = si === idx;
        const isPast    = si < idx;
        for (const ln of STEPS[si].lines) {
            if (ln.t === 'blank') {
                const cls = isPast ? 'code-line done blank' : isCurrent ? 'code-line active blank' : 'code-line pending blank';
                html += `<span class="${cls}"> </span>`;
            } else {
                // Strip syntax-highlight tags for future steps (not yet "revealed")
                const display = si > idx ? ln.c.replace(/<[^>]+>/g, '') : ln.c;
                const cls = isPast ? 'code-line done' : isCurrent ? 'code-line active' : 'code-line pending';
                html += `<span class="${cls}">${display}</span>`;
            }
        }
    }
    const codeBlock = document.getElementById('codeBlock');
    codeBlock.innerHTML = html;
    // Scroll to keep active lines in view
    const firstActive = codeBlock.querySelector('.code-line.active');
    if (firstActive) firstActive.scrollIntoView({ block: 'start', behavior: 'smooth' });

    // Explain & preview — wrap in preview-step to trigger fadeInUp animation
    document.getElementById('explainContent').innerHTML = EXPLAINS[idx];
    document.getElementById('previewContent').innerHTML = `<div class="preview-step active">${s.html}</div>`;

    // Animate bar charts (no-op when no .bar-fill[data-w] elements exist)
    document.querySelectorAll('.bar-fill[data-w]').forEach(el => {
        el.style.width = '0';
        setTimeout(() => el.style.width = el.dataset.w + '%', 80);
    });

    // Buttons
    document.getElementById('btnPrev').disabled = idx === 0;
    document.getElementById('btnNext').disabled = idx === total - 1;

    // Dots
    document.querySelectorAll('.step-dot').forEach((d, i) => {
        d.className = 'step-dot' + (i < idx ? ' done' : i === idx ? ' active' : '');
    });
}

// Build step dots
const dotsEl = document.getElementById('stepDots');
for (let i = 0; i < total; i++) {
    const d = document.createElement('button');
    d.className = 'step-dot';
    d.setAttribute('aria-label', `Étape ${i + 1}`);
    d.addEventListener('click', () => { stopAuto(); current = i; render(i); });
    dotsEl.appendChild(d);
}

// Prev / Next buttons
document.getElementById('btnPrev').addEventListener('click', () => {
    if (current > 0) { stopAuto(); current--; render(current); }
});
document.getElementById('btnNext').addEventListener('click', () => {
    if (current < total - 1) { stopAuto(); current++; render(current); }
});

// Autoplay
let autoTimer = null;
const btnAuto = document.getElementById('btnAutoplay');
const ring    = document.getElementById('countdownRing');

function startCountdownAnim() {
    ring.classList.add('playing');
    // Clone the fill to fully reset the CSS animation (reliable cross-browser)
    const fill = ring.querySelector('.ring-fill');
    const newFill = fill.cloneNode(true);
    fill.replaceWith(newFill);
}

function stopAuto() {
    if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
    btnAuto.textContent = '▶ Auto';
    btnAuto.classList.remove('playing');
    ring.classList.remove('playing');
}

function scheduleNext() {
    startCountdownAnim();
    autoTimer = setTimeout(() => {
        if (current < total - 1) { current++; render(current); scheduleNext(); }
        else stopAuto();
    }, 5000);
}

btnAuto.addEventListener('click', () => {
    if (autoTimer) { stopAuto(); return; }
    btnAuto.textContent = '⏸ Pause';
    btnAuto.classList.add('playing');
    scheduleNext();
});

// Keyboard navigation
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight' && current < total - 1) { stopAuto(); current++; render(current); }
    if (e.key === 'ArrowLeft'  && current > 0)         { stopAuto(); current--; render(current); }
    if (e.key === ' ') { e.preventDefault(); btnAuto.click(); }
});

// Mobile nav toggle
document.getElementById('navToggle').addEventListener('click', () => {
    document.querySelector('.nav-links').classList.toggle('open');
});

render(0);
