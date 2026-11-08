"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { cn } from "@/lib/format";
import { Icon, type IconName } from "./icons";

export type ActionResult = { ok: boolean; error?: string };

const ModalContext = createContext<{ close: () => void }>({ close: () => {} });

export function useModalClose() {
  return useContext(ModalContext).close;
}

export function Modal({
  label,
  title,
  description,
  children,
  icon,
  variant = "primary",
  size = "md",
  className,
}: {
  label: string;
  title: string;
  description?: string;
  children: ReactNode;
  icon?: IconName;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const widths = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl" };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "btn",
          variant === "primary" && "btn-primary",
          variant === "secondary" && "btn-secondary",
          variant === "ghost" && "btn-ghost",
          className
        )}
      >
        {icon && <Icon name={icon} className="h-4 w-4" />}
        {label}
      </button>

      {open && (
        <div
          className="modal-backdrop fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "modal-panel my-8 w-full rounded-2xl bg-white p-5 shadow-2xl sm:my-0",
              widths[size]
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 id={titleId} className="text-base font-semibold text-slate-900">
                  {title}
                </h2>
                {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                aria-label="Close"
              >
                <Icon name="x" className="h-4 w-4" />
              </button>
            </div>
            <ModalContext.Provider value={{ close: () => setOpen(false) }}>
              {children}
            </ModalContext.Provider>
          </div>
        </div>
      )}
    </>
  );
}

export function ActionForm({
  action,
  children,
  submitLabel = "Save",
  submitVariant = "primary",
  className,
  footerClassName,
  resetOnSuccess = true,
  closeOnSuccess = true,
  cancelLabel = "Cancel",
  successMessage,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: ReactNode;
  submitLabel?: string;
  submitVariant?: "primary" | "secondary" | "danger";
  className?: string;
  footerClassName?: string;
  resetOnSuccess?: boolean;
  closeOnSuccess?: boolean;
  cancelLabel?: string | null;
  successMessage?: string;
}) {
  const close = useModalClose();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <form
      className={cn("space-y-4", className)}
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        setError(null);
        setSaved(false);
        startTransition(async () => {
          const result = await action(formData);
          if (!result.ok) {
            setError(result.error ?? "Something went wrong. Please try again.");
            return;
          }
          if (resetOnSuccess) form.reset();
          if (successMessage) setSaved(true);
          if (closeOnSuccess) close();
        });
      }}
    >
      {children}

      {error && (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
          {error}
        </p>
      )}

      {saved && successMessage && (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-200">
          {successMessage}
        </p>
      )}

      <div className={cn("flex items-center justify-end gap-2 pt-1", footerClassName)}>
        {cancelLabel && (
          <button type="button" onClick={close} className="btn btn-secondary">
            {cancelLabel}
          </button>
        )}
        <button
          type="submit"
          disabled={pending}
          className={cn(
            "btn",
            submitVariant === "primary" && "btn-primary",
            submitVariant === "secondary" && "btn-secondary",
            submitVariant === "danger" && "btn-danger"
          )}
        >
          {pending ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

export function ActionButton({
  action,
  label,
  pendingLabel,
  className,
  variant = "ghost",
  icon,
  confirm,
  title,
  compact,
}: {
  action: () => Promise<ActionResult>;
  label?: string;
  pendingLabel?: string;
  className?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  icon?: IconName;
  confirm?: string;
  title?: string;
  compact?: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      title={title ?? label}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        startTransition(async () => {
          const result = await action();
          if (!result.ok && result.error) window.alert(result.error);
        });
      }}
      className={cn(
        "btn",
        compact && "btn-sm px-1.5",
        variant === "primary" && "btn-primary",
        variant === "secondary" && "btn-secondary",
        variant === "ghost" && "btn-ghost",
        variant === "danger" && "text-rose-600 hover:bg-rose-50",
        className
      )}
    >
      {icon && <Icon name={icon} className="h-4 w-4" />}
      {pending ? pendingLabel ?? "Working…" : label}
    </button>
  );
}

export function SubmitButton({
  children,
  className,
  variant = "primary",
  icon,
}: {
  children: ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "ghost";
  icon?: IconName;
}) {
  const [pending, setPending] = useState(false);

  return (
    <button
      type="submit"
      onClick={() => {
        // Reset shortly after so the pending state shows during the server round trip.
        setPending(true);
        window.setTimeout(() => setPending(false), 1800);
      }}
      disabled={pending}
      className={cn(
        "btn",
        variant === "primary" && "btn-primary",
        variant === "secondary" && "btn-secondary",
        variant === "ghost" && "btn-ghost",
        className
      )}
    >
      {icon && <Icon name={icon} className="h-4 w-4" />}
      {pending ? "Sending…" : children}
    </button>
  );
}

export function CopyButton({ value, label = "Copy link" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="btn btn-secondary btn-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1600);
        } catch {
          window.prompt("Copy this link", value);
        }
      }}
    >
      <Icon name={copied ? "check" : "globe"} className="h-3.5 w-3.5" />
      {copied ? "Copied" : label}
    </button>
  );
}
