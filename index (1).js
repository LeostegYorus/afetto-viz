// Looker Studio Community Visualization
// Afetto Ad Performance Table with Retention Chart

const dscc = require('@google/dscc');
const local = require('./local');

const IS_LOCAL = typeof window === 'undefined' ? false : window.location.href.includes('localhost');

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNumber(n) {
  if (n === null || n === undefined || isNaN(n)) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return Math.round(n).toLocaleString('pt-BR');
}

function formatCurrency(n) {
  if (n === null || n === undefined || isNaN(n)) return 'R$ 0,00';
  return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(n) {
  if (n === null || n === undefined || isNaN(n)) return '0,00%';
  return (n * 100).toFixed(2).replace('.', ',') + '%';
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '...' : str;
}

// ─── SVG Retention Chart ────────────────────────────────────────────────────

function buildRetentionChart(vv25, vv50, vv75, vv95, vv100) {
  const W = 110, H = 75, PAD_TOP = 8, CHART_H = 52;
  const xs = [8, 32, 56, 80, 102];
  const vals = [vv25, vv50, vv75, vv95, vv100];
  const labels = ['25%', '50%', '75%', '95%', '100%'];

  const maxVal = Math.max(...vals.filter(v => !isNaN(v) && v > 0));
  const base = maxVal === 0 ? 1 : maxVal;

  const ys = vals.map(v => {
    const ratio = isNaN(v) ? 0 : v / base;
    return PAD_TOP + CHART_H - Math.round(ratio * CHART_H);
  });

  const points = xs.map((x, i) => `${x},${ys[i]}`).join(' ');

  const gridMid = PAD_TOP + CHART_H / 2;
  const gridBot = PAD_TOP + CHART_H;
  const labelY = PAD_TOP + CHART_H + 10;

  let svg = `<svg width="${W}" height="${H}" style="overflow:visible;">`;

  // Grid lines
  svg += `<line x1="0" y1="${PAD_TOP}" x2="${W}" y2="${PAD_TOP}" stroke="#eee" stroke-width="1"/>`;
  svg += `<line x1="0" y1="${gridMid}" x2="${W}" y2="${gridMid}" stroke="#eee" stroke-width="1"/>`;
  svg += `<line x1="0" y1="${gridBot}" x2="${W}" y2="${gridBot}" stroke="#ccc" stroke-width="1"/>`;

  // Line
  svg += `<polyline points="${points}" fill="none" stroke="#E8572A" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;

  // Points + labels
  xs.forEach((x, i) => {
    const y = ys[i];
    const valLabel = vals[i] >= 1000
      ? (vals[i] / 1000).toFixed(1) + 'k'
      : Math.round(vals[i]).toString();

    svg += `<circle cx="${x}" cy="${y}" r="2.5" fill="#E8572A"/>`;
    svg += `<text x="${x}" y="${y - 4}" font-size="7" text-anchor="middle" fill="#555">${valLabel}</text>`;
    svg += `<text x="${x}" y="${labelY}" font-size="6" text-anchor="middle" fill="#999">${labels[i]}</text>`;
  });

  svg += `</svg>`;
  return svg;
}

// ─── Main Draw Function ──────────────────────────────────────────────────────

function drawViz(data) {
  const container = document.getElementById('viz-container') || document.body;
  container.innerHTML = '';

  // Aggregate rows by Ad Name (sum metrics)
  const adMap = new Map();

  const rows = data.tables.DEFAULT.rows;

  rows.forEach(row => {
    const adName    = row.adName?.[0]      || '';
    const thumbUrl  = row.thumbnailUrl?.[0] || '';
    const impr      = parseFloat(row.impressions?.[0])  || 0;
    const spend     = parseFloat(row.spend?.[0])        || 0;
    const vv3s      = parseFloat(row.vv3s?.[0])         || 0;
    const vv25      = parseFloat(row.vv25?.[0])         || 0;
    const vv50      = parseFloat(row.vv50?.[0])         || 0;
    const vv75      = parseFloat(row.vv75?.[0])         || 0;
    const vv95      = parseFloat(row.vv95?.[0])         || 0;
    const vv100     = parseFloat(row.vv100?.[0])        || 0;

    if (adMap.has(adName)) {
      const e = adMap.get(adName);
      e.impressions += impr;
      e.spend       += spend;
      e.vv3s        += vv3s;
      e.vv25        += vv25;
      e.vv50        += vv50;
      e.vv75        += vv75;
      e.vv95        += vv95;
      e.vv100       += vv100;
    } else {
      adMap.set(adName, {
        adName, thumbUrl,
        impressions: impr, spend,
        vv3s, vv25, vv50, vv75, vv95, vv100
      });
    }
  });

  // Sort by spend DESC
  const ads = Array.from(adMap.values()).sort((a, b) => b.spend - a.spend);

  if (ads.length === 0) {
    container.innerHTML = '<p style="padding:16px;color:#999;">Sem dados para exibir.</p>';
    return;
  }

  // ── Build Table ──
  let html = '<table>';

  // Header row
  html += '<thead><tr>';
  html += '<th class="label-cell">Anúncio</th>';
  ads.forEach(ad => {
    html += `<th class="header-cell" title="${ad.adName}">${truncate(ad.adName, 20)}</th>`;
  });
  html += '</tr></thead><tbody>';

  // Thumb URL (big image)
  html += '<tr><td class="label-cell">Thumb URL</td>';
  ads.forEach(ad => {
    html += `<td class="img-cell"><img src="${ad.thumbUrl}" alt="${ad.adName}" onerror="this.style.display='none'"/></td>`;
  });
  html += '</tr>';

  // Thumbnail URL (link)
  html += '<tr><td class="label-cell">Thumbnail URL</td>';
  ads.forEach(ad => {
    html += `<td class="data-cell"><a class="thumb-link" href="${ad.thumbUrl}" target="_blank">Ver imagem</a></td>`;
  });
  html += '</tr>';

  // Impressões
  html += '<tr><td class="label-cell">Impressões</td>';
  ads.forEach(ad => {
    html += `<td class="data-cell">${formatNumber(ad.impressions)}</td>`;
  });
  html += '</tr>';

  // Investimento
  html += '<tr><td class="label-cell">Investimento</td>';
  ads.forEach(ad => {
    html += `<td class="data-cell">${formatCurrency(ad.spend)}</td>`;
  });
  html += '</tr>';

  // VV 3s
  html += '<tr><td class="label-cell">VV 3s</td>';
  ads.forEach(ad => {
    html += `<td class="data-cell">${formatNumber(ad.vv3s)}</td>`;
  });
  html += '</tr>';

  // VV 25% a 100% (menores)
  [
    { key: 'vv25',  label: 'VV 25%'  },
    { key: 'vv50',  label: 'VV 50%'  },
    { key: 'vv75',  label: 'VV 75%'  },
    { key: 'vv95',  label: 'VV 95%'  },
    { key: 'vv100', label: 'VV 100%' },
  ].forEach(({ key, label }) => {
    html += `<tr><td class="label-cell-sm">${label}</td>`;
    ads.forEach(ad => {
      html += `<td class="data-cell-sm">${formatNumber(ad[key])}</td>`;
    });
    html += '</tr>';
  });

  // Hook Rate
  html += '<tr><td class="label-cell">Hook Rate</td>';
  ads.forEach(ad => {
    const hr = ad.impressions > 0 ? ad.vv3s / ad.impressions : 0;
    html += `<td class="data-cell">${formatPercent(hr)}</td>`;
  });
  html += '</tr>';

  // Retenção (SVG chart)
  html += '<tr><td class="label-cell">Retenção</td>';
  ads.forEach(ad => {
    const chart = buildRetentionChart(ad.vv25, ad.vv50, ad.vv75, ad.vv95, ad.vv100);
    html += `<td class="chart-cell">${chart}</td>`;
  });
  html += '</tr>';

  html += '</tbody></table>';

  const wrapper = document.createElement('div');
  wrapper.id = 'viz-container';
  wrapper.innerHTML = html;
  document.body.appendChild(wrapper);
}

// ─── Subscribe ───────────────────────────────────────────────────────────────

dscc.subscribeToData(drawViz, { transform: dscc.objectTransform });
