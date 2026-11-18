import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Activity, BriefcaseBusiness, Clock3, GraduationCap, MapPin, Menu, Moon, ShoppingBag, Smartphone, Wallet, Zap, Users, Radio } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "LUANDA — Open World Life" }, { name: "description", content: "Vive a tua própria história numa cidade 3D inspirada em Luanda, Angola." }] }),
  component: LuandaGame,
});

const locations = [
  { name: "Escola 1º de Maio", x: -34, z: -28, color: "#d9a34e", kind: "school", icon: "🎓" },
  { name: "Mercado do Bairro", x: 28, z: -34, color: "#d97950", kind: "shop", icon: "🛍️" },
  { name: "Escritório Central", x: 48, z: 18, color: "#69a99b", kind: "work", icon: "💼" },
  { name: "Paragem de táxi", x: -48, z: 22, color: "#d9bf50", kind: "transport", icon: "🚕" },
  { name: "Café da Avenida", x: 8, z: 48, color: "#c58a68", kind: "shop", icon: "☕" },
  { name: "Residencial Kilamba", x: -8, z: -58, color: "#9288bd", kind: "home", icon: "🏠" },
];

function LuandaGame() {
  const mountRef = useRef<HTMLDivElement>(null);
  const keys = useRef<Record<string, boolean>>({});
  const playerRef = useRef<THREE.Group | null>(null);
  const [playerName, setPlayerName] = useState("Visitante");
  const [started, setStarted] = useState(false);
  const [position, setPosition] = useState({ x: 0, z: 8 });
  const [time, setTime] = useState(495);
  const [money, setMoney] = useState(25000);
  const [energy, setEnergy] = useState(88);
  const [hunger, setHunger] = useState(76);
  const [activity, setActivity] = useState("A descobrir a cidade");
  const [message, setMessage] = useState("Bem-vindo a Luanda! Explora a cidade.");
  const [showMap, setShowMap] = useState(false);
  const [nearby, setNearby] = useState("");

  function interact() {
    const p = playerRef.current;
    if (!p) return;
    const nearest = locations.map(item => ({ ...item, distance: Math.hypot(item.x-p.position.x, item.z-p.position.z) })).sort((a,b)=>a.distance-b.distance)[0];
    if (!nearest || nearest.distance > 13) { setMessage("Não há locais próximos. Aproxima-te de um edifício para interagir."); return; }
    if (nearest.kind === "school") { setActivity("A estudar"); setEnergy(v=>Math.max(0,v-5)); setMessage("Assististe a uma aula! Aprendeste novas competências."); }
    else if (nearest.kind === "work") { setActivity("A trabalhar"); setMoney(v=>v+2500); setEnergy(v=>Math.max(0,v-8)); setMessage("Bom trabalho! Recebeste 2.500 Kz pelo teu turno."); }
    else if (nearest.kind === "shop") { setActivity("A fazer compras"); setMoney(v=>Math.max(0,v-1500)); setHunger(v=>Math.min(100,v+18)); setMessage("Compraste alimentos por 1.500 Kz."); }
    else if (nearest.kind === "home") { setActivity("A descansar em casa"); setEnergy(v=>Math.min(100,v+25)); setHunger(v=>Math.min(100,v+8)); setMessage("Descansaste em casa. A energia recuperou."); }
    else { setActivity("À espera de transporte"); setMessage("Chegaste à paragem. Os transportes públicos serão adicionados numa próxima atualização."); }
  }

  useEffect(() => {
    const down=(e:KeyboardEvent)=>{const key=e.key.toLowerCase();if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(key))e.preventDefault();keys.current[key]=true;if(key==="e")interact();if(key==="m")setShowMap(v=>!v);};
    const up=(e:KeyboardEvent)=>{keys.current[e.key.toLowerCase()]=false;};
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);};
  });

  useEffect(() => {
    const id=window.setInterval(()=>setTime(t=>(t+1)%(24*60)),2500);
    return()=>clearInterval(id);
  },[]);

  useEffect(() => {
    if (!started || !mountRef.current) return;
    const host=mountRef.current;
    const scene=new THREE.Scene();
    scene.background=new THREE.Color("#9ab8c2");
    scene.fog=new THREE.Fog("#9ab8c2",85,230);
    const camera=new THREE.PerspectiveCamera(62,host.clientWidth/host.clientHeight,0.1,500);
    const renderer=new THREE.WebGLRenderer({antialias:true, powerPreference:"high-performance"});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.7));
    renderer.setSize(host.clientWidth,host.clientHeight);
    renderer.shadowMap.enabled=true;
    renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=1.15;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xe4f0ff,0x66704c,2.1));
    const sun=new THREE.DirectionalLight(0xffe0b2,3.2);
    sun.position.set(-55,95,45);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-110;sun.shadow.camera.right=110;sun.shadow.camera.top=110;sun.shadow.camera.bottom=-110;scene.add(sun);

    const mat=(color:string,roughness=0.88)=>new THREE.MeshStandardMaterial({color,roughness});
    const ground=new THREE.Mesh(new THREE.PlaneGeometry(360,360),mat("#8c9e78"));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
    const roadMat=mat("#343b3d"),sidewalk=mat("#c1b69c"),lineMat=mat("#e6d5a5");
    function road(x:number,z:number,w:number,d:number){const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,.12,d),roadMat);mesh.position.set(x,.06,z);mesh.receiveShadow=true;scene.add(mesh);const curb1=new THREE.Mesh(new THREE.BoxGeometry(w,.22,1.1),sidewalk);curb1.position.set(x,.12,z-d/2-0.65);scene.add(curb1);const curb2=curb1.clone();curb2.position.z=z+d/2+.65;scene.add(curb2);}
    road(0,0,360,17);road(0,0,17,360);road(0,-75,260,12);road(75,0,12,260);road(-75,0,12,260);
    for(let i=-160;i<170;i+=18){const dash=new THREE.Mesh(new THREE.BoxGeometry(7,.025,.22),lineMat);dash.position.set(i,.14,0);scene.add(dash);const dash2=new THREE.Mesh(new THREE.BoxGeometry(.22,.025,7),lineMat);dash2.position.set(0,.14,i);scene.add(dash2);}

    const buildingColors=["#d6c3a0","#c6b49c","#d9d0b9","#b9c4bc","#d6a77d","#aebdb9","#d4c6b0"];
    function building(x:number,z:number,w:number,d:number,h:number,color:string,label?:string){
      const group=new THREE.Group();
      const body=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color));body.position.y=h/2;body.castShadow=true;body.receiveShadow=true;group.add(body);
      const roof=new THREE.Mesh(new THREE.BoxGeometry(w+.5,.45,d+.5),mat("#777b72"));roof.position.y=h+.2;group.add(roof);
      const windowMat=mat("#304b55",.35),frame=mat("#e6d5b5");
      const floors=Math.max(2,Math.floor(h/4));
      for(let f=0;f<floors;f++)for(let col=0;col<Math.max(2,Math.floor(w/3.2));col++){
        const win=new THREE.Mesh(new THREE.BoxGeometry(.95,1.15,.12),windowMat);
        win.position.set(-w/2+1.6+col*2.8,2+f*3.3,d/2+.07);group.add(win);
        const win2=win.clone();win2.position.z=-d/2-.07;win2.rotation.y=Math.PI;group.add(win2);
      }
      const door=new THREE.Mesh(new THREE.BoxGeometry(1.5,2.5,.15),frame);door.position.set(0,1.25,d/2+.1);group.add(door);
      group.position.set(x,0,z);scene.add(group);
      if(label){const canvas=document.createElement("canvas");canvas.width=512;canvas.height=96;const c=canvas.getContext("2d");if(c){c.fillStyle="#17231e";c.fillRect(0,0,512,96);c.fillStyle="#fff";c.font="bold 38px Arial";c.textAlign="center";c.fillText(label,256,62);}const tex=new THREE.CanvasTexture(canvas);const sign=new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w,15),2.8),new THREE.MeshBasicMaterial({map:tex,transparent:true}));sign.position.set(x,h+3,z+d/2+.3);scene.add(sign);}
    }
    for(let gx=-135;gx<=135;gx+=38)for(let gz=-135;gz<=135;gz+=38){
      if(Math.abs(gx)<22||Math.abs(gz)<22)continue;
      const w=12+(Math.abs(gx*gz)%8),d=12+(Math.abs(gx+gz)%8),h=9+(Math.abs(gx*7+gz*3)%30);
      building(gx, gz,w,d,h,buildingColors[Math.abs(Math.floor(gx+gz))%buildingColors.length]);
    }
    locations.forEach((p,i)=>building(p.x,p.z,18,15,i===0?13:i===2?20:10,p.color,p.name));

    const treeTrunk=mat("#72523b"),treeTop=mat("#477a4f");
    for(let i=0;i<95;i++){
      const x=((i*47)%310)-155,z=((i*83)%310)-155;
      if(Math.abs(x)<17||Math.abs(z)<17)continue;
      const tree=new THREE.Group();const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.28,.42,2.5,7),treeTrunk);trunk.position.y=1.25;trunk.castShadow=true;tree.add(trunk);
      const crown=new THREE.Mesh(new THREE.SphereGeometry(2.1,8,7),treeTop);crown.position.y=3.5;crown.castShadow=true;tree.add(crown);tree.position.set(x,0,z);scene.add(tree);
    }
    const carColors=["#bd4e3d","#e4d7bb","#315b70","#d4a344","#333b42"];
    for(let i=0;i<15;i++){
      const car=new THREE.Group();const body=new THREE.Mesh(new THREE.BoxGeometry(2.3,.85,4.3),mat(carColors[i%carColors.length],.45));body.position.y=.9;body.castShadow=true;car.add(body);
      const cabin=new THREE.Mesh(new THREE.BoxGeometry(1.8,.85,2.1),mat("#55717a",.35));cabin.position.set(0,1.65,-.15);car.add(cabin);
      for(const wx of [-1,1])for(const wz of [-1.35,1.35]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,.22,12),mat("#202326"));wheel.rotation.z=Math.PI/2;wheel.position.set(wx, .48,wz);car.add(wheel);}
      car.position.set(-95+i*13,.05,12+(i%3)*3);car.rotation.y=Math.PI/2;scene.add(car);
    }
    // Small ambient pedestrians give the streets life.
    for(let i=0;i<24;i++){
      const npc=new THREE.Group();const skin=new THREE.Mesh(new THREE.SphereGeometry(.34,10,8),mat(i%3===0?"#75452f":"#9a6044"));skin.position.y=1.55;npc.add(skin);
      const shirt=new THREE.Mesh(new THREE.CapsuleGeometry(.42,.9,4,8),mat(["#e4a354","#416c86","#e6e1d2","#8a6c9d"][i%4]));shirt.position.y=.72;npc.add(shirt);
      npc.position.set(-105+(i*29)%210,0,-95+((i*43)%190));scene.add(npc);
    }

    const avatar=new THREE.Group();
    const skin=mat("#87563f"),shirt=mat("#263f59"),pants=mat("#242b32"),shoe=mat("#171b1d");
    const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.48,.85,5,10),shirt);torso.position.y=1.55;torso.castShadow=true;avatar.add(torso);
    const head=new THREE.Mesh(new THREE.SphereGeometry(.36,16,12),skin);head.position.y=2.45;head.castShadow=true;avatar.add(head);
    const hair=new THREE.Mesh(new THREE.SphereGeometry(.37,12,8,0,Math.PI*2,0,Math.PI/2),mat("#211b18"));hair.position.y=2.57;avatar.add(hair);
    for(const side of [-1,1]){const leg=new THREE.Mesh(new THREE.CapsuleGeometry(.17,.72,4,8),pants);leg.position.set(side*.22,.55,0);avatar.add(leg);const foot=new THREE.Mesh(new THREE.BoxGeometry(.28,.18,.48),shoe);foot.position.set(side*.22,.12,-.1);avatar.add(foot);}
    avatar.position.set(0,0,8);scene.add(avatar);playerRef.current=avatar;

    const clock=new THREE.Clock();let lastUi=0;
    const animate=()=>{
      const delta=Math.min(clock.getDelta(),.04),move=new THREE.Vector3();
      if(keys.current.w||keys.current.arrowup)move.z-=1;
      if(keys.current.s||keys.current.arrowdown)move.z+=1;
      if(keys.current.a||keys.current.arrowleft)move.x-=1;
      if(keys.current.d||keys.current.arrowright)move.x+=1;
      const moving=move.lengthSq()>0;
      if(moving){move.normalize();avatar.position.addScaledVector(move,delta*13);avatar.rotation.y=Math.atan2(move.x,move.z);avatar.position.x=THREE.MathUtils.clamp(avatar.position.x,-165,165);avatar.position.z=THREE.MathUtils.clamp(avatar.position.z,-165,165);torso.position.y=1.55+Math.sin(clock.elapsedTime*12)*.045;}
      const forward=new THREE.Vector3(Math.sin(avatar.rotation.y),0,Math.cos(avatar.rotation.y));
      const target=avatar.position.clone().add(new THREE.Vector3(0,2.2,0));
      const desired=avatar.position.clone().add(new THREE.Vector3(0,7,0)).addScaledVector(forward,-10.5);
      camera.position.lerp(desired,.09);camera.lookAt(target);
      if(clock.elapsedTime-lastUi>.12){setPosition({x:Math.round(avatar.position.x),z:Math.round(avatar.position.z)});const near=locations.map(l=>({...l,d:Math.hypot(l.x-avatar.position.x,l.z-avatar.position.z)})).sort((a,b)=>a.d-b.d)[0];setNearby(near&&near.d<18?near.name:"");lastUi=clock.elapsedTime;}
      renderer.render(scene,camera);requestAnimationFrame(animate);
    };
    const raf=requestAnimationFrame(animate);
    const resize=()=>{if(!host.clientWidth||!host.clientHeight)return;camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);};
    const observer=new ResizeObserver(resize);observer.observe(host);
    return()=>{cancelAnimationFrame(raf);observer.disconnect();renderer.dispose();host.innerHTML="";scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(m=>m.dispose());}});playerRef.current=null;};
  },[started]);

  const clockText=String(Math.floor(time/60)).padStart(2,"0")+":"+String(time%60).padStart(2,"0");
  function travel(x:number,z:number,name:string){if(playerRef.current)playerRef.current.position.set(x,0,z);setPosition({x,z});setShowMap(false);setMessage("Chegaste a "+name+". Explora o local e prime E para interagir.");}

  return <main className="luanda-shell">
    <header className="game-topbar"><div className="brand-lockup"><div className="brand-mark">L</div><div><strong>LUANDA</strong><small>OPEN WORLD LIFE</small></div></div><div className="top-location"><MapPin size={15}/> Luanda, Angola <span>•</span> Cidade Aberta</div><div className="top-actions"><span className="online-dot"/> SERVIDOR: DEMO <button className="icon-button" onClick={()=>setShowMap(!showMap)} aria-label="Abrir mapa"><Menu size={19}/></button></div></header>
    {!started?<section className="welcome-screen"><div className="welcome-copy"><span className="eyebrow">A TUA CIDADE. A TUA VIDA.</span><h1>Luanda está<br/><em>à tua espera.</em></h1><p>Entra numa cidade 3D inspirada em Angola. Cria a tua personagem, explora as ruas, estuda, trabalha e constrói o teu futuro.</p><label htmlFor="player-name">Nome do teu personagem</label><input id="player-name" value={playerName} onChange={e=>setPlayerName(e.target.value)} maxLength={18}/><button className="primary-cta" onClick={()=>setStarted(true)}>ENTRAR NO MUNDO <span>→</span></button><small className="prototype-note">Protótipo 3D · Terceira pessoa · Modo online em preparação</small></div><div className="welcome-art"><div className="sun-glow"/><div className="skyline"><i/><i/><i/><i/><i/><i/><i/></div><div className="welcome-street"><div className="street-line"/></div><div className="welcome-tag">LUANDA <b>·</b> ANGOLA</div></div></section>:
    <section className="game-layout"><div className="game-world"><div className="world-label"><span className="live-dot"/> MUNDO 3D <small>LUANDA · BAIRRO CENTRAL</small></div><div ref={mountRef} className="three-world"/><div className="world-coordinates">X: {position.x} · Z: {position.z}</div><div className="world-controls"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Mover</span><span><kbd>E</kbd> Interagir</span><span><kbd>M</kbd> Mapa</span></div><div className="mobile-pad"><button onPointerDown={()=>keys.current.w=true} onPointerUp={()=>keys.current.w=false} onPointerLeave={()=>keys.current.w=false}>↑</button><div><button onPointerDown={()=>keys.current.a=true} onPointerUp={()=>keys.current.a=false} onPointerLeave={()=>keys.current.a=false}>←</button><button onPointerDown={()=>keys.current.s=true} onPointerUp={()=>keys.current.s=false} onPointerLeave={()=>keys.current.s=false}>↓</button><button onPointerDown={()=>keys.current.d=true} onPointerUp={()=>keys.current.d=false} onPointerLeave={()=>keys.current.d=false}>→</button></div><button className="interact-mobile" onClick={interact}>E</button></div>{nearby&&<div className="nearby-prompt">E <span>INTERAGIR · {nearby}</span></div>}</div>
    <aside className="game-sidebar"><div className="player-card"><div className="avatar">{playerName.slice(0,1).toUpperCase()}</div><div><strong>{playerName}</strong><small>Residente · Nível 1</small></div><span className="level-pill">LVL 1</span></div>
    <div className="online-card"><Radio size={16}/><div><b>Modo online</b><small>Servidor multijogador em preparação</small></div><span className="online-status">DEMO</span></div>
    <div className="status-grid"><div className="status-tile"><Clock3/><small>HORA</small><strong>{clockText}</strong></div><div className="status-tile"><Wallet/><small>SALDO</small><strong>{money.toLocaleString("pt-PT")} Kz</strong></div></div>
    <div className="needs-panel"><h3>ESTADO DO PERSONAGEM</h3><div className="need-row"><span><Zap/> Energia</span><b>{energy}%</b></div><div className="meter"><i style={{width:energy+"%"}}/></div><div className="need-row"><span><Activity/> Fome</span><b>{hunger}%</b></div><div className="meter hunger"><i style={{width:hunger+"%"}}/></div></div>
    <div className="mission-panel"><div className="section-heading"><h3>ROTINA DE HOJE</h3><span>01 / 04</span></div><div className="mission"><span className="mission-icon"><GraduationCap/></span><div><b>Visita a escola</b><small>Aprende algo novo</small></div></div><div className="mission"><span className="mission-icon"><BriefcaseBusiness/></span><div><b>Procura trabalho</b><small>Ganha o teu salário</small></div></div><div className="mission"><span className="mission-icon"><ShoppingBag/></span><div><b>Compra alimentos</b><small>Cuida da tua energia</small></div></div></div>
    <div className="activity-box"><span className="activity-pulse"/><div><small>ATIVIDADE ATUAL</small><b>{activity}</b></div></div><button className="interact-button" onClick={interact}>INTERAGIR COM LOCAL PRÓXIMO <span>E ↗</span></button><div className="game-message">{message}</div><button className="map-button" onClick={()=>setShowMap(!showMap)}><MapPin size={16}/> {showMap?"Fechar mapa":"Ver mapa da cidade"}</button></aside></section>}
    {showMap&&<div className="map-overlay"><div className="map-modal"><div className="section-heading"><div><small>EXPLORA LUANDA</small><h2>Mapa da cidade</h2></div><button className="icon-button" onClick={()=>setShowMap(false)}>✕</button></div><div className="map-list">{locations.map((p,i)=><button key={p.name} onClick={()=>travel(p.x,p.z,p.name)}><span style={{background:p.color}}>{i+1}</span><b>{p.name}</b><small>Viajar para aqui →</small></button>)}</div></div></div>}
    <footer className="game-footer"><span>LUANDA © 2026</span><span><Moon size={13}/> Ciclo dia/noite</span><span><Smartphone size={13}/> Controlos móveis</span><span><Users size={13}/> Multijogador em desenvolvimento</span></footer>
  </main>;
}
