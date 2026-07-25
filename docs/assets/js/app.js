const I={
  de:{games:"Spiele",new:"Neu",about:"Über",play:"Spielen",eyebrow:"KOSTENLOS · DIREKT · OHNE DOWNLOAD",headline:"Deine nächste Runde beginnt hier.",lead:"Entdecke handverlesene HTML5-Games – sofort spielbar auf deinem Gerät.",playNow:"Jetzt spielen",all:"Alle Spiele",search:"Spiele durchsuchen …",popular:"Beliebte Spiele",filterAll:"Alle",mobile:"Mobil",empty:"Keine passenden Spiele gefunden.",aboutTitle:"Gebaut fürs offene Web.",aboutText:"ArcadeForge läuft komplett im Browser, sammelt keine Kontodaten und funktioniert als statische GitHub-Pages-Website.",original:"Originalspiele",desktop:"Desktop",tablet:"Tablet",start:"Spiel starten",loading:"Spiele werden geladen …",error:"Die Spieleliste konnte nicht geladen werden."},
  en:{games:"Games",new:"New",about:"About",play:"Play",eyebrow:"FREE · INSTANT · NO DOWNLOAD",headline:"Your next round starts here.",lead:"Discover hand-picked HTML5 games – instantly playable on your device.",playNow:"Play now",all:"All games",search:"Search games …",popular:"Popular games",filterAll:"All",mobile:"Mobile",empty:"No matching games found.",aboutTitle:"Built for the open web.",aboutText:"ArcadeForge runs entirely in your browser, collects no account data and works as a static GitHub Pages site.",original:"Original games",desktop:"Desktop",tablet:"Tablet",start:"Play game",loading:"Loading games …",error:"The game library could not be loaded."}
};
const S={lang:localStorage.getItem("af-lang")||(navigator.language.startsWith("de")?"de":"en"),device:"all",q:"",games:[]};
const grid=document.querySelector("#grid"),empty=document.querySelector("#empty"),t=k=>I[S.lang][k]||k;
function icon(d){return d==="desktop"?"▣":d==="mobile"?"▯":"◇"}
function render(){
  const q=S.q.trim().toLowerCase();
  const games=S.games.filter(g=>(S.device==="all"||g.devices.includes(S.device))&&(!q||`${g.title[S.lang]} ${g.description[S.lang]} ${g.genre[S.lang]}`.toLowerCase().includes(q)));
  grid.innerHTML=games.map((g,i)=>`<article class="card" style="--delay:${i*70}ms"><a class="cover" href="${g.playUrl}" aria-label="${t("start")}: ${g.title[S.lang]}"><img src="${g.cover}" alt="" loading="lazy"><i>▶</i></a><div class="card-body"><div class="title-row"><div><h3>${g.title[S.lang]}</h3><p>${g.genre[S.lang]}</p></div><a href="${g.playUrl}" aria-label="${t("start")}: ${g.title[S.lang]}">↗</a></div><p class="desc">${g.description[S.lang]}</p><div class="badges">${g.devices.map(d=>`<span>${icon(d)} ${t(d)}</span>`).join("")}<span>◎ ${g.languages.map(x=>x.toUpperCase()).join(" · ")}</span></div></div></article>`).join("");
  empty.hidden=games.length>0;
}
function language(){
  document.documentElement.lang=S.lang;document.querySelector("#lang b").textContent=S.lang.toUpperCase();
  document.querySelectorAll("[data-t]").forEach(e=>e.textContent=t(e.dataset.t));
  document.querySelectorAll("[data-placeholder]").forEach(e=>e.placeholder=t(e.dataset.placeholder));
  if(S.games.length)render();
}
document.querySelector("#lang").addEventListener("click",()=>{S.lang=S.lang==="de"?"en":"de";localStorage.setItem("af-lang",S.lang);language()});
document.querySelectorAll("[data-device]").forEach(b=>b.addEventListener("click",()=>{S.device=b.dataset.device;document.querySelectorAll("[data-device]").forEach(x=>x.classList.toggle("active",x===b));render()}));
const search=document.querySelector("#search");search.addEventListener("input",()=>{S.q=search.value;render()});
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();search.focus()}if(e.key==="Escape"&&document.activeElement===search){search.value="";S.q="";render();search.blur()}});
grid.innerHTML=`<p class="loading">${t("loading")}</p>`;
fetch("./games/catalog.json").then(r=>{if(!r.ok)throw Error(r.status);return r.json()}).then(c=>{S.games=c.games;language()}).catch(()=>grid.innerHTML=`<p class="loading error">${t("error")}</p>`);
language();
