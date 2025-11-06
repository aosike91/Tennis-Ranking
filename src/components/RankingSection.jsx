// components/RankingSection.jsx
import React from "react";
import { avatarOf } from "../utils/avatar";

export default function RankingSection({
  isAdmin,
  ranked,
  tournaments,
  searchTerm,
  setSearchTerm,
  ageFilter,
  setAgeFilter,
  genderFilter,
  setGenderFilter,
  tournamentFilter,
  setTournamentFilter,
  onEditPlayer,
  onDeletePlayer,
  onOpenReport,
}) {
  return (
    <>
      {/* Filtros */}
      <section className="mb-3">
        <div className="flex flex-wrap items-center gap-2 text-xs px-1">
          {/* 1. Búsqueda */}
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input !py-1.5 !px-2 text-xs w-40"
            placeholder="Buscar jugador..."
          />

          {/* 2. Edad */}
          <select
            className="select !py-1 !px-2 text-xs"
            value={ageFilter}
            onChange={(e) => setAgeFilter(e.target.value)}
          >
            <option value="all">Edad: todas</option>
            <option value="u18">Menos de 18</option>
            <option value="18-30">18 - 30</option>
            <option value="31-45">31 - 45</option>
            <option value="46plus">46+</option>
          </select>

          {/* 3. Género */}
          <select
            className="select !py-1 !px-2 text-xs"
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
          >
            <option value="all">Género: todos</option>
            <option value="male">Solo hombres</option>
            <option value="female">Solo mujeres</option>
          </select>

          {/* 4. Torneo */}
          <select
            className="select !py-1 !px-2 text-xs max-w-xs"
            value={tournamentFilter}
            onChange={(e) => setTournamentFilter(e.target.value)}
          >
            <option value="all">Todos los torneos</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          <button
            className="btn btn-ghost !py-1 !px-2 text-xs"
            onClick={() => {
              setSearchTerm("");
              setAgeFilter("all");
              setGenderFilter("all");
              setTournamentFilter("all");
            }}
          >
            Limpiar filtros
          </button>
        </div>
      </section>

      {/* Tabla */}
      <section>
        <div className="paper rounded-2xl shadow overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left text-slate-600 text-sm border-b">
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">Jugador</th>
                <th className="px-4 py-3">Puntos</th>
                <th className="px-4 py-3">V/D</th>
                {isAdmin && <th className="px-14 py-3">Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {ranked.map((p) => (
                <tr
                  key={p.id}
                  className="group hover:bg-slate-50 cursor-pointer"
                  onClick={(ev) => {
                    if (ev.target.closest?.("button")) return;
                    onOpenReport(p.id);
                  }}
                >
                  {/* Usa el rank global, no el índice del filtro */}
                  <td className="px-4 py-3 align-middle">
                    {p.globalRank ?? "—"}
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <div className="flex items-center gap-3 relative">
                      <img
                        src={p.photo || avatarOf(p.name)}
                        alt={p.name}
                        loading="lazy"
                        className="avatar avatar-md avatar-circle avatar-border-thick avatar-border-indigo"
                      />
                      <div>
                        <div className="font-bold">{p.name}</div>
                        <div className="text-[10px] text-slate-500">
                          {p.membershipCode || "—"} ·{" "}
                          {p.category || "—"}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    <div className="text-indigo-700 font-extrabold">
                      {p.points}
                    </div>
                    <div className="text-[9px] text-slate-400">
                      Puntos manuales: {p.tournamentPoints || 0} · Extra W/L:{" "}
                      {p.basePoints || 0}
                    </div>
                  </td>

                  <td className="px-4 py-3 align-middle">
                    {(p.wins || 0)}/{(p.losses || 0)}
                  </td>

                  {isAdmin && (
                    <td className="px-4 py-3 align-middle w-36">
                      <div className="flex gap-2 justify-end">
                        <button
                          className="btn btn-warn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditPlayer(p.id);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeletePlayer(p.id);
                          }}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}

              {ranked.length === 0 && (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="px-4 py-6 text-center text-sm text-slate-400"
                  >
                    No hay jugadores que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
