/**
 * Afetto Ad Performance Table
 * Looker Studio Community Visualization - Standalone (no build required)
 */

(function() {

  function formatNumber(n) {
    n = parseFloat(n) || 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return Math.round(n).toLocaleString('pt-BR');
  }

  function formatCurrency(n) {
    n = parseFloat(n) || 0;
    return 'R$ ' + n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatPercent(n) {
    n = parseFloat(n) || 0;
    return (n * 100).toFixed(2).replace('.', ',') + '%';
  }

  function truncate(str, max) {
    if (!str) return '';
    return str.length > max ? str.substring(0, max) + '...' : str;
  }

  function buildRetentionChart(vv25, vv50, vv75, vv95, vv100) {
    var W = 110, H = 75, PAD_TOP = 8, CHART_H = 52;
    var xs = [8, 32, 56, 80, 102];
    var vals = [parseFloat(vv25)||0, parseFloat(vv50)||0, parseFloat(vv75)||0, parseFloat(vv95)||0, parseFloat(vv100)||0];
    var labels = ['25%','50%','75%','95%','100%'];
    var maxVal = Math.max.apply(null, vals.filter(function(v){return v>0;}));
    var base = maxVal === 0 ? 1 : maxVal;
    var ys = vals.map(function(v){ return PAD_TOP + CHART_H - Math.round((v/base)*CHART_H); });
    var points = xs.map(function(x,i){return x+','+ys[i];}).join(' ');
    var gridMid = PAD_TOP + CHART_H/2;
    var gridBot = PAD_TOP + CHART_H;
    var labelY = PAD_TOP + CHART_H + 10;

    var svg = '<svg width="'+W+'" height="'+H+'" style="overflow:visible;">';
    svg += '<line x1="0" y1="'+PAD_TOP+'" x2="'+W+'" y2="'+PAD_TOP+'" stroke="#eee" stroke-width="1"/>';
    svg += '<line x1="0" y1="'+gridMid+'" x2="'+W+'" y2="'+gridMid+'" stroke="#eee" stroke-width="1"/>';
    svg += '<line x1="0" y1="'+gridBot+'" x2="'+W+'" y2="'+gridBot+'" stroke="#ccc" stroke-width="1"/>';
    svg += '<polyline points="'+points+'" fill="none" stroke="#E8572A" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>';
    xs.forEach(function(x,i){
      var y=ys[i], v=vals[i];
      var lbl = v>=1000 ? (v/1000).toFixed(1)+'k' : Math.round(v).toString();
      svg += '<circle cx="'+x+'" cy="'+y+'" r="2.5" fill="#E8572A"/>';
      svg += '<text x="'+x+'" y="'+(y-4)+'" font-size="7" text-anchor="middle" fill="#555">'+lbl+'</text>';
      svg += '<text x="'+x+'" y="'+labelY+'" font-size="6" text-anchor="middle" fill="#999">'+labels[i]+'</text>';
    });
    svg += '</svg>';
    return svg;
  }

  function drawViz(data) {
    document.body.innerHTML = '';
    var rows = data.tables.DEFAULT.rows;
    var adMap = {}, adOrder = [];

    rows.forEach(function(row) {
      var adName   = (row.adName        && row.adName[0])        || '';
      var thumbUrl = (row.thumbnailUrl  && row.thumbnailUrl[0])  || '';
      var impr  = parseFloat(row.impressions  && row.impressions[0])  || 0;
      var spend = parseFloat(row.spend        && row.spend[0])        || 0;
      var vv3s  = parseFloat(row.vv3s         && row.vv3s[0])         || 0;
      var vv25  = parseFloat(row.vv25         && row.vv25[0])         || 0;
      var vv50  = parseFloat(row.vv50         && row.vv50[0])         || 0;
      var vv75  = parseFloat(row.vv75         && row.vv75[0])         || 0;
      var vv95  = parseFloat(row.vv95         && row.vv95[0])         || 0;
      var vv100 = parseFloat(row.vv100        && row.vv100[0])        || 0;

      if (adMap[adName]) {
        adMap[adName].impressions+=impr; adMap[adName].spend+=spend;
        adMap[adName].vv3s+=vv3s; adMap[adName].vv25+=vv25; adMap[adName].vv50+=vv50;
        adMap[adName].vv75+=vv75; adMap[adName].vv95+=vv95; adMap[adName].vv100+=vv100;
      } else {
        adMap[adName] = {adName:adName,thumbUrl:thumbUrl,impressions:impr,spend:spend,vv3s:vv3s,vv25:vv25,vv50:vv50,vv75:vv75,vv95:vv95,vv100:vv100};
        adOrder.push(adName);
      }
    });

    var ads = adOrder.map(function(k){return adMap[k];});
    ads.sort(function(a,b){return b.spend-a.spend;});

    if (ads.length === 0) {
      document.body.innerHTML = '<p style="padding:16px;color:#999;">Sem dados.</p>';
      return;
    }

    var LS  = 'background:#E8572A;color:white;font-weight:bold;padding:8px 12px;border:1px solid #c94a22;font-size:12px;white-space:nowrap;min-width:110px;position:sticky;left:0;z-index:2;';
    var LSS = 'background:#E8572A;color:white;font-weight:bold;padding:4px 12px;border:1px solid #c94a22;font-size:11px;white-space:nowrap;min-width:110px;position:sticky;left:0;z-index:2;';
    var HS  = 'background:#E8572A;color:white;font-weight:bold;padding:6px 8px;border:1px solid #c94a22;text-align:left;max-width:150px;min-width:120px;overflow:hidden;font-size:10px;white-space:nowrap;text-overflow:ellipsis;';
    var DS  = 'padding:6px 10px;border:1px solid #ddd;text-align:center;white-space:nowrap;max-width:150px;min-width:120px;font-size:11px;';
    var DSS = 'padding:2px 8px;border:1px solid #ddd;text-align:center;white-space:nowrap;max-width:150px;min-width:120px;font-size:10px;color:#444;';

    var html = '<div style="overflow-x:auto;font-family:Arial,sans-serif;"><table style="border-collapse:collapse;width:100%;">';

    // Header
    html += '<thead><tr><th style="'+LS+'">Anúncio</th>';
    ads.forEach(function(ad){ html += '<th style="'+HS+'" title="'+ad.adName+'">'+truncate(ad.adName,20)+'</th>'; });
    html += '</tr></thead><tbody>';

    // Imagem grande
    html += '<tr><td style="'+LS+'">Thumb URL</td>';
    ads.forEach(function(ad){
      html += '<td style="border:1px solid #ddd;text-align:center;padding:4px;max-width:150px;min-width:120px;">';
      html += '<img src="'+ad.thumbUrl+'" style="height:160px;width:120px;object-fit:cover;" onerror="this.style.display=\'none\'"/></td>';
    });
    html += '</tr>';

    // Link
    html += '<tr><td style="'+LS+'">Thumbnail URL</td>';
    ads.forEach(function(ad){
      html += '<td style="'+DS+'"><a href="'+ad.thumbUrl+'" target="_blank" style="color:#E8572A;font-size:11px;">Ver imagem</a></td>';
    });
    html += '</tr>';

    // Impressões
    html += '<tr><td style="'+LS+'">Impressões</td>';
    ads.forEach(function(ad){ html += '<td style="'+DS+'">'+formatNumber(ad.impressions)+'</td>'; });
    html += '</tr>';

    // Investimento
    html += '<tr><td style="'+LS+'">Investimento</td>';
    ads.forEach(function(ad){ html += '<td style="'+DS+'">'+formatCurrency(ad.spend)+'</td>'; });
    html += '</tr>';

    // VV 3s
    html += '<tr><td style="'+LS+'">VV 3s</td>';
    ads.forEach(function(ad){ html += '<td style="'+DS+'">'+formatNumber(ad.vv3s)+'</td>'; });
    html += '</tr>';

    // VV 25-100%
    [{key:'vv25',label:'VV 25%'},{key:'vv50',label:'VV 50%'},{key:'vv75',label:'VV 75%'},{key:'vv95',label:'VV 95%'},{key:'vv100',label:'VV 100%'}].forEach(function(item){
      html += '<tr><td style="'+LSS+'">'+item.label+'</td>';
      ads.forEach(function(ad){ html += '<td style="'+DSS+'">'+formatNumber(ad[item.key])+'</td>'; });
      html += '</tr>';
    });

    // Hook Rate
    html += '<tr><td style="'+LS+'">Hook Rate</td>';
    ads.forEach(function(ad){
      var hr = ad.impressions > 0 ? ad.vv3s/ad.impressions : 0;
      html += '<td style="'+DS+'">'+formatPercent(hr)+'</td>';
    });
    html += '</tr>';

    // Retenção
    html += '<tr><td style="'+LS+'">Retenção</td>';
    ads.forEach(function(ad){
      var chart = buildRetentionChart(ad.vv25,ad.vv50,ad.vv75,ad.vv95,ad.vv100);
      html += '<td style="border:1px solid #ddd;text-align:center;padding:6px 4px;max-width:150px;min-width:120px;vertical-align:middle;">'+chart+'</td>';
    });
    html += '</tr>';

    html += '</tbody></table></div>';
    document.body.innerHTML = html;
  }

  dscc.subscribeToData(drawViz, {transform: dscc.objectTransform});

})();
