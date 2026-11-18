import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Activity, BriefcaseBusiness, Clock3, GraduationCap, MapPin, Menu, Moon, ShoppingBag, Smartphone, Wallet, Zap } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "LUANDA — Vive a tua cidade" }, { name: "description", content: "Simulador de vida em mundo aberto inspirado em Luanda, Angola." }] }),
  component: LuandaGame,
});

const places = [
  { name: "Escola 1º de Maio", x: 150, y: 110, color: "#d9a34e", kind: "school" },
  { name: "Mercado do Bairro", x: 490, y: 110, color: "#d97950", kind: "shop" },
  { name: "Escritório Central", x: 830, y: 130, color: "#69a99b", kind: "work" },
  { name: "Paragem de táxi", x: 160, y: 430, color: "#d9bf50", kind: "transport" },
  { name: "Café da Avenida", x: 520, y: 430, color: "#c58a68", kind: "shop" },
  { name: "Residencial Kilamba", x: 850, y: 430, color: "#9288bd", kind: "home" },
];

function LuandaGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const player = useRef({ x: 480, y: 300 });
  const keys = useRef<Record<string, boolean>>({});
  const [position, setPosition] = useState({ x: 480, y: 300 });
  const [time, setTime] = useState(495);
  const [money, setMoney] = useState(25000);
  const [energy, setEnergy] = useState(88);
  const [hunger, setHunger] = useState(76);
  const [message, setMessage] = useState("Bem-vindo a Luanda! Explora a cidade.");
  const [activity, setActivity] = useState("A descobrir a cidade");
  const [showMap, setShowMap] = useState(false);
  const [playerName, setPlayerName] = useState("Visitante");
  const [started, setStarted] = useState(false);

  function interact() {
    const p = player.current;
    const nearest = places.map(b => ({ ...b, d: Math.hypot(b.x + 56 - p.x, b.y + 38 - p.y) })).sort((a,b) => a.d-b.d)[0];
    if (!nearest || nearest.d > 125) { setMessage("Não há locais próximos. Aproxima-te de um edifício e prime E."); return; }
    if (nearest.kind === "school") { setActivity("A estudar"); setEnergy(v => Math.max(0,v-5)); setMessage("Assististe a uma aula! Aprendeste novas competências."); }
    else if (nearest.kind === "work") { setActivity("A trabalhar"); setMoney(v => v+2500); setEnergy(v => Math.max(0,v-8)); setMessage("Bom trabalho! Recebeste 2.500 Kz pelo teu turno."); }
    else if (nearest.kind === "shop") { setActivity("A fazer compras"); setMoney(v => Math.max(0,v-1500)); setHunger(v => Math.min(100,v+18)); setMessage("Compraste alimentos por 1.500 Kz."); }
    else if (nearest.kind === "home") { setActivity("A descansar em casa"); setEnergy(v => Math.min(100,v+25)); setHunger(v => Math.min(100,v+8)); setMessage("Descansaste em casa. A energia recuperou."); }
    else { setActivity("À espera de transporte"); setMessage("Apanhaste um táxi. Escolhe outro destino no mapa."); }
  }

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) e.preventDefault();
      keys.current[e.key.toLowerCase()] = true;
      if (e.key.toLowerCase() === "e") interact();
    };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener("keydown",down); window.addEventListener("keyup",up);
    return () => { window.removeEventListener("keydown",down); window.removeEventListener("keyup",up); };
  });

  useEffect(() => {
    let raf = 0, last = 0;
    const draw = (now: number) => {
      const canvas = canvasRef.current, ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;
      const cw = canvas.clientWidth, ch = canvas.clientHeight, dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.round(cw*dpr) || canvas.height !== Math.round(ch*dpr)) { canvas.width=Math.round(cw*dpr); canvas.height=Math.round(ch*dpr); }
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const p=player.current, speed=2.7;
      if(keys.current.w||keys.current.arrowup)p.y-=speed;
      if(keys.current.s||keys.current.arrowdown)p.y+=speed;
      if(keys.current.a||keys.current.arrowleft)p.x-=speed;
      if(keys.current.d||keys.current.arrowright)p.x+=speed;
      p.x=Math.max(20,Math.min(980,p.x));p.y=Math.max(20,Math.min(580,p.y));
      if(now-last>100){setPosition({x:Math.round(p.x),y:Math.round(p.y)});last=now;}
      const ox=p.x-cw/2,oy=p.y-ch/2;
      ctx.fillStyle="#9eae8d";ctx.fillRect(0,0,cw,ch);
      for(let gx=-200;gx<1200;gx+=240)for(let gy=-100;gy<800;gy+=220){const x=gx-ox,y=gy-oy;ctx.fillStyle="#829878";ctx.fillRect(x,y,190,170);ctx.fillStyle="#a5b78f";for(let i=0;i<5;i++){ctx.beginPath();ctx.arc(x+25+i*34,y+28+(i%2)*18,7,0,7);ctx.fill();}}
      ctx.fillStyle="#4b5154";ctx.fillRect(-ox,245-oy,1200,110);ctx.fillRect(390-ox,-oy,110,760);
      ctx.fillStyle="#e8dcb9";ctx.fillRect(-ox,239-oy,1200,6);ctx.fillRect(-ox,355-oy,1200,6);ctx.fillRect(384-ox,-oy,6,760);ctx.fillRect(500-ox,-oy,6,760);
      ctx.strokeStyle="#d9c894";ctx.lineWidth=2;ctx.setLineDash([18,16]);ctx.beginPath();ctx.moveTo(-ox,300-oy);ctx.lineTo(1200-ox,300-oy);ctx.moveTo(445-ox,-oy);ctx.lineTo(445-ox,760-oy);ctx.stroke();ctx.setLineDash([]);
      places.forEach((b,i)=>{const x=b.x-ox,y=b.y-oy;ctx.fillStyle="rgba(20,25,20,.22)";ctx.fillRect(x+7,y+10,112,76);ctx.fillStyle=b.color;ctx.fillRect(x,y,112,76);ctx.fillStyle="rgba(255,255,255,.22)";ctx.fillRect(x+8,y+7,96,8);ctx.fillStyle="#29333a";ctx.fillRect(x+12,y+25,18,22);ctx.fillRect(x+46,y+25,18,22);ctx.fillRect(x+82,y+25,18,22);ctx.fillStyle="#443831";ctx.fillRect(x+45,y+52,22,24);ctx.fillStyle="#14231e";ctx.font="bold 11px system-ui";ctx.textAlign="center";ctx.fillText(b.name,x+56,y-10);ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(x+56,y+92,10,0,7);ctx.fill();ctx.fillStyle="#253b32";ctx.fillText(String(i+1),x+56,y+96);});
      for(let i=0;i<5;i++){ctx.fillStyle=["#c85b49","#e5d6ad","#3c657b"][i%3];ctx.fillRect(90+i*160-ox,265-oy,42,22);}
      ctx.fillStyle="rgba(0,0,0,.25)";ctx.beginPath();ctx.ellipse(cw/2,ch/2+11,13,6,0,0,7);ctx.fill();ctx.fillStyle="#edc19c";ctx.beginPath();ctx.arc(cw/2,ch/2-10,9,0,7);ctx.fill();ctx.fillStyle="#263c56";ctx.fillRect(cw/2-9,ch/2,18,22);ctx.fillStyle="#e8a35e";ctx.fillRect(cw/2-10,ch/2+20,8,12);ctx.fillRect(cw/2+2,ch/2+20,8,12);ctx.fillStyle="#fff";ctx.font="bold 11px system-ui";ctx.fillText(playerName,cw/2,ch/2-27);
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);
  },[playerName]);

  useEffect(()=>{const id=window.setInterval(()=>setTime(t=>(t+1)%(24*60)),2500);return()=>clearInterval(id);},[]);
  const clock=String(Math.floor(time/60)).padStart(2,"0")+":"+String(time%60).padStart(2,"0");

  return <main className="luanda-shell">
    <header className="game-topbar"><div className="brand-lockup"><div className="brand-mark">L</div><div><strong>LUANDA</strong><small>OPEN WORLD LIFE</small></div></div><div className="top-location"><MapPin size={15}/> Luanda, Angola <span>•</span> Bairro Central</div><div className="top-actions"><span className="online-dot"/> Mundo ativo <button className="icon-button" onClick={()=>setShowMap(!showMap)} aria-label="Abrir mapa"><Menu size={19}/></button></div></header>
    {!started ? <section className="welcome-screen"><div className="welcome-copy"><span className="eyebrow">A TUA CIDADE. A TUA VIDA.</span><h1>Escreve a tua<br/><em>própria história.</em></h1><p>Explora uma cidade inspirada em Luanda. Estuda, trabalha, faz amigos e constrói o teu futuro.</p><label htmlFor="player-name">Como te chamas?</label><input id="player-name" value={playerName} onChange={e=>setPlayerName(e.target.value)} maxLength={18}/><button className="primary-cta" onClick={()=>setStarted(true)}>ENTRAR NA CIDADE <span>→</span></button><small className="prototype-note">Versão inicial jogável · Exploração individual</small></div><div className="welcome-art"><div className="sun-glow"/><div className="skyline"><i/><i/><i/><i/><i/><i/><i/></div><div className="welcome-street"><div className="street-line"/></div><div className="welcome-tag">ANGOLA <b>·</b> 2026</div></div></section> :
    <><section className="game-layout"><div className="game-world"><div className="world-label"><span className="live-dot"/> MUNDO ABERTO <small>BAIRRO CENTRAL</small></div><canvas ref={canvasRef} className="world-canvas" aria-label="Cidade jogável. Usa WASD ou as setas para caminhar."/><div className="world-coordinates">X: {position.x} · Y: {position.y}</div><div className="world-controls"><span><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> Mover</span><span><kbd>E</kbd> Interagir</span></div><div className="mobile-pad"><button onClick={()=>player.current.y-=24}>↑</button><div><button onClick={()=>player.current.x-=24}>←</button><button onClick={()=>player.current.y+=24}>↓</button><button onClick={()=>player.current.x+=24}>→</button></div><button className="interact-mobile" onClick={interact}>E</button></div></div>
    <aside className="game-sidebar"><div className="player-card"><div className="avatar">{playerName.slice(0,1).toUpperCase()}</div><div><strong>{playerName}</strong><small>Residente · Nível 1</small></div><span className="level-pill">LVL 1</span></div>
    <div className="status-grid"><div className="status-tile"><Clock3/><small>HORA</small><strong>{clock}</strong></div><div className="status-tile"><Wallet/><small>SALDO</small><strong>{money.toLocaleString("pt-PT")} Kz</strong></div></div>
    <div className="needs-panel"><h3>ESTADO DO PERSONAGEM</h3><div className="need-row"><span><Zap/> Energia</span><b>{energy}%</b></div><div className="meter"><i style={{width:energy+"%"}}/></div><div className="need-row"><span><Activity/> Fome</span><b>{hunger}%</b></div><div className="meter hunger"><i style={{width:hunger+"%"}}/></div></div>
    <div className="mission-panel"><div className="section-heading"><h3>ROTINA DE HOJE</h3><span>01 / 04</span></div><div className="mission active"><span className="mission-icon"><GraduationCap/></span><div><b>Visita a escola</b><small>Aprende algo novo</small></div><span className="mission-arrow">›</span></div><div className="mission"><span className="mission-icon"><BriefcaseBusiness/></span><div><b>Procura trabalho</b><small>Ganha o teu salário</small></div></div><div className="mission"><span className="mission-icon"><ShoppingBag/></span><div><b>Compra alimentos</b><small>Cuida da tua energia</small></div></div></div>
    <div className="activity-box"><span className="activity-pulse"/><div><small>ATIVIDADE ATUAL</small><b>{activity}</b></div></div><button className="interact-button" onClick={interact}>INTERAGIR COM LOCAL PRÓXIMO <span>E ↗</span></button><div className="game-message">{message}</div><button className="map-button" onClick={()=>setShowMap(!showMap)}><MapPin size={16}/> {showMap?"Fechar mapa":"Ver mapa da cidade"}</button></aside></section>
    {showMap&&<div className="map-overlay"><div className="map-modal"><div className="section-heading"><div><small>EXPLORA LUANDA</small><h2>Mapa da cidade</h2></div><button className="icon-button" onClick={()=>setShowMap(false)}>✕</button></div><div className="map-list">{places.map((p,i)=><button key={p.name} onClick={()=>{player.current={x:p.x+56,y:p.y+110};setShowMap(false);setMessage("Chegaste perto de "+p.name+". Prime E para interagir.");}}><span style={{background:p.color}}>{i+1}</span><b>{p.name}</b><small>Viajar para aqui →</small></button>)}</div></div></div>}</>}
    <footer className="game-footer"><span>LUANDA © 2026</span><span><Moon size={13}/> Ciclo dia/noite ativo</span><span><Smartphone size={13}/> Teclado e controlos móveis</span><span>FEITO EM ANGOLA</span></footer>
  </main>;
}
