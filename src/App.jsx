import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "tennis-demo-players-v1";
const RULES_KEY   = "tennis-demo-rules-v1";

function uid(){ return Math.random().toString(36).slice(2,10); }

function seed(){
  const now = new Date().toISOString();
  return [
    { id: uid(), name: "Serena Williams", dob:"", phone:"", membershipCode:"T-001",
      wins:5, losses:1, matchHistory:[{opponentName:"Roger Federer", result:"win", score:"6-4, 6-2", date:now}] },
    { id: uid(), name: "Roger Federer", dob:"", phone:"", membershipCode:"T-002",
      wins:4, losses:2, matchHistory:[{opponentName:"Rafael Nadal", result:"win", score:"7-6, 6-4", date:now}] },
    { id: uid(), name: "Rafael Nadal", dob:"", phone:"", membershipCode:"T-003",
      wins:3, losses:3, matchHistory:[] },
  ];
}

function computeWithRules(p, rules){
  const wins = p.wins||0, losses = p.losses||0, total = wins+losses;
  const points = wins*rules.winPoints + losses*rules.lossPoints;
  const winPct = total ? Math.round((wins/total)*1000)/10 : 0;
  return { ...p, points, winPct, total };
}

export default function App(){
  const [players, setPlayers] = useState(()=>{
    try{ const raw = localStorage.getItem(STORAGE_KEY); return raw? JSON.parse(raw): seed(); }
    catch { return seed(); }
  });

  const [rules, setRules] = useState(()=>{
    try{ const raw = localStorage.getItem(RULES_KEY); return raw? JSON.parse(raw): { winPoints:10, lossPoints:-5 }; }
    catch{ return { winPoints:10, lossPoints:-5 }; }
  });

  const [selectedP1, setSelectedP1] = useState("");
  const [selectedP2, setSelectedP2] = useState("");
  const [score, setScore] = useState("");
  const [matchTab, setMatchTab] = useState("match");

  const [editingId, setEditingId] = useState(null);
  const [deleteId,  setDeleteId]  = useState(null);
  const [reportId,  setReportId]  = useState(null);

  const dlgPlayerRef = useRef(null);
  const dlgConfirmRef = useRef(null);
  const dlgBulkRef   = useRef(null);
  const dlgReportRef = useRef(null);

  const [formName, setFormName]   = useState("");
  const [formDob,  setFormDob]    = useState("");
  const [formPhone,setFormPhone]  = useState("");
  const [formCode, setFormCode]   = useState("");
  const [bulkText, setBulkText]   = useState("");

  useEffect(()=>{ try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(players)); }catch{} },[players]);
  useEffect(()=>{ try{ localStorage.setItem(RULES_KEY,   JSON.stringify(rules));   }catch{} },[rules]);

  const ranked = useMemo(()=> {
    return players.map(p=>computeWithRules(p, rules))
      .sort((a,b)=> b.points - a.points || a.name.localeCompare(b.name));
  }, [players, rules]);

  function openAdd(){ setEditingId(null); setFormName(""); setFormDob(""); setFormPhone(""); setFormCode(""); dlgPlayerRef.current?.showModal(); }
  function openEdit(id){ const p=players.find(x=>x.id===id); if(!p) return;
    setEditingId(id); setFormName(p.name||""); setFormDob(p.dob||""); setFormPhone(p.phone||""); setFormCode(p.membershipCode||""); dlgPlayerRef.current?.showModal(); }
  function savePlayer(e){
    e.preventDefault();
    const name=formName.trim(); if(!name){ alert("Nombre requerido"); return; }
    const base={ name, dob:formDob, phone:formPhone, membershipCode:formCode };
    setPlayers(prev => editingId ? prev.map(p=> p.id===editingId? {...p,...base} : p)
                                 : [...prev, { id:uid(), ...base, wins:0, losses:0, matchHistory:[] }]);
    dlgPlayerRef.current?.close();
  }
  function openDelete(id){ setDeleteId(id); dlgConfirmRef.current?.showModal(); }
  function confirmDelete(e){ e.preventDefault(); if(deleteId){ setPlayers(prev=> prev.filter(x=>x.id!==deleteId)); } dlgConfirmRef.current?.close(); }
  function openReport(id){ setReportId(id); dlgReportRef.current?.showModal(); }

  function addMatch(p1Wins){
    const id1=selectedP1, id2=selectedP2, s=score.trim();
    if(!id1||!id2||id1===id2){ alert("Selecciona jugadores distintos."); return; }
    if(!s){ alert("Escribe el marcador."); return; }
    const now=new Date().toISOString();
    setPlayers(prev=>{
      const A=prev.find(x=>x.id===id1), B=prev.find(x=>x.id===id2); if(!A||!B) return prev;
      const na={...A}, nb={...B};
      if(p1Wins){ na.wins=(na.wins||0)+1; nb.losses=(nb.losses||0)+1; } else { nb.wins=(nb.wins||0)+1; na.losses=(na.losses||0)+1; }
      na.matchHistory=[...(na.matchHistory||[]), {opponentId:nb.id, opponentName:nb.name, date:now, result:p1Wins?"win":"loss", score:s}];
      nb.matchHistory=[...(nb.matchHistory||[]), {opponentId:na.id, opponentName:na.name, date:now, result:p1Wins?"loss":"win", score:s}];
      return prev.map(p=> p.id===na.id?na : p.id===nb.id?nb : p);
    });
    setScore("");
  }

  function doBulk(e){
    e.preventDefault();
    try{
      const arr=JSON.parse(bulkText||"[]"); if(!Array.isArray(arr)) throw new Error("Debe ser un arreglo");
      setPlayers(prev=> [...prev, ...arr.filter(o=>o&&o.name).map(o=>({
        id:uid(), name:o.name, dob:o.dob||"", phone:o.phone||"", membershipCode:o.membershipCode||"",
        wins:o.wins||0, losses:o.losses||0, matchHistory:o.matchHistory||[]
      }))]);
      dlgBulkRef.current?.close(); setBulkText("");
    }catch(err){ alert(err.message); }
  }

  const reportPlayer = useMemo(()=>{
    const p=players.find(x=>x.id===reportId);
    return p? computeWithRules(p, rules) : null;
  }, [players, reportId, rules]);

  // Editor de reglas (tab)
  const [tmpWin, setTmpWin]   = useState(rules.winPoints);
  const [tmpLoss,setTmpLoss]  = useState(rules.lossPoints);
  useEffect(()=>{ setTmpWin(rules.winPoints); setTmpLoss(rules.lossPoints); }, [rules]);
  function applyRules(){
    const w = Number(tmpWin), l = Number(tmpLoss);
    if(Number.isNaN(w) || Number.isNaN(l)) { alert("Valores no válidos"); return; }
    setRules({ winPoints: w, lossPoints: l });
  }
  function resetRules(){ setRules({ winPoints: 10, lossPoints: -5 }); }

  const fmtDate = (d) => {
    if(!d) return "—";
    const t = Date.parse(d);
    return Number.isNaN(t) ? "—" : new Date(t).toLocaleDateString();
    };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* HEADER */}
        <header className="mb-6 md:mb-10">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-rose-500">
              Single Ladder: Club Rankings
            </h1>
            <div className="flex gap-2">
              <button onClick={()=>dlgBulkRef.current?.showModal()} className="btn btn-ghost">Carga masiva</button>
              <button onClick={openAdd} className="btn btn-primary">Añadir jugador</button>
            </div>
          </div>
        </header>

        {/* REGISTRAR PARTIDO */}
        <section className="mb-8 p-5 paper rounded-2xl shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-indigo-700 flex items-center gap-2">
              <span></span> Registrar partido 
            </h2>
            <div className="flex gap-2">
              <button
                className={`tab-btn ${matchTab==="match" ? "tab-active" : "tab-inactive"}`}
                onClick={()=>setMatchTab("match")}
              >
                Partido
              </button>
              <button
                className={`tab-btn ${matchTab==="rules" ? "tab-active" : "tab-inactive"}`}
                onClick={()=>setMatchTab("rules")}
              >
                Reglas
              </button>
            </div>
          </div>

          {matchTab === "match" ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <select value={selectedP1} onChange={e=>setSelectedP1(e.target.value)} className="select">
                  <option value="">— Jugador 1 —</option>
                  {players.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <select value={selectedP2} onChange={e=>setSelectedP2(e.target.value)} className="select">
                  <option value="">— Jugador 2 —</option>
                  {players.map(p=> <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input value={score} onChange={e=>setScore(e.target.value)} className="input" placeholder="Marcador (6-4, 6-2)"/>
              </div>

              <div className="grid gap-3 md:grid-cols-3 mt-3">
                <button
                  onClick={()=>addMatch(true)}
                  className="rounded-xl px-3 py-2 font-extrabold text-white bg-emerald-600 hover:brightness-110 active:scale-[.99] transition"
                >
                  Gana Jugador 1 (+{rules.winPoints})
                </button>
                <button
                  onClick={()=>addMatch(false)}
                  className="rounded-xl px-3 py-2 font-extrabold text-white bg-emerald-600 hover:brightness-110 active:scale-[.99] transition"
                >
                  Gana Jugador 2 (+{rules.winPoints})
                </button>
                <div className="flex items-center text-xs text-slate-500">
                  Derrota: {rules.lossPoints} puntos.
                </div>
              </div>
            </>
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Puntos por victoria</label>
                <input type="number" className="input w-full" value={tmpWin} onChange={e=>setTmpWin(e.target.value)} />
              </div>
              <div>
                <label className="label">Puntos por derrota</label>
                <input type="number" className="input w-full" value={tmpLoss} onChange={e=>setTmpLoss(e.target.value)} />
              </div>
              <div className="flex items-end gap-2">
                <button className="btn btn-ghost border border-slate-200" onClick={applyRules}>Aplicar</button>
                <button className="btn btn-ghost" onClick={resetRules}>Restaurar</button>
              </div>
              <p className="text-xs text-slate-500 sm:col-span-3">Actuales: victoria <b>{rules.winPoints}</b> / derrota <b>{rules.lossPoints}</b>.</p>
            </div>
          )}
        </section>

        {/* LISTA: 1 jugador por fila */}
        <section>
          <ul className="grid gap-4 grid-cols-1">
            {ranked.map((p,i)=>{
              const isP1=p.id===selectedP1, isP2=p.id===selectedP2;
              const pulseClass = isP1? "pulse-blue" : isP2? "pulse-pink" : "";
              return (
                <li key={p.id}
                    className={`group relative p-4 paper rounded-2xl shadow anim-in cursor-pointer card-safe hover:-translate-y-[2px] hover:shadow-lg transition ${pulseClass}`}
                    style={{animationDelay:`${i*30}ms`}}
                    onClick={(ev)=>{ if(ev.target.closest?.("button")) return; ev.currentTarget.classList.add("tap"); setTimeout(()=>ev.currentTarget.classList.remove("tap"),250); openReport(p.id);} }>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-11 w-11 rounded-full flex items-center justify-center text-white font-black bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-sm">
                        {i+1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-lg leading-tight truncate">{p.name}</div>
                        <div className="text-xs text-slate-500">W {p.wins||0} / L {p.losses||0}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <div className="text-3xl font-extrabold text-indigo-700">{p.points}</div>
                        <div className="text-[10px] uppercase tracking-wide text-indigo-500 font-semibold">Puntos</div>
                      </div>
                      <div className="flex flex-wrap gap-2 justify-end">
                        {/* Editar ahora ámbar/naranja */}
                        <button className="btn btn-warn" onClick={(e)=>{ e.stopPropagation(); openEdit(p.id); }}>Editar</button>
                        <button className="btn btn-danger" onClick={(e)=>{ e.stopPropagation(); openDelete(p.id); }}>Eliminar</button>
                      </div>
                    </div>
                  </div>

                  {(isP1||isP2) && (
                    <div className={`absolute -top-2 -right-2 text-[11px] font-bold px-2 py-1 rounded-full text-white shadow ${isP1?'bg-indigo-600':'bg-rose-600'}`}>
                      {isP1? 'P1' : 'P2'}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      {/* ===== MODALES ===== */}
      <dialog ref={dlgPlayerRef} className="rounded-2xl w-full max-w-lg">
        <form method="dialog" className="p-5" onSubmit={savePlayer}>
          <h3 className="text-xl font-bold mb-4">{editingId? "Editar jugador":"Añadir jugador"}</h3>
          <div className="space-y-3">
            <div>
              <label className="label">Nombre</label>
              <input value={formName} onChange={e=>setFormName(e.target.value)} className="input w-full" required />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">Nacimiento</label>
                <input type="date" value={formDob} onChange={e=>setFormDob(e.target.value)} className="input w-full" />
              </div>
              <div>
                <label className="label">Celular</label>
                <input value={formPhone} onChange={e=>setFormPhone(e.target.value)} className="input w-full" />
              </div>
            </div>
            <div>
              <label className="label">Código de miembro</label>
              <input value={formCode} onChange={e=>setFormCode(e.target.value)} className="input w-full" />
            </div>
          </div>
          <menu className="mt-5 flex justify-end gap-2">
            <button type="button" onClick={()=>dlgPlayerRef.current?.close()} className="btn btn-ghost">Cancelar</button>
            <button className="btn btn-primary">Guardar</button>
          </menu>
        </form>
      </dialog>

      <dialog ref={dlgBulkRef} className="rounded-2xl w-full max-w-2xl">
        <form method="dialog" className="p-5" onSubmit={doBulk}>
          <h3 className="text-xl font-bold mb-3">Carga masiva (JSON)</h3>
          <p className="text-sm text-slate-600 mb-2">Pega un arreglo de objetos con al menos <code>name</code>:</p>
          <pre className="bg-slate-50 p-2 rounded border border-slate-200 text-xs mb-2">
            [
            {"\n  "}{'{'}`"name":"Serena Williams","phone":"999999","membershipCode":"T-001"`{'}'}
            {"\n  "}{'{'}`"name":"Roger Federer"`{'}'}
            {"\n"}]
          </pre>
          <textarea value={bulkText} onChange={e=>setBulkText(e.target.value)} className="w-full h-56 border border-slate-200 rounded-xl p-3 font-mono text-sm bg-white" placeholder="[]"/>
          <menu className="mt-3 flex justify-end gap-2">
            <button type="button" onClick={()=>dlgBulkRef.current?.close()} className="btn btn-ghost">Cancelar</button>
            <button className="btn btn-ghost border border-slate-200">Subir</button>
          </menu>
        </form>
      </dialog>

      <dialog ref={dlgConfirmRef} className="rounded-2xl w-full max-w-sm">
        <form method="dialog" className="p-5" onSubmit={confirmDelete}>
          <p className="mb-5">¿Eliminar a "{players.find(p=>p.id===deleteId)?.name || "—"}"?</p>
          <menu className="flex justify-end gap-2">
            <button type="button" onClick={()=>dlgConfirmRef.current?.close()} className="btn btn-ghost">Cancelar</button>
            <button className="btn btn-danger">Eliminar</button>
          </menu>
        </form>
      </dialog>

      {/* Reporte con info extra del perfil */}
      <dialog ref={dlgReportRef} className="rounded-2xl w-full max-w-3xl">
        <form method="dialog" className="p-0 overflow-hidden">
          <div className="p-5 bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-rose-600 text-white">
            <h3 className="text-2xl font-extrabold">{reportPlayer?.name || "Reporte"}</h3>
          </div>
          <div className="p-5">
            {/* Nueva fila: datos personales */}
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              <div className="p-3 paper rounded-2xl">
                <div className="text-xs text-slate-500">Código de miembro</div>
                <div className="text-base font-semibold">{reportPlayer?.membershipCode || "—"}</div>
              </div>
              <div className="p-3 paper rounded-2xl">
                <div className="text-xs text-slate-500">Nacimiento</div>
                <div className="text-base font-semibold">{fmtDate(reportPlayer?.dob)}</div>
              </div>
              <div className="p-3 paper rounded-2xl">
                <div className="text-xs text-slate-500">Celular</div>
                <div className="text-base font-semibold">{reportPlayer?.phone || "—"}</div>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 paper rounded-2xl"><div className="text-xs text-slate-500">Puntos</div><div className="text-2xl font-extrabold">{reportPlayer?.points ?? 0}</div></div>
              <div className="p-3 paper rounded-2xl"><div className="text-xs text-slate-500">Ganados</div><div className="text-2xl font-extrabold">{reportPlayer?.wins ?? 0}</div></div>
              <div className="p-3 paper rounded-2xl"><div className="text-xs text-slate-500">Perdidos</div><div className="text-2xl font-extrabold">{reportPlayer?.losses ?? 0}</div></div>
              <div className="p-3 paper rounded-2xl"><div className="text-xs text-slate-500">Win %</div><div className="text-2xl font-extrabold">{reportPlayer ? `${reportPlayer.winPct}%` : "0%"}</div></div>
            </div>

            <h4 className="text-lg font-bold mb-2">Historial de partidos</h4>
            <div className="space-y-2 max-h-80 overflow-auto">
              {(reportPlayer?.matchHistory||[]).slice().sort((a,b)=> new Date(b.date)-new Date(a.date)).map((m,idx)=>(
                <div key={idx} className="p-3 paper rounded-xl flex items-center justify-between">
                  <span className={"px-2 py-1 rounded text-sm font-semibold "+(m.result==="win"?"bg-emerald-100 text-emerald-700":"bg-rose-100 text-rose-700")}>
                    {m.result.toUpperCase()}
                  </span>
                  <div className="flex-1 px-3 text-slate-700">vs <b>{m.opponentName||"—"}</b> <span className="text-slate-500 ml-1">({m.score||""})</span></div>
                  <span className="text-xs text-slate-500">{new Date(m.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>

            <menu className="mt-5 flex justify-end">
              <button type="button" className="btn btn-primary" onClick={()=>dlgReportRef.current?.close()}>Cerrar</button>
            </menu>
          </div>
        </form>
      </dialog>
    </div>
  );
}
