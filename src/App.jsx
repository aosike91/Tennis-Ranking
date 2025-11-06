// App.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { avatarOf } from "./utils/avatar";
import { computeWithRules, getAgeFromDob } from "./utils/tournaments";
import RegisterMatchSection from "./components/RegisterMatchSection";
import RankingSection from "./components/RankingSection";

const STORAGE_KEY = "tennis-demo-players-v1";
const RULES_KEY = "tennis-demo-rules-v1";
const TOURNAMENTS_KEY = "tennis-demo-tournaments-v1";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function seedPlayers() {
  const now = new Date().toISOString();
  const base = [
    {
      name: "Serena Williams",
      dob: "",
      phone: "",
      membershipCode: "T-001",
      gender: "F",
      category: "3RA",
      wins: 5,
      losses: 1,
      matchHistory: [
        { opponentName: "Roger Federer", result: "win", score: "6-4, 6-2", date: now },
      ],
    },
    {
      name: "Roger Federer",
      dob: "",
      phone: "",
      membershipCode: "T-002",
      gender: "M",
      category: "3RA",
      wins: 4,
      losses: 2,
      matchHistory: [
        { opponentName: "Rafael Nadal", result: "win", score: "7-6, 6-4", date: now },
      ],
    },
    {
      name: "Rafael Nadal",
      dob: "",
      phone: "",
      membershipCode: "T-003",
      gender: "M",
      category: "3RA",
      wins: 3,
      losses: 3,
      matchHistory: [],
    },
  ];
  return base.map((b) => ({
    id: uid(),
    photo: avatarOf(b.name),
    ...b,
  }));
}

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  // Jugadores
  const [players, setPlayers] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : seedPlayers();
      return (parsed || []).map((p) => ({
        ...p,
        photo: p.photo || avatarOf(p.name || "Usuario"),
        gender: p.gender || "M",
        category: p.category || "Principiante",
      }));
    } catch {
      return seedPlayers();
    }
  });

  // Torneos
  const [tournaments, setTournaments] = useState(() => {
    try {
      const raw = localStorage.getItem(TOURNAMENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const tournamentsById = useMemo(() => {
    const map = {};
    tournaments.forEach((t) => (map[t.id] = t));
    return map;
  }, [tournaments]);

  // Reglas extra W/L (opcionales)
  const [rules, setRules] = useState(() => {
    try {
      const raw = localStorage.getItem(RULES_KEY);
      return raw ? JSON.parse(raw) : { winPoints: 0, lossPoints: 0 };
    } catch {
      return { winPoints: 0, lossPoints: 0 };
    }
  });

  // Estado registrar partido (simple: 1 jugador + torneo + puntos)
  const [selectedP1, setSelectedP1] = useState("");
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [matchStage, setMatchStage] = useState("round-robin");
  const [score, setScore] = useState("");
  const [matchTab, setMatchTab] = useState("match");

  // Filtros ranking
  const [searchTerm, setSearchTerm] = useState("");
  const [ageFilter, setAgeFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [tournamentFilter, setTournamentFilter] = useState("all");

  // Modals
  const dlgPlayerRef = useRef(null);
  const dlgConfirmRef = useRef(null);
  const dlgBulkRef = useRef(null);
  const dlgReportRef = useRef(null);
  const dlgTournamentRef = useRef(null);

  // Form jugador
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [reportId, setReportId] = useState(null);
  const [formName, setFormName] = useState("");
  const [formDob, setFormDob] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formPhoto, setFormPhoto] = useState("");
  const [formGender, setFormGender] = useState("M");
  const [formCategory, setFormCategory] = useState("Principiante");
  const [bulkText, setBulkText] = useState("");

  // Form torneo
  const [formTName, setFormTName] = useState("");
  const [formTPoints, setFormTPoints] = useState(100);
  const [formTStart, setFormTStart] = useState("");
  const [formTEnd, setFormTEnd] = useState("");
  const [formTType, setFormTType] = useState("single");
  const [formTDivision, setFormTDivision] = useState("mixed");

  // Reglas temporales UI
  const [tmpWin, setTmpWin] = useState(rules.winPoints);
  const [tmpLoss, setTmpLoss] = useState(rules.lossPoints);

  useEffect(() => {
    setTmpWin(rules.winPoints);
    setTmpLoss(rules.lossPoints);
  }, [rules]);

  // Persistencia
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
    } catch {}
  }, [players]);

  useEffect(() => {
    try {
      localStorage.setItem(RULES_KEY, JSON.stringify(rules));
    } catch {}
  }, [rules]);

  useEffect(() => {
    try {
      localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
    } catch {}
  }, [tournaments]);

  // ===== RANKING GLOBAL (NO SE MUEVE EL NÚMERO) =====
  const rankedGlobal = useMemo(() => {
    const enriched = players.map((p) => computeWithRules(p, rules));
    enriched.sort(
      (a, b) => b.points - a.points || a.name.localeCompare(b.name)
    );
    return enriched.map((p, index) => ({
      ...p,
      globalRank: index + 1,
    }));
  }, [players, rules]);

  // ===== FILTROS SOBRE EL RANKING GLOBAL =====
  const rankedFiltered = useMemo(() => {
    let list = rankedGlobal;

    // 1) Búsqueda por texto (parcial, nombre o código)
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      list = list.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(q) ||
          (p.membershipCode || "").toLowerCase().includes(q)
      );
    }

    // 2) Edad
    if (ageFilter !== "all") {
      list = list.filter((p) => {
        const age = getAgeFromDob(p.dob);
        if (age == null) return false;
        switch (ageFilter) {
          case "u18":
            return age < 18;
          case "18-30":
            return age >= 18 && age <= 30;
          case "31-45":
            return age >= 31 && age <= 45;
          case "46plus":
            return age >= 46;
          default:
            return true;
        }
      });
    }

    // 3) Género
    if (genderFilter === "male") {
      list = list.filter((p) => p.gender === "M");
    } else if (genderFilter === "female") {
      list = list.filter((p) => p.gender === "F");
    }

    // 4) Torneo
    if (tournamentFilter !== "all") {
      const tid = tournamentFilter;
      list = list.filter((p) =>
        (p.matchHistory || []).some((m) => m.tournamentId === tid)
      );
    }

    return list;
  }, [rankedGlobal, searchTerm, ageFilter, genderFilter, tournamentFilter]);

  // ===== Torneos =====
  function openAddTournament() {
    setFormTName("");
    setFormTPoints(100);
    setFormTStart("");
    setFormTEnd("");
    setFormTType("single");
    setFormTDivision("mixed");
    dlgTournamentRef.current?.showModal();
  }

  function saveTournament(e) {
    e.preventDefault();
    const name = formTName.trim();
    if (!name) {
      alert("Nombre del torneo requerido");
      return;
    }
    const totalPoints = Number(formTPoints) || 0;

    const t = {
      id: uid(),
      name,
      totalPoints,
      startDate: formTStart || null,
      endDate: formTEnd || null,
      type: formTType,
      division: formTDivision,
    };

    setTournaments((prev) => [...prev, t]);
    dlgTournamentRef.current?.close();
  }

  function updateTournament(id, patch) {
    setTournaments((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
  }

  // ===== Jugadores CRUD =====

  function openAddPlayer() {
    setEditingId(null);
    setFormName("");
    setFormDob("");
    setFormPhone("");
    setFormCode("");
    setFormPhoto("");
    setFormGender("M");
    setFormCategory("Principiante");
    dlgPlayerRef.current?.showModal();
  }

  function openEditPlayer(id) {
    const p = players.find((x) => x.id === id);
    if (!p) return;
    setEditingId(id);
    setFormName(p.name || "");
    setFormDob(p.dob || "");
    setFormPhone(p.phone || "");
    setFormCode(p.membershipCode || "");
    setFormPhoto(p.photo || "");
    setFormGender(p.gender || "M");
    setFormCategory(p.category || "Principiante");
    dlgPlayerRef.current?.showModal();
  }

  function onPhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Sube una imagen válida.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setFormPhoto(reader.result);
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    setFormPhoto("");
  }

  function savePlayer(e) {
    e.preventDefault();
    const name = formName.trim();
    if (!name) {
      alert("Nombre requerido");
      return;
    }

    let photoToSave = formPhoto;
    if (!editingId && !photoToSave) {
      alert("La foto es obligatoria para crear un jugador.");
      return;
    }
    if (!photoToSave) {
      photoToSave =
        players.find((p) => p.id === editingId)?.photo || avatarOf(name);
    }

    const base = {
      name,
      dob: formDob,
      phone: formPhone,
      membershipCode: formCode,
      gender: formGender,
      category: formCategory,
      photo: photoToSave,
    };

    setPlayers((prev) =>
      editingId
        ? prev.map((p) => (p.id === editingId ? { ...p, ...base } : p))
        : [
            ...prev,
            {
              id: uid(),
              ...base,
              wins: 0,
              losses: 0,
              matchHistory: [],
            },
          ]
    );

    dlgPlayerRef.current?.close();
  }

  function openDeletePlayer(id) {
    setDeleteId(id);
    dlgConfirmRef.current?.showModal();
  }

  function confirmDelete(e) {
    e.preventDefault();
    if (deleteId) {
      setPlayers((prev) => prev.filter((p) => p.id !== deleteId));
    }
    dlgConfirmRef.current?.close();
  }

  function openReport(id) {
    setReportId(id);
    dlgReportRef.current?.showModal();
  }

  const reportPlayer = useMemo(() => {
    const p = players.find((x) => x.id === reportId);
    return p ? computeWithRules(p, rules) : null;
  }, [players, reportId, rules]);

  // ===== Carga masiva =====

  function doBulk(e) {
    e.preventDefault();
    try {
      const arr = JSON.parse(bulkText || "[]");
      if (!Array.isArray(arr)) throw new Error("Debe ser un arreglo");
      setPlayers((prev) => [
        ...prev,
        ...arr
          .filter((o) => o && o.name)
          .map((o) => {
            const name = o.name;
            return {
              id: uid(),
              name,
              dob: o.dob || "",
              phone: o.phone || "",
              membershipCode: o.membershipCode || "",
              gender: o.gender || "M",
              category: o.category || "Principiante",
              photo: o.photo || avatarOf(name),
              wins: o.wins || 0,
              losses: o.losses || 0,
              matchHistory: o.matchHistory || [],
            };
          }),
      ]);
      dlgBulkRef.current?.close();
      setBulkText("");
    } catch (err) {
      alert(err.message);
    }
  }

  // ===== Reglas extra =====
  function applyRules() {
    const w = Number(tmpWin);
    const l = Number(tmpLoss);
    if (Number.isNaN(w) || Number.isNaN(l)) {
      alert("Valores no válidos");
      return;
    }
    setRules({ winPoints: w, lossPoints: l });
  }

  function resetRulesToTournamentsOnly() {
    setRules({ winPoints: 0, lossPoints: 0 });
    setTmpWin(0);
    setTmpLoss(0);
  }

  // ===== Registrar puntos (1 jugador) =====
  function addMatch() {
    const playerId = selectedP1;
    const tid = selectedTournamentId;
    const pts = Number(score);

    if (!playerId) {
      alert("Selecciona un jugador.");
      return;
    }
    if (!tid) {
      alert("Selecciona un torneo.");
      return;
    }
    if (!score.trim() || Number.isNaN(pts)) {
      alert("Ingresa puntos válidos (ej: 100).");
      return;
    }

    const now = new Date().toISOString();
    const t = tournamentsById[tid];

    setPlayers((prev) =>
      prev.map((p) => {
        if (p.id !== playerId) return p;

        const event = {
          date: now,
          tournamentId: tid,
          tournamentName: t?.name || "",
          stage: matchStage,
          points: pts,
        };

        const prevManual =
          typeof p.manualPoints === "number" ? p.manualPoints : 0;

        return {
          ...p,
          manualPoints: prevManual + pts,
          matchHistory: [...(p.matchHistory || []), event],
        };
      })
    );

    setScore("");
  }

  const fmtDate = (d) => {
    if (!d) return "—";
    const t = Date.parse(d);
    return Number.isNaN(t)
      ? "—"
      : new Date(t).toLocaleDateString();
  };

  // ===== Render =====

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 text-slate-900">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* HEADER */}
        <header className="mb-6 md:mb-10">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-fuchsia-500 to-rose-500">
                Registro de puntos
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Gestión local de jugadores, torneos y puntos.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="btn-group" role="tablist">
                <button
                  className={`btn ${!isAdmin ? "btn-primary" : ""}`}
                  onClick={() => setIsAdmin(false)}
                >
                  Usuario
                </button>
                <button
                  className={`btn ${isAdmin ? "btn-primary" : ""}`}
                  onClick={() => setIsAdmin(true)}
                >
                  Admin
                </button>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => dlgBulkRef.current?.showModal()}
                    className="btn btn-ghost"
                  >
                    Carga masiva
                  </button>
                  <button
                    onClick={openAddTournament}
                    className="btn btn-ghost"
                  >
                    Añadir torneo
                  </button>
                  <button
                    onClick={openAddPlayer}
                    className="btn btn-primary"
                  >
                    Añadir jugador
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Registrar puntos / Editar torneo */}
        <RegisterMatchSection
          isAdmin={isAdmin}
          players={players}
          tournaments={tournaments}
          selectedP1={selectedP1}
          setSelectedP1={setSelectedP1}
          selectedTournamentId={selectedTournamentId}
          setSelectedTournamentId={setSelectedTournamentId}
          matchStage={matchStage}
          setMatchStage={setMatchStage}
          score={score}
          setScore={setScore}
          matchTab={matchTab}
          setMatchTab={setMatchTab}
          addMatch={addMatch}
          updateTournament={updateTournament}
          tmpWin={tmpWin}
          tmpLoss={tmpLoss}
          setTmpWin={setTmpWin}
          setTmpLoss={setTmpLoss}
          applyRules={applyRules}
          resetRulesToTournamentsOnly={resetRulesToTournamentsOnly}
        />

        {/* Ranking con filtros */}
        <RankingSection
          isAdmin={isAdmin}
          ranked={rankedFiltered}
          tournaments={tournaments}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          ageFilter={ageFilter}
          setAgeFilter={setAgeFilter}
          genderFilter={genderFilter}
          setGenderFilter={setGenderFilter}
          tournamentFilter={tournamentFilter}
          setTournamentFilter={setTournamentFilter}
          onEditPlayer={openEditPlayer}
          onDeletePlayer={openDeletePlayer}
          onOpenReport={openReport}
        />
      </div>

      {/* Modales: jugador, torneo, bulk, confirm, reporte */}
      {/* (idénticos a los que ya tenías, solo asegurando que usan reportPlayer) */}

      {/* MODAL: Jugador */}
      <dialog ref={dlgPlayerRef} className="rounded-2xl w-full max-w-lg">
        <form method="dialog" className="p-5" onSubmit={savePlayer}>
          <h3 className="text-xl font-bold mb-4">
            {editingId ? "Editar jugador" : "Añadir jugador"}
          </h3>
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <img
                src={formPhoto || avatarOf(formName || "Usuario", 128)}
                alt="preview"
                className="avatar avatar-xl avatar-circle avatar-border-thick avatar-border-slate"
              />
              <div className="flex items-center gap-2">
                <label className="btn btn-ghost border border-slate-200 cursor-pointer">
                  Cargar foto
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onPhotoChange}
                    className="hidden"
                  />
                </label>
                {formPhoto && (
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={clearPhoto}
                  >
                    Quitar
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="label">Nombre</label>
              <input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="input w-full"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">Nacimiento</label>
                <input
                  type="date"
                  value={formDob}
                  onChange={(e) => setFormDob(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="label">Celular</label>
                <input
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="input w-full"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="label">Código</label>
                <input
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="label">Género</label>
                <select
                  value={formGender}
                  onChange={(e) => setFormGender(e.target.value)}
                  className="select w-full"
                >
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
              </div>
              <div>
                <label className="label">Categoría</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="select w-full"
                >
                  <option>Principiante</option>
                  <option>5TA B</option>
                  <option>5TA A</option>
                  <option>4TA</option>
                  <option>3RA</option>
                </select>
              </div>
            </div>
          </div>

          <menu className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dlgPlayerRef.current?.close()}
              className="btn btn-ghost"
            >
              Cancelar
            </button>
            <button className="btn btn-primary">Guardar</button>
          </menu>
        </form>
      </dialog>

      {/* MODAL: Torneo */}
      <dialog ref={dlgTournamentRef} className="rounded-2xl w-full max-w-lg">
        <form method="dialog" className="p-5" onSubmit={saveTournament}>
          <h3 className="text-xl font-bold mb-4">Añadir torneo</h3>
          <div className="space-y-3">
            <div>
              <label className="label">Nombre del torneo</label>
              <input
                value={formTName}
                onChange={(e) => setFormTName(e.target.value)}
                className="input w-full"
                required
              />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">Puntos totales (referencia)</label>
                <input
                  type="number"
                  value={formTPoints}
                  onChange={(e) => setFormTPoints(e.target.value)}
                  className="input w-full"
                />
              </div>
              <div>
                <label className="label">Tipo</label>
                <select
                  value={formTType}
                  onChange={(e) => setFormTType(e.target.value)}
                  className="select w-full"
                >
                  <option value="single">Singles</option>
                  <option value="double">Doubles</option>
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">División</label>
                <select
                  value={formTDivision}
                  onChange={(e) => setFormTDivision(e.target.value)}
                  className="select w-full"
                >
                  <option value="male">Masculino</option>
                  <option value="female">Femenino</option>
                  <option value="mixed">Mixto</option>
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="label">Inicio</label>
                  <input
                    type="date"
                    value={formTStart}
                    onChange={(e) => setFormTStart(e.target.value)}
                    className="input w-full"
                  />
                </div>
                <div className="flex-1">
                  <label className="label">Fin</label>
                  <input
                    type="date"
                    value={formTEnd}
                    onChange={(e) => setFormTEnd(e.target.value)}
                    className="input w-full"
                  />
                </div>
              </div>
            </div>
          </div>
          <menu className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dlgTournamentRef.current?.close()}
              className="btn btn-ghost"
            >
              Cancelar
            </button>
            <button className="btn btn-primary">Guardar</button>
          </menu>
        </form>
      </dialog>

      {/* MODAL: Carga masiva */}
      <dialog ref={dlgBulkRef} className="rounded-2xl w-full max-w-2xl">
        <form method="dialog" className="p-5" onSubmit={doBulk}>
          <h3 className="text-xl font-bold mb-3">Carga masiva (JSON)</h3>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            className="w-full h-56 border border-slate-200 rounded-xl p-3 font-mono text-sm bg-white"
            placeholder='[{"name":"Jugador","gender":"M","category":"5TA A"}]'
          />
          <menu className="mt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dlgBulkRef.current?.close()}
              className="btn btn-ghost"
            >
              Cancelar
            </button>
            <button className="btn btn-ghost border border-slate-200">
              Subir
            </button>
          </menu>
        </form>
      </dialog>

      {/* MODAL: Confirmar eliminación */}
      <dialog ref={dlgConfirmRef} className="rounded-2xl w-full max-w-sm">
        <form method="dialog" className="p-5" onSubmit={confirmDelete}>
          <p className="mb-5">
            ¿Eliminar a "
            {players.find((p) => p.id === deleteId)?.name || "—"}"?
          </p>
          <menu className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => dlgConfirmRef.current?.close()}
              className="btn btn-ghost"
            >
              Cancelar
            </button>
            <button className="btn btn-danger">Eliminar</button>
          </menu>
        </form>
      </dialog>

      {/* MODAL: Reporte jugador */}
      <dialog ref={dlgReportRef} className="rounded-2xl w-full max-w-3xl">
        <form method="dialog" className="p-0 overflow-hidden">
          <div className="p-5 bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-rose-600 text-white flex items-center gap-4">
            <img
              src={
                reportPlayer?.photo ||
                avatarOf(reportPlayer?.name || "Usuario", 160)
              }
              alt={reportPlayer?.name || "Jugador"}
              className="avatar avatar-2xl avatar-circle avatar-border-heavy avatar-border-emerald"
            />
            <div>
              <h3 className="text-2xl font-extrabold">
                {reportPlayer?.name || "Reporte"}
              </h3>
              {reportPlayer && (
                <p className="text-xs text-slate-100">
                  {reportPlayer.gender === "F" ? "Femenino" : "Masculino"} ·{" "}
                  {reportPlayer.category || "Sin categoría"}
                </p>
              )}
            </div>
          </div>

          <div className="p-5">
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              <div className="p-3 paper rounded-2xl">
                <div className="text-xs text-slate-500">Código</div>
                <div className="text-base font-semibold">
                  {reportPlayer?.membershipCode || "—"}
                </div>
              </div>
              <div className="p-3 paper rounded-2xl">
                <div className="text-xs text-slate-500">Nacimiento</div>
                <div className="text-base font-semibold">
                  {fmtDate(reportPlayer?.dob)}
                </div>
              </div>
              <div className="p-3 paper rounded-2xl">
                <div className="text-xs text-slate-500">Celular</div>
                <div className="text-base font-semibold">
                  {reportPlayer?.phone || "—"}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 paper rounded-2xl">
                <div className="text-xs text-slate-500">Rank global</div>
                <div className="text-2xl font-extrabold">
                  {
                    rankedGlobal.find((p) => p.id === reportPlayer?.id)
                      ?.globalRank ?? "—"
                  }
                </div>
              </div>
              <div className="p-3 paper rounded-2xl">
                <div className="text-xs text-slate-500">Puntos totales</div>
                <div className="text-2xl font-extrabold">
                  {reportPlayer?.points ?? 0}
                </div>
              </div>
              <div className="p-3 paper rounded-2xl">
                <div className="text-xs text-slate-500">De torneos/manual</div>
                <div className="text-2xl font-extrabold">
                  {reportPlayer?.tournamentPoints ?? 0}
                </div>
              </div>
              <div className="p-3 paper rounded-2xl">
                <div className="text-xs text-slate-500">Win % extra</div>
                <div className="text-2xl font-extrabold">
                  {reportPlayer ? `${reportPlayer.winPct}%` : "0%"}
                </div>
              </div>
            </div>

            <h4 className="text-lg font-bold mb-2">Historial de partidos</h4>
            <div className="match-list max-h-80 overflow-auto">
              {(reportPlayer?.matchHistory || [])
                .slice()
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .map((m, idx) => {
                  const t =
                    m.tournamentId && tournamentsById[m.tournamentId];
                  return (
                    <div key={idx} className="match-item">
                      <span className="match-badge match-badge-win">
                        +{m.points || 0}
                      </span>
                      <div className="match-item-body">
                        {t ? (
                          <>
                            {t.name} · {m.stage || "—"}
                          </>
                        ) : (
                          "Puntos manuales"
                        )}
                      </div>
                      <span className="match-item-date">
                        {m.date
                          ? new Date(m.date).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                  );
                })}
            </div>

            <menu className="mt-5 flex justify-end">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => dlgReportRef.current?.close()}
              >
                Cerrar
              </button>
            </menu>
          </div>
        </form>
      </dialog>
    </div>
  );
}
