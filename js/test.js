var fn = (function () {
  'use strict';

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* ════════════════════════════════════════════════
     1. ENTRANCE — galaxy + multi-effect text reveal
     ════════════════════════════════════════════════ */
  (function initEntrance() {
    var entrance = document.getElementById('entrance');
    var site = document.getElementById('site');
    var pCanvas = document.getElementById('e-particles');
    var pCtx = pCanvas.getContext('2d');

    var W, H;
    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      if (pCanvas) { pCanvas.width = W; pCanvas.height = H; }
    }
    resize();
    window.addEventListener('resize', resize);

    /* ── Milky Way dots ── */
    var bgDots = [];
    var DOT_COUNT = 250;
    var gMaxR = Math.min(W, H) * 0.45;
    for (var i = 0; i < DOT_COUNT; i++) {
      var arm = Math.floor(Math.random() * 3);
      var dist = Math.random();
      var angle = dist * 4 * Math.PI + arm * 2 * Math.PI / 3;
      var r = dist * gMaxR;
      angle += (Math.random() - 0.5) * 0.25;
      r += (Math.random() - 0.5) * gMaxR * 0.06;
      bgDots.push({
        a: angle, r: r,
        sz: 0.3 + Math.random() * 1,
        al: 0.04 + Math.random() * 0.12,
        sp: 0.04 + (1 - dist) * 0.18,
        ph: Math.random() * Math.PI * 2,
        c: Math.random() > 0.6 ? '180,175,255' : '160,185,230'
      });
    }

    /* ── Wave sweep ── */
    var waves = [];
    var waveTrails = [];

    function spawnWaves() {
      for (var i = 0; i < 4; i++) {
        waves.push({
          progress: -0.4 - i * 0.06,
          yOff: (i - 1.5) * 28,
          amp: 20 + i * 8,
          freq: 0.016 + i * 0.004,
          al: 0.12 + i * 0.03,
          w: 1.5 + i * 0.5,
          spd: 0.008 + i * 0.0005,
          c: '180,170,255'
        });
      }
    }

    /* ── Reticles (bubble → pop → spinning cross) ── */
    var reticles = [];
    var popBursts = [];
    var finalFlash = 0;

    function spawnReticle(x, y) {
      reticles.push({
        x: x, y: y,
        phase: 0,          // 0=bubble grow, 1=bubble pop, 2=cross spin
        timer: 0,
        sc: 0,
        al: 0.6,
        r: 12 + rand(0, 10),
        ang: rand(0, Math.PI * 2),
        spin: (0.03 + rand(0, 0.04)) * (Math.random() > 0.5 ? 1 : -1),
        c: '200,190,255'
      });
    }

    function spawnPopBurst(x, y) {
      for (var i = 0; i < 10; i++) {
        var a = rand(0, Math.PI * 2);
        var spd = rand(1, 3);
        popBursts.push({
          x: x, y: y,
          vx: Math.cos(a) * spd, vy: Math.sin(a) * spd,
          life: 1, al: 0.35, sz: rand(1, 2.2),
          c: Math.random() > 0.3 ? '200,190,255' : '255,255,255'
        });
      }
    }

    /* ── Schedule ── */
    var startTime = performance.now();
    var entranceDone = false;
    var fadeOut = -1;

    // Start wave sweep
    setTimeout(function () {
      if (fadeOut >= 0) return;
      spawnWaves();
    }, 30);

    /* ── Animation loop ── */
    function anim(now) {
      try {
        var elapsed = now - startTime;

        if (entranceDone && fadeOut < 0) fadeOut = 0;
        if (fadeOut >= 0) fadeOut += 0.018;
        var gAlpha = fadeOut < 0 ? 1 : Math.max(0, 1 - fadeOut * 0.85);

        pCtx.clearRect(0, 0, W, H);

        var cx = W / 2;
        var cy = H / 2;

        /* ── Milky Way ── */
        for (var i = 0; i < bgDots.length; i++) {
          var d = bgDots[i];
          var a = d.a + elapsed * 0.00025 * d.sp;
          var x = cx + Math.cos(a) * d.r;
          var y = cy + Math.sin(a * 0.65) * d.r * 0.38 + Math.sin(elapsed * 0.00015 + d.ph) * 1.5;
          var tw = 0.5 + Math.sin(elapsed * 0.0012 + d.ph) * 0.5;
          var aVal = d.al * (0.4 + tw * 0.6) * gAlpha;

          pCtx.beginPath();
          pCtx.arc(x, y, d.sz * 3, 0, Math.PI * 2);
          pCtx.fillStyle = 'rgba(' + d.c + ',' + (aVal * 0.08) + ')';
          pCtx.fill();

          pCtx.beginPath();
          pCtx.arc(x, y, d.sz, 0, Math.PI * 2);
          pCtx.fillStyle = 'rgba(' + d.c + ',' + aVal + ')';
          pCtx.fill();
        }

        /* ── Sweep waves + reticle spawn ── */
        for (var w = waves.length - 1; w >= 0; w--) {
          var wv = waves[w];
          var prevP = wv.progress;
          wv.progress += wv.spd;
          if (wv.progress > 1.5) { waves.splice(w, 1); continue; }

          // Spawn reticles along wave path every 0.16 progress
          var spawnIdx = Math.floor(wv.progress / 0.16);
          var prevSpawn = Math.floor(prevP / 0.16);
          if (spawnIdx > prevSpawn && wv.progress > 0.1 && wv.progress < 1.2) {
            var tPos = (Math.random() * 2 - 1) * 0.38;
            var sx = wv.progress * W + Math.sin(tPos * 20 * wv.freq + wv.progress * 6) * wv.amp + rand(-6, 6);
            var sy = cy + wv.yOff + tPos * H * 0.55 + rand(-6, 6);
            spawnReticle(sx, sy);
          }

          // Draw wave
          var wa = wv.al * gAlpha;

          // Glow trail
          pCtx.beginPath();
          for (var t = -0.45; t <= 0.45; t += 0.03) {
            var waveX = Math.sin(t * 20 * wv.freq + wv.progress * 6) * wv.amp;
            var sx = (wv.progress - 0.06) * W + waveX;
            var sy = cy + wv.yOff + t * H * 0.55;
            if (t === -0.45) pCtx.moveTo(sx, sy); else pCtx.lineTo(sx, sy);
          }
          pCtx.strokeStyle = 'rgba(' + wv.c + ',' + (wa * 0.08) + ')';
          pCtx.lineWidth = wv.w * 5;
          pCtx.stroke();

          // Main wave line
          pCtx.beginPath();
          for (var t = -0.45; t <= 0.45; t += 0.03) {
            var waveX = Math.sin(t * 20 * wv.freq + wv.progress * 6) * wv.amp;
            var sx = wv.progress * W + waveX;
            var sy = cy + wv.yOff + t * H * 0.55;
            if (t === -0.45) pCtx.moveTo(sx, sy); else pCtx.lineTo(sx, sy);
          }
          pCtx.strokeStyle = 'rgba(' + wv.c + ',' + (wa * 0.5) + ')';
          pCtx.lineWidth = wv.w * 2.5;
          pCtx.stroke();
          pCtx.strokeStyle = 'rgba(' + wv.c + ',' + wa + ')';
          pCtx.lineWidth = wv.w;
          pCtx.stroke();
        }

        /* ── Reticles (bubble → pop → spinning cross) ── */
        for (var ri = reticles.length - 1; ri >= 0; ri--) {
          var rt = reticles[ri];
          var dt = 0.016;
          rt.timer += dt;
          var ra, s;

          if (rt.phase === 0) {
            // Bubble growing
            rt.sc = Math.min(1, rt.timer / 0.55);
            ra = rt.al * rt.sc * gAlpha;
            s = rt.r * rt.sc;
            pCtx.beginPath();
            pCtx.arc(rt.x, rt.y, s, 0, Math.PI * 2);
            pCtx.strokeStyle = 'rgba(' + rt.c + ',' + ra + ')';
            pCtx.lineWidth = 1.5;
            pCtx.stroke();
            pCtx.beginPath();
            pCtx.arc(rt.x, rt.y, s * 0.5, 0, Math.PI * 2);
            pCtx.fillStyle = 'rgba(' + rt.c + ',' + (ra * 0.03) + ')';
            pCtx.fill();
            if (rt.timer >= 0.55) { rt.phase = 1; rt.timer = 0; spawnPopBurst(rt.x, rt.y); }
          } else if (rt.phase === 1) {
            // Bubble popping
            rt.sc = 1 - rt.timer / 0.25;
            ra = rt.al * rt.sc * gAlpha;
            s = rt.r * rt.sc * 1.2;
            pCtx.beginPath();
            pCtx.arc(rt.x, rt.y, s, 0, Math.PI * 2);
            pCtx.strokeStyle = 'rgba(' + rt.c + ',' + ra + ')';
            pCtx.lineWidth = 1.5;
            pCtx.stroke();
            if (rt.timer >= 0.25) { rt.phase = 2; rt.timer = 0; rt.sc = 0; }
          } else {
            // Cross spinning
            rt.sc = Math.min(1, rt.timer / 0.35);
            rt.ang += rt.spin;
            ra = rt.al * (1 - rt.timer / 3) * rt.sc * gAlpha;
            if (ra < 0.005 || rt.timer > 3) { reticles.splice(ri, 1); continue; }
            s = rt.r * rt.sc;
            pCtx.save();
            pCtx.translate(rt.x, rt.y);
            pCtx.rotate(rt.ang);
            // Cross glow
            pCtx.beginPath();
            pCtx.arc(0, 0, s * 0.8, 0, Math.PI * 2);
            pCtx.fillStyle = 'rgba(' + rt.c + ',' + (ra * 0.04) + ')';
            pCtx.fill();
            // Cross outer glow ring
            pCtx.beginPath();
            pCtx.arc(0, 0, s * 0.5, 0, Math.PI * 2);
            pCtx.strokeStyle = 'rgba(' + rt.c + ',' + (ra * 0.15) + ')';
            pCtx.lineWidth = 0.5;
            pCtx.stroke();
            // Cross lines
            var cl = s * 0.7;
            pCtx.beginPath();
            pCtx.moveTo(-cl, 0); pCtx.lineTo(cl, 0);
            pCtx.moveTo(0, -cl); pCtx.lineTo(0, cl);
            pCtx.strokeStyle = 'rgba(' + rt.c + ',' + ra + ')';
            pCtx.lineWidth = 1.4;
            pCtx.stroke();
            // Diagonal lines
            var dl = s * 0.45;
            pCtx.beginPath();
            pCtx.moveTo(-dl, -dl); pCtx.lineTo(dl, dl);
            pCtx.moveTo(dl, -dl); pCtx.lineTo(-dl, dl);
            pCtx.strokeStyle = 'rgba(' + rt.c + ',' + (ra * 0.5) + ')';
            pCtx.lineWidth = 0.9;
            pCtx.stroke();
            // Dot at center
            pCtx.beginPath();
            pCtx.arc(0, 0, 1, 0, Math.PI * 2);
            pCtx.fillStyle = 'rgba(255,255,255,' + (ra * 0.6) + ')';
            pCtx.fill();
            pCtx.restore();
          }
        }

        /* ── Pop bursts ── */
        for (var pb = popBursts.length - 1; pb >= 0; pb--) {
          var bp = popBursts[pb];
          bp.x += bp.vx;
          bp.y += bp.vy;
          bp.vy += 0.015;
          bp.life -= 0.025;
          if (bp.life <= 0) { popBursts.splice(pb, 1); continue; }
          var ba = bp.al * bp.life * gAlpha;
          pCtx.beginPath();
          pCtx.arc(bp.x, bp.y, bp.sz * bp.life, 0, Math.PI * 2);
          pCtx.fillStyle = 'rgba(' + bp.c + ',' + ba + ')';
          pCtx.fill();
          // Trail glow
          pCtx.beginPath();
          pCtx.arc(bp.x, bp.y, bp.sz * bp.life * 2, 0, Math.PI * 2);
          pCtx.fillStyle = 'rgba(' + bp.c + ',' + (ba * 0.06) + ')';
          pCtx.fill();
        }

        /* ── Final ring flash ── */
        if (elapsed > 3800 && elapsed < 5000) {
          var ringP = (elapsed - 3800) / 800;
          var ringR = ringP * Math.min(W, H) * 0.7;
          var ringA = (1 - ringP) * 0.2 * gAlpha;
          pCtx.beginPath();
          pCtx.arc(cx, cy, ringR, 0, Math.PI * 2);
          pCtx.strokeStyle = 'rgba(180,170,255,' + ringA + ')';
          pCtx.lineWidth = 1.5 * (1 - ringP);
          pCtx.stroke();
        }
      } catch (e) {}

      /* ── Fade-out complete → remove (outside try-catch) ── */
      if (fadeOut >= 1.2) {
        entrance.remove();
        site.classList.add('visible');
        showContent();
        showFurry();
        showBio();
        initPaw();
        initPlayer();
        return;
      }

      requestAnimationFrame(anim);
    }

    anim();

    /* ── Trigger fade-out ── */
    setTimeout(function () {
      entranceDone = true;
    }, 4200);
  })();

  /* ════════════════════════════════════════════════
     2. CONTENT STAGGER REVEAL
     ════════════════════════════════════════════════ */
  function showContent() {
    var els = document.querySelectorAll('.stagger');
    els.forEach(function (el, i) {
      setTimeout(function () { el.classList.add('show'); }, 80 + i * 70);
    });
  }

  /* ════════════════════════════════════════════════
     3. FURRY! REVEAL
     ════════════════════════════════════════════════ */
  function showFurry() {
    var letters = document.querySelectorAll('.furry-wrap span');
    letters.forEach(function (el, i) {
      setTimeout(function () {
        el.style.animation = 'none';
        el.style.opacity = '0';
        el.style.transform = 'translateY(16px)';
        void el.offsetWidth;
        el.style.animation = 'furryReveal 0.5s ease forwards';
      }, i * 70);
    });
  }

  /* ════════════════════════════════════════════════
     3b. BIO REVEAL
     ════════════════════════════════════════════════ */
  function showBio() {
    var letters = document.querySelectorAll('.bio-wrap span');
    letters.forEach(function (el, i) {
      setTimeout(function () {
        el.style.animation = 'none';
        el.style.opacity = '0';
        el.style.transform = 'translateY(-16px)';
        void el.offsetWidth;
        el.style.animation = 'bioReveal 0.5s ease forwards';
      }, i * 70);
    });
  }

  /* ════════════════════════════════════════════════
     4. BG PARTICLES
     ════════════════════════════════════════════════ */
  (function initBg() {
    var canvas = document.getElementById('bg-particles');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var W, H, parts = [];

    function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
    window.addEventListener('resize', resize);
    resize();

    var colors = ['rgba(124,92,255,', 'rgba(255,92,168,', 'rgba(184,160,255,'];
    for (var i = 0; i < 40; i++) {
      parts.push({
        x: rand(0, W), y: rand(0, H),
        vx: rand(-0.1, 0.1), vy: rand(-0.1, 0.1),
        size: rand(0.8, 2.2), alpha: rand(0.04, 0.16),
        color: colors[Math.floor(rand(0, colors.length))]
      });
    }

    function anim() {
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -5) p.x = W + 5; if (p.x > W + 5) p.x = -5;
        if (p.y < -5) p.y = H + 5; if (p.y > H + 5) p.y = -5;
        p.vx += Math.sin(Date.now() * 0.001 + p.x * 0.01) * 0.0002;
        p.vy += Math.cos(Date.now() * 0.001 + p.y * 0.01) * 0.0002;
        var spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (spd > 0.3) { p.vx = (p.vx / spd) * 0.3; p.vy = (p.vy / spd) * 0.3; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color + p.alpha + ')';
        ctx.fill();
      });
      requestAnimationFrame(anim);
    }
    anim();
  })();

  /* ════════════════════════════════════════════════
     5. PAW CURSOR
     ════════════════════════════════════════════════ */
  function initPaw() {
    if (!matchMedia('(pointer: fine)').matches) return;
    var paw = document.getElementById('paw-cursor');
    if (!paw) return;
    document.documentElement.classList.add('cur-on');

    var mx = window.innerWidth / 2, my = window.innerHeight / 2, cx = mx, cy = my, shown = false;
    var hoverSel = 'a, button, .skill-tag, .proj-card, .contact-links a, .cta';

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!shown) { shown = true; paw.classList.remove('hidden'); }
    });
    document.addEventListener('mouseleave', function () { paw.classList.add('hidden'); shown = false; });
    document.addEventListener('mouseenter', function () { if (!shown) { shown = true; paw.classList.remove('hidden'); } });
    document.addEventListener('mouseover', function (e) { if (e.target.closest(hoverSel)) paw.classList.add('hover'); });
    document.addEventListener('mouseout', function (e) { if (e.target.closest(hoverSel)) paw.classList.remove('hover'); });

    document.addEventListener('mousedown', function (e) {
      var x = e.clientX, y = e.clientY;
      var colors = ['#7c5cff', '#9b7fff', '#ff5ca8', '#b8a0ff', '#ffffff'];
      for (var i = 0; i < rand(8, 14); i++) {
        var s = document.createElement('div');
        s.className = 'spark';
        var a = rand(0, Math.PI * 2), d = rand(16, 50), sz = rand(2, 4);
        s.style.cssText =
          'left:' + x + 'px;top:' + y + 'px;' +
          'width:' + sz + 'px;height:' + sz + 'px;' +
          'background:' + colors[Math.floor(rand(0, colors.length))] + ';' +
          '--dx:' + (Math.cos(a) * d) + 'px;--dy:' + (Math.sin(a) * d) + 'px;' +
          'animation-duration:' + rand(0.35, 0.75) + 's;';
        document.body.appendChild(s);
        setTimeout(function () { s.remove(); }, 900);
      }
    });

    (function loop() {
      cx += (mx - cx) * 0.16; cy += (my - cy) * 0.16;
      paw.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)';
      requestAnimationFrame(loop);
    })();
  /* ════════════════════════════════════════════════
     6. MUSIC PLAYER
     ════════════════════════════════════════════════ */
  function initPlayer() {
    var songs = [
      { title: 'PASSENGER', artist: 'Alex Warren', file: 'assets/audio/01.mp3' },
      { title: 'Кошка', artist: 'Lida', file: 'assets/audio/02.mp3' },
      { title: 'целоваться', artist: 'lightprey', file: 'assets/audio/03.mp3' },
      { title: 'Hate me', artist: 'Ellie Goulding, Juice WRLD', file: 'assets/audio/04.mp3' },
      { title: 'Юра, Юра', artist: 'Cupsize', file: 'assets/audio/05.mp3' }
    ];

    var player = document.getElementById('player');
    var playBtn = document.getElementById('playerPlay');
    var titleEl = document.getElementById('playerTitle');
    var artistEl = document.getElementById('playerArtist');
    var progressFill = document.getElementById('playerProgressFill');
    var progressWrap = document.querySelector('.player-progress');
    var volumeSlider = document.getElementById('playerVolume');
    var dogeBtn = document.getElementById('dogeBtn');
    var dogeOverlay = document.getElementById('dogeOverlay');

    if (!player) return;

    var audio = new Audio();
    audio.volume = volumeSlider ? volumeSlider.value / 100 : 0.6;

    var currentIndex = -1;
    var isDoge = false;

    function formatTime(s) { var m = Math.floor(s / 60); var sec = Math.floor(s % 60); return m + ':' + (sec < 10 ? '0' : '') + sec; }

    function loadSong(idx) {
      if (idx < 0 || idx >= songs.length) return;
      currentIndex = idx;
      isDoge = idx === 4;
      audio.src = songs[idx].file;
      audio.load();
      titleEl.textContent = songs[idx].title;
      artistEl.textContent = songs[idx].artist;
    }

    function play() {
      if (audio.paused && audio.src) {
        audio.play().catch(function () {});
        playBtn.querySelector('.play-icon').style.display = 'none';
        playBtn.querySelector('.pause-icon').style.display = '';
      }
    }

    function pause() {
      if (!audio.paused) {
        audio.pause();
        playBtn.querySelector('.play-icon').style.display = '';
        playBtn.querySelector('.pause-icon').style.display = 'none';
      }
    }

    function togglePlay() {
      if (audio.paused) play(); else pause();
    }

    function pickRandom() {
      var idx;
      do { idx = Math.floor(Math.random() * 4); } while (idx === currentIndex);
      loadSong(idx);
      play();
    }

    // Show player
    player.classList.add('visible');
    dogeBtn.classList.add('visible');

    // Start random song
    pickRandom();

    // Play/pause
    playBtn.addEventListener('click', togglePlay);

    // Progress
    audio.addEventListener('timeupdate', function () {
      if (audio.duration) {
        progressFill.style.width = (audio.currentTime / audio.duration * 100) + '%';
      }
    });

    progressWrap.addEventListener('click', function (e) {
      if (!audio.duration) return;
      var rect = progressWrap.getBoundingClientRect();
      var pct = (e.clientX - rect.left) / rect.width;
      audio.currentTime = pct * audio.duration;
    });

    // Volume
    volumeSlider.addEventListener('input', function () {
      audio.volume = this.value / 100;
    });

    // Auto next
    audio.addEventListener('ended', function () {
      if (isDoge) { pickRandom(); return; }
      var idx;
      do { idx = Math.floor(Math.random() * 4); } while (idx === currentIndex);
      loadSong(idx);
      play();
    });

    /* ── Doge button ── */
    dogeBtn.addEventListener('click', function () {
      if (currentIndex === 4 && !audio.paused) {
        // Already playing doge
      } else {
        loadSong(4);
        play();
      }
      dogeOverlay.classList.add('active');
    });

    function closeDoge() {
      dogeOverlay.classList.remove('active');
    }

    dogeOverlay.addEventListener('click', closeDoge);
    document.addEventListener('keydown', function (e) {
      if (dogeOverlay.classList.contains('active')) closeDoge();
    });
  }
})();
