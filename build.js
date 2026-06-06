#!/usr/bin/env node
/*
 * build.js — renders the three Markdown roadmaps into one self-contained index.html.
 * The served artifact is index.html (no runtime dependencies). Run: node build.js
 * (requires `marked` at build time only: npm install)
 */
const fs = require('fs');
const { marked } = require('marked');

// External links open in a new tab; affiliate links keep their rel.
const renderer = new marked.Renderer();
const baseLink = renderer.link.bind(renderer);
renderer.link = (href, title, text) => {
  let html = baseLink(href, title, text);
  if (/^https?:\/\//i.test(href)) {
    const rel = /tag=sharkfins-20/.test(href) ? 'nofollow sponsored noopener' : 'noopener';
    html = html.replace(/^<a /, `<a target="_blank" rel="${rel}" `);
  }
  return html;
};
marked.setOptions({ gfm: true, breaks: false, headerIds: true, mangle: false, renderer });

const ROADMAPS = [
  { id: 'r1', file: 'roadmap-1_guitar-practice/README.md',   label: 'Guitar & Musicianship', tag: 'Roadmap 1' },
  { id: 'r2', file: 'roadmap-2_live-performance/README.md',   label: 'Live Performance',       tag: 'Roadmap 2' },
  { id: 'r3', file: 'roadmap-3_music-production/README.md',    label: 'Production & Songwriting', tag: 'Roadmap 3' },
];

const strip = s => s.replace(/<[^>]+>/g, '').trim();

function build() {
  const data = ROADMAPS.map(r => {
    const md = fs.readFileSync(r.file, 'utf8');
    const html = marked.parse(md);
    const toc = [];
    const re = /<h([23]) id="([^"]+)">([\s\S]*?)<\/h\1>/g;
    let m;
    while ((m = re.exec(html))) toc.push({ level: +m[1], id: m[2], text: strip(m[3]) });
    const tm = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    const title = tm ? strip(tm[1]) : r.label;
    return { id: r.id, label: r.label, tag: r.tag, title, html, toc };
  });
  const json = JSON.stringify(data).replace(/<\/script/gi, '<\\/script');
  const out = template(json, data);
  fs.writeFileSync('index.html', out);
  console.log('Built index.html (' + Math.round(out.length / 1024) + ' KB)');
  data.forEach(d => console.log('  ' + d.label + ' — ' + d.toc.length + ' TOC entries'));
}

function template(json) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Ultimate Guitar Roadmap</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{
  --bg:#FBF7F0;--surface:#F4ECDD;--sidebar:#F6EFE2;--card:#FFFDF8;
  --text:#2B2118;--muted:#8C795F;--faint:#B6A688;
  --accent:#B5651D;--accent-soft:#C98A3A;--accent-deep:#8A4A12;
  --border:#E7DBC6;--border-soft:#EFE6D6;
  --code-bg:#241C14;--code-text:#EAD9BE;--code-inline:#FBEFD9;
  --display:'Fraunces',Georgia,serif;--body:'Newsreader',Georgia,serif;--mono:'JetBrains Mono',monospace;
}
*{box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{margin:0;background:var(--bg);color:var(--text);font-family:var(--body);font-size:18px;line-height:1.7;-webkit-font-smoothing:antialiased;}
.shell{display:grid;grid-template-columns:320px 1fr;min-height:100vh;}
aside{position:sticky;top:0;height:100vh;overflow-y:auto;background:var(--sidebar);border-right:1px solid var(--border);}
aside::-webkit-scrollbar{width:8px;} aside::-webkit-scrollbar-thumb{background:var(--border);border-radius:8px;}
.brand{padding:30px 26px 18px;border-bottom:1px solid var(--border-soft);}
.brand .kicker{font-family:var(--mono);font-size:10px;letter-spacing:.28em;text-transform:uppercase;color:var(--accent);}
.brand h1{font-family:var(--display);font-weight:600;font-size:25px;line-height:1.08;margin:8px 0 4px;color:var(--text);}
.brand p{margin:0;font-size:13px;color:var(--muted);font-family:var(--mono);letter-spacing:.02em;}
.tabs{padding:16px 14px 6px;display:flex;flex-direction:column;gap:6px;}
.tab{display:flex;gap:10px;align-items:baseline;text-align:left;background:none;border:1px solid transparent;border-radius:9px;padding:10px 12px;cursor:pointer;color:var(--muted);font-family:var(--body);font-size:15px;transition:.15s;}
.tab:hover{background:var(--card);color:var(--text);}
.tab.active{background:var(--card);color:var(--accent-deep);border-color:var(--border);box-shadow:inset 3px 0 0 var(--accent);}
.tab .tnum{font-family:var(--mono);font-size:11px;color:var(--accent);opacity:.75;min-width:18px;}
.tab .tlabel{font-weight:500;}
.toc{padding:8px 14px 60px;border-top:1px solid var(--border-soft);margin-top:10px;}
.toc-head{font-family:var(--mono);font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:var(--faint);padding:10px 12px 6px;}
.toc a{display:block;text-decoration:none;color:var(--muted);font-size:13.5px;line-height:1.45;padding:5px 12px;border-radius:7px;border-left:2px solid transparent;transition:.13s;}
.toc a:hover{background:var(--card);color:var(--text);}
.toc a.lvl3{padding-left:26px;font-size:13px;color:var(--faint);}
.toc a.active{color:var(--accent-deep);border-left-color:var(--accent);background:var(--card);}
main{max-width:860px;width:100%;}
.doc{padding:54px 64px 140px;animation:fade .4s ease;}
@keyframes fade{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:none;}}
.doc h1{font-family:var(--display);font-weight:700;font-size:38px;line-height:1.12;margin:0 0 6px;color:var(--text);}
.doc h2{font-family:var(--display);font-weight:600;font-size:27px;margin:48px 0 8px;padding-top:18px;border-top:1px solid var(--border);color:var(--accent-deep);line-height:1.18;}
.doc h3{font-family:var(--display);font-weight:600;font-size:21px;margin:34px 0 6px;color:var(--text);}
.doc h4{font-family:var(--mono);font-weight:500;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--accent);margin:26px 0 6px;}
.doc p{margin:14px 0;}
.doc a{color:var(--accent);text-decoration:none;border-bottom:1px solid var(--border);}
.doc a:hover{border-bottom-color:var(--accent);}
.doc strong{font-weight:600;color:var(--text);}
.doc em{font-style:italic;}
.doc ul,.doc ol{margin:14px 0;padding-left:26px;}
.doc li{margin:7px 0;}
.doc li::marker{color:var(--accent-soft);}
.doc hr{border:none;border-top:1px solid var(--border);margin:38px 0;}
.doc blockquote{margin:20px 0;padding:14px 18px;background:var(--surface);border-left:3px solid var(--accent-soft);border-radius:0 10px 10px 0;color:var(--muted);font-size:16px;}
.doc blockquote p{margin:6px 0;}
.doc code{font-family:var(--mono);font-size:14px;background:var(--code-inline);color:var(--accent-deep);padding:2px 6px;border-radius:5px;border:1px solid var(--border-soft);}
.doc pre{background:var(--code-bg);color:var(--code-text);border-radius:12px;padding:18px 20px;overflow-x:auto;margin:20px 0;border:1px solid #0e0a06;box-shadow:0 14px 40px -26px rgba(0,0,0,.6);}
.doc pre code{background:none;border:none;color:var(--code-text);font-size:13.5px;line-height:1.6;padding:0;}
.doc table{width:100%;border-collapse:collapse;margin:22px 0;font-size:15.5px;}
.doc th,.doc td{border:1px solid var(--border);padding:9px 13px;text-align:left;vertical-align:top;}
.doc th{background:var(--surface);font-family:var(--mono);font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--accent-deep);font-weight:500;}
.doc tr:nth-child(even) td{background:var(--card);}
.doc img{max-width:100%;border-radius:10px;}
.footer{max-width:860px;margin:0;padding:0 64px 60px;color:var(--faint);font-size:12px;font-family:var(--mono);}
.footer a{color:var(--accent);}
.mobile-bar{display:none;}
.scrim{display:none;}
@media(max-width:900px){
  .shell{grid-template-columns:1fr;}
  aside{position:fixed;left:0;top:0;width:300px;z-index:50;transform:translateX(-100%);transition:.3s;}
  aside.open{transform:none;}
  .mobile-bar{display:flex;align-items:center;gap:12px;position:sticky;top:0;z-index:40;padding:12px 18px;background:rgba(251,247,240,.92);backdrop-filter:blur(8px);border-bottom:1px solid var(--border);}
  .menu-btn{font-family:var(--mono);background:var(--card);border:1px solid var(--border);color:var(--accent);padding:8px 12px;border-radius:8px;cursor:pointer;}
  .mtitle{font-family:var(--display);font-weight:600;color:var(--text);}
  .doc{padding:30px 22px 100px;} .footer{padding:0 22px 60px;}
  .doc h1{font-size:30px;} .doc h2{font-size:23px;}
  .scrim.show{display:block;position:fixed;inset:0;background:rgba(43,33,24,.35);z-index:45;}
}
</style>
</head>
<body>
<div class="shell">
  <aside id="sidebar">
    <div class="brand">
      <span class="kicker">// practice · perform · produce</span>
      <h1>The Ultimate<br>Guitar Roadmap</h1>
      <p>three roadmaps · zero → stage-ready</p>
    </div>
    <div class="tabs" id="tabs"></div>
    <div class="toc"><div class="toc-head">On this roadmap</div><div id="toc"></div></div>
  </aside>
  <div class="scrim" id="scrim"></div>
  <main>
    <div class="mobile-bar">
      <button class="menu-btn" id="menuBtn">☰ menu</button>
      <span class="mtitle" id="mtitle">The Ultimate Guitar Roadmap</span>
    </div>
    <div class="doc" id="doc"></div>
    <div class="footer">
      Some links are Amazon affiliate links — as an Amazon Associate I earn from qualifying purchases, at no extra cost to you. · The Ultimate Guitar Roadmap
    </div>
  </main>
</div>
<script>
const DATA = ${json};
const tabsEl=document.getElementById('tabs');
const tocEl=document.getElementById('toc');
const docEl=document.getElementById('doc');
const mtitle=document.getElementById('mtitle');
let current=0;
function renderTabs(){
  tabsEl.innerHTML='';
  DATA.forEach((r,i)=>{
    const b=document.createElement('button');
    b.className='tab'+(i===current?' active':'');
    b.innerHTML='<span class="tnum">'+(i+1)+'</span><span class="tlabel">'+r.label+'</span>';
    b.onclick=()=>{select(i);closeSidebar();};
    tabsEl.appendChild(b);
  });
}
function renderToc(){
  const r=DATA[current];
  tocEl.innerHTML=r.toc.map(t=>'<a class="lvl'+t.level+'" href="#'+t.id+'" data-id="'+t.id+'">'+t.text+'</a>').join('');
  tocEl.querySelectorAll('a').forEach(a=>{
    a.onclick=e=>{
      e.preventDefault();
      const el=document.getElementById(a.dataset.id);
      if(el)el.scrollIntoView({behavior:'smooth',block:'start'});
      closeSidebar();
    };
  });
}
function select(i){
  current=i;
  docEl.innerHTML=DATA[i].html;
  mtitle.textContent=DATA[i].label;
  renderTabs();renderToc();
  window.scrollTo({top:0,behavior:'smooth'});
}
// Active-section highlighting in the TOC as you scroll
let ticking=false;
window.addEventListener('scroll',()=>{
  if(ticking)return; ticking=true;
  requestAnimationFrame(()=>{
    const heads=DATA[current].toc.map(t=>document.getElementById(t.id)).filter(Boolean);
    let activeId=null;
    for(const h of heads){ if(h.getBoundingClientRect().top<=120) activeId=h.id; else break; }
    tocEl.querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.dataset.id===activeId));
    ticking=false;
  });
});
const sidebar=document.getElementById('sidebar');
const scrim=document.getElementById('scrim');
document.getElementById('menuBtn').addEventListener('click',()=>{sidebar.classList.toggle('open');scrim.classList.toggle('show');});
scrim.addEventListener('click',closeSidebar);
function closeSidebar(){sidebar.classList.remove('open');scrim.classList.remove('show');}
select(0);
</script>
</body>
</html>
`;
}

build();
