document.addEventListener('DOMContentLoaded', () => {
  initPhpLogoCanvas();
  initTerminalAnimation();
  initTabs();
  initCopyButtons();
  initScrollSpy();
  initProgressbar();
  initEvidenceDashboard();
});

// Particle background for the logo area (inside terminal)
function initPhpLogoCanvas() {
  const canvas = document.getElementById('phpLogoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.parentElement.offsetWidth;
    canvas.height = canvas.parentElement.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const particles = [];
  for (let i = 0; i < 30; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 59, 59, 0.4)';
    ctx.strokeStyle = 'rgba(255, 59, 59, 0.15)';

    particles.forEach((p, i) => {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const p2 = particles[j];
        const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
        if (dist < 80) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }
    });
    requestAnimationFrame(draw);
  }
  draw();
}

// Terminal: type command → show output lines → pause → next sequence
function initTerminalAnimation() {
  const body = document.getElementById('terminalBody');
  if (!body) return;

  const sequences = [
    {
      cmd: 'php2shell-check --cve CVE-2026-109618',
      output: [
        'php2shell-check -- CVE-2026-109618 (Heap UAF in session.upload_progress)',
        '=====================================================================',
        'Target : localhost',
        'Verdict: <span class="red">LIKELY VULNERABLE</span>',
        '',
        'Observed facts',
        '--------------------------------------------------------------',
        '  php_version                8.3.6',
        '  sapi                       cgi-fcgi',
        '  os_family                  Windows',
        '  is_windows                 true',
        '  upload_progress            enabled',
        '',
        '<span class="red">⚠ This version is affected. Upgrade to 8.3.36+ immediately.</span>'
      ]
    },
    {
      cmd: 'php2shell-check --cve CVE-2026-109619',
      output: [
        'php2shell-check -- CVE-2026-109619 (UAF → Privilege Escalation Chain)',
        '=====================================================================',
        'Target : localhost',
        'Verdict: <span class="red">LIKELY VULNERABLE</span>',
        '',
        'Observed facts',
        '--------------------------------------------------------------',
        '  php_version                8.3.6',
        '  chain_dependency           CVE-2026-109618',
        '  persistence_vector         confirmed',
        '  heap_spray_feasible        true',
        '',
        '<span class="red">⚠ Chained exploit possible after initial RCE.</span>'
      ]
    },
    {
      cmd: 'php -v | grep -E "8\\.(2|3|4|5)"',
      output: [
        'PHP 8.3.6 (cgi-fcgi) (built: Apr 15 2026)',
        'Copyright (c) The PHP Group',
        '<span class="yellow">WARNING: 8.3.6 < 8.3.36 — vulnerable to CVE-2026-109618</span>',
        '<span class="yellow">WARNING: 8.3.6 < 8.3.36 — vulnerable to CVE-2026-109619</span>',
        '<span class="green">FIX: Upgrade to PHP 8.3.36 or set session.upload_progress.enabled=Off</span>'
      ]
    }
  ];

  let seqIndex = 0;

  function runSequence() {
    const seq = sequences[seqIndex];
    body.innerHTML = '';

    // Preserve the logo element
    const logo = body.querySelector('.terminal-logo');
    if (logo) body.appendChild(logo);

    const cmdLine = document.createElement('div');
    cmdLine.className = 'term-line';
    cmdLine.innerHTML = '<span class="prompt">root@sunilawesome:~#</span> <span class="cmd"></span><span class="cursor">&#9608;</span>';
    body.insertBefore(cmdLine, logo);

    const cmdSpan = cmdLine.querySelector('.cmd');
    const cursorSpan = cmdLine.querySelector('.cursor');
    let charIndex = 0;

    function typeChar() {
      if (charIndex < seq.cmd.length) {
        cmdSpan.textContent += seq.cmd[charIndex];
        charIndex++;
        setTimeout(typeChar, 28);
      } else {
        cursorSpan.style.display = 'none';
        setTimeout(showOutput, 250);
      }
    }

    function showOutput() {
      let lineIndex = 0;
      function showLine() {
        if (lineIndex < seq.output.length) {
          const line = document.createElement('div');
          line.className = 'term-line output-line';
          line.innerHTML = seq.output[lineIndex];
          body.insertBefore(line, logo);
          body.scrollTop = body.scrollHeight;
          lineIndex++;
          setTimeout(showLine, 120);
        } else {
          setTimeout(() => {
            seqIndex = (seqIndex + 1) % sequences.length;
            runSequence();
          }, 3000);
        }
      }
      showLine();
    }

    typeChar();
  }

  runSequence();
}

// Tabs (legacy tab-bar if any remain)
function initTabs() {
  const btns = document.querySelectorAll('.tab-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.tab;
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tab-panel').forEach(p => {
        p.classList.toggle('active', p.id === `tab-${target}`);
      });
    });
  });
  initParrotTabs();
}

// Parrot OS terminal tabs for detection section
function initParrotTabs() {
  const menuItems = document.querySelectorAll('.parrot-menu-item');
  const panels = document.querySelectorAll('.parrot-panel');
  const lineNums = document.getElementById('parrotLineNums');

  function updateLineNumbers(panel) {
    if (!lineNums || !panel) return;
    const lines = panel.querySelectorAll('div');
    let html = '';
    for (let i = 1; i <= lines.length; i++) {
      html += i + '\n';
    }
    lineNums.textContent = html;
  }

  function activateTab(tabName) {
    menuItems.forEach(m => m.classList.toggle('active', m.dataset.tab === tabName));
    panels.forEach(p => {
      const isActive = p.id === `ptab-${tabName}`;
      p.classList.toggle('active', isActive);
      if (isActive) updateLineNumbers(p);
    });
  }

  menuItems.forEach(item => {
    item.addEventListener('click', () => activateTab(item.dataset.tab));
  });

  // Initialize first tab
  if (menuItems.length > 0) activateTab(menuItems[0].dataset.tab);
}

// Copy buttons
function initCopyButtons() {
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.previousElementSibling.textContent;
      navigator.clipboard.writeText(code).then(() => {
        const original = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => btn.textContent = original, 2000);
      });
    });
  });
}

// Version Checker — uses real patched version numbers from research
function checkVersion() {
  const input = document.getElementById('versionInput').value.trim();
  const result = document.getElementById('versionResult');

  if (!input) {
    result.innerHTML = '<span style="color: var(--yellow)">Please enter a PHP version (e.g. 8.3.6)</span>';
    return;
  }

  const match = input.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) {
    result.innerHTML = '<span style="color: var(--yellow)">Invalid format. Use major.minor.patch (e.g. 8.3.6)</span>';
    return;
  }

  const major = parseInt(match[1]);
  const minor = parseInt(match[2]);
  const patch = parseInt(match[3]);

  // Patched versions from ikow/php2shell-poc and syrex1013/php2shell
  const patchedVersions = {
    '8.5': 12,
    '8.4': 27,
    '8.3': 36,
    '8.2': 35
  };

  const branch = `${major}.${minor}`;

  if (major < 8 || (major === 8 && minor < 2)) {
    result.innerHTML = '<span style="color: var(--red)">⚠️ VULNERABLE — PHP ' + input + ' is end-of-life with no official patch. Use mpyw/php-eol backported Docker images or upgrade to PHP 8.2.35+.</span>';
    return;
  }

  if (patchedVersions[branch] !== undefined) {
    if (patch >= patchedVersions[branch]) {
      result.innerHTML = '<span style="color: var(--green)">✅ PATCHED — PHP ' + input + ' includes the fix for CVE-2026-109618 and CVE-2026-109619.</span>';
    } else {
      result.innerHTML = '<span style="color: var(--red)">⚠️ VULNERABLE — PHP ' + input + ' is below the patched release ' + branch + '.' + patchedVersions[branch] + '. Upgrade immediately or set session.upload_progress.enabled=Off as temporary mitigation.</span>';
    }
  } else {
    result.innerHTML = '<span style="color: var(--yellow)">⚠️ UNKNOWN — PHP ' + input + ' branch not in the known patch table. Check against the latest PHP security advisory.</span>';
  }
}

// Scroll Spy
function initScrollSpy() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          link.style.color = link.getAttribute('href') === '#' + id
            ? 'var(--text)'
            : '';
        });
      }
    });
  }, { rootMargin: '-40% 0px -60% 0px' });

  sections.forEach(s => observer.observe(s));
}

// Progress Bar
function initProgressbar() {
  const bar = document.getElementById('progressBar');
  window.addEventListener('scroll', () => {
    const scrollTop = document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const progress = (scrollTop / scrollHeight) * 100;
    bar.style.width = `${progress}%`;
  });
}
// Evidence dashboard — 3D tilt cards + count-up on scroll
function initEvidenceDashboard() {
  const grid = document.getElementById('evidenceGrid');
  if (!grid) return;
  const cards = grid.querySelectorAll('.stat-card');

  // ---- 3D tilt + glow cursor on each card ----
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;   // 0..1
      const py = (e.clientY - rect.top) / rect.height;   // 0..1
      const rotY = (px - 0.5) * 14;
      const rotX = (0.5 - py) * 14;
      card.style.transform = `perspective(800px) rotateX(${rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg) translateY(-4px)`;
      card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
      card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });

  // ---- Count-up numbers when grid scrolls into view ----
  const counts = grid.querySelectorAll('.count');
  if (!counts.length) return;

  let started = false;

  function animate() {
    if (started) return;
    started = true;

    counts.forEach(el => {
      const card = el.closest('.stat-card');
      const target = parseInt(card.dataset.count, 10) || 0;
      const prefix = card.dataset.prefix || '';
      const suffix = card.dataset.suffix || '';
      const dur = 900;
      const t0 = performance.now();
      // Start at 1 and climb to the target so values like "14 yrs" read as
      // a real count-up (1, 2, 3 … 14), not a jump from 0.
      const start = target >= 2 ? 1 : 0;

      function tick(now) {
        const p = Math.min((now - t0) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
        const val = start + Math.round((target - start) * eased);
        el.textContent = prefix + val + suffix;
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }

  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) animate(); });
    }, { threshold: 0.25 });
    obs.observe(grid);
  } else {
    animate();
  }
}
