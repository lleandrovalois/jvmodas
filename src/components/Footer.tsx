"use client";

import React from "react";
import Link from "next/link";
import { useCms } from "@/context/CmsContext";
import {
  ShieldCheck,
  MessageCircle,
  Phone,
  Mail,
  MapPin,
  Lock,
} from "lucide-react";

export function Footer() {
  const { cms } = useCms();

  const cleanPhone = (cms.whatsappNumber || "5511999998888").replace(/\D/g, "");
  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
    "Olá, equipe JVMODAS! Gostaria de tirar uma dúvida sobre os produtos de moda fitness."
  )}`;

  return (
    <footer
      className="w-full pt-16 pb-10 transition-colors duration-300"
      style={{
        backgroundColor: "var(--card-bg)",
        color: "var(--text-primary)",
        borderTop: "1px solid rgba(148, 163, 184, 0.15)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800/40">
          
          {/* 1. Brand Info */}
          <div className="space-y-4">
            <div className="flex flex-col items-start leading-none">
              <span
                className="text-2xl font-black tracking-tighter uppercase"
                style={{ color: "var(--text-primary)" }}
              >
                <span style={{ color: cms.secondaryColor || "#e11d48" }}>JV</span>
                <span>MODAS</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-0.5">
                Fitness Wear
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {cms.brandTagline || "Moda fitness de alta performance com tecnologia zero transparência, compressão anatômica e elegância para todos os momentos do seu dia."}
            </p>
            <div className="flex items-center gap-3 pt-2">
              {cms.instagramUrl && (
                <a
                  href={cms.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-slate-900 hover:bg-rose-600 text-white flex items-center justify-center transition"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
              )}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-full bg-slate-900 hover:bg-emerald-600 text-white flex items-center justify-center transition"
                aria-label="WhatsApp"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* 2. Categorias */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">
              Coleções Populares
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li>
                <a href="#vitrine" className="hover:text-white transition">Leggings de Alta Compressão</a>
              </li>
              <li>
                <a href="#vitrine" className="hover:text-white transition">Tops Nadador & Alta Sustentação</a>
              </li>
              <li>
                <a href="#vitrine" className="hover:text-white transition">Conjuntos Seamless Canelados</a>
              </li>
              <li>
                <a href="#vitrine" className="hover:text-white transition">Shorts com Bolso Celular</a>
              </li>
              <li>
                <a href="#vitrine" className="hover:text-white transition">Macacões Modeladores</a>
              </li>
            </ul>
          </div>

          {/* 3. Atendimento e Suporte */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-white mb-4">
              Atendimento Humanizado
            </h4>
            <ul className="space-y-3 text-xs text-slate-400">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-500 shrink-0" />
                <span>WhatsApp: {cms.whatsappNumber || "(11) 99999-8888"}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-rose-500 shrink-0" />
                <span>contato@jvmodas.com.br</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>São Paulo - SP | Envio para todo o Brasil</span>
              </li>
              <li className="pt-1">
                <Link
                  href="/meus-pedidos"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 transition"
                >
                  <span>📦 Acompanhar Meus Pedidos</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* 4. Segurança e Acesso Admin */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-white">
              Segurança & Gestão
            </h4>
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Lock className="w-4 h-4" />
                <span>Checkout 100% Blindado</span>
              </div>
              <p className="text-[11px] text-slate-400">
                PIX com QR Code dinâmico do Banco Central e Cartões processados com tokenização criptografada.
              </p>
            </div>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition w-full justify-center"
            >
              <ShieldCheck className="w-4 h-4 text-rose-500" />
              <span>Acessar Painel Admin CMS</span>
            </Link>
          </div>

        </div>

        {/* Bottom Bar: Copyright & Payment Icons */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            &copy; {new Date().getFullYear()} {cms.brandName} - Todos os direitos reservados. CNPJ 00.000.000/0001-00
          </div>
          <div className="flex items-center gap-2 font-bold text-[11px]">
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white">PIX</span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white">VISA</span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white">MASTERCARD</span>
            <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white">ELO</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
