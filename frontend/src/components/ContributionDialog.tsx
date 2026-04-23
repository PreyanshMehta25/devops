import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/clerk-react";
import {
  AlertCircle,
  CheckCircle,
  Gift,
  Heart,
  Loader2,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";

type ContributionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
};

type MessageState = {
  type: "success" | "error";
  text: string;
} | null;

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const presetAmounts = [99, 199, 499];

let razorpayScriptPromise: Promise<boolean> | null = null;

const loadRazorpayScript = () => {
  if (typeof window === "undefined") {
    return Promise.resolve(false);
  }

  if (window.Razorpay) {
    return Promise.resolve(true);
  }

  if (!razorpayScriptPromise) {
    razorpayScriptPromise = new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  }

  return razorpayScriptPromise;
};

const ContributionDialog: React.FC<ContributionDialogProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useUser();
  const [amount, setAmount] = useState("199");
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);

  useEffect(() => {
    if (!isOpen) {
      setLoading(false);
      return;
    }

    setMessage(null);
    setAmount("199");
    setCustomAmount("");
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, loading, onClose]);

  if (!isOpen) {
    return null;
  }

  const selectedAmount = Number(customAmount.trim() || amount);
  const validAmount = Number.isFinite(selectedAmount)
    ? Math.max(1, Math.round(selectedAmount))
    : 0;

  const handlePresetSelect = (presetAmount: number) => {
    setAmount(String(presetAmount));
    setCustomAmount("");
  };

  const startPayment = async () => {
    if (!RAZORPAY_KEY_ID) {
      setMessage({
        type: "error",
        text: "Missing Razorpay publishable key. Add VITE_RAZORPAY_KEY_ID in the frontend .env file.",
      });
      return;
    }

    if (validAmount < 1) {
      setMessage({
        type: "error",
        text: "Please enter a valid contribution amount.",
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Unable to load Razorpay checkout.");
      }

      const orderResponse = await fetch(
        `${API_BASE_URL}/api/payments/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: validAmount,
            currency: "INR",
            purpose: "Community contribution",
          }),
        },
      );

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create payment order.");
      }

      const orderData = await orderResponse.json();
      const order = orderData.order;

      const checkout = new window.Razorpay({
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "StackIt Community Fund",
        description: "Support the community with a contribution",
        order_id: order.id,
        prefill: {
          name: user?.fullName || user?.firstName || "Community Supporter",
          email: user?.emailAddresses?.[0]?.emailAddress || "",
        },
        theme: {
          color: "#8b5cf6",
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            const verifyResponse = await fetch(
              `${API_BASE_URL}/api/payments/verify`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  ...response,
                  amount: validAmount,
                }),
              },
            );

            if (!verifyResponse.ok) {
              const errorData = await verifyResponse.json().catch(() => ({}));
              throw new Error(
                errorData.error || "Payment verification failed.",
              );
            }

            setMessage({
              type: "success",
              text: "Contribution successful. Thank you for supporting the community.",
            });
            setTimeout(() => {
              onClose();
            }, 1400);
          } catch (error: any) {
            setMessage({
              type: "error",
              text:
                error.message || "Payment completed but verification failed.",
            });
          } finally {
            setLoading(false);
          }
        },
      });

      checkout.on("payment.failed", (response: any) => {
        setMessage({
          type: "error",
          text:
            response?.error?.description || "Payment failed. Please try again.",
        });
        setLoading(false);
      });

      checkout.open();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Unable to start the payment flow.",
      });
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000]">
      <div
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
        aria-hidden="true"
        onClick={() => {
          if (!loading) {
            onClose();
          }
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-lg max-h-[92vh] overflow-auto rounded-3xl border border-white/70 bg-white shadow-2xl">
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 px-6 py-5 text-white">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex rounded-2xl bg-white/15 p-3">
                  <Gift className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold">Support the community</h3>
                <p className="mt-2 max-w-md text-sm text-white/85">
                  Make a contribution to keep the discussion space active and
                  useful for everyone.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!loading) {
                    onClose();
                  }
                }}
                disabled={loading}
                className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Close contribution dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="space-y-5 p-6">
            {message && (
              <div
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm ${
                  message.type === "success"
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0" />
                )}
                <span>{message.text}</span>
              </div>
            )}

            <div>
              <label className="mb-3 block text-sm font-semibold text-gray-700">
                Choose an amount
              </label>
              <div className="grid grid-cols-3 gap-3">
                {presetAmounts.map((presetAmount) => (
                  <button
                    key={presetAmount}
                    type="button"
                    onClick={() => handlePresetSelect(presetAmount)}
                    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition-all ${
                      Number(customAmount.trim() || amount) === presetAmount
                        ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm"
                        : "border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:bg-purple-50"
                    }`}
                  >
                    ₹{presetAmount}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="custom-contribution"
                className="mb-3 block text-sm font-semibold text-gray-700"
              >
                Or enter a custom amount
              </label>
              <input
                id="custom-contribution"
                type="number"
                min="1"
                step="1"
                value={customAmount}
                onChange={(event) => setCustomAmount(event.target.value)}
                placeholder="Amount in INR"
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-800 outline-none transition-all focus:border-purple-400 focus:ring-4 focus:ring-purple-100"
              />
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-gray-50 px-4 py-3 text-sm text-gray-500">
              <span>Minimum contribution: ₹1</span>
              <span>Secure checkout via Razorpay</span>
            </div>

            <button
              type="button"
              onClick={startPayment}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 px-5 py-3.5 font-semibold text-white transition-all hover:shadow-lg hover:shadow-purple-200 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Heart className="h-5 w-5" />
              )}
              {loading ? "Processing..." : `Contribute ₹${validAmount}`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ContributionDialog;
