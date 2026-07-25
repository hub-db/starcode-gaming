/* global THREE */
(()=>{"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],clamp=THREE.MathUtils.clamp;
const coarse=matchMedia("(pointer:coarse)").matches||navigator.maxTouchPoints>0,CELL=4;
const MAP=[
"#################",
"#S....#.....F...#",
"#.##..#..###....#",
"#.....#.........#",
"###.#####.###.#.#",
"#...#.....#...#.#",
"#.F.#.###.#.###.#",
"#...#...#.#.....#",
"#.#####.#.#####.#",
"#.......#.......#",
"#.###.#####.###.#",
"#...#.....#...#.#",
"#.#.###.#.###.#.#",
"#.#.....#.....#.#",
"#...F.......#..E#",
"#################"
];
const U={menu:$("#menu"),how:$("#howbox"),pause:$("#pausebox"),over:$("#overbox"),win:$("#winbox"),hud:$("#hud"),status:$("#status"),mobile:$("#mobile"),cross:$("#crosshair"),obj:$("#objective"),battery:$("#battery"),batteryText:$("#batteryText"),fuses:$("#fuses"),warning:$("#warning"),prompt:$("#prompt"),blood:$("#blood"),jump:$("#jumpscare"),lamp:$("#lamp")};
const S={mode:"menu",yaw:Math.PI,pitch:0,battery:100,fuses:0,light:true,sprint:false,hunt:0,pathTimer:0,time:0,jumpTime:0,scareTimer:35,sound:true,move:{f:0,r:0}};
let spawn={x:6,z:6},exitPos=null;
const fuseSpots=[];

const scene=new THREE.Scene();scene.background=new THREE.Color(0x030403);scene.fog=new THREE.FogExp2(0x080a07,.047);
const cam=new THREE.PerspectiveCamera(68,innerWidth/innerHeight,.05,120);cam.rotation.order="YXZ";
const renderer=new THREE.WebGLRenderer({antialias:!coarse,powerPreference:"high-performance"});renderer.setPixelRatio(Math.min(devicePixelRatio,coarse?1.35:1.7));renderer.setSize(innerWidth,innerHeight);renderer.outputEncoding=THREE.sRGBEncoding;renderer.shadowMap.enabled=!coarse;renderer.shadowMap.type=THREE.PCFSoftShadowMap;$("#game").appendChild(renderer.domElement);
const clock=new THREE.Clock(),world=new THREE.Group(),collectibles=[],flickers=[];
scene.add(world,new THREE.HemisphereLight(0x63705b,0x080908,.17));
const flashlight=new THREE.SpotLight(0xe8efd8,3.8,22,Math.PI/7,.55,1.5);flashlight.castShadow=!coarse;flashlight.shadow.mapSize.set(512,512);scene.add(flashlight,flashlight.target);
const handLight=new THREE.PointLight(0xb8c9a4,.17,4);scene.add(handLight);

const materials={
 wall:new THREE.MeshStandardMaterial({color:0x2c302a,roughness:.92,metalness:.06}),
 tile:new THREE.MeshStandardMaterial({color:0x20231f,roughness:.95}),
 ceiling:new THREE.MeshStandardMaterial({color:0x121410,roughness:1}),
 metal:new THREE.MeshStandardMaterial({color:0x333831,roughness:.42,metalness:.8}),
 red:new THREE.MeshStandardMaterial({color:0x6f1717,emissive:0x310404,emissiveIntensity:.7}),
 fuse:new THREE.MeshStandardMaterial({color:0xe1aa43,emissive:0xa76509,emissiveIntensity:2.2}),
 dark:new THREE.MeshStandardMaterial({color:0x070807,roughness:.8}),
 eye:new THREE.MeshBasicMaterial({color:0xff1e12}),
 monsterSkin:new THREE.MeshStandardMaterial({color:0x8f9186,roughness:.78,metalness:0,emissive:0x241010,emissiveIntensity:.5}),
 monsterFlesh:new THREE.MeshStandardMaterial({color:0x5d0707,roughness:.7,emissive:0x390000,emissiveIntensity:1.15}),
 tooth:new THREE.MeshBasicMaterial({color:0xfff2c9})
};

function buildWorld(){
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(MAP[0].length*CELL,MAP.length*CELL),materials.tile);floor.rotation.x=-Math.PI/2;floor.position.set(MAP[0].length*CELL/2,0,MAP.length*CELL/2);floor.receiveShadow=true;world.add(floor);
 const ceil=floor.clone();ceil.material=materials.ceiling;ceil.position.y=3.7;ceil.rotation.x=Math.PI/2;world.add(ceil);
 for(let r=0;r<MAP.length;r++)for(let c=0;c<MAP[r].length;c++){const ch=MAP[r][c],x=c*CELL+CELL/2,z=r*CELL+CELL/2;
  if(ch==="#"){const w=new THREE.Mesh(new THREE.BoxGeometry(CELL,3.7,CELL),materials.wall);w.position.set(x,1.85,z);w.castShadow=w.receiveShadow=!coarse;world.add(w);
   if((r+c)%3===0){const stain=new THREE.Mesh(new THREE.PlaneGeometry(1.5,.7),materials.red);stain.position.set(x,1.5,z-CELL/2-.012);world.add(stain)}}
  if(ch==="S")spawn={x,z};
  if(ch==="F"){fuseSpots.push({x,z});makeFuse(x,z)}
  if(ch==="E"){exitPos={x,z};makeExit(x,z)}
 }
 for(let r=2;r<MAP.length-1;r+=3)for(let c=1;c<MAP[0].length-1;c+=4)if(MAP[r][c]!== "#")makeLamp(c*CELL+2,r*CELL+2);
 makeSigns();makeDebris();makeStationScene();
}
function makeLamp(x,z){const fixture=new THREE.Mesh(new THREE.BoxGeometry(1.8,.12,.42),materials.metal);fixture.position.set(x,3.52,z);world.add(fixture);const light=new THREE.PointLight(0xb6c8a5,.65,9,2);light.position.set(x,3.35,z);light.userData.base=.45+Math.random()*.35;world.add(light);flickers.push(light)}
function makeFuse(x,z){const g=new THREE.Group(),glass=new THREE.MeshStandardMaterial({color:0xe5c774,transparent:true,opacity:.68,roughness:.15,emissive:0x6b3b00,emissiveIntensity:.8}),a=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.86,16),glass);a.rotation.z=Math.PI/2;g.add(a);[-.52,.52].forEach(q=>{const cap=new THREE.Mesh(new THREE.CylinderGeometry(.23,.23,.22,12),materials.metal);cap.rotation.z=Math.PI/2;cap.position.x=q;g.add(cap)});const ring=new THREE.Mesh(new THREE.TorusGeometry(.58,.035,6,24),materials.fuse);ring.rotation.x=Math.PI/2;g.add(ring);g.position.set(x,1.05,z);g.userData.fuse=true;world.add(g);collectibles.push(g)}
function makeExit(x,z){const g=new THREE.Group();for(const q of [-1.5,1.5]){const p=new THREE.Mesh(new THREE.BoxGeometry(.28,3.5,.35),materials.metal);p.position.x=q;g.add(p)}const top=new THREE.Mesh(new THREE.BoxGeometry(3.3,.28,.35),materials.metal);top.position.y=3.35;g.add(top);const door=new THREE.Mesh(new THREE.BoxGeometry(2.7,3.1,.22),materials.red);door.position.y=1.55;door.userData.door=true;g.add(door);const light=new THREE.PointLight(0xff2018,1.8,7);light.position.set(0,2.8,-.5);g.add(light);g.position.set(x,0,z);g.userData.exit=true;world.add(g);exitPos.group=g}
function makeSigns(){for(const [x,z,rot,text] of [[6,22,0,"GLEIS 04"],[50,38,Math.PI/2,"AUSGANG"],[22,58,0,"NICHT BETRETEN"]]){const cv=document.createElement("canvas");cv.width=512;cv.height=128;const c=cv.getContext("2d");c.fillStyle="#d7d9c8";c.fillRect(0,0,512,128);c.fillStyle="#191b18";c.font="bold 48px Arial";c.textAlign="center";c.fillText(text,256,80);const m=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv)}),p=new THREE.Mesh(new THREE.PlaneGeometry(3.4,.85),m);p.position.set(x,2.25,z);p.rotation.y=rot;world.add(p)}}
function makeDebris(){for(let i=0;i<35;i++){const c=1+Math.floor(Math.random()*(MAP[0].length-2)),r=1+Math.floor(Math.random()*(MAP.length-2));if(MAP[r][c]==="#")continue;const d=new THREE.Mesh(new THREE.BoxGeometry(.15+Math.random()*.6,.05+Math.random()*.15,.2+Math.random()*.8),materials.dark);d.position.set(c*CELL+1+Math.random()*2,.08,r*CELL+1+Math.random()*2);d.rotation.y=Math.random()*6;world.add(d)}}
function makeStationScene(){
 const steel=new THREE.MeshStandardMaterial({color:0x555b56,roughness:.3,metalness:.9}),wood=new THREE.MeshStandardMaterial({color:0x493326,roughness:.92}),yellow=new THREE.MeshStandardMaterial({color:0xc6a429,roughness:.82,emissive:0x302300,emissiveIntensity:.25}),trainMat=new THREE.MeshStandardMaterial({color:0x474e49,roughness:.58,metalness:.55}),windowMat=new THREE.MeshStandardMaterial({color:0x071218,roughness:.12,metalness:.72,emissive:0x071018,emissiveIntensity:.5});
 // Alte Gleise mit Holzschwellen und gelber Bahnsteigkante.
 for(let x=4;x<65;x+=1.5){const sleeper=new THREE.Mesh(new THREE.BoxGeometry(1.15,.1,2.7),wood);sleeper.position.set(x,.06,38);world.add(sleeper)}
 [-.72,.72].forEach(z=>{const rail=new THREE.Mesh(new THREE.BoxGeometry(62,.13,.12),steel);rail.position.set(34,.16,38+z);world.add(rail)});
 const edge=new THREE.Mesh(new THREE.BoxGeometry(62,.09,.42),yellow);edge.position.set(34,.12,35.9);world.add(edge);
 // Verlassener Zug am gegenüberliegenden Gleis.
 const train=new THREE.Group(),car=new THREE.Mesh(new THREE.BoxGeometry(28,3.15,2.55),trainMat);car.position.y=1.72;car.castShadow=true;train.add(car);
 for(let x=-11.5;x<=11.5;x+=3.2){const win=new THREE.Mesh(new THREE.PlaneGeometry(1.75,.82),windowMat);win.position.set(x,2.18,-1.281);train.add(win)}
 for(const x of [-7.9,0,7.9]){const door=new THREE.Mesh(new THREE.PlaneGeometry(1.55,2.45),materials.metal);door.position.set(x,1.48,-1.292);train.add(door)}
 train.position.set(34,0,40.5);world.add(train);
 // Bänke, Mülleimer und Deckenrohre.
 [[10,10,0],[30,34,0],[54,54,Math.PI/2]].forEach(([x,z,rot])=>{const g=new THREE.Group();for(const q of [-.32,.32]){const slat=new THREE.Mesh(new THREE.BoxGeometry(2.7,.14,.45),wood);slat.position.set(0,q,q);g.add(slat)}for(const q of [-1,1]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.12,.72,.12),steel);leg.position.set(q,-.42,0);g.add(leg)}g.position.set(x,.83,z);g.rotation.y=rot;world.add(g)});
 [[14,6],[54,34],[30,58]].forEach(([x,z])=>{const bin=new THREE.Mesh(new THREE.CylinderGeometry(.38,.46,1.05,14),new THREE.MeshStandardMaterial({color:0x24342a,roughness:.7,metalness:.4}));bin.position.set(x,.54,z);world.add(bin)});
 for(const z of [1.2,62.8]){const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.085,.085,62,10),steel);pipe.position.set(34,3.25,z);pipe.rotation.z=Math.PI/2;world.add(pipe)}
}
function makeMonster(){
 const g=new THREE.Group(),body=new THREE.Mesh(new THREE.CylinderGeometry(.38,.7,2.15,9),materials.monsterSkin);body.position.y=1.48;body.castShadow=true;g.add(body);
 const ribs=new THREE.Mesh(new THREE.TorusGeometry(.48,.08,6,10,Math.PI),materials.monsterFlesh);ribs.position.set(0,1.72,-.37);ribs.rotation.z=Math.PI/2;g.add(ribs);
 const head=new THREE.Mesh(new THREE.SphereGeometry(.6,16,12),materials.monsterSkin);head.scale.set(.88,1.3,.86);head.position.y=2.88;head.castShadow=true;g.add(head);
 [-.22,.22].forEach(x=>{const socket=new THREE.Mesh(new THREE.SphereGeometry(.12,9,7),materials.monsterFlesh);socket.position.set(x,2.99,-.47);g.add(socket);const e=new THREE.Mesh(new THREE.SphereGeometry(.065,8,6),materials.eye);e.position.set(x,2.99,-.565);g.add(e)});
 const mouth=new THREE.Mesh(new THREE.CircleGeometry(.28,18),materials.monsterFlesh);mouth.position.set(0,2.61,-.515);mouth.rotation.y=Math.PI;mouth.scale.y=1.55;g.add(mouth);
 for(let i=-3;i<=3;i++){const tooth=new THREE.Mesh(new THREE.ConeGeometry(.045,.22,6),materials.tooth);tooth.position.set(i*.075,2.72,-.555);tooth.rotation.x=Math.PI;g.add(tooth);const lower=tooth.clone();lower.position.y=2.5;lower.rotation.x=0;g.add(lower)}
 [-.58,.58].forEach(x=>{const arm=new THREE.Mesh(new THREE.CylinderGeometry(.1,.16,2.55,7),materials.monsterSkin);arm.position.set(x,1.42,-.02);arm.rotation.z=x<0?-.2:.2;arm.castShadow=true;g.add(arm);const claw=new THREE.Mesh(new THREE.ConeGeometry(.18,.52,5),materials.monsterFlesh);claw.position.set(x<0?-.82:.82,.2,-.05);claw.rotation.z=x<0?-2.7:2.7;g.add(claw)});
 const glow=new THREE.PointLight(0xff1a0b,1.5,4);glow.position.set(0,2.85,-.7);g.add(glow);
 g.position.set(58,0,54);scene.add(g);return g;
}
buildWorld();const monster=makeMonster();cam.position.set(spawn.x,1.7,spawn.z);

class Sound{
 init(){if(this.ctx){this.ctx.resume();return}const C=window.AudioContext||window.webkitAudioContext;if(!C)return;this.ctx=new C;this.master=this.ctx.createGain();this.master.gain.value=.22;this.master.connect(this.ctx.destination);this.drone=this.ctx.createOscillator();this.drone.type="sawtooth";this.drone.frequency.value=37;const f=this.ctx.createBiquadFilter();f.type="lowpass";f.frequency.value=115;this.dg=this.ctx.createGain();this.dg.gain.value=.08;this.drone.connect(f);f.connect(this.dg);this.dg.connect(this.master);this.drone.start()}
 tone(type){if(!this.ctx)return;const map={fuse:[180,650,.45],lamp:[90,45,.14],hit:[80,25,.7],shriek:[980,85,.58],door:[120,320,.65],step:[55,45,.06]},v=map[type],o=this.ctx.createOscillator(),g=this.ctx.createGain(),n=this.ctx.currentTime;o.type=type==="fuse"?"sine":"sawtooth";o.frequency.setValueAtTime(v[0],n);o.frequency.exponentialRampToValueAtTime(v[1],n+v[2]);g.gain.setValueAtTime(type==="hit"?.3:type==="shriek"?.42:.08,n);g.gain.exponentialRampToValueAtTime(.001,n+v[2]);o.connect(g);g.connect(this.master);o.start();o.stop(n+v[2])}
 danger(d){if(this.dg)this.dg.gain.setTargetAtTime(.07+clamp(1-d/18,0,1)*.14,this.ctx.currentTime,.1)}
}const sound=new Sound;

function cell(x,z){return {c:Math.floor(x/CELL),r:Math.floor(z/CELL)}}
function open(x,z){const {c,r}=cell(x,z);return r>=0&&r<MAP.length&&c>=0&&c<MAP[0].length&&MAP[r][c]!=="#"}
function tryMove(obj,dx,dz,rad=.42){const nx=obj.position.x+dx,nz=obj.position.z+dz;if(open(nx+Math.sign(dx)*rad,obj.position.z))obj.position.x=nx;if(open(obj.position.x,nz+Math.sign(dz)*rad))obj.position.z=nz}
function pathTo(from,to){
 const a=cell(from.x,from.z),b=cell(to.x,to.z),key=(r,c)=>`${r},${c}`,q=[[a.r,a.c]],prev=new Map([[key(a.r,a.c),null]]);
 for(let i=0;i<q.length;i++){const [r,c]=q[i];if(r===b.r&&c===b.c)break;for(const [dr,dc] of [[1,0],[-1,0],[0,1],[0,-1]]){const nr=r+dr,nc=c+dc,k=key(nr,nc);if(nr>=0&&nr<MAP.length&&nc>=0&&nc<MAP[0].length&&MAP[nr][nc]!=="#"&&!prev.has(k)){prev.set(k,[r,c]);q.push([nr,nc])}}}
 let cur=[b.r,b.c],p=[];if(!prev.has(key(...cur)))return p;while(cur){p.push({x:cur[1]*CELL+2,z:cur[0]*CELL+2});cur=prev.get(key(...cur))}return p.reverse();
}
function hasSight(from,to){
 const dx=to.x-from.x,dz=to.z-from.z,n=Math.ceil(Math.hypot(dx,dz)/.35);
 for(let i=1;i<n;i++)if(!open(from.x+dx*i/n,from.z+dz*i/n))return false;
 return true;
}
function randomOpenPoint(){for(let i=0;i<80;i++){const c=1+Math.floor(Math.random()*(MAP[0].length-2)),r=1+Math.floor(Math.random()*(MAP.length-2));if(MAP[r][c]!=="#")return{x:c*CELL+2,z:r*CELL+2}}return{x:58,z:54}}
let monsterPath=[],stepTimer=0,patrolTimer=0,patrolTarget=null;
function updatePlayer(dt){
 const forward=new THREE.Vector3(-Math.sin(S.yaw),0,-Math.cos(S.yaw)),right=new THREE.Vector3(Math.cos(S.yaw),0,-Math.sin(S.yaw)),moving=Math.abs(S.move.f)+Math.abs(S.move.r)>.05;
 const speed=S.sprint?5.5:3.2,vec=forward.multiplyScalar(S.move.f).add(right.multiplyScalar(S.move.r));if(vec.lengthSq()>1)vec.normalize();tryMove(cam,vec.x*speed*dt,vec.z*speed*dt);
 cam.position.y=1.7+(moving?Math.sin(S.time*(S.sprint?13:9))*.055:0);cam.rotation.y=S.yaw;cam.rotation.x=S.pitch;
 flashlight.position.copy(cam.position);flashlight.target.position.copy(cam.position).add(new THREE.Vector3(0,0,-1).applyEuler(cam.rotation));handLight.position.copy(cam.position);flashlight.visible=S.light&&S.battery>0;handLight.visible=flashlight.visible;
 if(flashlight.visible){S.battery=clamp(S.battery-dt*.55,0,100);flashlight.intensity=S.battery<15&&Math.random()<.05?.35:3.8}if(S.battery<=0){S.light=false;U.lamp.classList.remove("on")}
 if(moving){stepTimer-=dt;if(stepTimer<=0){sound.tone("step");stepTimer=S.sprint?.28:.48}}
}
function updateMonster(dt){
 let dist=Math.hypot(monster.position.x-cam.position.x,monster.position.z-cam.position.z),moving=Math.abs(S.move.f)+Math.abs(S.move.r)>.08;
 const sees=hasSight(monster.position,cam.position)&&dist<(S.light?31:11),hears=(S.sprint&&moving&&dist<25)||(moving&&dist<7);
 if(sees||hears){S.hunt=Math.max(S.hunt,8);patrolTarget={x:cam.position.x,z:cam.position.z}}
 S.hunt=Math.max(0,S.hunt-dt);S.pathTimer-=dt;patrolTimer-=dt;
 if(S.hunt<=0&&(patrolTimer<=0||!patrolTarget)){patrolTarget=randomOpenPoint();patrolTimer=7+Math.random()*8;monsterPath=[];S.pathTimer=0}
 const destination=S.hunt>0?cam.position:patrolTarget;
 if(S.pathTimer<=0&&destination){monsterPath=pathTo(monster.position,destination);S.pathTimer=S.hunt>0?.3:1.2}
 const t=monsterPath.length>1?monsterPath[1]:destination,v=t?new THREE.Vector3(t.x-monster.position.x,0,t.z-monster.position.z):new THREE.Vector3();
 if(monsterPath.length>1&&v.length()<.3)monsterPath.shift();else if(v.lengthSq()>.001){v.normalize();const sp=S.hunt>0?4.15:1.7;tryMove(monster,v.x*sp*dt,v.z*sp*dt,.38);monster.rotation.y=Math.atan2(v.x,v.z)+Math.PI}
 monster.position.y=Math.sin(S.time*5)*.05;monster.children.forEach((x,i)=>{if(i>2)x.rotation.z+=Math.sin(S.time*7+i)*.004});
 if(S.hunt>0&&!U.warning.classList.contains("on")){U.warning.classList.add("on");setTimeout(()=>U.warning.classList.remove("on"),1600)}
 dist=Math.hypot(monster.position.x-cam.position.x,monster.position.z-cam.position.z);sound.danger(S.hunt>0?dist:40);if(S.hunt>0&&dist<1.45)lose();
}
function updateItems(dt){
 collectibles.forEach(x=>{if(!x.visible)return;x.rotation.y+=dt*1.3;x.position.y=1.05+Math.sin(S.time*2+x.position.x)*.12;if(x.position.distanceTo(cam.position)<1.25){x.visible=false;S.fuses++;S.battery=clamp(S.battery+25,0,100);sound.tone("fuse");flashText("SICHERUNG GEFUNDEN");if(S.fuses===3){U.obj.textContent="Erreiche das Notfalltor";exitPos.group.children.find(q=>q.userData.door).material=new THREE.MeshStandardMaterial({color:0x284225,emissive:0x173a11,emissiveIntensity:1});exitPos.group.children.at(-1).color.set(0x51ff49)}}});
 const d=Math.hypot(cam.position.x-exitPos.x,cam.position.z-exitPos.z);if(d<1.8){U.prompt.textContent=S.fuses===3?"TOR ÖFFNEN":"NOCH 3 SICHERUNGEN BENÖTIGT".replace("3",3-S.fuses);U.prompt.classList.add("show");if(S.fuses===3)win()}else U.prompt.classList.remove("show");
}
function flashText(t){U.prompt.textContent=t;U.prompt.classList.add("show");setTimeout(()=>{if(U.prompt.textContent===t)U.prompt.classList.remove("show")},1500)}
function flicker(){flickers.forEach((l,i)=>{const bad=Math.sin(S.time*9+i*7)+Math.sin(S.time*21+i)>1.45;l.intensity=bad?0:l.userData.base})}
function hud(){U.battery.style.transform=`scaleX(${S.battery/100})`;U.batteryText.textContent=`${Math.ceil(S.battery)}%`;U.fuses.textContent=`${S.fuses} / 3`}
function updateRandomScare(dt){S.scareTimer-=dt;if(S.scareTimer>0||S.hunt>0)return;S.scareTimer=42+Math.random()*55;sound.tone("shriek");U.jump.classList.add("on");U.blood.classList.remove("on");void U.blood.offsetWidth;U.blood.classList.add("on");setTimeout(()=>U.jump.classList.remove("on"),180)}
function reset(){Object.assign(S,{mode:"run",yaw:Math.PI,pitch:0,battery:100,fuses:0,light:true,sprint:false,hunt:0,pathTimer:0,time:0,jumpTime:0,scareTimer:28+Math.random()*35,move:{f:0,r:0}});cam.position.set(spawn.x,1.7,spawn.z);monster.position.set(54,0,14);monster.scale.setScalar(1);monster.visible=true;monsterPath=[];patrolTimer=0;patrolTarget=null;collectibles.forEach(x=>x.visible=true);U.obj.textContent="Finde die Sicherungen";U.lamp.classList.add("on");U.blood.classList.remove("on");U.jump.classList.remove("on");hud()}
async function start(){sound.init();reset();[U.menu,U.how,U.pause,U.over,U.win].forEach(x=>x.classList.remove("active"));[U.hud,U.status,U.cross].forEach(x=>x.classList.remove("hide"));if(coarse)U.mobile.classList.remove("hide");clock.getDelta();if(!document.fullscreenElement)try{await document.documentElement.requestFullscreen({navigationUI:"hide"})}catch(_){}if(!coarse)renderer.domElement.requestPointerLock?.()}
function setPause(on){if(on&&S.mode==="run"){S.mode="pause";U.pause.classList.add("active");document.exitPointerLock?.()}else if(!on&&S.mode==="pause"){S.mode="run";U.pause.classList.remove("active");clock.getDelta();if(!coarse)renderer.domElement.requestPointerLock?.()}}
function lose(){if(S.mode!=="run")return;S.mode="jumpscare";S.jumpTime=0;S.move.f=S.move.r=0;S.light=true;monster.visible=true;flashlight.visible=true;flashlight.intensity=9;sound.tone("hit");document.exitPointerLock?.()}
function updateJumpscare(dt){
 S.jumpTime+=dt;
 const t=clamp(S.jumpTime/1.35,0,1),rush=1-Math.pow(1-t,3),forward=new THREE.Vector3(0,0,-1).applyEuler(cam.rotation),distance=4.8*(1-rush)+.72,scale=1+t*.72;
 monster.scale.setScalar(scale);monster.position.copy(cam.position).add(forward.multiplyScalar(distance));monster.position.y=cam.position.y-2.75*scale;monster.rotation.set(0,S.yaw+Math.PI,Math.sin(t*28)*.04);
 cam.position.x+=(Math.random()-.5)*t*.06;cam.position.y+=(Math.random()-.5)*t*.045;flashlight.position.copy(cam.position);flashlight.target.position.copy(monster.position).add(new THREE.Vector3(0,2.7*scale,0));
 if(t>.72&&!U.blood.classList.contains("on"))U.blood.classList.add("on");
 if(t>.8&&!U.jump.classList.contains("on"))U.jump.classList.add("on");
 if(t>=1){S.mode="over";flashlight.intensity=3.8;U.jump.classList.remove("on");U.over.classList.add("active")}
}
function win(){if(S.mode!=="run")return;S.mode="win";sound.tone("door");document.exitPointerLock?.();U.win.classList.add("active")}
function menu(){S.mode="menu";[U.pause,U.over,U.win].forEach(x=>x.classList.remove("active"));U.menu.classList.add("active");[U.hud,U.status,U.cross,U.mobile].forEach(x=>x.classList.add("hide"));document.exitPointerLock?.()}
function toggleLight(){if(S.mode!=="run"||S.battery<=0)return;S.light=!S.light;U.lamp.classList.toggle("on",S.light);sound.tone("lamp")}
$("#start").onclick=start;$("#again").onclick=start;$("#winAgain").onclick=start;$("#resume").onclick=()=>setPause(false);$("#pause").onclick=()=>setPause(true);$("#quit").onclick=$("#back").onclick=$("#winBack").onclick=menu;$("#how").onclick=()=>U.how.classList.add("active");$(".x").onclick=$(".ok").onclick=()=>U.how.classList.remove("active");U.lamp.onclick=toggleLight;
const keys={};addEventListener("keydown",e=>{keys[e.code]=true;if(e.code==="KeyF"&&!e.repeat)toggleLight();if((e.code==="Escape"||e.code==="KeyP")&&!e.repeat)(S.mode==="run"?setPause(true):S.mode==="pause"&&setPause(false))});addEventListener("keyup",e=>keys[e.code]=false);
addEventListener("mousemove",e=>{if(document.pointerLockElement===renderer.domElement&&S.mode==="run"){S.yaw-=e.movementX*.0022;S.pitch=clamp(S.pitch-e.movementY*.0018,-1.18,1.18)}});
renderer.domElement.addEventListener("click",()=>{if(!coarse&&S.mode==="run")renderer.domElement.requestPointerLock?.()});
let look=null;renderer.domElement.addEventListener("pointerdown",e=>{if(coarse&&e.clientX>innerWidth*.42&&S.mode==="run")look={x:e.clientX,y:e.clientY,id:e.pointerId}});
renderer.domElement.addEventListener("pointermove",e=>{if(look&&look.id===e.pointerId){S.yaw-=(e.clientX-look.x)*.006;S.pitch=clamp(S.pitch-(e.clientY-look.y)*.005,-1.18,1.18);look.x=e.clientX;look.y=e.clientY}});
renderer.domElement.addEventListener("pointerup",()=>look=null);
const stick=$("#stick"),nub=stick.querySelector("i");let stickId=null;function stickMove(e){const r=stick.getBoundingClientRect(),x=clamp(e.clientX-(r.left+r.width/2),-42,42),y=clamp(e.clientY-(r.top+r.height/2),-42,42);nub.style.transform=`translate(${x}px,${y}px)`;S.move.r=x/42;S.move.f=-y/42}
stick.addEventListener("pointerdown",e=>{stickId=e.pointerId;stick.setPointerCapture(e.pointerId);stickMove(e)});stick.addEventListener("pointermove",e=>{if(e.pointerId===stickId)stickMove(e)});["pointerup","pointercancel"].forEach(k=>stick.addEventListener(k,()=>{stickId=null;S.move.f=S.move.r=0;nub.style.transform=""}));
addEventListener("blur",()=>{if(S.mode==="run")setPause(true)});document.addEventListener("visibilitychange",()=>{if(document.hidden&&S.mode==="run")setPause(true)});
addEventListener("resize",()=>{cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
function loop(){requestAnimationFrame(loop);const dt=Math.min(clock.getDelta(),.05);if(S.mode==="run"){S.time+=dt;if(!coarse){S.move.f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);S.move.r=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);S.sprint=!!(keys.ShiftLeft||keys.ShiftRight)}else S.sprint=Math.hypot(S.move.f,S.move.r)>.82;updatePlayer(dt);updateMonster(dt);updateItems(dt);updateRandomScare(dt);flicker();hud()}else if(S.mode==="jumpscare"){updateJumpscare(dt)}else if(S.mode==="menu"){S.time+=dt;flicker();cam.position.set(spawn.x,1.7,spawn.z);cam.rotation.y=Math.PI+Math.sin(S.time*.15)*.2;flashlight.position.copy(cam.position);flashlight.target.position.set(spawn.x,1.4,spawn.z+10)}renderer.render(scene,cam)}loop();
})();
