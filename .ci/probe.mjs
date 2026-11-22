// Eenmalige telling: wandelroutes in Turkije volgens Waymarked Trails en Overpass.
import fs from 'fs';
const out = {}; fs.mkdirSync('out', { recursive: true });
const j = async (u, o) => { const r = await fetch(u, o); if (!r.ok) throw new Error(r.status + ' ' + u); return r.json(); };
const X = l => l * 20037508.34 / 180, Y = a => 6378137 * Math.log(Math.tan(Math.PI / 4 + a * Math.PI / 360));
// 1. Raster over Turkije, per vak de lijst (max 100) van Waymarked Trails
const seen = new Map();
for (let lon = 26; lon < 45; lon += 1.5) for (let lat = 35.8; lat < 42.2; lat += 1.2) {
  try { const d = await j(`https://hiking.waymarkedtrails.org/api/v1/list/by_area?bbox=${X(lon)},${Y(lat)},${X(lon + 1.5)},${Y(lat + 1.2)}&limit=100`);
    (d.results || []).forEach(r => seen.set(r.id, { n: r.name, g: r.group, ref: r.ref })); if ((d.results || []).length >= 100) out['vol_' + lon + '_' + lat] = 100; } catch (e) { out['err_' + lon + '_' + lat] = String(e).slice(0, 80); }
}
out.wmt_total = seen.size; const g = {}; seen.forEach(v => g[v.g] = (g[v.g] || 0) + 1); out.wmt_groups = g;
out.wmt_named = [...seen.values()].filter(v => v.g !== 'LOC').map(v => v.g + ': ' + (v.n || v.ref)).sort();
// 2. Bekende Turkse routes op naam
for (const q of ['Likya', 'Lycian', 'Paul', 'Karia', 'Carian', 'Evliya', 'Frig', 'Phrygian', 'Kaçkar', 'Hitit', 'Sultans', 'Efeler', 'Mysia', 'Abraham', 'Yenice', 'Kapadokya', 'Cappadocia', 'Bergama', 'Kudüs', 'Via Eurasia', 'Gallipoli', 'Menteşe', 'Fethiye', 'Likya Yolu', 'Lycian Way', 'Ayder', 'Uludağ', 'Kaz Dağları', 'Istanbul']) {
  try { const d = await j('https://hiking.waymarkedtrails.org/api/v1/list/search?query=' + encodeURIComponent(q) + '&limit=20'); out['zoek_' + q] = (d.results || []).map(r => r.group + ':' + (r.name || r.ref)).join(' | '); } catch (e) { out['zoek_' + q] = String(e).slice(0, 80); }
}
// 3. Overpass: aantal routerelaties in Turkije
for (const ep of ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter']) {
  try { const d = await j(ep, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent('[out:json][timeout:120];area["ISO3166-1"="TR"][admin_level=2]->.a;(relation["route"~"^(hiking|foot|walking)$"](area.a););out tags;') });
    const els = d.elements || []; out.overpass_total = els.length; const n = {}; els.forEach(e => { const k = (e.tags.network || '-'); n[k] = (n[k] || 0) + 1 }); out.overpass_networks = n;
    out.overpass_named = els.filter(e => e.tags.network !== 'lwn').map(e => (e.tags.network || '-') + ': ' + (e.tags.name || e.tags['name:en'] || e.tags.ref || e.id) + (e.tags.operator ? ' [' + e.tags.operator + ']' : '')).sort(); break; } catch (e) { out['overpass_err_' + ep.slice(8, 20)] = String(e).slice(0, 100); }
}
fs.writeFileSync('out/probe.json', JSON.stringify(out, null, 1));
