// End-to-end check of the cookie preference center: opens from the footer
// without navigating, matches the measured reference geometry, and all five
// categories + toggles + Cookies Details + Save settings work.
import fs from 'node:fs';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = Number(process.env.CDP_PORT || 9333);
const all = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const t = all.find((x) => x.type === 'page' && x.webSocketDebuggerUrl);
const ws = new WebSocket(t.webSocketDebuggerUrl);
let seq = 0; const w = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (m.id && w.has(m.id)) { w.get(m.id)(m); w.delete(m.id); } };
const send = (m, p = {}) => new Promise((r) => { const id = ++seq; w.set(id, r); ws.send(JSON.stringify({ id, method: m, params: p })); });
await new Promise((r) => { ws.onopen = r; });
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

// Every snippet is a self-contained IIFE, so one wrapper handles both plain
// expressions and multi-statement bodies.
const ev = async (body) => {
  const r = await send('Runtime.evaluate', {
    expression: `(() => { try { return (${body}); } catch (e) { return 'ERR ' + e.message; } })()`,
    returnByValue: true, awaitPromise: true,
  });
  if (r.result?.exceptionDetails) return 'THREW ' + (r.result.exceptionDetails.text || '');
  return r.result?.result?.value ?? '(none)';
};
const shot = async (n) => {
  const s = await send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(n, Buffer.from(s.result.data, 'base64'));
};
const clickItem = (name) => ev(`(() => {
  const b = Array.from(document.querySelectorAll('.ppc-rail-item'))
    .find(x => x.textContent.indexOf(${JSON.stringify(name)}) !== -1);
  if (!b) return 'NOT FOUND';
  b.click();
  return 'clicked ' + b.textContent.trim().slice(0, 26);
})()`);
const openModal = () => ev(`(() => {
  const all = Array.from(document.querySelectorAll('a,button'))
    .filter(x => /cookie preferences/i.test(x.textContent));
  const foot = all.find(x => x.closest('footer'));
  const a = foot || all[0];
  if (!a) return 'LINK NOT FOUND';
  const where = a.closest('footer') ? 'FOOTER' : (a.closest('article') ? 'ARTICLE' : 'OTHER');
  a.click();
  return 'clicked ' + where + ' <' + a.tagName + '> href=' + a.getAttribute('href') +
    ' (of ' + all.length + ' matches)';
})()`);
const click = (sel) => ev(`(() => { const b = document.querySelector(${JSON.stringify(sel)}); if (!b) return 'MISSING ' + ${JSON.stringify(sel)}; b.click(); return 'ok'; })()`);
const swState = () => ev(`(() => { const s = document.querySelector('.ppc-switch');
  if (!s) return 'NO SWITCH';
  return 'checked=' + s.getAttribute('aria-checked') + ' bg=' + getComputedStyle(s).backgroundColor; })()`);

await send('Page.navigate', { url: 'http://localhost:5173/p/privacy' });
await sleep(7000);
await ev(`(() => { localStorage.removeItem('sf_cookie_consent'); return 'cleared'; })()`);
console.log('page:', await ev(`location.pathname + ' | ' + (document.querySelector('#root').innerHTML.length < 200 ? 'BLANK' : 'rendered')`));

console.log('\n--- footer link opens the dialog WITHOUT navigating ---');
console.log(await openModal());
await sleep(1200);
console.log('path after click :', await ev(`location.pathname`), '  <- must still be /p/privacy');
console.log('dialog open      :', await ev(`!!document.querySelector('.ppc-dialog')`));
console.log('scroll locked    :', await ev(`document.body.style.overflow`));
console.log('focus on close X :', await ev(`document.activeElement.className`));

console.log('\n--- GEOMETRY (mine vs reference) ---');
console.log(await ev(`(() => {
  const d = document.querySelector('.ppc-dialog').getBoundingClientRect();
  const out = ['dialog ' + Math.round(d.width) + 'x' + Math.round(d.height) + '   [ref 730x610]'];
  const g = (sel, label, ref) => {
    const e = document.querySelector(sel); if (!e) return out.push(label + ' MISSING');
    const b = e.getBoundingClientRect();
    out.push(label + ' ' + Math.round(b.width) + 'x' + Math.round(b.height) + '   [ref ' + ref + ']');
  };
  g('.ppc-header', 'header', '730x61'); g('.ppc-close', 'close ', '44x44');
  g('.ppc-body', 'body  ', '730x437'); g('.ppc-rail', 'rail  ', '224');
  g('.ppc-rail-item', 'item  ', 'h45'); g('.ppc-footer', 'footer', '730x112');
  g('.ppc-save', 'save  ', '155x41'); g('.ppc-ot', 'otbar', '730x30');
  const cb = document.querySelector('.ppc-copy').getBoundingClientRect();
  out.push('copy  ' + Math.round(cb.width - 7) + '          [ref 477]');
  const cs = (s) => { const x = getComputedStyle(document.querySelector(s)); return x.fontSize + '/' + x.fontWeight; };
  out.push('type  h2=' + cs('.ppc-title h2') + '  h4=' + cs('.ppc-desc h4') +
    '  p=' + cs('.ppc-desc p') + '  nav=' + cs('.ppc-rail-item'));
  return out.join('\\n');
})()`));

console.log('\n--- ALL FIVE CATEGORIES ---');
for (const n of ['General Description', 'Essential Cookies', 'First Party Performance and Functionality Cookies', 'Third Party Performance and Functionality Cookies', 'Advertising Cookies']) {
  await clickItem(n);
  await sleep(300);
  console.log(await ev(`(() => {
    const h = document.querySelector('.ppc-desc h4');
    const sw = document.querySelector('.ppc-switch');
    const dt = document.querySelector('.ppc-details');
    const sel = document.querySelector('.ppc-rail-item.on');
    const s = sel ? getComputedStyle(sel) : null;
    const got = h ? h.textContent : '-';
    return (got === ${JSON.stringify(n)} ? '[OK]   ' : '[FAIL] ') + got.slice(0, 40).padEnd(42) +
      'switch=' + (sw ? sw.getAttribute('aria-checked') : 'none').padEnd(5) +
      'details=' + (dt ? 'yes' : 'no').padEnd(4) +
      'redbar=' + (s ? s.borderLeftColor + '/' + s.borderLeftWidth : '-') +
      ' bg=' + (s ? s.backgroundColor : '-');
  })()`));
}
await clickItem('Third Party');
await sleep(400);
await shot('_v_thirdparty.png');

console.log('\n--- TOGGLE ROUND-TRIP (advertising) ---');
await clickItem('Advertising');
await sleep(300);
console.log('initial :', await swState());
await click('.ppc-switch');
await sleep(500);
console.log('click 1 :', await swState());
await click('.ppc-switch');
await sleep(500);
console.log('click 2 :', await swState());

console.log('\n--- COOKIES DETAILS SUB-VIEW ---');
console.log(await click('.ppc-details'));
await sleep(500);
console.log(await ev(`(() => {
  const t = document.querySelector('.ppc-list-title');
  const hosts = Array.from(document.querySelectorAll('.ppc-host-name')).map(x => x.textContent);
  return 'title=' + (t ? t.textContent : 'MISSING') + ' | hosts=' + hosts.join(', ');
})()`));
console.log('expand host:', await click('.ppc-host-box'));
await sleep(400);
console.log('expanded rows:', await ev(`document.querySelectorAll('.ppc-cookie').length`));
await shot('_v_details.png');
console.log('back:', await click('.ppc-back'));
await sleep(400);
console.log('rail back   :', await ev(`!!document.querySelector('.ppc-rail')`));

console.log('\n--- SAVE SETTINGS ---');
await clickItem('Advertising');
await sleep(300);
await click('.ppc-switch');
await sleep(400);
await click('.ppc-save');
await sleep(700);
console.log('dialog closed  :', await ev(`!document.querySelector('.ppc-dialog')`));
console.log('scroll unlocked:', await ev(`document.body.style.overflow === 'hidden' ? 'STILL LOCKED' : 'ok'`));
console.log('stored consent :', await ev(`localStorage.getItem('sf_cookie_consent')`));
console.log('focus returned :', await ev(`document.activeElement.tagName + '/' + (document.activeElement.textContent || '').trim().slice(0, 24)`));

console.log('\n--- REOPEN PERSISTS + CLOSE X + ESCAPE ---');
await openModal();
await sleep(900);
await clickItem('Advertising');
await sleep(300);
console.log('kept off after reopen:', await ev(`document.querySelector('.ppc-switch').getAttribute('aria-checked')`));
await click('.ppc-close');
await sleep(500);
console.log('close X works  :', await ev(`!document.querySelector('.ppc-dialog')`));
await openModal();
await sleep(800);
await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await sleep(500);
console.log('Escape works   :', await ev(`!document.querySelector('.ppc-dialog')`));
ws.close();

