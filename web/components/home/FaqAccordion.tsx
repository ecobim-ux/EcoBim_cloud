"use client";

import { useState } from "react";

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="toggle__list">
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div className={`toggle__item${isOpen ? " item--open" : ""}`} key={item.question}>
            <div
              className="toggle__header"
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? null : i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpenIndex(isOpen ? null : i);
                }
              }}
            >
              <span className="toggle__header__title title">{item.question}</span>
              <span className="plus__icon" aria-hidden="true" />
            </div>
            <div className={`toggle__content${isOpen ? " open" : ""}`}>
              <p className="toggle__body">{item.answer}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
