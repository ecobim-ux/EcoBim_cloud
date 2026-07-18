"use client";

import { useEffect } from "react";
import { useMaintenanceModal } from "./ModalContext";

export default function MaintenanceModal() {
  const { isOpen, close } = useMaintenanceModal();

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
  }, [isOpen]);

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (!isOpen) return;
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const modal = document.getElementById("maintenance-modal");
        if (!modal) return;
        const focusable = modal.querySelectorAll<HTMLElement>("a[href], button");
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, [isOpen, close]);

  return (
    <div
      className={`modal-overlay${isOpen ? " active" : ""}`}
      id="maintenance-modal"
      aria-hidden={!isOpen}
      role="dialog"
      aria-label="Under maintenance"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="modal-card">
        <div className="modal-icon" aria-hidden="true">⚙</div>
        <h3 className="modal-title">Under maintenance</h3>
        <p className="modal-body">
          The client portal is being upgraded. We&apos;ll be back online shortly. Thank you for your patience.
        </p>
        <p className="modal-body" style={{ marginBottom: "1.5rem", marginTop: "-.5rem" }}>
          Need help? Reach us at{" "}
          <a href="mailto:info@ecobim.co" style={{ color: "rgb(var(--orange))", textDecoration: "underline", fontWeight: 600 }}>
            info@ecobim.co
          </a>
        </p>
        <button
          className="button button--solid modal-close-btn"
          id="modal-close"
          style={{ minWidth: "auto", width: "100%", justifyContent: "center" }}
          onClick={close}
        >
          <span className="button__text">
            <span className="button__text--sp">Got it</span>
            <span className="button__text--sp button__text--sp--clone">Got it</span>
          </span>
        </button>
      </div>
    </div>
  );
}
