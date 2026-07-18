"use client";

import { FormEvent, useRef, useState } from "react";
import { site } from "@/lib/site-content";

export default function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const phoneRef = useRef<HTMLInputElement>(null);
  const msgRef = useRef<HTMLTextAreaElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const submitBtnRef = useRef<HTMLButtonElement>(null);
  const submitLabelRef = useRef<HTMLSpanElement>(null);

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [nameError, setNameError] = useState(false);
  const [emailError, setEmailError] = useState(false);

  function toggleChip(value: string) {
    setSelectedTypes((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  }

  function setLabel(text: string) {
    if (submitLabelRef.current) submitLabelRef.current.textContent = text;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (honeypotRef.current?.value) {
      setLabel("Sent ✓");
      setTimeout(() => setLabel("Send enquiry"), 3000);
      return;
    }

    const data = {
      name: nameRef.current?.value ?? "",
      email: emailRef.current?.value ?? "",
      phone: phoneRef.current?.value ?? "",
      project: selectedTypes.join(", "),
      message: msgRef.current?.value ?? "",
      timestamp: new Date().toISOString(),
    };

    let hasError = false;
    setNameError(false);
    setEmailError(false);
    if (!data.name) {
      setNameError(true);
      nameRef.current?.focus();
      hasError = true;
    }
    if (!data.email) {
      setEmailError(true);
      if (!hasError) emailRef.current?.focus();
      hasError = true;
    }
    if (hasError) return;

    const btn = submitBtnRef.current;
    if (btn) {
      btn.style.opacity = ".6";
      btn.disabled = true;
    }
    setLabel("Sending…");

    const googleSheetUrl = site.google_sheet_url;

    if (!googleSheetUrl) {
      const subject = encodeURIComponent(`EcoBIM enquiry from ${data.name}`);
      const body = encodeURIComponent(data.message || "");
      window.location.href = `mailto:info@ecobim.co?subject=${subject}&body=${body}`;
      setTimeout(() => {
        if (btn) {
          btn.style.opacity = "";
          btn.disabled = false;
        }
        setLabel("Send enquiry");
      }, 1500);
      return;
    }

    try {
      await fetch(googleSheetUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      formRef.current?.reset();
      setSelectedTypes([]);
      setLabel("Sent ✓");
      setTimeout(() => {
        if (btn) {
          btn.style.opacity = "";
          btn.disabled = false;
        }
        setLabel("Send enquiry");
      }, 3000);
    } catch {
      setLabel("Error, try again");
      if (btn) {
        btn.style.opacity = "";
        btn.disabled = false;
      }
      setTimeout(() => setLabel("Send enquiry"), 4000);
    }
  }

  return (
    <form
      className="contact-form reveal form-highlight"
      id="contact-form"
      aria-label="Project enquiry form"
      ref={formRef}
      onSubmit={handleSubmit}
    >
      <div style={{ position: "absolute", left: "-9999px", top: "-9999px" }} aria-hidden="true">
        <label htmlFor="f-website">Leave this field empty</label>
        <input type="text" id="f-website" name="website" tabIndex={-1} autoComplete="off" ref={honeypotRef} />
      </div>
      <div className="form__field">
        <label className="form__label" htmlFor="f-name">Your name</label>
        <input
          className={`form__input${nameError ? " form__input--error" : ""}`}
          type="text"
          id="f-name"
          name="name"
          autoComplete="name"
          placeholder=" "
          required
          aria-describedby="f-name-err"
          ref={nameRef}
        />
        <span className={`form__error${nameError ? " visible" : ""}`} id="f-name-err" role="alert">Please enter your name</span>
      </div>
      <div className="form__field">
        <label className="form__label" htmlFor="f-email">Email</label>
        <input
          className={`form__input${emailError ? " form__input--error" : ""}`}
          type="email"
          id="f-email"
          name="email"
          autoComplete="email"
          placeholder=" "
          required
          aria-describedby="f-email-err"
          ref={emailRef}
        />
        <span className={`form__error${emailError ? " visible" : ""}`} id="f-email-err" role="alert">Please enter a valid email</span>
      </div>
      <div className="form__field">
        <label className="form__label" htmlFor="f-phone">Phone</label>
        <input className="form__input" type="tel" id="f-phone" name="phone" autoComplete="tel" placeholder=" " ref={phoneRef} />
      </div>
      <div className="form__field">
        <label className="form__label">Project type</label>
        <input type="hidden" id="f-project" name="project" value={selectedTypes.join(", ")} readOnly />
        <div className="form__chips" role="group" aria-label="Select project type">
          {site.project_types.map((type) => (
            <button
              type="button"
              className={`form__chip${selectedTypes.includes(type) ? " active" : ""}`}
              data-value={type}
              key={type}
              onClick={() => toggleChip(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </div>
      <div className="form__field">
        <label className="form__label" htmlFor="f-msg">Tell us about the project</label>
        <textarea className="form__input" id="f-msg" name="message" rows={4} placeholder=" " style={{ resize: "vertical", lineHeight: 1.6 }} ref={msgRef} />
      </div>
      <button
        type="submit"
        className="button button--ghost-light"
        style={{ width: "100%", justifyContent: "center", minWidth: 0 }}
        ref={submitBtnRef}
      >
        <span className="button__text">
          <span className="button__text--sp" ref={submitLabelRef}>Send enquiry</span>
          <span className="button__text--sp button__text--sp--clone">Sending…</span>
        </span>
        <span className="button__icon__inner" aria-hidden="true">↗</span>
      </button>
    </form>
  );
}
