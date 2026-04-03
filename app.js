function init() {
  const data = JSON.parse(document.getElementById('api-data').textContent);
  buildAPI(data);
  addCopyButtons();
  addAnchorLinks();
  bindEvents();
}

function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function walletBadge(w) {
  if (w === 'yes') return '<span class="nav-badge badge-w">wallet</span>';
  if (w === 'optional') return '<span class="nav-badge badge-ow">wallet?</span>';
  return '';
}

function requiresBadge(r) {
  if (r === 'index-tx') return '<span class="nav-badge badge-ix">--index-tx</span>';
  if (r === 'index-tx?') return '<span class="nav-badge badge-oix">--index-tx?</span>';
  if (r === 'index-address') return '<span class="nav-badge badge-ix">--index-addr</span>';
  return '';
}

function walletTag(w) {
  if (w === 'yes') return '<span class="tag tag-w">wallet required</span>';
  if (w === 'optional') return '<span class="tag tag-ow">wallet optional</span>';
  return '';
}

function requiresTag(r) {
  if (r === 'index-tx') return '<span class="tag tag-ix">--index-tx</span>';
  if (r === 'index-tx?') return '<span class="tag tag-oix">--index-tx?</span>';
  if (r === 'index-address') return '<span class="tag tag-ix">--index-address</span>';
  return '';
}

function syntaxHL(obj, indent) {
  indent = indent || 0;
  const pad = '  '.repeat(indent);
  if (obj === null) return '<span class="sn">null</span>';
  if (typeof obj === 'boolean') return `<span class="sb">${obj}</span>`;
  if (typeof obj === 'number') return `<span class="snum">${obj}</span>`;
  if (typeof obj === 'string') {
    const s = esc(obj);
    if (s.length > 48) return `<span class="ss">"${s.substring(0,44)}..."</span>`;
    return `<span class="ss">"${s}"</span>`;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map(i => pad + '  ' + syntaxHL(i, indent + 1));
    return '[\n' + items.join(',\n') + '\n' + pad + ']';
  }
  const keys = Object.keys(obj);
  if (keys.length === 0) return '{}';
  const entries = keys.map(k =>
    pad + '  ' + `<span class="sk">"${esc(k)}"</span>: ` + syntaxHL(obj[k], indent + 1)
  );
  return '{\n' + entries.join(',\n') + '\n' + pad + '}';
}

function buildAPI(sections) {
  const nav = document.getElementById('nav');
  const content = document.getElementById('methods');
  let navHTML = '';
  let mainHTML = '';

  for (const sec of sections) {
    navHTML += `<div class="nav-cat" data-cat="${sec.id}">${esc(sec.label)}</div>`;
    for (const m of sec.methods) {
      navHTML += `<a class="nav-link" href="#${m.name}" data-method="${m.name}">${m.name}${requiresBadge(m.requires)}${walletBadge(m.wallet)}</a>`;
    }

    mainHTML += `<section class="category" data-cat="${sec.id}">`;
    mainHTML += `<h3 class="cat-hdr" id="${sec.id}">${esc(sec.label)}</h3>`;
    mainHTML += `<p class="cat-desc">${esc(sec.description)}</p>`;

    for (const m of sec.methods) {
      mainHTML += `<div class="method" id="${m.name}">`;
      mainHTML += `<div class="method-hdr">`;
      mainHTML += `<span class="method-name">${m.name}</span>`;
      mainHTML += `<span class="method-tags">${requiresTag(m.requires)}${walletTag(m.wallet)}</span>`;
      mainHTML += `</div>`;
      mainHTML += `<div class="method-body">`;
      mainHTML += `<p class="method-desc">${esc(m.description)}</p>`;

      if (m.params && m.params.length > 0) {
        mainHTML += `<div class="sec-lbl">Parameters</div>`;
        mainHTML += `<table class="ptable"><thead><tr><th>Name</th><th>Type</th><th></th><th>Description</th></tr></thead><tbody>`;
        for (const p of m.params) {
          const req = p.required ? '<span class="preq">required</span>' : '<span class="popt">optional</span>';
          let desc = esc(p.description);
          if (p.default) desc += ` <span class="pdef">(default: ${esc(p.default)})</span>`;
          mainHTML += `<tr><td class="pname">${esc(p.name)}</td><td class="ptype">${esc(p.type)}</td><td>${req}</td><td class="pdesc">${desc}</td></tr>`;
        }
        mainHTML += `</tbody></table>`;
      } else {
        mainHTML += `<div class="sec-lbl">Parameters</div><p class="pdesc" style="font-size:13px">None</p>`;
      }

      if (m.response && m.response.length > 0) {
        mainHTML += `<div class="sec-lbl">Response</div>`;
        mainHTML += `<table class="ptable"><thead><tr><th>Field</th><th>Type</th><th>Description</th></tr></thead><tbody>`;
        for (const r of m.response) {
          mainHTML += `<tr><td class="pname">${esc(r.name)}</td><td class="ptype">${esc(r.type)}</td><td class="pdesc">${esc(r.description)}</td></tr>`;
        }
        mainHTML += `</tbody></table>`;
      }

      if (m.example) {
        mainHTML += `<div class="sec-lbl">Example</div>`;
        mainHTML += `<div class="fb-terminal"><div class="fb-terminal-bar"><span class="fb-terminal-dot"></span><span class="fb-terminal-dot"></span><span class="fb-terminal-dot"></span></div><div class="fb-terminal-body"><code><span class="t-prompt">$</span>${esc(m.example.request)}</code></div></div>`;
        if (m.example.response != null) {
          const resp = typeof m.example.response === 'string'
            ? `"${esc(m.example.response)}"`
            : syntaxHL(m.example.response);
          mainHTML += `<div class="fb-terminal"><div class="fb-terminal-bar"><span class="fb-terminal-dot"></span><span class="fb-terminal-dot"></span><span class="fb-terminal-dot"></span></div><div class="fb-terminal-body"><code>${resp}</code></div></div>`;
        }
      }

      if (m.notes) {
        mainHTML += `<div class="note">${m.notes.replace(/`([^`]+)`/g, '<code>$1</code>')}</div>`;
      }

      mainHTML += `</div></div>`;
    }
    mainHTML += `</section>`;
  }

  nav.insertAdjacentHTML('beforeend', navHTML);
  content.innerHTML = mainHTML;
}

function addAnchorLinks() {
  const linkIcon = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6.5 9.5a3 3 0 004.2.3l2-2a3 3 0 00-4.2-4.3L7 4.8"/><path d="M9.5 6.5a3 3 0 00-4.2-.3l-2 2a3 3 0 004.2 4.3L9 11.2"/></svg>';
  document.querySelectorAll('.guide h2[id], .cat-hdr[id]').forEach(el => {
    const a = document.createElement('a');
    a.className = 'anchor-link';
    a.href = '#' + el.id;
    a.innerHTML = linkIcon;
    a.addEventListener('click', e => {
      e.preventDefault();
      history.replaceState(null, '', '#' + el.id);
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    el.appendChild(a);
  });
}

function addCopyButtons() {
  const clipIcon = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M3 10.5H2.5A1.5 1.5 0 011 9V2.5A1.5 1.5 0 012.5 1H9A1.5 1.5 0 0110.5 2.5V3"/></svg>';
  const checkIcon = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.5 8.5L6.5 11.5L12.5 4.5"/></svg>';
  document.querySelectorAll('.fb-terminal').forEach(blk => {
    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.innerHTML = clipIcon;
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const code = blk.querySelector('.fb-terminal-body code');
      navigator.clipboard.writeText((code || blk).textContent.replace(/^\$/gm, ''));
      btn.innerHTML = checkIcon;
      btn.classList.add('copied');
      setTimeout(() => { btn.innerHTML = clipIcon; btn.classList.remove('copied'); }, 1500);
    });
    blk.appendChild(btn);
  });
}

function bindEvents() {
  const sidebar = document.getElementById('sidebar');
  const menuBtn = document.getElementById('menuBtn');
  const overlay = document.getElementById('sidebarOverlay');

  function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('open');
  }
  function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('open');
  }

  menuBtn.addEventListener('click', () => {
    if (sidebar.classList.contains('open')) closeSidebar();
    else openSidebar();
  });
  overlay.addEventListener('click', closeSidebar);

  const input = document.getElementById('search');
  const allNavLinks = document.querySelectorAll('.nav-link[data-method]');
  const allNavCats = document.querySelectorAll('.nav-cat');
  const allMethods = document.querySelectorAll('.method');
  const allCategories = document.querySelectorAll('.category');
  const guideSection = document.getElementById('guide');
  const guideNavLinks = document.querySelectorAll('.nav-link.guide-link');

  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();

    allNavLinks.forEach(l => l.classList.toggle('hidden', q && !l.dataset.method.includes(q)));
    allNavCats.forEach(c => {
      let el = c.nextElementSibling, vis = false;
      while (el && !el.classList.contains('nav-cat')) {
        if (el.classList.contains('nav-link') && !el.classList.contains('hidden')) vis = true;
        el = el.nextElementSibling;
      }
      c.classList.toggle('hidden', q && !vis);
    });

    allMethods.forEach(m => m.classList.toggle('hidden', q && !m.id.includes(q)));
    allCategories.forEach(s => {
      const vis = s.querySelectorAll('.method:not(.hidden)').length;
      s.classList.toggle('hidden', q && !vis);
    });

    if (guideSection) guideSection.classList.toggle('hidden', !!q);
    guideNavLinks.forEach(l => l.classList.toggle('hidden', !!q));
    document.querySelectorAll('.nav-divider').forEach(d => d.classList.toggle('hidden', !!q));
  });

  const spyTargets = [
    ...document.querySelectorAll('.guide h2[id]'),
    ...allMethods
  ];
  const allSpyLinks = document.querySelectorAll('.nav-link[href^="#"]');

  let currentActive = null;
  let navLock = null;
  let navLockTimer = null;
  let hashReady = !location.hash;

  function setActive(id) {
    if (id === currentActive) return;
    currentActive = id;
    if (hashReady) history.replaceState(null, '', '#' + id);
    allSpyLinks.forEach(l => l.classList.remove('active'));
    allMethods.forEach(m => m.classList.remove('active'));
    const el = document.getElementById(id);
    if (el && el.classList.contains('method')) el.classList.add('active');
    const link = document.querySelector(`.nav-link[href="#${id}"]`);
    if (link) {
      link.classList.add('active');
      const nav = link.closest('.sidebar-nav');
      if (nav) {
        const linkRect = link.getBoundingClientRect();
        const navRect = nav.getBoundingClientRect();
        if (linkRect.top < navRect.top || linkRect.bottom > navRect.bottom) {
          link.scrollIntoView({ block: 'nearest', behavior: 'instant' });
        }
      }
    }
  }

  function updateScrollSpy() {
    if (navLock) { setActive(navLock); return; }

    const scrollY = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    let best = null;

    let lastAbove = -1;
    for (let i = 0; i < spyTargets.length; i++) {
      if (spyTargets[i].getBoundingClientRect().top < 60) lastAbove = i;
    }

    if (maxScroll > 0 && scrollY > maxScroll - window.innerHeight) {
      const start = maxScroll - window.innerHeight;
      const progress = Math.min((scrollY - start) / (maxScroll - start), 1);
      const remaining = spyTargets.length - 1 - lastAbove;
      if (remaining > 0) {
        const idx = lastAbove + Math.round(progress * remaining);
        best = spyTargets[Math.min(idx, spyTargets.length - 1)];
      } else {
        best = lastAbove >= 0 ? spyTargets[lastAbove] : null;
      }
    } else {
      best = lastAbove >= 0 ? spyTargets[lastAbove] : null;
    }

    if (best) setActive(best.id);
  }

  if (location.hash) {
    const t = document.querySelector(location.hash);
    if (t) {
      t.scrollIntoView({ block: 'start', behavior: 'instant' });
      navLock = t.id;
      setActive(t.id);
      setTimeout(() => { navLock = null; hashReady = true; }, 500);
    } else {
      hashReady = true;
    }
  }

  window.addEventListener('scroll', updateScrollSpy, { passive: true });
  updateScrollSpy();

  function handleNavClick(e, l) {
    e.preventDefault();
    const id = l.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    navLock = id;
    setActive(id);
    clearTimeout(navLockTimer);
    navLockTimer = setTimeout(() => { navLock = null; }, 800);
    closeSidebar();
  }
  allNavLinks.forEach(l => l.addEventListener('click', e => handleNavClick(e, l)));
  guideNavLinks.forEach(l => l.addEventListener('click', e => handleNavClick(e, l)));

  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== input) { e.preventDefault(); input.focus(); }
    if (e.key === 'Escape') {
      if (document.activeElement === input) {
        input.value = ''; input.dispatchEvent(new Event('input')); input.blur();
      }
      closeSidebar();
    }
  });
}

init();
