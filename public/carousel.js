/**
 * carousel.js — Shared engine for Dessin gallery pages
 *
 * Provides: mobile nav toggle, image right-click protection,
 *           probeImages(), setupCarousel().
 *
 * Each page only needs an inline <script> with its own
 * setupCarousel('id', 'images/folder') calls.
 */

// Mobile nav toggle
document.getElementById('navToggle').addEventListener('click', function () {
    document.querySelector('.nav-links').classList.toggle('open');
});

// Protection — right-click disabled on carousel images
document.addEventListener('contextmenu', function (e) {
    if (e.target.closest('.carousel-track')) e.preventDefault();
});

// Probe images from a folder (01.jpg, 02.png, …) until one is missing.
// Also fetches a matching 01.txt for each image (caption overlay).
function probeImages(folder) {
    return new Promise(function (resolve) {
        var found = [], i = 1;
        var exts = ['jpg', 'jpeg', 'png', 'webp'];
        function tryIndex() {
            var pad = String(i).padStart(2, '0'), e = 0;
            function tryExt() {
                if (e >= exts.length) { resolve(found); return; }
                var src = folder + '/' + pad + '.' + exts[e];
                var img = new Image();
                img.onload = function () {
                    var txtUrl = folder + '/' + pad + '.txt';
                    fetch(txtUrl)
                        .then(function (r) { return r.ok ? r.text() : ''; })
                        .catch(function () { return ''; })
                        .then(function (caption) {
                            found.push({ src: src, caption: caption.trim() });
                            i++;
                            tryIndex();
                        });
                };
                img.onerror = function () { e++; tryExt(); };
                img.src = src;
            }
            tryExt();
        }
        tryIndex();
    });
}

// Set up a single carousel section
function setupCarousel(id, folder) {
    var track     = document.querySelector('[data-carousel="' + id + '"]');
    var dotsEl    = document.querySelector('[data-dots="'     + id + '"]');
    var counterEl = document.querySelector('[data-counter="'  + id + '"]');
    var btnPrev   = document.querySelector('[data-prev="'     + id + '"]');
    var btnNext   = document.querySelector('[data-next="'     + id + '"]');
    var current   = 0;

    function activate(images) {
        if (images.length > 0) {
            track.innerHTML = images.map(function (item) {
                var overlay = item.caption
                    ? '<div class="slide-overlay-caption">' + item.caption + '</div>'
                    : '';
                return '<div class="carousel-slide"><img src="' + item.src + '" alt="" loading="lazy">' + overlay + '</div>';
            }).join('');
            dotsEl.innerHTML = images.map(function (_, j) {
                return '<button class="carousel-dot' + (j === 0 ? ' active' : '') + '"></button>';
            }).join('');
            counterEl.innerHTML = '<strong>1</strong> / ' + images.length;
        }
        var slides = track.querySelectorAll('.carousel-slide');
        var total  = slides.length;
        var dots   = dotsEl.querySelectorAll('.carousel-dot');
        var strong = counterEl ? counterEl.querySelector('strong') : null;

        function goTo(n) {
            current = Math.max(0, Math.min(n, total - 1));
            track.style.transform = 'translateX(-' + (current * 100) + '%)';
            if (strong) strong.textContent = current + 1;
            dots.forEach(function (d, j) { d.classList.toggle('active', j === current); });
            if (btnPrev) btnPrev.disabled = current === 0;
            if (btnNext) btnNext.disabled = current === total - 1;
        }

        if (btnPrev) btnPrev.addEventListener('click', function () { goTo(current - 1); });
        if (btnNext) btnNext.addEventListener('click', function () { goTo(current + 1); });
        dots.forEach(function (d, j) { d.addEventListener('click', function () { goTo(j); }); });

        // Touch swipe support
        var startX = 0;
        track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
        track.addEventListener('touchend',   function (e) {
            var dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 40) goTo(current + (dx < 0 ? 1 : -1));
        });

        goTo(0);
    }

    probeImages(folder).then(activate);
}
