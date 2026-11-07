import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { randomUUID } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { composePrompt, createAlToqueServer, detectMenuIntent, getAssistantPersona, getLocalMenuAnswer, makeRiderSupportInstructions, selectMenuItem, shouldUseWebSearch, styleLocalAnswer } from './server.mjs';

async function createReelsTestServer(t, testDataDir, reelsDeletePassword = 'test-reels-delete-password', persistenceStore, fetchImpl = fetch) {
  const server = createAlToqueServer({
    ordersFile: join(testDataDir, 'orders.json'),
    reelsFile: join(testDataDir, 'reels.json'),
    reelsVideosDir: join(testDataDir, 'reels-videos'),
    reelsDeletePassword,
    persistenceStore,
    fetchImpl
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(async () => {
    if (server.listening) {
      await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
    await rm(testDataDir, { recursive: true, force: true });
  });
  return server;
}

async function createReelsTestDirectory() {
  return mkdtemp(join(process.cwd(), `.reels-test-${randomUUID()}-`));
}

test('serves the Reel watermark image as a public PNG asset', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir);
  const response = await fetch(`http://127.0.0.1:${server.address().port}/al-toque-reel-watermark.png`);
  const image = Buffer.from(await response.arrayBuffer());

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
});

test('serves the campus location logo used by the home carousel', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir);
  const response = await fetch(`http://127.0.0.1:${server.address().port}/miraflores-logo-transparent.png`);
  const image = Buffer.from(await response.arrayBuffer());

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
});

test('serves new public product and game images as PNG assets', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir);
  for (const asset of ['jugo-maracuya-helada.png', 'agua-san-luis-helada.png', 'agua-san-luis-natural.png', 'chicha-morada-helada.png', 'combo-marino-imagen.png', 'combo-marino-nueva-imagen.png', 'combo-costeno-imagen.png', 'combo-fitness-imagen.png', 'partykub-logo.png']) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/${asset}`);
    const image = Buffer.from(await response.arrayBuffer());

    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
    assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  }
});

test('serves the tablet stylesheet and includes it in the application page', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const [pageResponse, stylesheetResponse] = await Promise.all([
    fetch(baseUrl),
    fetch(`${baseUrl}/al-toque-tablet.css`)
  ]);
  const [page, stylesheet] = await Promise.all([
    pageResponse.text(),
    stylesheetResponse.text()
  ]);

  assert.equal(pageResponse.status, 200);
  assert.match(page, /<link href="\/al-toque-tablet\.css\?v=\d+" rel="stylesheet"\s*\/?>/);
  assert.equal(stylesheetResponse.status, 200);
  assert.equal(stylesheetResponse.headers.get('content-type'), 'text/css; charset=utf-8');
  assert.match(stylesheet, /@media \(min-width: 768px\)/);
  assert.match(stylesheet, /#root\s*\{\s*width:\s*100vw\s*!important;\s*max-width:\s*none\s*!important;\s*height:\s*100dvh\s*!important;/);
  assert.match(stylesheet, /padding:\s*0\s*!important;/);
  assert.match(stylesheet, /#root \.tablet-status-bar\s*\{[^}]*height:\s*calc\(68px\s*\+\s*env\(safe-area-inset-top,\s*0px\)\);/s);
  assert.match(stylesheet, /#root \.tablet-fullscreen-control--overlay\s*\{[^}]*top:\s*max\(16px,\s*env\(safe-area-inset-top,\s*0px\)\);/s);
  assert.match(page, /viewport-fit=cover/);
  assert.match(page, /aria-label=\{isFullscreen \? 'Salir de pantalla completa' : 'Ver en pantalla completa'\}/);
  assert.match(page, /requestFullscreen\(\{ navigationUI: 'hide' \}\)/);
  assert.match(page, /className="tablet-status-bar bg-white/);
  assert.doesNotMatch(stylesheet, /max-width:\s*1366px/);
  assert.match(page, /aria-label="Información del campus" aria-roledescription="carrusel"/);
  assert.match(page, /timeZone: 'America\/Lima'/);
  assert.match(stylesheet, /#root \.home-feature-carousel/);
  assert.match(page, /className="menu-bembos-grid"/);
  assert.equal((page.match(/className="menu-product-grid grid grid-cols-2 gap-/g) || []).length, 5);
  assert.match(page, /className="menu-regular-grid"/);
  assert.match(page, /handleMenuProductSelection = \(event, onSelect\)/);
  assert.match(page, /handleMenuProductKeyDown = \(event, onSelect\)/);
  assert.match(page, /onClick=\{\(event\) => handleMenuProductSelection\(event, \(\) => onAddBembos\(promo\)\)\}/);
  assert.equal((page.match(/onClick=\{\(event\) => handleMenuProductSelection\(event, \(\) => onAddStarbucks\(product\)\)\}/g) || []).length, 4);
  assert.match(page, /onClick=\{\(event\) => handleMenuProductSelection\(event, \(\) => onOpenCustomize\(pricedDish\)\)\}/);
  assert.doesNotMatch(page, /onClick=\{\(\) => onAddStarbucks\(product\)\}/);
  assert.doesNotMatch(page, /onClick=\{\(\) => onAddBembos\(promo\)\}/);
  assert.doesNotMatch(page, /className="menu-add-button w-8 h-8/);
  assert.match(stylesheet, /#root \.menu-bembos-grid,\s*#root \.menu-product-grid,\s*#root \.menu-regular-grid\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\);/);
  assert.match(stylesheet, /#root \.menu-bembos-grid > \.menu-pop-card,\s*#root \.menu-product-grid > \.menu-pop-card,\s*#root \.menu-regular-grid > \.menu-pop-card\s*\{[^}]*animation:\s*tabletMenuCardGoldShimmer 3\.2s ease-in-out infinite;/s);
  assert.match(stylesheet, /@keyframes tabletMenuCardGoldShimmer/);
  assert.match(stylesheet, /50%\s*\{\s*border-color:\s*#d7b85b;\s*box-shadow:\s*0 6px 16px rgb\(55 38 20 \/ 7%\), 0 0 10px 1px rgb\(215 184 91 \/ 22%\);/);
  assert.match(stylesheet, /#root \.menu-product-grid > \.menu-pop-card,\s*#root \.menu-regular-grid > \.menu-pop-card\s*\{\s*border-color:\s*#e7d9b8;\s*box-shadow:\s*0 6px 16px rgb\(55 38 20 \/ 7%\);\s*animation:\s*none;/);
  assert.match(stylesheet, /#root \.menu-pop-card\[role="button"\]\[data-selected="true"\]\s*\{[^}]*animation:\s*tabletHomeCardGoldGlow 700ms ease-out both;/s);
  assert.match(stylesheet, /#root \.menu-regular-grid \.menu-pop-media > span\s*\{[^}]*position:\s*absolute;[^}]*z-index:\s*4;[^}]*top:\s*8px;[^}]*left:\s*8px;[^}]*border:\s*1px solid #d7b85b;[^}]*font-size:\s*12px\s*!important;[^}]*transform:\s*translateZ\(32px\);[^}]*animation:\s*tabletMenuBadgeGoldGlow 2\.6s ease-in-out infinite;/s);
  assert.match(stylesheet, /@keyframes tabletMenuBadgeGoldGlow/);
  assert.match(stylesheet, /50%\s*\{\s*border-color:\s*#e8cc77;\s*box-shadow:\s*0 0 0 2px rgb\(215 184 91 \/ 34%\), 0 0 10px rgb\(215 184 91 \/ 24%\);/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*#root \.menu-regular-grid \.menu-pop-media > span\s*\{\s*animation:\s*none;/);
  assert.match(stylesheet, /#root \.menu-bembos-media\s*\{[^}]*height:\s*clamp\(120px,\s*14vw,\s*164px\);/s);
  assert.match(stylesheet, /#root \.bembos-promo-hover-label\s*\{\s*position:\s*absolute;\s*z-index:\s*4;\s*bottom:\s*8px;\s*left:\s*8px;/);
  assert.match(stylesheet, /#root \.bembos-promo-hover-label\s*\{[^}]*font-size:\s*11px\s*!important;[^}]*line-height:\s*1\.2;/s);
  assert.match(stylesheet, /#root \.bembos-promo-hover-label\s*\{[^}]*transform:\s*translateZ\(32px\);/s);
  assert.match(page, /className="menu-pop-image menu-bembos-image bembos-promo-image h-full w-full rounded-2xl object-contain"/);
  assert.match(page, /className="flex space-x-3 overflow-x-auto no-scrollbar pb-2 -mx-4 px-4"/);
  assert.match(page, /className=\{`w-full h-full object-cover \$\{dish\.id === '9' \? 'menu-marino-image' : ''\}`\}/);
  assert.match(stylesheet, /--tablet-brand:\s*#a50f2d/);
  assert.match(stylesheet, /--tablet-yellow-accent:\s*#ffc61a/);
  assert.match(page, /href="\/al-toque-tablet\.css\?v=102"/);
  assert.match(page, /aria-label="PartyKub, juego próximamente"/);
  assert.match(page, /setPartyKubNotice\('PartyKub estará disponible próximamente\.'\)/);
  assert.match(page, /src="\/partykub-logo\.png" alt="" aria-hidden="true"/);
  assert.match(page, /aria-label="Abrir Reels"/);
  assert.doesNotMatch(stylesheet, /partykub-ring-spin|partykub-launcher::before/);
  assert.match(stylesheet, /#root \.partykub-launcher img\s*\{[^}]*animation:\s*partykub-logo-float 2\.8s ease-in-out infinite;/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*#root \.partykub-launcher img\s*\{\s*animation:\s*none;/s);
  assert.ok(page.indexOf('aria-label="PartyKub, juego próximamente"') < page.indexOf('aria-label="Abrir Reels"'));
  assert.match(stylesheet, /#root \.profile-questionnaire input\[type="checkbox"\]\s*\{[^}]*width:\s*30px\s*!important;[^}]*position:\s*relative;[^}]*overflow:\s*visible;[^}]*appearance:\s*none\s*!important;[^}]*border:\s*2px solid #16a34a;[^}]*background-color:\s*#fff;/s);
  assert.match(stylesheet, /#root \.profile-questionnaire input\[type="checkbox"\]:checked\s*\{[^}]*background-color:\s*#16a34a;[^}]*animation:\s*tabletProfileCheckboxPulse 520ms ease-out;/s);
  assert.match(stylesheet, /#root \.profile-questionnaire input\[type="checkbox"\]::before\s*\{[^}]*content:\s*"✓";[^}]*font-size:\s*36px;[^}]*text-shadow:\s*1px 0 #d1d5db,\s*-1px 0 #d1d5db,\s*0 1px #d1d5db,\s*0 -1px #d1d5db,/s);
  assert.match(stylesheet, /#root \.profile-questionnaire input\[type="checkbox"\]:checked::before\s*\{[^}]*animation:\s*tabletProfileCheckboxCheckPulse 520ms cubic-bezier\(0\.2,\s*0\.8,\s*0\.2,\s*1\);/s);
  assert.match(stylesheet, /@keyframes tabletProfileCheckboxCheckPulse[\s\S]*?48%\s*\{\s*opacity:\s*1;\s*transform:\s*scale\(1\.3\);/);
  assert.match(stylesheet, /@keyframes tabletProfileCheckboxPulse\s*\{\s*0%\s*\{\s*box-shadow:\s*0 0 0 0 rgb\(22 163 74 \/ 42%\);/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)\s*\{[\s\S]*?#root \.profile-questionnaire input\[type="checkbox"\],[\s\S]*?animation:\s*none !important;/);
  assert.match(page, /image: '\.\/combo-marino-nueva-imagen\.png'/);
  assert.match(page, /dish\.id === '9' \? 'menu-marino-image'/);
  assert.match(page, /className=\{`combo-card-image w-full h-full object-cover \$\{dish\.id === '5' \? 'menu-fitness-image' : dish\.id === '8' \? 'menu-costeno-image' : dish\.id === '9' \? 'menu-marino-image' : ''\}`\}/);
  assert.match(stylesheet, /#root \.menu-regular-grid \.menu-marino-image,\s*#root \.home-pop-card \.menu-marino-image\s*\{\s*object-fit:\s*cover\s*!important;/);
  assert.match(page, /image: '\.\/combo-costeno-imagen\.png'/);
  assert.match(page, /dish\.id === '8' \? 'menu-costeno-image'/);
  assert.match(stylesheet, /#root \.menu-regular-grid \.menu-costeno-image,\s*#root \.home-pop-card \.menu-costeno-image\s*\{\s*object-fit:\s*cover\s*!important;/);
  assert.match(page, /image: '\.\/combo-fitness-imagen\.png'/);
  assert.match(page, /dish\.id === '5' \? 'menu-fitness-image'/);
  assert.match(stylesheet, /#root \.menu-regular-grid \.menu-fitness-image,\s*#root \.home-pop-card \.menu-fitness-image\s*\{\s*object-fit:\s*cover\s*!important;/);
  assert.match(stylesheet, /#root nav\[aria-label="Navegación principal"\] button\s*\{[^}]*transition:\s*transform 140ms ease,\s*box-shadow 140ms ease,\s*background-color 140ms ease;/s);
  assert.match(stylesheet, /#root nav\[aria-label="Navegación principal"\] button:active\s*\{\s*transform:\s*scale\(0\.96\);\s*box-shadow:\s*0 2px 6px rgb\(43 23 24 \/ 16%\);/);
  assert.match(stylesheet, /#root nav\[aria-label="Navegación principal"\] button\.bottom-nav-ai-option:active\s*\{\s*transform:\s*translateY\(-13px\) scale\(0\.96\);\s*box-shadow:\s*0 2px 7px rgb\(133 93 194 \/ 20%\);/);
  assert.match(stylesheet, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*#root nav\[aria-label="Navegación principal"\] button\s*\{\s*transition:\s*none;/);
  assert.equal((page.match(/className="cart-quantity-control-button w-5 h-5 bg-white rounded flex items-center justify-center font-bold text-xs"/g) || []).length, 2);
  assert.match(stylesheet, /#root \.cart-quantity-control-button\s*\{\s*box-sizing:\s*border-box;\s*width:\s*50px\s*!important;\s*height:\s*50px\s*!important;\s*flex:\s*0 0 50px;\s*border:\s*1px solid #f1e4c4;\s*border-radius:\s*12px\s*!important;\s*background-color:\s*#fff6df\s*!important;\s*color:\s*var\(--tablet-dark\)\s*!important;\s*font-size:\s*24px\s*!important;\s*line-height:\s*1;/);
  assert.match(stylesheet, /#root \.cart-quantity-control-button:hover\s*\{\s*background-color:\s*#fff1cf\s*!important;/);
  assert.match(page, /image: '\.\/jugo-maracuya-helada\.png'/);
  assert.match(page, /dish\.id === '7' \? 'menu-maracuya-image'/);
  assert.match(stylesheet, /#root \.menu-regular-grid \.menu-maracuya-image\s*\{\s*object-fit:\s*cover\s*!important;/);
  assert.match(page, /image: '\.\/agua-san-luis-natural\.png'/);
  assert.match(page, /dish\.id === '10' \? 'menu-agua-image'/);
  assert.match(stylesheet, /#root \.menu-regular-grid \.menu-agua-image\s*\{\s*object-fit:\s*cover\s*!important;/);
  assert.match(page, /image: '\.\/chicha-morada-helada\.png'/);
  assert.match(page, /dish\.id === '6' \? 'menu-chicha-image'/);
  assert.match(stylesheet, /#root \.menu-regular-grid \.menu-chicha-image\s*\{\s*object-fit:\s*cover\s*!important;/);
  assert.match(page, /name: 'Administración y Gestión',\s*careers: \['Administración', 'Administración en Salud', 'Administración en Salud PGE', 'Gestión de Desarrollo Global'\]/);
  assert.match(page, /name: 'Ciencias',\s*careers: \['Biología', 'Química', 'Farmacia y Bioquímica', 'Nutrición'\]/);
  assert.match(page, /name: 'Educación',\s*careers: \['Educación', 'Educación Inicial', 'Educación Primaria', 'Educación PGE'\]/);
  assert.match(page, /name: 'Ingeniería',\s*careers: \['Ingeniería Ambiental', 'Ingeniería Biomédica', 'Ingeniería Industrial', 'Ingeniería Informática'\]/);
  assert.match(page, /name: 'Salud y Medicina',\s*careers: \['Medicina', 'Estomatología', 'Enfermería', 'Enfermería PGE', 'Medicina Veterinaria y Zootecnia', 'Laboratorio Clínico y Anatomía Patológica', 'Psicología', 'Psicología PGE'\]/);
  assert.match(page, /setProfileCareerGroup\(event\.target\.value\);\s*updateProfile\('career', ''\);/);
  assert.match(page, /id="profile-career-other"/);
  assert.match(page, /className="tablet-order-toast absolute top-10 left-1\/2 -translate-x-1\/2 bg-dark text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg z-50 animate-bounce cursor-pointer hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"/);
  assert.match(stylesheet, /#root \.tablet-order-toast\s*\{\s*box-sizing:\s*border-box;\s*top:\s*120px\s*!important;\s*width:\s*max-content;\s*min-width:\s*min\(560px,\s*calc\(100vw - 48px\)\);\s*max-width:\s*calc\(100vw - 48px\);\s*padding:\s*16px 28px\s*!important;\s*font-size:\s*clamp\(20px,\s*2\.2vw,\s*28px\)\s*!important;\s*line-height:\s*1\.25;/);
  assert.match(page, /className="profile-experience-card bg-cream\/60 border border-cream p-4 rounded-3xl flex justify-around items-center text-center"/);
  assert.match(page, /className="profile-preference-icon w-9 h-9 bg-cream rounded-xl flex items-center justify-center text-dark"/);
  assert.match(stylesheet, /#root \.profile-affiliate-button\s*\{\s*background-color:\s*#db9eac\s*!important;\s*color:\s*#fff\s*!important;\s*opacity:\s*1\s*!important;/);
  assert.match(stylesheet, /#root \.profile-experience-card\s*\{\s*background-color:\s*#fff6df\s*!important;\s*border-color:\s*#fff0c8\s*!important;/);
  assert.match(stylesheet, /#root \.profile-preference-icon\s*\{\s*background-color:\s*#fff1cf\s*!important;/);
  assert.match(page, /className="complaints-book-overlay fixed inset-0 z-\[80\] flex items-end justify-center bg-black\/55 p-0 sm:items-center sm:p-4"/);
  assert.match(page, /className="complaints-book-dialog max-h-\[92dvh\] w-full max-w-\[520px\] overflow-y-auto rounded-t-\[28px\] bg-\[#fffdf8\] p-5 shadow-2xl sm:rounded-\[28px\]"/);
  assert.match(page, /className="complaints-book-form space-y-3"/);
  assert.match(stylesheet, /#root \.complaints-book-overlay\s*\{\s*box-sizing:\s*border-box;\s*align-items:\s*flex-end;\s*padding:\s*24px 24px 0;/);
  assert.match(stylesheet, /#root \.complaints-book-dialog\s*\{\s*box-sizing:\s*border-box;\s*width:\s*min\(1440px,\s*calc\(100vw - 48px\)\)\s*!important;\s*max-width:\s*1440px\s*!important;\s*max-height:\s*calc\(100dvh - 24px\)\s*!important;[^}]*border-radius:\s*28px 28px 0 0\s*!important;/s);
  assert.match(stylesheet, /#root \.complaints-book-form\s*\{\s*display:\s*grid;\s*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\);\s*align-items:\s*start;\s*gap:\s*12px;/);
  assert.match(stylesheet, /#root \.complaints-book-form > \.complaint-kind-field,[\s\S]*grid-column:\s*1 \/ -1;/);
  assert.match(page, /className="help-support-overlay fixed inset-0 z-50 bg-black\/40 flex items-end justify-center"/);
  assert.match(page, /className="help-support-dialog w-full max-w-\[390px\] bg-white rounded-t-3xl p-5 space-y-4 shadow-2xl"/);
  assert.match(stylesheet, /#root \.help-support-overlay\s*\{\s*box-sizing:\s*border-box;\s*align-items:\s*flex-end;\s*padding:\s*24px 24px 0;/);
  assert.match(stylesheet, /#root \.help-support-dialog\s*\{\s*box-sizing:\s*border-box;\s*width:\s*min\(1280px,\s*calc\(100vw - 48px\)\)\s*!important;\s*max-width:\s*1280px\s*!important;\s*border-radius:\s*28px 28px 0 0\s*!important;/);
  assert.match(page, /className="brand-preview-random-image" src="\.\/splash-random-reference\.png"/);
  assert.match(page, /\.brand-preview-random-image\s*\{\s*display:\s*block;\s*width:\s*100%;\s*height:\s*auto;/);
  assert.match(stylesheet, /#root#root,\s*#root#root \*:not\(svg text\)\s*\{\s*font-size:\s*17px\s*!important;/);
  assert.match(stylesheet, /#root \.text-brand\s*\{\s*color:\s*var\(--tablet-brand\)\s*!important;/);
  assert.match(stylesheet, /#root \.border-brand\s*\{\s*border-color:\s*var\(--tablet-brand\)\s*!important;/);
  assert.match(stylesheet, /#root \.bg-yellow-accent\s*\{\s*background-color:\s*var\(--tablet-yellow-accent\)\s*!important;/);
  assert.match(page, /className="profile-identity-card bg-dark text-white/);
  assert.match(stylesheet, /#root \.profile-identity-card\s*\{\s*background:\s*linear-gradient\(110deg,\s*#b80c0c 0%,\s*#771522 100%\)\s*!important;/);
  assert.match(stylesheet, /#root \.profile-identity-card \.profile-edit-button\s*\{[^}]*background:\s*#fff0c8;[^}]*color:\s*#74131d\s*!important;/s);
  assert.match(stylesheet, /#root \.profile-rider-access-card\s*\{\s*background:\s*#b90000\s*!important;/);
  assert.match(page, /className="profile-questionnaire bg-white/);
  assert.match(stylesheet, /#root \.profile-questionnaire input::placeholder\s*\{\s*color:\s*#9aa2b2\s*!important;/);
  assert.match(stylesheet, /#root \.profile-affiliate-button:disabled\s*\{[^}]*background-color:\s*#db9eac\s*!important;[^}]*opacity:\s*1\s*!important;/s);
  assert.match(stylesheet, /#root \.bg-brand:disabled\s*\{[^}]*background-color:\s*#6b6261\s*!important;[^}]*\}\s*#root \.profile-affiliate-button:disabled\s*\{[^}]*background-color:\s*#db9eac\s*!important;/s);
  assert.match(stylesheet, /#root \.brand-theme-dialog\s*\{[^}]*width:\s*min\(1280px,\s*calc\(100vw - 64px\)\)\s*!important;[^}]*max-width:\s*1280px\s*!important;[^}]*max-height:\s*min\(90dvh,\s*880px\);[^}]*padding:\s*24px\s*!important;/s);
  assert.match(stylesheet, /#root \.brand-theme-dialog > \.grid\.grid-cols-2\s*\{\s*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\);\s*align-items:\s*stretch;\s*gap:\s*12px;/);
  assert.match(stylesheet, /#root \.brand-theme-dialog > \.grid\.grid-cols-2 > button\s*\{\s*display:\s*flex;\s*min-width:\s*0;\s*flex-direction:\s*column;\s*transform:\s*none\s*!important;/);
  assert.match(stylesheet, /#root \.brand-theme-dialog > \.grid\.grid-cols-2 > button > \.brand-preview\s*\{\s*width:\s*100%;\s*height:\s*auto;\s*aspect-ratio:\s*1024 \/ 572;/);
  assert.match(stylesheet, /#root \.brand-theme-dialog \.brand-preview-strip \.brand-preview\s*\{\s*height:\s*100px;/);
  assert.match(stylesheet, /#root \.home-pop-card-media\[data-touch-active="true"\] > img/);
  assert.match(stylesheet, /#root \.home-pop-card-media:hover > img/);
  assert.doesNotMatch(stylesheet, /\.home-pop-card:hover \.home-pop-card-media > img/);
  assert.doesNotMatch(stylesheet, /\.home-pop-card:focus-within \.home-pop-card-media > img/);
  assert.doesNotMatch(stylesheet, /\.home-pop-card\[data-selected="true"\].*\.home-pop-card-media > img/);
  assert.match(stylesheet, /#root \.home-pop-card:hover\s*\{[^}]*transform:\s*translateY\(-4px\)/s);
  assert.match(stylesheet, /#root \.home-pop-card\[data-touch-active="true"\]\s*\{[^}]*transform:\s*translateY\(-2px\)/s);
  assert.match(stylesheet, /transform:\s*perspective\(1000px\)\s*translateZ\(24px\)\s*scale\(1\.05\)\s*!important;/);
  assert.match(stylesheet, /#root \.home-pop-card\[data-selected="true"\]/);
  assert.match(stylesheet, /@keyframes tabletHomeCardGoldGlow/);
  assert.match(stylesheet, /#root \.home-pop-card-media\s*\{[^}]*overflow:\s*visible\s*!important;/s);
  assert.match(page, /onPointerDown=\{handleHomeProductPointerState\}/);
  assert.match(page, /onPointerMove=\{handleHomeProductPointerState\}/);
  assert.match(page, /role="button" tabIndex=\{0\} aria-label=\{`Personalizar \$\{dish\.name\}`\} onClick=\{\(event\) => handleHomeProductSelection\(event, dish\)\}/);
  assert.match(page, /<TabletFullscreenControl isTabletLayout=\{isTabletLayout\} \/>/);
  assert.match(page, /name: 'Vaso de emoliente y Pan con Queso'/);
  assert.match(page, /image: 'https:\/\/al-toque-upch\.onrender\.com\/desayuno-emoliente-pan-queso\.png'/);
  assert.match(page, /id: 'desayunos', label: 'Desayunos'/);
  assert.match(page, /\{ id: 'panettone', label: 'Navidad 🎄' \}/);
  assert.match(page, /border-\[#e30613\] text-\[#e30613\]/);
  assert.match(page, /<h3 id="starbucks-panettone-title"[^>]*>Navidad 🎄<\/h3>/);
  assert.match(page, /const STARBUCKS_PANETTONE_PRODUCTS = \[/);
  assert.match(page, /starbucksSection === 'panettone'/);
  assert.match(page, /No encontramos productos de Navidad que coincidan con la búsqueda/);
  assert.doesNotMatch(page, /STARBUCKS_UPCOMING_PROMOTIONS|matchingUpcomingPromotions/);
  assert.match(page, /\{ id: 'alimentos', label: 'Alimentos' \}/);
  assert.match(page, /\{ id: 'merch', label: 'Merch & Café en Grano' \}/);
  assert.match(page, /\{ id: 'packs', label: 'Packs & Boxes' \}/);
  assert.match(page, /const STARBUCKS_FOOD_PRODUCTS = STARBUCKS_FOOD_SOURCE\.map/);
  assert.match(page, /const STARBUCKS_MERCH_PRODUCTS = STARBUCKS_MERCH_SOURCE\.map/);
  assert.match(page, /const STARBUCKS_PACK_PRODUCTS = STARBUCKS_PACK_SOURCE\.map/);
  assert.match(stylesheet, /#root \.starbucks-campaign-overlay/);
  assert.match(page, /className="complaint-book-card/);
  assert.match(page, /aria-label="Abrir el Libro de Reclamaciones virtual/);
  assert.match(page, /fetch\('\/api\/complaints'/);
  assert.match(page, /salesUpdatesConsentAt/);
  assert.match(page, /salesUpdates: false/);
  assert.match(page, /Correo para tu pedido o promociones \(opcional\)/);
  assert.match(page, /fetch\('\/api\/marketing\/subscribe'/);
  assert.match(page, /function CartScreen\(\{[^}]*setPickupPoint/);
  assert.match(page, /aria-label="Elige un punto de recojo"/);
  assert.match(page, /name: 'En la puerta principal'/);
  assert.match(page, /name: 'En el patio'/);
  assert.match(page, /name: 'Área de tutoría'/);
  assert.match(page, /role="group" aria-label="Método de pago"/);
  assert.match(page, /aria-pressed=\{paymentMethod === method\.id\}/);
  assert.match(page, /aria-expanded=\{showSearch\}/);
  assert.match(page, /aria-controls=\{showSearch \? 'menu-search' : undefined\}/);
  assert.match(page, /aria-label="Buscar platos, combos o bebidas"/);
  assert.match(page, /aria-label="Limpiar búsqueda"/);
  assert.match(page, /aria-pressed=\{filter === chip\.id\}/);
  assert.match(page, /No encontramos resultados/);
  assert.match(page, /aria-label=\{`Quitar una unidad de \$\{item\.name\}`\}/);
  assert.match(page, /aria-label=\{`Agregar una unidad de \$\{item\.name\}`\}/);
  assert.doesNotMatch(page, /<h5 className="font-bold text-xs">Punto de recojo<\/h5>/);
});

test('forwards an explicitly submitted marketing email to the reference subscription service', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  let forwardedRequest;
  const fetchImpl = async (url, options) => {
    forwardedRequest = { url, options };
    return new Response(JSON.stringify({ provider: 'hubspot' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };
  const server = await createReelsTestServer(t, testDataDir, undefined, undefined, fetchImpl);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${baseUrl}/api/marketing/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ email: '  student@example.com  ' })
  });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { provider: 'hubspot' });
  assert.equal(forwardedRequest.url, 'https://al-toque-upch.onrender.com/api/marketing/subscribe');
  assert.equal(forwardedRequest.options.method, 'POST');
  assert.deepEqual(JSON.parse(forwardedRequest.options.body), { email: 'student@example.com' });
});

test('rejects invalid and cross-origin marketing subscription requests without forwarding email', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  let forwarded = false;
  const fetchImpl = async () => {
    forwarded = true;
    throw new Error('The upstream service must not be called for invalid requests.');
  };
  const server = await createReelsTestServer(t, testDataDir, undefined, undefined, fetchImpl);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const invalidEmail = await fetch(`${baseUrl}/api/marketing/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ email: 'not-an-email' })
  });
  const crossOrigin = await fetch(`${baseUrl}/api/marketing/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://untrusted.example' },
    body: JSON.stringify({ email: 'student@example.com' })
  });

  assert.equal(invalidEmail.status, 400);
  assert.equal(crossOrigin.status, 403);
  assert.equal(forwarded, false);
});

test('reports marketing subscription service failures instead of recording consent', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const fetchImpl = async () => new Response(JSON.stringify({ error: 'Servicio temporalmente no disponible.' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' }
  });
  const server = await createReelsTestServer(t, testDataDir, undefined, undefined, fetchImpl);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${baseUrl}/api/marketing/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ email: 'student@example.com' })
  });

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: 'Servicio temporalmente no disponible.' });
});

test('stores complaint submissions in the configured private backend and returns a receipt', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const submittedComplaints = [];
  const persistenceStore = {
    maxVideoBytes: 50 * 1024 * 1024,
    async loadState() {
      return null;
    },
    async saveState() {},
    async createComplaint(complaint) {
      submittedComplaints.push(complaint);
      return { id: '123e4567-e89b-42d3-a456-426614174000', submittedAt: '2026-01-02T03:04:05.000Z' };
    }
  };
  const server = await createReelsTestServer(t, testDataDir, undefined, persistenceStore);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${baseUrl}/api/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({
      kind: 'reclamo',
      consumerName: 'Cliente de prueba',
      documentType: 'DNI',
      documentNumber: '12345678',
      address: 'Av. de prueba 123',
      email: 'cliente@example.com',
      phone: '+51 999 123 456',
      product: 'Pedido de prueba',
      amount: '12.50',
      description: 'El pedido de prueba llegó incompleto y deseo dejar constancia.',
      request: 'Solicito una respuesta sobre el producto.',
      privacyConsent: true
    })
  });
  const payload = await response.json();

  assert.equal(response.status, 201);
  assert.deepEqual(payload.complaint, {
    id: '123e4567-e89b-42d3-a456-426614174000',
    submittedAt: '2026-01-02T03:04:05.000Z'
  });
  assert.equal(submittedComplaints.length, 1);
  assert.equal(submittedComplaints[0].consumer_name, 'Cliente de prueba');
  assert.equal(submittedComplaints[0].document_number, '12345678');
  assert.equal(submittedComplaints[0].amount, 12.5);
  assert.equal(submittedComplaints[0].privacy_consent, true);
  assert.ok(Number.isFinite(Date.parse(submittedComplaints[0].privacy_consented_at)));
});

test('requires privacy consent and configured Supabase storage for complaint submissions', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const complaint = {
    kind: 'reclamo',
    consumerName: 'Cliente de prueba',
    documentType: 'DNI',
    documentNumber: '12345678',
    address: 'Av. de prueba 123',
    email: 'cliente@example.com',
    phone: '+51 999 123 456',
    product: 'Pedido de prueba',
    amount: '',
    description: 'El pedido de prueba llegó incompleto y deseo dejar constancia.',
    request: 'Solicito una respuesta sobre el producto.',
    privacyConsent: false
  };
  const withoutConsent = await fetch(`${baseUrl}/api/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify(complaint)
  });
  assert.equal(withoutConsent.status, 400);

  const notConfigured = await fetch(`${baseUrl}/api/complaints`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ ...complaint, privacyConsent: true })
  });
  assert.equal(notConfigured.status, 503);
  assert.match((await notConfigured.json()).error, /no está conectado a Supabase/);
});

test('serves the offline JavaScript and font assets from local paths', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir);
  const assets = [
    ['/vendor/tailwind.js', 'text/javascript; charset=utf-8'],
    ['/vendor/react.development.js', 'text/javascript; charset=utf-8'],
    ['/vendor/react-dom.development.js', 'text/javascript; charset=utf-8'],
    ['/vendor/babel.min.js', 'text/javascript; charset=utf-8'],
    ['/vendor/lucide.js', 'text/javascript; charset=utf-8'],
    ['/vendor/fonts.css', 'text/css; charset=utf-8'],
    ['/vendor/fonts/outfit-400.ttf', 'font/ttf'],
    ['/vendor/fonts/outfit-500.ttf', 'font/ttf'],
    ['/vendor/fonts/outfit-600.ttf', 'font/ttf'],
    ['/vendor/fonts/outfit-700.ttf', 'font/ttf'],
    ['/vendor/fonts/space-grotesk-600.ttf', 'font/ttf'],
    ['/vendor/fonts/space-grotesk-700.ttf', 'font/ttf']
  ];

  for (const [path, contentType] of assets) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`);
    assert.equal(response.status, 200, `${path} should be served`);
    assert.equal(response.headers.get('content-type'), contentType);
    assert.ok(Number(response.headers.get('content-length')) > 0, `${path} should not be empty`);
  }
});

test('compresses large text assets when the client accepts gzip', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir);
  const response = await new Promise((resolve, reject) => {
    const request = http.get(`http://127.0.0.1:${server.address().port}/vendor/babel.min.js`, {
      headers: { 'accept-encoding': 'gzip' }
    }, resolve);
    request.once('error', reject);
  });
  const chunks = [];
  for await (const chunk of response) chunks.push(chunk);
  const compressed = Buffer.concat(chunks);
  const original = gunzipSync(compressed);

  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['content-encoding'], 'gzip');
  assert.equal(response.headers.vary, 'Accept-Encoding');
  assert.equal(response.headers['content-type'], 'text/javascript; charset=utf-8');
  assert.ok(compressed.length < original.length);
  assert.equal(Number(response.headers['content-length']), compressed.length);
});

test('serves the professor photo used in the October promotion window', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir);
  const response = await fetch(`http://127.0.0.1:${server.address().port}/promo-profesor-martin.png`);
  const cleanedResponse = await fetch(`http://127.0.0.1:${server.address().port}/promo-profesor-martin-limpio.png`);
  const referenceResponse = await fetch(`http://127.0.0.1:${server.address().port}/promo-profesor-martin-referencia.png`);
  const bannerResponse = await fetch(`http://127.0.0.1:${server.address().port}/promo-al-toque-banner.png`);
  const image = Buffer.from(await response.arrayBuffer());
  const cleanedImage = Buffer.from(await cleanedResponse.arrayBuffer());
  const referenceImage = Buffer.from(await referenceResponse.arrayBuffer());
  const bannerImage = Buffer.from(await bannerResponse.arrayBuffer());

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.equal(image.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(cleanedResponse.status, 200);
  assert.equal(cleanedResponse.headers.get('content-type'), 'image/png');
  assert.equal(cleanedImage.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.notDeepEqual(cleanedImage, image);
  assert.equal(referenceResponse.status, 200);
  assert.equal(referenceResponse.headers.get('content-type'), 'image/png');
  assert.equal(referenceImage.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(bannerResponse.status, 200);
  assert.equal(bannerResponse.headers.get('content-type'), 'image/png');
  assert.equal(bannerImage.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
});

test('creates and updates standalone Reels profiles with validated public IDs and photos', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const profileId = randomUUID();
  const photo = `data:image/png;base64,${Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).toString('base64')}`;

  const createResponse = await fetch(`${baseUrl}/api/reels/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId, name: '  Reels creator  ', photo })
  });
  assert.equal(createResponse.status, 201);
  assert.deepEqual((await createResponse.json()).profile, { profileId, name: 'Reels creator', photo });

  const updateResponse = await fetch(`${baseUrl}/api/reels/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId, name: 'Creator updated' })
  });
  assert.equal(updateResponse.status, 200);
  assert.deepEqual((await updateResponse.json()).profile, { profileId, name: 'Creator updated', photo });

  const invalidIdResponse = await fetch(`${baseUrl}/api/reels/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId: '../bad', name: 'Invalid' })
  });
  assert.equal(invalidIdResponse.status, 400);
  const invalidPhotoResponse = await fetch(`${baseUrl}/api/reels/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId: randomUUID(), name: 'Invalid photo', photo: 'data:image/png;base64,Zm9v' })
  });
  assert.equal(invalidPhotoResponse.status, 400);
  const oversizedImage = Buffer.alloc(1024 * 1024 + 1);
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]).copy(oversizedImage);
  const oversizedPhotoResponse = await fetch(`${baseUrl}/api/reels/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profileId: randomUUID(),
      name: 'Oversized photo',
      photo: `data:image/png;base64,${oversizedImage.toString('base64')}`
    })
  });
  assert.equal(oversizedPhotoResponse.status, 400);
});

test('accepts requests from localhost aliases when using the same local server port', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir);
  const port = server.address().port;
  const response = await fetch(`http://127.0.0.1:${port}/api/reels/profile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: `http://localhost:${port}`
    },
    body: JSON.stringify({ profileId: randomUUID(), name: 'Alias ok' })
  });
  assert.equal(response.status, 201);
});

test('accepts same-origin requests forwarded over HTTPS', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir);
  const port = server.address().port;
  const response = await fetch(`http://127.0.0.1:${port}/api/complaints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: `https://127.0.0.1:${port}`,
      'X-Forwarded-Proto': 'https'
    },
    body: JSON.stringify({})
  });

  assert.equal(response.status, 400);
});

test('loads the public feed for a valid first-time viewer before profile creation', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const newViewerId = randomUUID();

  const response = await fetch(`${baseUrl}/api/reels?profileId=${newViewerId}`);
  assert.equal(response.status, 200);
  const feed = await response.json();
  assert.deepEqual(feed, { posts: [], profiles: [] });

  const invalidResponse = await fetch(`${baseUrl}/api/reels?profileId=not-a-uuid`);
  assert.equal(invalidResponse.status, 400);
});

test('uploads validated video streams and serves them with byte-range support', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const mp4 = Buffer.from('000000186674797069736f6d00000000', 'hex');
  const upload = (contentType, body) => fetch(`${baseUrl}/api/reels/videos`, {
    method: 'POST',
    headers: { 'Content-Type': contentType },
    body
  });

  const unsupportedResponse = await upload('video/quicktime', mp4);
  assert.equal(unsupportedResponse.status, 400);
  const mismatchedResponse = await upload('video/webm', mp4);
  assert.equal(mismatchedResponse.status, 400);
  const invalidSignatureResponse = await upload('video/mp4', Buffer.from('not a video'));
  assert.equal(invalidSignatureResponse.status, 400);

  const uploadResponse = await upload('video/mp4', mp4);
  assert.equal(uploadResponse.status, 201);
  const { video } = await uploadResponse.json();
  assert.match(video.id, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  assert.equal(video.url, `/api/reels/videos/${video.id}`);
  assert.equal(video.mimeType, 'video/mp4');

  const rangeResponse = await fetch(`${baseUrl}${video.url}`, { headers: { Range: 'bytes=4-11' } });
  assert.equal(rangeResponse.status, 206);
  assert.equal(rangeResponse.headers.get('content-type'), 'video/mp4');
  assert.equal(rangeResponse.headers.get('accept-ranges'), 'bytes');
  assert.equal(rangeResponse.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(rangeResponse.headers.get('content-range'), `bytes 4-11/${mp4.length}`);
  assert.deepEqual(Buffer.from(await rangeResponse.arrayBuffer()), mp4.subarray(4, 12));
  assert.equal((await fetch(`${baseUrl}/api/reels/videos/%2e%2e%2fserver.mjs`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/api/reels/videos/${randomUUID()}`)).status, 404);
});

test('requires and persists image-rights consent when a Reel includes people', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const profileId = randomUUID();
  const jsonPost = (path, value) => fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value)
  });

  await jsonPost('/api/reels/profile', { profileId, name: 'Creator' });
  const uploadResponse = await fetch(`${baseUrl}/api/reels/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x93, 0x42])
  });
  assert.equal(uploadResponse.status, 201);
  const { video } = await uploadResponse.json();

  const missingConsentResponse = await jsonPost('/api/reels/posts', {
    profileId,
    videoId: video.id,
    caption: 'Person visible',
    hasPeople: true,
    imageRightsAccepted: false
  });
  assert.equal(missingConsentResponse.status, 400);

  const acceptedResponse = await jsonPost('/api/reels/posts', {
    profileId,
    videoId: video.id,
    caption: 'Person visible',
    hasPeople: true,
    imageRightsAccepted: true
  });
  assert.equal(acceptedResponse.status, 201);
  const { post } = await acceptedResponse.json();
  const savedReels = JSON.parse(await readFile(join(testDataDir, 'reels.json'), 'utf8'));
  const savedPost = savedReels.posts.find((item) => item.id === post.id);
  assert.equal(savedPost.hasPeople, true);
  assert.ok(Number.isFinite(new Date(savedPost.imageRightsAcceptedAt).getTime()));
});

test('shares Reels posts, likes and comments across profiles and server restarts', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  let server = await createReelsTestServer(t, testDataDir);
  const firstBaseUrl = `http://127.0.0.1:${server.address().port}`;
  const creatorId = randomUUID();
  const viewerId = randomUUID();
  const jsonPost = (path, value, baseUrl = firstBaseUrl) => fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(value)
  });
  await jsonPost('/api/reels/profile', { profileId: creatorId, name: 'Creator' });
  await jsonPost('/api/reels/profile', { profileId: viewerId, name: 'Viewer' });

  const uploadResponse = await fetch(`${firstBaseUrl}/api/reels/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x93, 0x42])
  });
  assert.equal(uploadResponse.status, 201);
  const { video } = await uploadResponse.json();
  assert.equal(video.mimeType, 'video/webm');

  const createPostResponse = await jsonPost('/api/reels/posts', {
    profileId: creatorId,
    videoId: video.id,
    caption: 'First reel'
  });
  assert.equal(createPostResponse.status, 201);
  const { post } = await createPostResponse.json();
  assert.equal(post.profileName, 'Creator');
  assert.equal(post.likeCount, 0);
  assert.equal(post.likedByViewer, false);
  assert.equal(post.comments.length, 0);

  const firstLikeResponse = await jsonPost(`/api/reels/posts/${post.id}/like`, { profileId: viewerId });
  assert.equal((await firstLikeResponse.json()).post.likeCount, 1);
  const duplicateLikeResponse = await jsonPost(`/api/reels/posts/${post.id}/like`, { profileId: viewerId });
  assert.equal((await duplicateLikeResponse.json()).post.likeCount, 0);
  await jsonPost(`/api/reels/posts/${post.id}/like`, { profileId: creatorId });

  const commentResponse = await jsonPost(`/api/reels/posts/${post.id}/comments`, { profileId: viewerId, text: 'Nice video!' });
  assert.equal(commentResponse.status, 201);
  assert.equal((await commentResponse.json()).comment.profileName, 'Viewer');

  const feedResponse = await fetch(`${firstBaseUrl}/api/reels?profileId=${viewerId}`);
  assert.equal(feedResponse.status, 200);
  const feed = await feedResponse.json();
  assert.equal(feed.posts[0].id, post.id);
  assert.equal(feed.posts[0].likeCount, 1);
  assert.equal(feed.posts[0].likedByViewer, false);
  assert.deepEqual(feed.posts[0].comments.map(({ profileId, profileName, text }) => ({ profileId, profileName, text })), [
    { profileId: viewerId, profileName: 'Viewer', text: 'Nice video!' }
  ]);
  assert.equal(feed.profiles.length, 2);

  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  server = await createReelsTestServer(t, testDataDir);
  const restartedUrl = `http://127.0.0.1:${server.address().port}`;
  const restartedFeed = await fetch(`${restartedUrl}/api/reels?profileId=${creatorId}`);
  assert.equal(restartedFeed.status, 200);
  const persisted = await restartedFeed.json();
  assert.equal(persisted.posts[0].likeCount, 1);
  assert.equal(persisted.posts[0].likedByViewer, true);
  assert.equal(persisted.posts[0].comments[0].text, 'Nice video!');
  assert.equal((await fetch(`${restartedUrl}${video.url}`, { headers: { Range: 'bytes=0-3' } })).status, 206);
});

test('requires the deletion password and owner profile to remove a Reel', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const creatorId = randomUUID();
  const viewerId = randomUUID();

  await fetch(`${baseUrl}/api/reels/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId: creatorId, name: 'Owner' })
  });
  await fetch(`${baseUrl}/api/reels/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId: viewerId, name: 'Viewer' })
  });

  const uploadResponse = await fetch(`${baseUrl}/api/reels/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x93, 0x42])
  });
  assert.equal(uploadResponse.status, 201);
  const { video } = await uploadResponse.json();

  const createPostResponse = await fetch(`${baseUrl}/api/reels/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId: creatorId, videoId: video.id, caption: 'Delete me' })
  });
  assert.equal(createPostResponse.status, 201);
  const { post } = await createPostResponse.json();

  const forbiddenDeleteResponse = await fetch(`${baseUrl}/api/reels/posts/${post.id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId: viewerId })
  });
  assert.equal(forbiddenDeleteResponse.status, 403);

  const missingPasswordResponse = await fetch(`${baseUrl}/api/reels/posts/${post.id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId: creatorId })
  });
  assert.equal(missingPasswordResponse.status, 403);

  const incorrectPasswordResponse = await fetch(`${baseUrl}/api/reels/posts/${post.id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId: creatorId, password: '0000' })
  });
  assert.equal(incorrectPasswordResponse.status, 403);

  const deleteResponse = await fetch(`${baseUrl}/api/reels/posts/${post.id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId: creatorId, password: 'test-reels-delete-password' })
  });
  assert.equal(deleteResponse.status, 200);
  assert.deepEqual(await deleteResponse.json(), { deleted: true, postId: post.id });

  const feedResponse = await fetch(`${baseUrl}/api/reels?profileId=${creatorId}`);
  assert.equal(feedResponse.status, 200);
  const feed = await feedResponse.json();
  assert.deepEqual(feed.posts, []);
  assert.equal((await fetch(`${baseUrl}${video.url}`)).status, 404);
});

test('disables Reel deletion when the server password is not configured', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir, '');
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const profileId = randomUUID();

  await fetch(`${baseUrl}/api/reels/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId, name: 'Owner' })
  });
  const uploadResponse = await fetch(`${baseUrl}/api/reels/videos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x93, 0x42])
  });
  assert.equal(uploadResponse.status, 201);
  const { video } = await uploadResponse.json();
  const createPostResponse = await fetch(`${baseUrl}/api/reels/posts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId, videoId: video.id, caption: 'Delete me' })
  });
  assert.equal(createPostResponse.status, 201);
  const { post } = await createPostResponse.json();

  const deleteResponse = await fetch(`${baseUrl}/api/reels/posts/${post.id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profileId, password: '' })
  });
  assert.equal(deleteResponse.status, 503);
  assert.equal((await deleteResponse.json()).error, 'La eliminación de Reels no está configurada en el servidor.');
});

test('rejects oversized Reels video requests before accepting their bodies', async (t) => {
  const testDataDir = await createReelsTestDirectory();
  const server = await createReelsTestServer(t, testDataDir);
  const address = server.address();
  const status = await new Promise((resolve, reject) => {
    const request = http.request({
      host: '127.0.0.1',
      port: address.port,
      path: '/api/reels/videos',
      method: 'POST',
      headers: { 'Content-Type': 'video/mp4', 'Content-Length': 100 * 1024 * 1024 + 1 }
    }, (response) => {
      response.resume();
      response.once('end', () => {
        request.destroy();
        resolve(response.statusCode);
      });
    });
    request.on('error', (error) => {
      if (!request.destroyed) reject(error);
    });
    request.flushHeaders();
  });
  assert.equal(status, 413);
});

test('serves local music files with byte ranges for browser audio controls', async (t) => {
  const testDataDir = await mkdtemp(join(tmpdir(), 'altoque-audio-test-'));
  const server = createAlToqueServer({ ordersFile: join(testDataDir, 'orders.json') });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await rm(testDataDir, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  for (const trackPath of ['/music/bby-wow.mp3', '/music/dame-un-beso.mp3']) {
    const response = await fetch(`${baseUrl}${trackPath}`, { headers: { Range: 'bytes=0-31' } });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('content-type'), 'audio/mpeg');
    assert.equal(response.headers.get('accept-ranges'), 'bytes');
    assert.match(response.headers.get('content-range'), /^bytes 0-31\/\d+$/);
    assert.equal((await response.arrayBuffer()).byteLength, 32);
  }

  const coverResponse = await fetch(`${baseUrl}/music/dame-un-beso-cover.png`);
  assert.equal(coverResponse.status, 200);
  assert.equal(coverResponse.headers.get('content-type'), 'image/png');
  assert.deepEqual(
    Array.from(new Uint8Array(await coverResponse.arrayBuffer()).slice(0, 8)),
    [137, 80, 78, 71, 13, 10, 26, 10]
  );

  const gorritosWelcomeStickerResponse = await fetch(`${baseUrl}/gorritos-welcome-hat.png`);
  assert.equal(gorritosWelcomeStickerResponse.status, 200);
  assert.equal(gorritosWelcomeStickerResponse.headers.get('content-type'), 'image/png');
  assert.deepEqual(
    Array.from(new Uint8Array(await gorritosWelcomeStickerResponse.arrayBuffer()).slice(0, 8)),
    [137, 80, 78, 71, 13, 10, 26, 10]
  );

  for (let stickerId = 1; stickerId <= 25; stickerId += 1) {
    const stickerExtension = stickerId <= 8 ? 'webp' : 'png';
    const stickerResponse = await fetch(`${baseUrl}/sticker_${stickerId}.${stickerExtension}`);
    assert.equal(stickerResponse.status, 200, `sticker_${stickerId}.${stickerExtension} should be served`);
    assert.equal(stickerResponse.headers.get('content-type'), stickerId <= 8 ? 'image/webp' : 'image/png');
    assert.deepEqual(
      Array.from(new Uint8Array(await stickerResponse.arrayBuffer()).slice(0, stickerId <= 8 ? 4 : 8)),
      stickerId <= 8
        ? [82, 73, 70, 70]
        : [137, 80, 78, 71, 13, 10, 26, 10]
    );
  }

  const unknownTrack = await fetch(`${baseUrl}/music/not-allowed.mp3`);
  assert.equal(unknownTrack.status, 404);
});

test('understands a direct request for a drink', () => {
  assert.equal(detectMenuIntent('Recomiéndame una bebida, por favor'), 'bebidas');
  assert.equal(selectMenuItem('bebidas', 'Quiero algo para tomar').category, 'bebidas');
});

test('keeps a meal request among food and combo items', () => {
  assert.equal(detectMenuIntent('Quiero un plato para almorzar'), 'comida');
  assert.notEqual(selectMenuItem('comida', 'Quiero comer algo').category, 'bebidas');
});

test('matches specifically named products without crossing categories', () => {
  assert.equal(selectMenuItem('bebidas', 'Quiero Jugo de Maracuyá').id, '7');
  assert.equal(selectMenuItem('comida', 'Recomiéndame ceviche').id, '3');
  assert.equal(selectMenuItem('comida', 'Quiero el Combo Costeño').id, '8');
  assert.equal(selectMenuItem('comida', 'Quiero el Combo Marino').id, '9');
  assert.equal(selectMenuItem('bebidas', 'Quiero Agua San Luis').id, '10');
});

test('uses a reasonable general recommendation when the request has no category', () => {
  assert.equal(detectMenuIntent('¿Qué me recomiendas?'), 'cualquiera');
  assert.ok(selectMenuItem('cualquiera', '¿Qué me recomiendas?'));
  assert.equal(detectMenuIntent('Tengo S/ 15'), 'cualquiera');
  assert.equal(detectMenuIntent('¿A qué hora empieza el partido?'), 'ninguna');
  assert.equal(selectMenuItem('ninguna', '¿A qué hora empieza el partido?'), null);
});

test('resolves explicit exclusions to the requested category', () => {
  assert.equal(detectMenuIntent('No quiero bebida, prefiero un plato'), 'comida');
  assert.equal(detectMenuIntent('No quiero un plato, solo una bebida'), 'bebidas');
});

test('answers simple menu questions locally without requesting web search', () => {
  const drinks = getLocalMenuAnswer('¿Qué bebidas ofrecen hoy?');
  assert.match(drinks.reply, /Chicha Morada Natural/);
  assert.match(drinks.reply, /Jugo de Maracuyá/);
  assert.equal(drinks.dishId, null);
  assert.equal(shouldUseWebSearch('¿Qué bebidas ofrecen hoy?'), false);
  assert.equal(getLocalMenuAnswer('¿Qué incluye el Combo Fitness?').dishId, '5');
  assert.match(getLocalMenuAnswer('¿Qué incluye el Combo Costeño?').reply, /Agua San Luis 600ml/);
  assert.match(getLocalMenuAnswer('¿Qué incluye el Combo Marino?').reply, /Jugo de maracuyá 500ml/);
  assert.match(getLocalMenuAnswer('¿Qué bebidas ofrecen hoy?').reply, /Agua San Luis 600ml/);
  assert.equal(getLocalMenuAnswer('Quiero una bebida').intent, 'bebidas');
  assert.equal(getLocalMenuAnswer('Quiero un plato para almorzar').intent, 'comida');
});

test('reserves web search for current or complex questions', () => {
  assert.equal(shouldUseWebSearch('¿Cuál es el tipo de cambio actual?'), true);
  assert.equal(shouldUseWebSearch('Explica por qué cambia el clima y compara las causas principales'), true);
  assert.equal(shouldUseWebSearch('Hola, ¿cómo estás?'), false);
  assert.equal(shouldUseWebSearch('¿Qué incluye el Combo Fitness?'), false);
  assert.equal(getLocalMenuAnswer('¿Cuál es el origen histórico del ceviche?'), null);
  assert.equal(shouldUseWebSearch('¿Cuál es el origen histórico del ceviche?'), true);
});

test('uses one OpenAI-backed assistant with three distinct response personas', () => {
  const personas = ['ChatGPT', 'Copilot', 'Gemini'].map(getAssistantPersona);
  assert.equal(new Set(personas).size, 3);
  assert.match(getAssistantPersona('Copilot'), /práctico/);
  assert.match(getAssistantPersona('Gemini'), /creativo/);

  const response = 'El Jugo de Maracuyá cuesta S/3.50.';
  const styles = ['ChatGPT', 'Copilot', 'Gemini'].map((provider) => styleLocalAnswer(response, provider));
  assert.equal(new Set(styles).size, 3);
  assert.ok(styles.every((style) => style.includes(response)));
});

test('gives the rider support assistant empathetic, practical, and truthful guidance', () => {
  const instructions = makeRiderSupportInstructions();
  assert.match(instructions, /amabilidad, empatía y respeto/i);
  assert.match(instructions, /No inventes funciones/i);
  assert.match(instructions, /No solicites contraseñas/i);
  assert.match(instructions, /lugar seguro/i);
});

test('routes rider support questions to AI with the dedicated support instructions', async (t) => {
  const testDataDir = await mkdtemp(join(tmpdir(), 'altoque-rider-support-test-'));
  let requestedUrl;
  let requestedBody;
  const server = createAlToqueServer({
    ordersFile: join(testDataDir, 'orders.json'),
    openAIApiKey: 'test-openai-api-key',
    fetchImpl: async (url, options) => {
      requestedUrl = new URL(url);
      requestedBody = JSON.parse(options.body);
      return new Response(JSON.stringify({ output_text: 'Siento que estés pasando por esto. Revisemos juntos qué puedes hacer.' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await rm(testDataDir, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({
      provider: 'ChatGPT',
      assistantMode: 'rider-support',
      text: 'Mi pedido se está demorando y estoy preocupado.',
      history: [],
      memory: ''
    })
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).reply, 'Siento que estés pasando por esto. Revisemos juntos qué puedes hacer.');
  assert.equal(requestedUrl.origin, 'https://api.openai.com');
  assert.equal(requestedUrl.pathname, '/v1/responses');
  assert.equal(requestedBody.tools, undefined);
  assert.equal(requestedBody.input[0].role, 'developer');
  assert.match(requestedBody.input[0].content, /amabilidad, empatía y respeto/i);
  assert.match(requestedBody.input[0].content, /No inventes funciones/i);
  assert.match(requestedBody.input[1].content, /Mi pedido se está demorando y estoy preocupado/);
});

test('falls back to the local Keras model for rider support when OpenAI is unavailable', async (t) => {
  const testDataDir = await mkdtemp(join(tmpdir(), 'altoque-rider-support-fallback-test-'));
  const requestedCalls = [];
  const server = createAlToqueServer({
    ordersFile: join(testDataDir, 'orders.json'),
    openAIApiKey: 'test-openai-api-key',
    fetchImpl: async (url, options) => {
      const requestedUrl = new URL(url);
      requestedCalls.push({ requestedUrl, options });
      if (requestedUrl.hostname === 'api.openai.com') {
        return new Response(JSON.stringify({ error: { message: 'La cuota de OpenAI se agotó.' } }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify({
        respuesta: 'Siento que estés pasando por esta demora. Revisa el estado y contacta a soporte con el número del pedido.'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await rm(testDataDir, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({
      provider: 'ChatGPT',
      assistantMode: 'rider-support',
      text: 'Mi pedido se demora, ¿qué hago?',
      history: [],
      memory: ''
    })
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.engine, 'Keras local');
  assert.equal(payload.fallbackFrom, 'OpenAI API');
  assert.equal(payload.reply, 'Siento que estés pasando por esta demora. Revisa el estado y contacta a soporte con el número del pedido.');
  assert.equal(requestedCalls.length, 2);
  assert.equal(requestedCalls[0].requestedUrl.hostname, 'api.openai.com');
  assert.equal(requestedCalls[1].requestedUrl.hostname, '127.0.0.1');
  assert.equal(requestedCalls[1].requestedUrl.port, '5000');
  assert.equal(requestedCalls[1].requestedUrl.pathname, '/preguntar');
  assert.equal(requestedCalls[1].options.headers['Content-Type'], 'application/json');
  const kerasBody = JSON.parse(requestedCalls[1].options.body);
  assert.match(kerasBody.pregunta, /amabilidad, empatía y respeto/i);
  assert.match(kerasBody.pregunta, /Mi pedido se demora, ¿qué hago\?/);
});

test('keeps previous conversation context separate from assistant instructions', () => {
  const prompt = composePrompt(
    'Responde en español.',
    [{ sender: 'user', text: 'Prefiero opciones ligeras.' }],
    'Me gustan las bebidas naturales.',
    '¿Qué me recomiendas?',
    null,
    [{ name: 'Jugo de Maracuyá', quantity: 3 }, { name: 'Bowl de quinua', quantity: 1 }]
  );
  assert.equal(prompt[0].role, 'developer');
  assert.equal(prompt[1].role, 'user');
  assert.match(prompt[1].content, /bebidas naturales/);
  assert.match(prompt[1].content, /opciones ligeras/);
  assert.match(prompt[1].content, /¿Qué me recomiendas\?/);
  assert.match(prompt[1].content, /"Jugo de Maracuyá": 3/);
  assert.match(prompt[1].content, /"Bowl de quinua": 1/);
});

test('omits personalized context when history and memory are disabled', () => {
  const prompt = composePrompt('Responde en español.', [], '', 'Hola', null);
  assert.equal(prompt[1].content, 'Mensaje actual:\nHola');
});

test('searches YouTube through the official API without exposing its key to the client', async (t) => {
  const testDataDir = await mkdtemp(join(tmpdir(), 'altoque-youtube-test-'));
  let requestedSearchUrl;
  let requestedVideosUrl;
  let upstreamStatus = 200;
  let verificationStatus = 200;
  let upstreamPayload = {
    nextPageToken: 'page-two',
    items: [
      { id: { videoId: 'video123' }, snippet: { title: 'Canción de prueba', channelTitle: 'Artista de prueba' } },
      { id: { videoId: 'private123' }, snippet: { title: 'Video privado', channelTitle: 'Canal privado' } },
      { id: { videoId: 'region123' }, snippet: { title: 'Video no disponible en Perú', channelTitle: 'Canal regional' } }
    ]
  };
  const verificationPayload = {
    items: [
      { id: 'video123', status: { privacyStatus: 'public', uploadStatus: 'processed', embeddable: true }, contentDetails: {} },
      { id: 'private123', status: { privacyStatus: 'private', uploadStatus: 'processed', embeddable: true }, contentDetails: {} },
      { id: 'region123', status: { privacyStatus: 'public', uploadStatus: 'processed', embeddable: true }, contentDetails: { regionRestriction: { allowed: ['US'] } } }
    ]
  };
  const server = createAlToqueServer({
    ordersFile: join(testDataDir, 'orders.json'),
    youtubeApiKey: 'test-youtube-api-key',
    fetchImpl: async (url) => {
      const requestedUrl = new URL(url);
      if (requestedUrl.pathname === '/youtube/v3/videos') {
        requestedVideosUrl = requestedUrl;
        return new Response(JSON.stringify(verificationPayload), { status: verificationStatus, headers: { 'Content-Type': 'application/json' } });
      }
      requestedSearchUrl = requestedUrl;
      return new Response(JSON.stringify(upstreamPayload), { status: upstreamStatus, headers: { 'Content-Type': 'application/json' } });
    }
  });
  const unconfiguredServer = createAlToqueServer({
    ordersFile: join(testDataDir, 'unconfigured-orders.json'),
    youtubeApiKey: ''
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  await new Promise((resolve, reject) => {
    unconfiguredServer.once('error', reject);
    unconfiguredServer.listen(0, '127.0.0.1', resolve);
  });
  t.after(async () => {
    await Promise.all([server, unconfiguredServer].map((activeServer) => new Promise((resolve, reject) => {
      activeServer.close((error) => error ? reject(error) : resolve());
    })));
    await rm(testDataDir, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const unconfiguredBaseUrl = `http://127.0.0.1:${unconfiguredServer.address().port}`;
  const unconfiguredResponse = await fetch(`${unconfiguredBaseUrl}/api/youtube/search?q=test`);
  assert.equal(unconfiguredResponse.status, 503);
  assert.match((await unconfiguredResponse.json()).error, /YOUTUBE_API_KEY/);

  const invalidResponse = await fetch(`${baseUrl}/api/youtube/search?q=`);
  assert.equal(invalidResponse.status, 400);

  const response = await fetch(`${baseUrl}/api/youtube/search?q=${encodeURIComponent('canción de prueba')}`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    videos: [{
      id: 'video123',
      title: 'Canción de prueba',
      artist: 'Artista de prueba'
    }],
    nextPageToken: 'page-two'
  });
  assert.equal(requestedSearchUrl.origin, 'https://www.googleapis.com');
  assert.equal(requestedSearchUrl.pathname, '/youtube/v3/search');
  assert.equal(requestedSearchUrl.searchParams.get('q'), 'canción de prueba');
  assert.equal(requestedSearchUrl.searchParams.get('key'), 'test-youtube-api-key');
  assert.equal(requestedSearchUrl.searchParams.get('maxResults'), '50');
  assert.equal(requestedSearchUrl.searchParams.get('videoEmbeddable'), 'true');
  assert.equal(requestedSearchUrl.searchParams.get('regionCode'), 'PE');
  assert.equal(requestedVideosUrl.pathname, '/youtube/v3/videos');
  assert.equal(requestedVideosUrl.searchParams.get('part'), 'status,contentDetails');
  assert.equal(requestedVideosUrl.searchParams.get('id'), 'video123,private123,region123');

  await fetch(`${baseUrl}/api/youtube/search?q=test&pageToken=page-two`);
  assert.equal(requestedSearchUrl.searchParams.get('pageToken'), 'page-two');

  verificationStatus = 500;
  const verificationFailureResponse = await fetch(`${baseUrl}/api/youtube/search?q=test`);
  assert.equal(verificationFailureResponse.status, 502);
  assert.match((await verificationFailureResponse.json()).error, /verificar qué videos están disponibles/i);
  verificationStatus = 200;

  upstreamStatus = 400;
  upstreamPayload = {
    error: {
      status: 'INVALID_ARGUMENT',
      message: 'API key not valid. Please pass a valid API key.',
      errors: [{ reason: 'badRequest' }]
    }
  };
  const invalidKeyResponse = await fetch(`${baseUrl}/api/youtube/search?q=test`);
  assert.equal(invalidKeyResponse.status, 503);
  assert.match((await invalidKeyResponse.json()).error, /YOUTUBE_API_KEY.*inválida/i);
});

test('shares customer orders with the rider queue and enforces delivery transitions', async (t) => {
  const testDataDir = await mkdtemp(join(tmpdir(), 'altoque-server-test-'));
  const server = createAlToqueServer({ ordersFile: join(testDataDir, 'orders.json') });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await rm(testDataDir, { recursive: true, force: true });
  });

  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const invalidLocationResponse = await fetch(`${baseUrl}/api/location/reverse?lat=91&lon=0`);
  assert.equal(invalidLocationResponse.status, 400);
  assert.match((await invalidLocationResponse.json()).error, /coordenadas/i);

  const invalidPickupResponse = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: baseUrl
    },
    body: JSON.stringify({
      idempotencyKey: 'invalid-pickup-123456',
      items: [{ name: 'Iced Protein Matcha', quantity: 1, price: 22 }],
      pickupPoint: 'Cafetería Central',
      paymentMethod: 'yape'
    })
  });
  assert.equal(invalidPickupResponse.status, 400);
  assert.match((await invalidPickupResponse.json()).error, /punto de recojo/i);

  const orderResponse = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: baseUrl
    },
    body: JSON.stringify({
      idempotencyKey: 'customer-checkout-123456',
      customer: 'Armando',
      items: [{
        name: 'Iced Protein Matcha',
        quantity: 1,
        price: 22,
        description: 'Bebida de matcha con proteína.',
        image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%3E%3C%2Fsvg%3E'
      }],
      pickupPoint: 'En la puerta principal',
      paymentMethod: 'yape'
    })
  });
  assert.equal(orderResponse.status, 201);
  const { order } = await orderResponse.json();
  assert.equal(order.customer, 'Armando');
  assert.equal(order.total, 23);
  assert.equal(order.pickupPoint, 'En la puerta principal');
  assert.equal(order.status, 'available');
  assert.equal(order.items[0].description, 'Bebida de matcha con proteína.');
  assert.equal(order.items[0].image, 'data:image/svg+xml;charset=UTF-8,%3Csvg%3E%3C%2Fsvg%3E');

  const retryResponse = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: baseUrl
    },
    body: JSON.stringify({
      idempotencyKey: 'customer-checkout-123456',
      customer: 'Armando',
      items: [{
        name: 'Iced Protein Matcha',
        quantity: 1,
        price: 22,
        description: 'Bebida de matcha con proteína.',
        image: 'data:image/svg+xml;charset=UTF-8,%3Csvg%3E%3C%2Fsvg%3E'
      }],
      pickupPoint: 'En la puerta principal',
      paymentMethod: 'yape'
    })
  });
  assert.equal(retryResponse.status, 200);
  assert.equal((await retryResponse.json()).order.id, order.id);

  const queueResponse = await fetch(`${baseUrl}/api/orders`);
  assert.equal(queueResponse.status, 200);
  assert.deepEqual((await queueResponse.json()).orders.map((item) => item.id), [order.id]);

  const postAction = (action, details = {}) => fetch(`${baseUrl}/api/orders/${order.id}/action`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: baseUrl
    },
    body: JSON.stringify({ action, ...details })
  });
  const reviewOrder = (rating, comment) => fetch(`${baseUrl}/api/orders/${order.id}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: baseUrl
    },
    body: JSON.stringify({ rating, comment })
  });
  assert.equal((await reviewOrder(5, 'Muy amable')).status, 409);
  const acceptResponse = await postAction('accept', { driverId: 'rider-armando', driverName: 'Armando' });
  assert.equal(acceptResponse.status, 200);
  assert.equal((await acceptResponse.json()).order.driverName, 'Armando');

  const chatUrl = `${baseUrl}/api/orders/${order.id}/chat`;
  const customerMessage = {
    id: 'customer-message-123',
    type: 'text',
    text: 'Ya llegué',
    createdAt: Date.now()
  };
  const sendMessageResponse = await fetch(chatUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({ role: 'customer', message: customerMessage })
  });
  assert.equal(sendMessageResponse.status, 201);

  const riderChatResponse = await fetch(`${chatUrl}?role=rider&after=0&read=1`);
  const riderChat = await riderChatResponse.json();
  assert.equal(riderChat.messages[0].text, 'Ya llegué');
  assert.equal(Number.isFinite(riderChat.messages[0].readAt), true);

  const customerChatResponse = await fetch(`${chatUrl}?role=customer&after=${customerMessage.createdAt}`);
  const customerChat = await customerChatResponse.json();
  assert.deepEqual(customerChat.receipts, [{ id: customerMessage.id, readAt: riderChat.messages[0].readAt }]);

  const sendAudioResponse = await fetch(chatUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({
      role: 'rider',
      message: {
        id: 'rider-audio-message-123',
        type: 'audio',
        text: '',
        createdAt: Date.now(),
        attachment: {
          name: 'Audio de prueba',
          mimeType: 'audio/webm;codecs=opus',
          data: 'data:audio/webm;codecs=opus;base64,AA=='
        }
      }
    })
  });
  assert.equal(sendAudioResponse.status, 201);

  assert.equal((await postAction('picked-up')).status, 200);
  assert.equal((await postAction('deliver')).status, 200);
  const reviewResponse = await reviewOrder(5, 'Muy amable y puntual');
  assert.equal(reviewResponse.status, 201);
  assert.equal((await reviewOrder(4, 'Otra opinión')).status, 409);
  const riderProfile = await (await fetch(`${baseUrl}/api/rider/profile?driverId=rider-armando`)).json();
  assert.equal(riderProfile.profile.name, 'Armando');
  assert.equal(riderProfile.profile.ratingAverage, 5);
  assert.equal(riderProfile.profile.reviewCount, 1);
  assert.equal(riderProfile.profile.reviews[0].comment, 'Muy amable y puntual');
  const orderDetails = await (await fetch(`${baseUrl}/api/orders/${order.id}`)).json();
  assert.equal(orderDetails.order.review.rating, 5);
  assert.equal((await postAction('accept')).status, 409);
  assert.deepEqual((await (await fetch(`${baseUrl}/api/orders`)).json()).orders, []);

  for (const [index, pickupPoint] of ['En el patio', 'Área de tutoría'].entries()) {
    const pickupOrderResponse = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: baseUrl
      },
      body: JSON.stringify({
        idempotencyKey: `customer-pickup-${index}-123456`,
        items: [{ name: 'Iced Protein Matcha', quantity: 1, price: 22 }],
        pickupPoint,
        paymentMethod: 'yape'
      })
    });
    assert.equal(pickupOrderResponse.status, 201);
    assert.equal((await pickupOrderResponse.json()).order.pickupPoint, pickupPoint);
  }

  for (const asset of ['splash-clean-reference.png', 'splash-warm-reference.png', 'splash-random-reference.png']) {
    const response = await fetch(`${baseUrl}/${asset}`);
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), 'image/png');
  }

  const audioTermsResponse = await fetch(`${baseUrl}/audiomack-player-terms.html`);
  assert.equal(audioTermsResponse.status, 200);
  assert.match(audioTermsResponse.headers.get('content-type'), /text\/html/);
  const audioTermsHtml = await audioTermsResponse.text();
  assert.match(audioTermsHtml, /Términos de uso del reproductor Audiomack/);
  assert.match(audioTermsHtml, /https:\/\/audiomack\.com\/about\/terms-of-service/);

  const coinResponse = await fetch(`${baseUrl}/Moneda%20Al%20Toque.html?coinEmbed=1`);
  assert.equal(coinResponse.status, 200);
  assert.match(coinResponse.headers.get('content-type'), /text\/html/);
  assert.equal(coinResponse.headers.get('x-frame-options'), 'SAMEORIGIN');
  const coinHtml = await coinResponse.text();
  assert.match(coinHtml, /coinEmbed/);
  const embeddedCoinBuilder = coinHtml.match(/function buildEmbeddedCoin\(onReady\)\s*\{([\s\S]*?)\n  \}\s*\n\n  function resize\(\)/)?.[1];
  assert.ok(embeddedCoinBuilder, 'embedded coin renderer should be defined');
  assert.match(embeddedCoinBuilder, /build\(\)/);
  assert.match(coinHtml, /var N = 2048/);
  assert.match(coinHtml, /neon: '#a51e2a'/);
  assert.match(coinHtml, /#45484d/);
  assert.match(coinHtml, /background-color: transparent !important/);
  assert.match(coinHtml, /renderer\.setClearAlpha\(0\)/);
  assert.match(coinHtml, /premultipliedAlpha: true/);
  assert.match(coinHtml, /preserveDrawingBuffer: true/);
  assert.match(coinHtml, /renderer\.setClearColor\(0x000000, 0\)/);
  assert.doesNotMatch(coinHtml, /coinColor/);

  for (const asset of ['coin-front-red.png']) {
    const photoResponse = await fetch(`${baseUrl}/${asset}`);
    assert.equal(photoResponse.status, 200);
    assert.match(photoResponse.headers.get('content-type'), /image\/png/);
    assert.ok((await photoResponse.arrayBuffer()).byteLength > 10_000);
  }
});

test('accepts Gorritos redemptions without a cash total or service fee', async (t) => {
  const testDataDir = await mkdtemp(join(tmpdir(), 'altoque-gorritos-test-'));
  const server = createAlToqueServer({ ordersFile: join(testDataDir, 'orders.json') });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  t.after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
    await rm(testDataDir, { recursive: true, force: true });
  });

  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const submitRedemption = (details) => fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({
      customer: 'Armando',
      items: [{ id: '1', name: 'Lomo saltado', quantity: 1, price: 0 }],
      pickupPoint: 'Cafetería Central',
      paymentMethod: 'gorritos',
      gorritosSpent: 12,
      ...details
    })
  });

  const redemptionResponse = await submitRedemption({ idempotencyKey: 'gorritos-redeem-123456' });
  assert.equal(redemptionResponse.status, 201);
  const { order } = await redemptionResponse.json();
  assert.equal(order.paymentMethod, 'gorritos');
  assert.equal(order.gorritosSpent, 12);
  assert.equal(order.subtotal, 0);
  assert.equal(order.total, 0);
  assert.equal(order.items[0].id, '1');

  const retryResponse = await submitRedemption({ idempotencyKey: 'gorritos-redeem-123456' });
  assert.equal(retryResponse.status, 200);
  assert.equal((await retryResponse.json()).order.id, order.id);

  const cashChargeResponse = await submitRedemption({
    idempotencyKey: 'gorritos-cash-123456',
    items: [{ id: '1', name: 'Lomo saltado', quantity: 1, price: 12 }]
  });
  assert.equal(cashChargeResponse.status, 400);

  const missingPointsResponse = await submitRedemption({
    idempotencyKey: 'gorritos-points-123456',
    gorritosSpent: 0
  });
  assert.equal(missingPointsResponse.status, 400);

  const cashWithPointsResponse = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: baseUrl },
    body: JSON.stringify({
      idempotencyKey: 'cash-with-gorritos-123456',
      items: [{ id: '1', name: 'Lomo saltado', quantity: 1, price: 12 }],
      pickupPoint: 'Cafetería Central',
      paymentMethod: 'efectivo',
      gorritosSpent: 12
    })
  });
  assert.equal(cashWithPointsResponse.status, 400);
});
