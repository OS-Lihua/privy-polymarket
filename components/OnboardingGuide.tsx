"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/utils/classNames";

type TourStep = {
  target: string;
  titleKey:
    | "tourSafeAddressTitle"
    | "tourDepositTitle"
    | "tourSessionTitle"
    | "tourOrderTitle";
  bodyKey:
    | "tourSafeAddressBody"
    | "tourDepositBody"
    | "tourSessionBody"
    | "tourOrderBody";
  placement: "bottom" | "top";
};

const steps: TourStep[] = [
  {
    target: "[data-tour='safe-address']",
    titleKey: "tourSafeAddressTitle",
    bodyKey: "tourSafeAddressBody",
    placement: "bottom",
  },
  {
    target: "[data-tour='deposit-balance']",
    titleKey: "tourDepositTitle",
    bodyKey: "tourDepositBody",
    placement: "bottom",
  },
  {
    target: "[data-tour='session']",
    titleKey: "tourSessionTitle",
    bodyKey: "tourSessionBody",
    placement: "bottom",
  },
  {
    target: "[data-tour='order']",
    titleKey: "tourOrderTitle",
    bodyKey: "tourOrderBody",
    placement: "top",
  },
];

export default function OnboardingGuide({ enabled }: { enabled: boolean }) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const step = steps[stepIndex];

  useEffect(() => {
    if (!enabled) return;

    const seen = window.localStorage.getItem("tradingGuideSeen") === "true";
    if (!seen) setIsOpen(true);
  }, [enabled]);

  useEffect(() => {
    if (!isOpen) return;

    const updateTarget = () => {
      const target = document.querySelector(step.target);
      if (!target) {
        setTargetRect(null);
        return;
      }

      const rect = target.getBoundingClientRect();
      setTargetRect(rect);
    };

    document
      .querySelector(step.target)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });
    updateTarget();
    window.addEventListener("resize", updateTarget);
    window.addEventListener("scroll", updateTarget, true);

    return () => {
      window.removeEventListener("resize", updateTarget);
      window.removeEventListener("scroll", updateTarget, true);
    };
  }, [isOpen, step.target]);

  const popoverStyle = useMemo(() => {
    if (!targetRect) return undefined;

    const width = Math.min(360, window.innerWidth - 32);
    const left = Math.min(
      Math.max(16, targetRect.left + targetRect.width / 2 - width / 2),
      window.innerWidth - width - 16
    );
    const top =
      step.placement === "bottom"
        ? targetRect.bottom + 16
        : targetRect.top - 16;

    return {
      width,
      left,
      top: step.placement === "bottom" ? top : undefined,
      bottom:
        step.placement === "top"
          ? Math.max(16, window.innerHeight - top)
          : undefined,
    };
  }, [step.placement, targetRect]);

  if (!enabled) return null;

  const finish = () => {
    window.localStorage.setItem("tradingGuideSeen", "true");
    setIsOpen(false);
    setStepIndex(0);
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="btn btn-secondary fixed bottom-5 right-5 z-40"
      >
        {t("tourRestart")}
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-40 bg-transparent" />
      {targetRect && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border-2 border-blue-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.58),0_0_28px_rgba(96,165,250,0.55)]"
          style={{
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        />
      )}
      <div
        className="fixed z-50 rounded-lg border border-blue-400/50 bg-gray-950 p-4 shadow-lg"
        style={popoverStyle || { left: 16, right: 16, top: 120 }}
      >
        <div
          className={cn(
            "absolute left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-blue-400/50 bg-gray-950",
            step.placement === "bottom"
              ? "-top-1.5 border-l border-t"
              : "-bottom-1.5 border-b border-r"
          )}
        />
        <div className="mb-4">
          <p className="text-sm font-semibold text-white">{t(step.titleKey)}</p>
          <p className="mt-2 text-sm leading-6 text-gray-300">{t(step.bodyKey)}</p>
        </div>
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={finish} className="btn btn-ghost">
            {t("tourSkip")}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
              disabled={stepIndex === 0}
              className="btn btn-secondary"
            >
              {t("tourBack")}
            </button>
            <button
              type="button"
              onClick={() => {
                if (stepIndex === steps.length - 1) finish();
                else setStepIndex((value) => value + 1);
              }}
              className="btn btn-primary"
            >
              {stepIndex === steps.length - 1 ? t("tourDone") : t("tourNext")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
