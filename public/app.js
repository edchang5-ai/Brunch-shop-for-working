const form = document.getElementById('search-form');
const resultsEl = document.getElementById('results');
const toolbar = document.getElementById('toolbar');
const countLabel = document.getElementById('count-label');
const analyzeAllBtn = document.getElementById('analyze-all');

let places = [];

function badge(label, state) {
  const map = {
    true: 'yes',
    false: 'no',
    null: 'unknown',
    undefined: 'unknown',
  };
  const text = { true: '是', false: '否', null: '待確認' };
  return `<span class="badge ${map[String(state)]}">${label}：${text[String(state)] ?? '待確認'}</span>`;
}

function renderCard(place) {
  const el = document.createElement('div');
  el.className = 'card';
  el.id = `card-${place.placeId}`;
  el.innerHTML = `
    <h3>${escapeHtml(place.name)}</h3>
    <div class="address">${escapeHtml(place.address || '')}</div>
    <div class="badges">
      <span class="badge">評分 ${place.rating ?? '-'}（${place.userRatingCount ?? 0} 則）</span>
    </div>
    <div class="analysis">
      <span class="loading">尚未分析</span>
      <button class="secondary analyze-one" data-id="${place.placeId}" type="button" style="margin-left:10px;padding:4px 12px;font-size:13px;">分析這間</button>
    </div>
  `;
  el.querySelector('.analyze-one').addEventListener('click', () => analyzeOne(place.placeId));
  return el;
}

function renderSummary(place, analysis) {
  const card = document.getElementById(`card-${place.placeId}`);
  if (!card) return;
  const box = card.querySelector('.analysis');
  const hours = analysis.hoursNote
    ? `<div>🕐 營業時間：${escapeHtml(analysis.hoursNote)}</div>`
    : '';
  box.innerHTML = `
    <div class="badges">
      ${badge('電源插座', analysis.hasPower)}
      ${badge('供應咖啡', analysis.servesCoffee)}
    </div>
    ${hours}
    <div class="summary">${escapeHtml(analysis.summary)}</div>
  `;
}

async function analyzeOne(placeId) {
  const card = document.getElementById(`card-${placeId}`);
  if (!card) return;
  const box = card.querySelector('.analysis');
  box.innerHTML = '<span class="loading">AI 分析中…</span>';

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '分析失敗');
    renderSummary(data.place, data.analysis);
  } catch (err) {
    box.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
  }
}

async function analyzeAll() {
  analyzeAllBtn.disabled = true;
  analyzeAllBtn.textContent = `分析中… 0 / ${places.length}`;
  let done = 0;
  for (const place of places) {
    await analyzeOne(place.placeId);
    done += 1;
    analyzeAllBtn.textContent = `分析中… ${done} / ${places.length}`;
  }
  analyzeAllBtn.textContent = '重新分析全部';
  analyzeAllBtn.disabled = false;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const query = document.getElementById('query').value.trim();
  const count = document.getElementById('count').value;
  resultsEl.innerHTML = '<div class="empty">搜尋中…</div>';
  toolbar.classList.add('hidden');

  try {
    const res = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, count: Number(count) }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '搜尋失敗');

    places = data.results || [];
    resultsEl.innerHTML = '';
    if (places.length === 0) {
      resultsEl.innerHTML = '<div class="empty">找不到店家，請換個關鍵字試試。</div>';
      return;
    }

    countLabel.textContent = `找到 ${places.length} 間店家`;
    toolbar.classList.remove('hidden');
    for (const place of places) resultsEl.appendChild(renderCard(place));
  } catch (err) {
    resultsEl.innerHTML = `<div class="error">${escapeHtml(err.message)}</div>`;
  }
});

analyzeAllBtn.addEventListener('click', analyzeAll);

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
