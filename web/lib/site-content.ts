import siteJson from "@/content/site.json";

export interface SiteContent {
  meta: {
    title: string;
    description: string;
    keywords: string;
    url: string;
    email: string;
    schema_services: string[];
  };
  hero: {
    eyebrow: string;
    solution_line: string;
    title_line1: string;
    title_line2: string;
    description: string;
    cta_primary: string;
    cta_secondary: string;
  };
  auto_calculate: {
    sqft_value: number;
    clashes_per_1000_sqft: number;
    cost_per_clash_usd: number;
  };
  services: {
    pretitle: string;
    title: string;
    description: string;
    items: string[];
    cta_text: string;
    cta_button: string;
  };
  process: {
    pretitle: string;
    title: string;
    description: string;
    total: number;
    steps: { title: string; description: string }[];
  };
  stats_section: {
    pretitle: string;
    title: string;
    description: string;
    items: {
      value: string;
      suffix: string;
      display: string;
      label: string;
      auto?: string;
    }[];
  };
  project_types: string[];
  projects: {
    pretitle: string;
    title: string;
    description: string;
    items: { name: string; tag: string; image: string; alt: string }[];
  };
  tools: { name: string; ext: string; category: string }[];
  standards: { tag: string; description: string }[];
  faq: { question: string; answer: string }[];
  contact: {
    pretitle: string;
    title: string;
    description: string;
    standards_line: string;
    response_time: string;
  };
  footer: {
    tagline: string;
    copyright_year: string;
    standards_line: string;
  };
  google_sheet_url: string;
}

export const site = siteJson as SiteContent;

/** Mirrors build.py's `formatNumber` + auto-clash calculation, run at request time. */
export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString("en-US");
}

export function autoClashes(): number {
  const { sqft_value, clashes_per_1000_sqft } = site.auto_calculate;
  return Math.round((sqft_value / 1000) * clashes_per_1000_sqft);
}
