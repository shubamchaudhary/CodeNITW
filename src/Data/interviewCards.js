// The retired Topics page's cards (AI / HLD / LLD). Nothing links to that page
// any more, but planning days made back then still point at its cards, so the
// Planning page can show them. Kept in its own module so the card data (large)
// only loads with the pages that use it, not with every page of the site.
import { jobHuntPlan } from "./JobHuntPlan";

// Each plan card keeps AI/HLD/LLD categories; the legacy "DSA" tag and the
// per-card daily-DSA coupling are dropped so the page stays topic-oriented.
export const INTERVIEW_CARDS = jobHuntPlan.map((card) => ({
  ...card,
  categories: card.categories.filter((c) => c !== "DSA"),
}));

const IP_BY_ID = Object.fromEntries(INTERVIEW_CARDS.map((c) => [c.id, c]));

export function getInterviewCard(id) {
  return IP_BY_ID[id] || null;
}
