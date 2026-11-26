// Eenmalig: ruwe routegegevens van de Mullerthal Trail ophalen, om Route 3 en het aanvullen met Extra Tour A te onderzoeken.
import fs from 'fs';
fs.mkdirSync('out', { recursive: true });
const ids = [6335336, 21195289, 2343781, 6354078, 2964143, 21169485];
const log = {};
for (const id of ids) {
  for (const [k, u] of [['wmt', `https://hiking.waymarkedtrails.org/api/v1/details/relation/${id}`], ['ele', `https://hiking.waymarkedtrails.org/api/v1/details/relation/${id}/way-elevation?simplify=120`]]) {
    try { const r = await fetch(u); const t = await r.text(); fs.writeFileSync(`out/${k}_${id}.json`, t); log[k + id] = r.status + ' ' + t.length; } catch (e) { log[k + id] = String(e).slice(0, 100); }
  }
  for (const ep of ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter']) {
    try { const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'data=' + encodeURIComponent(`[out:json][timeout:90];rel(${id})->.a;rel(r.a)->.b;rel(r.b)->.c;(.a;.b;.c;);out geom;`) });
      const t = await r.text(); if (!r.ok) throw new Error(r.status); fs.writeFileSync(`out/ovp_${id}.json`, t); log['ovp' + id] = r.status + ' ' + t.length; break; } catch (e) { log['ovp' + id + ep.slice(8, 16)] = String(e).slice(0, 100); }
  }
}
fs.writeFileSync('out/probe.json', JSON.stringify(log, null, 1));
