// components/RegisterMatchSection.jsx
import React from "react";

export default function RegisterMatchSection({
  isAdmin,
  players,
  tournaments,
  selectedP1,
  setSelectedP1,
  selectedTournamentId,
  setSelectedTournamentId,
  matchStage,
  setMatchStage,
  score,
  setScore,
  matchTab,
  setMatchTab,
  addMatch,
  updateTournament,
  tmpWin,
  tmpLoss,
  setTmpWin,
  setTmpLoss,
  applyRules,
  resetRulesToTournamentsOnly,
}) {
  if (!isAdmin) return null;

  const selectedTournament = tournaments.find(
    (t) => t.id === selectedTournamentId
  );

  return (
    <section className="mb-8 p-5 paper rounded-2xl shadow">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold text-indigo-700">
          Nuevo
        </h2>
        <div className="flex gap-2">
          <button
            className={`tab-btn ${
              matchTab === "match" ? "tab-active" : "tab-inactive"
            }`}
            onClick={() => setMatchTab("match")}
          >
            Regresar
          </button>
          <button
            className={`tab-btn ${
              matchTab === "torneo" ? "tab-active" : "tab-inactive"
            }`}
            onClick={() => setMatchTab("torneo")}
          >
            Editar Torneo
          </button>
        </div>
      </div>

      {matchTab === "match" ? (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            {/* Jugador */}
            <select
              value={selectedP1}
              onChange={(e) => setSelectedP1(e.target.value)}
              className="select"
            >
              <option value="">— Jugador —</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Torneo */}
            <select
              value={selectedTournamentId}
              onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="select"
            >
              <option value="">— Torneo —</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} {t.type === "double" ? "(Dobles)" : "(Singles)"}
                </option>
              ))}
            </select>

            {/* Ronda */}
            <select
              value={matchStage}
              onChange={(e) => setMatchStage(e.target.value)}
              className="select"
            >
              <option value="round-robin">Round Robin</option>
              <option value="octavos">Octavos</option>
              <option value="cuartos">Cuartos</option>
              <option value="semis">Semifinal</option>
              <option value="final">Final</option>
            </select>

            {/* Puntos: input nativo con flechitas */}
            <input
              type="number"
              min="0"
              step="5" // ajusta el step si quieres
              value={score}
              onChange={(e) => setScore(e.target.value)}
              className="input w-full"
              placeholder="Puntos (ej: 100)"
            />
          </div>

          <div className="flex items-center gap-3 mt-3">
            <button
              onClick={addMatch}
              className="rounded-xl px-4 py-2 font-extrabold text-white bg-emerald-600 hover:brightness-110 active:scale-[.99] transition"
            >
              Guardar puntos
            </button>
            
          </div>
        </>
      ) : (
        <div className="space-y-3">
          {!selectedTournament ? (
            <p className="text-xs text-slate-500">
              Selecciona un torneo en la pestaña "Partido" para editar sus datos.
            </p>
          ) : (
            <>
              <p className="text-xs text-slate-500">
                Editando torneo: <b>{selectedTournament.name}</b>
              </p>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Nombre</label>
                  <input
                    className="input w-full"
                    value={selectedTournament.name}
                    onChange={(e) =>
                      updateTournament(selectedTournament.id, {
                        name: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">Puntos totales (referencia)</label>
                  <input
                    type="number"
                    className="input w-full"
                    value={selectedTournament.totalPoints || 0}
                    onChange={(e) =>
                      updateTournament(selectedTournament.id, {
                        totalPoints: Number(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <label className="label">Tipo</label>
                  <select
                    className="select w-full"
                    value={selectedTournament.type || "single"}
                    onChange={(e) =>
                      updateTournament(selectedTournament.id, {
                        type: e.target.value,
                      })
                    }
                  >
                    <option value="single">Singles</option>
                    <option value="double">Doubles</option>
                  </select>
                </div>
                <div>
                  <label className="label">División</label>
                  <select
                    className="select w-full"
                    value={selectedTournament.division || "mixed"}
                    onChange={(e) =>
                      updateTournament(selectedTournament.id, {
                        division: e.target.value,
                      })
                    }
                  >
                    <option value="male">Masculino</option>
                    <option value="female">Femenino</option>
                    <option value="mixed">Mixto</option>
                  </select>
                </div>
                <div className="text-[10px] text-slate-500 flex items-end">
                  Por ahora es informativo; la suma real viene del campo de puntos.
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Fecha inicio</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={selectedTournament.startDate || ""}
                    onChange={(e) =>
                      updateTournament(selectedTournament.id, {
                        startDate: e.target.value || null,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">Fecha fin</label>
                  <input
                    type="date"
                    className="input w-full"
                    value={selectedTournament.endDate || ""}
                    onChange={(e) =>
                      updateTournament(selectedTournament.id, {
                        endDate: e.target.value || null,
                      })
                    }
                  />
                </div>
              </div>

              <div className="mt-3 border-t pt-3">
                <p className="text-[10px] text-slate-500 mb-1">
                  Puntos extra por win/loss (opcionales, se suman a los puntos manuales):
                </p>
                <div className="grid md:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="label">Por victoria</label>
                    <input
                      type="number"
                      className="input w-full"
                      value={tmpWin}
                      onChange={(e) => setTmpWin(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label">Por derrota</label>
                    <input
                      type="number"
                      className="input w-full"
                      value={tmpLoss}
                      onChange={(e) => setTmpLoss(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="btn btn-ghost border border-slate-200 flex-1"
                      onClick={applyRules}
                    >
                      Aplicar
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost flex-1"
                      onClick={resetRulesToTournamentsOnly}
                    >
                      Solo manual
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
