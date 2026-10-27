"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import confetti from "canvas-confetti";
import {
  X,
  ShieldCheck,
  Lock,
  Loader2,
  CheckCircle2,
  QrCode,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { useCms } from "@/context/CmsContext";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    MercadoPago: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    paymentBrickController?: any;
  }
}

interface CustomerData {
  name: string;
  email: string;
  cpf: string;
  phone?: string;
}

interface MercadoPagoModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  preferenceId: string;
  initPoint?: string;
  publicKey: string;
  total: number;
  customer: CustomerData;
  onPaymentSuccess?: (orderId: string) => void;
}

export function MercadoPagoModal({
  isOpen,
  onClose,
  orderId,
  preferenceId,
  initPoint,
  publicKey,
  total,
  customer,
  onPaymentSuccess,
}: MercadoPagoModalProps) {
  const router = useRouter();
  const { cms } = useCms();

  // Lifecycle & payment states
  const [orderAmount, setOrderAmount] = useState<number>(total > 0 ? total : 0);
  const [loadingBrick, setLoadingBrick] = useState(true);
  const [brickError, setBrickError] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<"form" | "pix_pending" | "approved">("form");
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string | null } | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins for PIX

  // Sync total prop when changed to positive value
  useEffect(() => {
    if (total > 0) {
      setOrderAmount(total);
    }
  }, [total]);

  // References to prevent re-render loops from parent updates
  const customerRef = useRef(customer);
  customerRef.current = customer;

  const onPaymentSuccessRef = useRef(onPaymentSuccess);
  onPaymentSuccessRef.current = onPaymentSuccess;

  const initPointRef = useRef(initPoint);
  initPointRef.current = initPoint;

  // Track if brick is already successfully mounted or currently in-flight
  const mountedOrderIdRef = useRef<string | null>(null);
  const isInitializingRef = useRef(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const brickControllerRef = useRef<any>(null);
  const containerId = "mercadopago-brick-container";
  const isMountedRef = useRef(false);

  // Trigger celebration confetti
  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.5 },
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }, 250);
    } catch (e) {
      console.warn("Confetti error:", e);
    }
  }, []);

  // Safely cleanup Brick controller
  const unmountBrick = useCallback(() => {
    if (brickControllerRef.current) {
      try {
        brickControllerRef.current.unmount();
      } catch (err) {
        console.warn("Error unmounting Mercado Pago Brick:", err);
      }
      brickControllerRef.current = null;
    }
    mountedOrderIdRef.current = null;
    isInitializingRef.current = false;
  }, []);

  // Initialize Payment Brick
  useEffect(() => {
    if (!isOpen || paymentState !== "form") {
      unmountBrick();
      return;
    }

    // CRITICAL: If the brick is already mounted for this orderId or currently in-flight, DO NOT remount!
    if (mountedOrderIdRef.current === orderId || isInitializingRef.current) {
      return;
    }

    isMountedRef.current = true;
    isInitializingRef.current = true;
    setLoadingBrick(true);
    setBrickError(null);
    setSubmitError(null);

    let checkInterval: NodeJS.Timeout;

    const setupBrick = async () => {
      // 1. Wait for window.MercadoPago to be available
      if (typeof window === "undefined" || !window.MercadoPago) {
        let attempts = 0;
        await new Promise<void>((resolve, reject) => {
          checkInterval = setInterval(() => {
            attempts++;
            if (window.MercadoPago) {
              clearInterval(checkInterval);
              resolve();
            } else if (attempts > 30) {
              clearInterval(checkInterval);
              reject(new Error("Não foi possível carregar o SDK do Mercado Pago."));
            }
          }, 200);
        });
      }

      if (!isMountedRef.current) {
        isInitializingRef.current = false;
        return;
      }

      try {
        // Ensure old brick is unmounted before creating a new one
        unmountBrick();

        const container = document.getElementById(containerId);
        if (container) {
          container.innerHTML = "";
        }

        // Resolve valid order amount and preferenceId (fallback to order endpoint if needed)
        let validAmount = orderAmount > 0 ? orderAmount : (total > 0 ? total : 0);
        let effectivePrefId = preferenceId;

        if ((validAmount <= 0 || !effectivePrefId) && orderId) {
          try {
            const res = await fetch(`/api/orders/${orderId}`);
            if (res.ok) {
              const data = await res.json();
              if (data?.total && Number(data.total) > 0) {
                validAmount = Number(data.total);
                setOrderAmount(validAmount);
              }
              if (data?.preferenceId) {
                effectivePrefId = data.preferenceId;
              }
            }
          } catch (e) {
            console.warn("Could not fetch order details:", e);
          }
        }

        if (validAmount <= 0) {
          isInitializingRef.current = false;
          throw new Error("Valor do pedido inválido ou não informado. Recarregue a página.");
        }

        const mp = new window.MercadoPago(publicKey, {
          locale: "pt-BR",
        });

        const bricksBuilder = mp.bricks();

        const curCustomer = customerRef.current;
        const [firstName, ...rest] = (curCustomer?.name || "Cliente").trim().split(" ");
        const lastName = rest.join(" ") || "Cliente";
        const cleanCpf = (curCustomer?.cpf || "").replace(/\D/g, "");

        const isDark = document.documentElement.classList.contains("dark");

        const settings = {
          initialization: {
            amount: Number(validAmount.toFixed(2)),
            preferenceId: effectivePrefId || undefined,
            payer: {
              email: curCustomer?.email,
              firstName,
              lastName,
              identification: {
                type: "CPF",
                number: cleanCpf,
              },
            },
          },
          customization: {
            paymentMethods: {
              bankTransfer: "all", // PIX
              mercadoPago: "all",  // Conta Mercado Pago
            },
            visual: {
              style: {
                theme: isDark ? "dark" : "default",
              },
            },
          },
          callbacks: {
            onReady: () => {
              if (isMountedRef.current) {
                setLoadingBrick(false);
                mountedOrderIdRef.current = orderId;
                isInitializingRef.current = false;
              }
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onSubmit: ({ formData }: { formData: any }) => {
              return new Promise<void>((resolve, reject) => {
                setSubmitError(null);

                // If user selected Mercado Pago account and it requires wallet redirect
                if (
                  formData?.payment_type_id === "wallet" ||
                  formData?.payment_method_id === "account_money" ||
                  formData?.payment_method_id === "consumer_credits"
                ) {
                  const targetUrl = initPointRef.current;
                  if (targetUrl) {
                    window.location.href = targetUrl;
                    resolve();
                    return;
                  }
                }

                fetch("/api/checkout/process-payment", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    orderId,
                    formData,
                  }),
                })
                  .then(async (res) => {
                    const data = await res.json();
                    if (!res.ok || !data.success) {
                      throw new Error(data.error || "Erro ao processar pagamento.");
                    }
                    return data;
                  })
                  .then((data) => {
                    resolve();

                    if (data.status === "approved") {
                      setPaymentState("approved");
                      triggerConfetti();
                      if (onPaymentSuccessRef.current) {
                        onPaymentSuccessRef.current(orderId);
                      }
                      setTimeout(() => {
                        router.push(`/pedido/sucesso?external_reference=${orderId}&status=approved`);
                      }, 2500);
                    } else if (data.status === "pending" || data.status === "in_process") {
                      if (data.pix) {
                        setPixData(data.pix);
                        setPaymentState("pix_pending");
                      } else {
                        // Other pending method (e.g. Card review)
                        setPaymentState("approved");
                        setTimeout(() => {
                          router.push(`/pedido/sucesso?external_reference=${orderId}&status=pending`);
                        }, 2000);
                      }
                    }
                  })
                  .catch((err: unknown) => {
                    const msg =
                      err instanceof Error
                        ? err.message
                        : "Não foi possível concluir o pagamento. Verifique seus dados e tente novamente.";
                    setSubmitError(msg);
                    reject(err);
                  });
              });
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onError: (error: any) => {
              console.warn("Mercado Pago Brick error notice:", error);
              if (isMountedRef.current) {
                setLoadingBrick(false);
                isInitializingRef.current = false;
              }
            },
          },
        };

        const controller = await bricksBuilder.create("payment", containerId, settings);
        if (isMountedRef.current) {
          brickControllerRef.current = controller;
          mountedOrderIdRef.current = orderId;
          isInitializingRef.current = false;
        } else {
          controller.unmount();
          isInitializingRef.current = false;
        }
      } catch (err: unknown) {
        if (isMountedRef.current) {
          setLoadingBrick(false);
          isInitializingRef.current = false;
          setBrickError(
            err instanceof Error
              ? err.message
              : "Erro ao inicializar a interface do Mercado Pago. Tente novamente."
          );
        }
      }
    };

    setupBrick();

    return () => {
      isMountedRef.current = false;
      clearInterval(checkInterval);
    };
  }, [
    isOpen,
    paymentState,
    orderId,
    preferenceId,
    publicKey,
    unmountBrick,
  ]);

  // PIX Countdown Timer
  useEffect(() => {
    if (paymentState !== "pix_pending") return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [paymentState]);

  // PIX Real-time Polling: Check if user paid via their banking app
  useEffect(() => {
    if (paymentState !== "pix_pending") return;

    let active = true;
    const pollPayment = async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/sync-mp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        const data = await res.json();

        if (active && data.order?.paymentStatus === "APPROVED") {
          setPaymentState("approved");
          triggerConfetti();
          if (onPaymentSuccess) {
            onPaymentSuccess(orderId);
          }
          setTimeout(() => {
            router.push(`/pedido/sucesso?external_reference=${orderId}&status=approved`);
          }, 2500);
        }
      } catch (e) {
        console.warn("Polling MP status error:", e);
      }
    };

    const interval = setInterval(pollPayment, 3500);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [paymentState, orderId, onPaymentSuccess, router, triggerConfetti]);

  // Copy PIX Code
  const handleCopyPix = () => {
    if (!pixData?.qrCode) return;
    navigator.clipboard.writeText(pixData.qrCode);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  // Format timer MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (!isOpen) return null;

  return (
    <>
      <Script src="https://sdk.mercadopago.com/js/v2" strategy="afterInteractive" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* MODAL CARD */}
      <div
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mp-modal-title"
      >
        
        {/* MODAL HEADER */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 id="mp-modal-title" className="font-black text-sm text-slate-900 dark:text-white leading-none">
                  Mercado Pago Seguro
                </h3>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">
                  <Lock className="w-2.5 h-2.5" /> 256-bit
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                Pedido <strong className="font-mono text-slate-700 dark:text-slate-300">#{orderId}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</div>
              <div
                className="font-black text-sm sm:text-base leading-none"
                style={{ color: cms.secondaryColor || "#e11d48" }}
              >
                R$ {(orderAmount > 0 ? orderAmount : total).toFixed(2).replace(".", ",")}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition"
              title="Fechar janela (seu pedido continuará salvo)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* STATE 1: APPROVED CELEBRATION */}
          {paymentState === "approved" && (
            <div className="py-8 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" /> Sucesso!
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  Pagamento Confirmado!
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Seu pedido <strong className="font-mono">#{orderId}</strong> foi aprovado pelo Mercado Pago e já está sendo preparado!
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => router.push(`/pedido/sucesso?external_reference=${orderId}&status=approved`)}
                  className="px-6 py-3 rounded-xl font-extrabold text-xs uppercase tracking-wider bg-slate-900 text-white dark:bg-white dark:text-slate-950 shadow-md hover:opacity-90 flex items-center justify-center gap-2 transition"
                >
                  <span>Ver Detalhes do Pedido</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: PIX QR CODE & CODE */}
          {paymentState === "pix_pending" && pixData && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="text-center space-y-1">
                <div className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full">
                  <QrCode className="w-3.5 h-3.5" /> PIX Gerado com Sucesso
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Pague com seu Banco ou Celular
                </h4>
                <div className="text-xs font-bold text-rose-500 flex items-center justify-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Expira em: {formatTimer(timeLeft)}</span>
                </div>
              </div>

              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 max-w-xs mx-auto">
                {pixData.qrCodeBase64 ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={pixData.qrCodeBase64}
                    alt="PIX QR Code"
                    className="w-52 h-52 rounded-xl shadow-md border-4 border-white dark:border-slate-700"
                  />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl">
                    <QrCode className="w-16 h-16 text-slate-400" />
                  </div>
                )}
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2.5 text-center">
                  Abra o app do seu banco e escaneie o código
                </span>
              </div>

              {/* Copia e Cola */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400">
                  <span>Ou use o Pix Copia e Cola:</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all max-h-20 overflow-y-auto">
                  {pixData.qrCode}
                </div>

                <button
                  type="button"
                  onClick={handleCopyPix}
                  className="w-full py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center justify-center gap-2 transition"
                >
                  {copiedPix ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Código Pix Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Código Pix</span>
                    </>
                  )}
                </button>
              </div>

              {/* Live Detection Notice */}
              <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900/60 flex items-center gap-2.5 text-xs text-sky-800 dark:text-sky-300">
                <Loader2 className="w-4 h-4 animate-spin text-sky-500 shrink-0" />
                <span>
                  Aguardando confirmação do pagamento... Esta janela se atualizará automaticamente assim que você pagar.
                </span>
              </div>

              <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
                <button
                  type="button"
                  onClick={() => setPaymentState("form")}
                  className="hover:underline font-bold text-slate-500 dark:text-slate-400"
                >
                  ← Escolher outra forma de pagamento
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="hover:underline font-bold text-slate-500 dark:text-slate-400"
                >
                  Pagar mais tarde
                </button>
              </div>
            </div>
          )}

          {/* STATE 3: PAYMENT BRICK EMBEDDED FORM */}
          {paymentState === "form" && (
            <div className="space-y-4">
              
              {/* Submission Error Banner */}
              {submitError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                  <div>
                    <strong className="block font-bold">Aviso no Pagamento</strong>
                    <span>{submitError}</span>
                  </div>
                </div>
              )}

              {/* Brick Error Banner */}
              {brickError && (
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200 space-y-3">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-500" />
                    <span>Não foi possível carregar o formulário integrado</span>
                  </div>
                  <p>{brickError}</p>
                  {initPoint && (
                    <a
                      href={initPoint}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-bold text-xs"
                    >
                      <span>Abrir Mercado Pago na página</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              )}

              {/* Loader while Brick initialises */}
              {loadingBrick && !brickError && (
                <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                  <span className="text-xs font-bold">Carregando interface oficial do Mercado Pago...</span>
                </div>
              )}

              {/* PAYMENT BRICK CONTAINER */}
              <div
                id={containerId}
                className={loadingBrick ? "hidden" : "w-full min-h-[300px]"}
              />

              {/* Fallback Option */}
              {initPoint && !loadingBrick && (
                <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] text-slate-400">
                    Deseja pagar via Mercado Pago diretamente?{" "}
                    <a
                      href={initPoint}
                      className="font-bold text-sky-500 hover:underline"
                    >
                      Pagar na página oficial
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-500" />
            Zero dados bancários retidos na loja
          </span>
          <span>Ambiente Oficial Mercado Pago</span>
        </div>
      </div>
    </div>
    </>
  );
}
