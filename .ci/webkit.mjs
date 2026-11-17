// Kaarttegels in Safari's engine (WebKit) op een iPhone-profiel, tegen de echte kaartdiensten.
import { webkit, chromium, devices } from 'playwright';
import fs from 'fs';
const res = { runs: [] };
const VIS = "(()=>{const L_=Object.values(bases).find(l=>map.hasLayer(l));if(!L_)return 'geen basislaag';const t=Object.values(L_._tiles).filter(t=>t.current&&L_._tileZoom===t.coords.z);return 'z'+map.getZoom()+' '+(L_===bases.osm?'osm':'topo')+' '+t.filter(t=>t.loaded&&!t.el.classList.contains('leaflet-tile-loaded')===false&&t.el.complete&&t.el.naturalWidth>0).length+'/'+t.length+' zichtbaar, laden:'+t.filter(t=>!t.loaded).length+' '+JSON.stringify(TS)+' haveKeys '+haveKeys.size})()";
async function run(name, engine, opts) {
  const r = { name, steps: [], errors: [], failed: {}, ok: {} };
  const b = await engine.launch(); const ctx = await b.newContext({ ...devices['iPhone 14'], locale: 'nl-NL' }); const pg = await ctx.newPage();
  pg.on('pageerror', e => r.errors.push(String(e).slice(0, 200)));
  pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') r.errors.push('console: ' + m.text().slice(0, 200)); });
  pg.on('requestfailed', q => { const u = new URL(q.url()); const k = u.hostname + ' ' + (q.failure()?.errorText || ''); r.failed[k] = (r.failed[k] || 0) + 1; });
  pg.on('requestfinished', async q => { const u = new URL(q.url()); if (u.hostname === 'localhost') return; const s = await q.response(); const k = u.hostname + ' ' + (s ? s.status() : '?'); r.ok[k] = (r.ok[k] || 0) + 1; });
  const shot = async n => { await pg.screenshot({ path: `out/wk_${name}_${n}.jpg`, type: 'jpeg', quality: 60 }); };
  const at = async (label, js, wait) => { const t = Date.now(); try { if (js) await pg.evaluate(j => window.eval(j), js); await pg.waitForTimeout(wait); r.steps.push(label + ' (' + Math.round((Date.now() - t) / 1000) + ' s): ' + await pg.evaluate(j => window.eval(j), VIS)); } catch (e) { r.steps.push(label + ': FOUT ' + String(e).slice(0, 200)); } try { await shot(label); } catch (e) {} };
  try {
    await pg.goto('http://localhost:8080/'); await pg.waitForTimeout(3000);
    if (opts.sharp) await pg.evaluate(() => window.eval("store.sharp=true;makeBases();applyLayers()"));
    if (opts.osm) await pg.evaluate(() => window.eval("store.base='osm';applyLayers()"));
    await at('z8_belgie', "map.setView([50.55,4.2],8,{animate:false})", 8000);
    if (opts.reload) { await pg.reload(); await pg.waitForTimeout(3000); await at('na_herladen_z8', "map.setView([50.55,4.2],8,{animate:false})", 6000); }
    for (const z of [9, 10, 11, 12, 13]) await at('zoom_' + z, `map.setZoom(${z})`, 9000);
    await at('schuif', "map.panBy([250,300])", 9000);
    await at('elzas_z13', "map.setView([47.81,7.33],13,{animate:false})", 10000);
  } catch (e) { r.errors.push('run: ' + String(e).slice(0, 300)); }
  await b.close(); res.runs.push(r); fs.writeFileSync('out/webkit.json', JSON.stringify(res, null, 1));
}
fs.mkdirSync('out', { recursive: true });
await run('webkit', webkit, {});
await run('webkit_herladen', webkit, { reload: true });
await run('webkit_scherp', webkit, { sharp: true });
await run('webkit_osm', webkit, { osm: true });
await run('chromium', chromium, {});
