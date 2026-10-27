"use client";

import React from "react";
import { X, Ruler, CheckCircle } from "lucide-react";

export function SizeGuideModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
      />

      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 z-10 animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 flex items-center justify-center">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Tabela de Medidas Feminina
              </h3>
              <p className="text-xs text-slate-400">Medidas em centímetros (cm)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Measurements Table */}
        <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase font-black tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Tamanho</th>
                <th className="py-3 px-4">Manequim</th>
                <th className="py-3 px-4">Busto</th>
                <th className="py-3 px-4">Cintura</th>
                <th className="py-3 px-4">Quadril</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold text-slate-700 dark:text-slate-200">
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                <td className="py-3 px-4 font-black text-rose-600">P</td>
                <td className="py-3 px-4">36 - 38</td>
                <td className="py-3 px-4">84 - 89</td>
                <td className="py-3 px-4">66 - 71</td>
                <td className="py-3 px-4">92 - 97</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                <td className="py-3 px-4 font-black text-rose-600">M</td>
                <td className="py-3 px-4">40 - 42</td>
                <td className="py-3 px-4">90 - 95</td>
                <td className="py-3 px-4">72 - 77</td>
                <td className="py-3 px-4">98 - 103</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                <td className="py-3 px-4 font-black text-rose-600">G</td>
                <td className="py-3 px-4">44 - 46</td>
                <td className="py-3 px-4">96 - 102</td>
                <td className="py-3 px-4">78 - 85</td>
                <td className="py-3 px-4">104 - 110</td>
              </tr>
              <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                <td className="py-3 px-4 font-black text-rose-600">GG</td>
                <td className="py-3 px-4">48 - 50</td>
                <td className="py-3 px-4">103 - 110</td>
                <td className="py-3 px-4">86 - 94</td>
                <td className="py-3 px-4">111 - 118</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* How to Measure Tips */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs text-slate-600 dark:text-slate-300">
          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>Dicas para medir com fita métrica:</span>
          </div>
          <p>
            <strong>Busto:</strong> Passe a fita na parte mais saliente do busto mantendo os braços relaxados.
          </p>
          <p>
            <strong>Cintura:</strong> Meça na parte mais estreita do tronco, cerca de 2 dedos acima do umbigo.
          </p>
          <p>
            <strong>Quadril:</strong> Meça contornando a parte mais larga dos glúteos com os pés juntos.
          </p>
        </div>

        {/* Close Button */}
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-sm bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition"
          >
            Entendi, fechar tabela
          </button>
        </div>
      </div>
    </div>
  );
}
