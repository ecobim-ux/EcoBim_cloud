export const ML = (to: string, subj: string, body: string) =>
  `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;

export const LEAD_EMAIL = "info@ecobim.co";
export const LEAD_NAME = "Pranav R.";
export const CO_EMAIL = "info@ecobim.co";
