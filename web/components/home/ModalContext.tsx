"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

interface ModalContextValue {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  loginBtnRef: React.RefObject<HTMLButtonElement | null>;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const loginBtnRef = useRef<HTMLButtonElement>(null);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => {
    setIsOpen(false);
    loginBtnRef.current?.focus();
  }, []);

  return (
    <ModalContext.Provider value={{ isOpen, open, close, loginBtnRef }}>
      {children}
    </ModalContext.Provider>
  );
}

export function useMaintenanceModal() {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error("useMaintenanceModal must be used within a ModalProvider");
  return ctx;
}
