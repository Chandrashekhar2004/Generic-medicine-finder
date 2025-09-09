// =========================
// Demo Medicines Data (extendable)
// =========================
const MEDICINES = [
    {
        name: "Paracetamol",
        composition: "Paracetamol 500 mg",
        company: "Generic Labs",
        type: "Tablet",
        price: 18,
        uses: "Fever, mild pain relief",
        sideEffects: "Nausea, rash (rare)",
        alternatives: ["Dolo 650", "Crocin 500", "Calpol"]
    },
    {
        name: "Azithromycin",
        composition: "Azithromycin 500 mg",
        company: "Zeta Pharma",
        type: "Tablet",
        price: 95,
        uses: "Bacterial infections",
        sideEffects: "Diarrhea, nausea",
        alternatives: ["Azax 500", "Azee 500", "Zithrox"]
    },
    {
        name: "Pantoprazole",
        composition: "Pantoprazole 40 mg",
        company: "Alpha Remedies",
        type: "Tablet",
        price: 55,
        uses: "Acidity, GERD",
        sideEffects: "Headache, flatulence",
        alternatives: ["Pan 40", "Pantozen 40", "Pantodac 40"]
    },
    {
        name: "Cetirizine",
        composition: "Cetirizine 10 mg",
        company: "HealWell",
        type: "Tablet",
        price: 12,
        uses: "Allergy, sneezing",
        sideEffects: "Drowsiness",
        alternatives: ["Cetzine", "Alerid", "Zyrtec"]
    },
    {
        name: "Metformin",
        composition: "Metformin 500 mg",
        company: "Nova Care",
        type: "Tablet",
        price: 28,
        uses: "Type 2 Diabetes",
        sideEffects: "Bloating, nausea",
        alternatives: ["Glycomet", "Metlong", "Met Ride"]
    }
];

// =========================
// UTILITIES
// =========================
const $ = (s, p = document) => p.querySelector(s);
const $$ = (s, p = document) => Array.from(p.querySelectorAll(s));

const toast = (msg) => {
    const el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 1800);
};

const saveLocal = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const getLocal = (k, d = null) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d));

// =========================
// AUTH FLOW (very basic demo)
// =========================
const authWrap = $('#auth');
const signupCard = $('#signup-card');
const loginCard = $('#login-card');

$('#go-login').onclick = () => {
    signupCard.style.display = 'none';
    loginCard.style.display = 'block';
};
$('#go-signup').onclick = () => {
    loginCard.style.display = 'none';
    signupCard.style.display = 'block';
};

$('#signup-btn').onclick = () => {
    const u = $('#signup-username').value.trim();
    const p = $('#signup-password').value.trim();
    if (u.length < 3 || p.length < 4) {
        $('#signup-msg').textContent = 'Username/Password too short.';
        return;
    }
    saveLocal('user', { u, p, since: new Date().toISOString() });
    $('#signup-msg').textContent = 'Account created. Please login.';
    setTimeout(() => {
        signupCard.style.display = 'none';
        loginCard.style.display = 'block';
    }, 600);
};

$('#login-btn').onclick = () => {
    const store = getLocal('user');
    const u = $('#login-username').value.trim();
    const p = $('#login-password').value.trim();
    if (!store || store.u !== u || store.p !== p) {
        $('#login-error').textContent = 'Invalid credentials';
        return;
    }
    startApp(store);
};

const startApp = (user) => {
    authWrap.style.display = 'none';
    $('#app').style.display = 'grid';
    $('#user-title').textContent = user.u;
    $('#avatar').textContent = (user.u[0] || 'U').toUpperCase();
    const since = new Date(user.since || Date.now()).toLocaleDateString();
    $('#member-since').textContent = `Member since ${since}`;
    $('#welcome').textContent = `Hello, ${user.u} 👋`;
    const preferred = getLocal('theme', 'dark');
    document.documentElement.classList.toggle('light', preferred === 'light');
    $('#theme-toggle').checked = preferred === 'light';
    renderSaved();
    showSection('search');
};

$('#logout').onclick = () => { location.reload(); };

// Auto-login if user exists
const existing = getLocal('user');
if (existing) { // optional: auto-show login card for returning users
    signupCard.style.display = 'none';
    loginCard.style.display = 'block';
}

// =========================
// NAVIGATION & SECTIONS
// =========================
const sections = {
    search: $('#section-search'),
    saved: $('#section-saved'),
    about: $('#section-about'),
    settings: $('#section-settings'),
};

function showSection(name) {
    Object.entries(sections).forEach(([k, el]) => {
        if (k === name) { el.style.display = ''; }
        else { el.style.display = k === 'saved' ? '' : 'none'; } // keep saved visible in sidebar grid
    });
    $$('.nav .item').forEach(b => b.classList.toggle('active', b.dataset.section === name));
    // Special: about/settings are full-width cards below
    sections.about.classList.toggle('active', name === 'about');
    sections.settings.classList.toggle('active', name === 'settings');
}

$$('.nav .item').forEach(btn => btn.addEventListener('click', () => showSection(btn.dataset.section)));

// =========================
// THEME TOGGLE
// =========================
$('#theme-toggle').addEventListener('change', (e) => {
    const mode = e.target.checked ? 'light' : 'dark';
    document.documentElement.classList.toggle('light', mode === 'light');
    saveLocal('theme', mode);
});

// =========================
// SEARCH + SUGGESTIONS
// =========================
const input = $('#medicineInput');
const suggestionsEl = $('#suggestions');
const resultEl = $('#result');
const altEl = $('#alternatives');

const matchMeds = (q) => MEDICINES.filter(m => m.name.toLowerCase().includes(q.toLowerCase()));

const renderSuggestions = (list) => {
    suggestionsEl.innerHTML = '';
    list.slice(0, 6).forEach(m => {
        const row = document.createElement('div'); 
        row.className = 'suggestion';
        row.innerHTML = `<span>${m.name}</span><button class="btn" data-pick="${m.name}">Select</button>`;
        suggestionsEl.appendChild(row);
    });
    suggestionsEl.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => {
        input.value = b.dataset.pick;
        suggestionsEl.innerHTML = '';
        doSearch();
    });
};

const renderResult = (med) => {
    if (!med) {
        resultEl.innerHTML = '';
        altEl.innerHTML = '';
        return;
    }
    resultEl.innerHTML = `
        <div class="med-info">
          <h3>${med.name}</h3>
          <div class="meta">${med.composition} · ${med.type} · ₹${med.price}</div>
          <div class="meta">Company: ${med.company}</div>
          <div class="meta">Uses: ${med.uses}</div>
          <div class="meta">Side effects: ${med.sideEffects}</div>
          <div style="margin-top:8px; display:flex; gap:10px; flex-wrap:wrap;">
            <button class="btn btn-primary" id="saveMed">⭐ Save</button>
            <button class="btn" id="clearRes">Clear</button>
          </div>
        </div>
      `;

    altEl.innerHTML = `<h4>Alternatives</h4><div class="alt-grid">${med.alternatives.map(a => `
        <div class="alt-card"><strong>${a}</strong><span class="meta">Similar purpose</span></div>
      `).join('')}</div>`;

    $('#saveMed').onclick = () => { saveMedicine(med); };
    $('#clearRes').onclick = () => {
        resultEl.innerHTML = '';
        altEl.innerHTML = '';
    };
};

const doSearch = () => {
    const q = input.value.trim();
    if (!q) {
        resultEl.innerHTML = '';
        altEl.innerHTML = '';
        return;
    }
    const found = matchMeds(q);
    renderSuggestions(found);
    renderResult(found[0]);
};

input.addEventListener('input', () => {
    const q = input.value.trim();
    if (!q) {
        suggestionsEl.innerHTML = '';
        return;
    }
    renderSuggestions(matchMeds(q));
});

$('#searchBtn').onclick = doSearch;
$('#clearBtn').onclick = () => {
    input.value = '';
    suggestionsEl.innerHTML = '';
    resultEl.innerHTML = '';
    altEl.innerHTML = '';
};

// =========================
// SAVED MEDICINES (Local)
// =========================
const renderSaved = () => {
    const saved = getLocal('saved', []);
    const box = $('#savedList');
    box.innerHTML = '';
    if (!saved.length) {
        box.innerHTML = '<div class="muted">No saved medicines yet.</div>';
        return;
    }
    saved.forEach(m => {
        const row = document.createElement('div'); row.className = 'saved-item';
        row.innerHTML = `<span>${m.name}</span><div style="display:flex;gap:8px;">
          <button class="btn" data-open="${m.name}">Open</button>
          <button class="btn" data-remove="${m.name}">Remove</button>
        </div>`;
        box.appendChild(row);
    });
    box.querySelectorAll('[data-open]').forEach(b => b.onclick = () => {
        input.value = b.dataset.open;
        doSearch();
    });
    box.querySelectorAll('[data-remove]').forEach(b => b.onclick = () => {
        const list = getLocal('saved', []).filter(x => x.name !== b.dataset.remove);
        saveLocal('saved', list);
        renderSaved();
        toast('Removed');
    });
};

const saveMedicine = (med) => {
    const saved = getLocal('saved', []);
    if (saved.some(x => x.name === med.name)) {
        toast('Already saved');
        return;
    }
    saved.unshift({ name: med.name, time: Date.now() });
    saveLocal('saved', saved);
    renderSaved();
    toast('Saved');
};

$('#clearSaved').onclick = () => {
    saveLocal('saved', []);
    renderSaved();
    toast('Cleared');
};
