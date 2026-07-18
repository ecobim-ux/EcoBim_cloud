"use client";

import { useState } from "react";

export function useCollapse(): [boolean, () => void] {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("bimco_sidebar_collapsed") === "1";
    } catch {
      return false;
    }
  });
  const toggle = () =>
    setCollapsed((c) => {
      const n = !c;
      try {
        localStorage.setItem("bimco_sidebar_collapsed", n ? "1" : "0");
      } catch {
        /* noop */
      }
      return n;
    });
  return [collapsed, toggle];
}
