// Course catalogue. Titles and summaries come from the Course Handbook; slide
// and page ranges point into media/slides/<deck>/ and media/handbook/.
// "insured" items only appear when the media build included them
// (tools/build-media.ps1 -IncludeInsured).
window.RX_COURSE = {
  title: "AI Practice Assurance",
  tagline: "Responsible, verified and defensible use of AI in legal practice",

  tracks: [
    { id: "leadership", name: "Leadership", who: "Managing partners, risk partners", modules: ["m01", "m02", "m03", "m08a", "m08b", "m09"] },
    { id: "practitioner", name: "Practitioner", who: "Partners and associates", modules: ["m01", "m02", "m03", "m04", "m05", "m06", "m07", "m09", "m10"] },
    { id: "support", name: "Support staff", who: "Paralegals, assistants, trainees", modules: ["m01", "m02", "m04", "m05", "m06", "m07"] },
    { id: "lead", name: "AI Governance Lead", who: "The named Lead and AI champion", modules: ["m01", "m02", "m03", "m04", "m05", "m06", "m07", "m08a", "m08b", "m09", "m10"] }
  ],

  modules: [
    { id: "m00", label: "Module 0", minutes: 7, insured: true,
      title: "Your Rudra-X cover and AI: what you need to do",
      summary: "Insured Edition for Rudra-X policyholders: what your cover expects of you when you use AI.",
      slides: { deck: "insured", from: 1, to: 12 } },
    { id: "m01", label: "Module 1", minutes: 6,
      title: "How generative AI actually works",
      summary: "Why a tool that writes brilliantly can still be confidently wrong.",
      slides: { deck: "market", from: 1, to: 11 }, pages: { from: 4, to: 7 } },
    { id: "m02", label: "Module 2", minutes: 6,
      title: "How AI fails you: the legal risk map",
      summary: "Eleven ways AI use turns into a claim, a sanction or a complaint.",
      slides: { deck: "market", from: 12, to: 21 }, pages: { from: 8, to: 11 } },
    { id: "m03", label: "Module 3", minutes: 6,
      title: "Ethics, court rules and regulation",
      summary: "What the rules already require of every lawyer who uses AI.",
      slides: { deck: "market", from: 22, to: 31 }, pages: { from: 12, to: 15 } },
    { id: "m04", label: "Module 4", minutes: 6,
      title: "Prompting for accurate output",
      summary: "How to ask so the answer is useful, grounded and checkable.",
      slides: { deck: "market", from: 32, to: 41 }, pages: { from: 16, to: 19 } },
    { id: "m05", label: "Module 5", minutes: 6,
      title: "The verification protocol and the review record",
      summary: "The checks that stand between an AI draft and a professional error.",
      slides: { deck: "market", from: 42, to: 52 }, pages: { from: 20, to: 23 } },
    { id: "m06", label: "Module 6", minutes: 4,
      title: "Confidentiality and data handling",
      summary: "What can go into which tool, and what must never go in at all.",
      slides: { deck: "market", from: 53, to: 61 }, pages: { from: 24, to: 26 } },
    { id: "m07", label: "Module 7", minutes: 3,
      title: "Individual controls: the daily checklist",
      summary: "Nine questions to ask every time you rely on AI.",
      slides: { deck: "market", from: 62, to: 69 }, pages: { from: 27, to: 28 } },
    { id: "m08a", label: "Module 8A", minutes: 5,
      title: "Firm governance: building the AI governance programme",
      summary: "For managing partners and the AI Governance Lead.",
      slides: { deck: "market", from: 70, to: 79 }, pages: { from: 29, to: 31 } },
    { id: "m08b", label: "Module 8B", minutes: 3,
      title: "Evidence readiness: logging, records and legal hold",
      summary: "Be able to prove what happened, years later.",
      slides: { deck: "market", from: 80, to: 87 }, pages: { from: 32, to: 33 } },
    { id: "m09", label: "Module 9", minutes: 4,
      title: "When it goes wrong: incident response",
      summary: "Speed and candor turn an error into a manageable event.",
      slides: { deck: "market", from: 88, to: 96 }, pages: { from: 34, to: 36 } },
    { id: "m10", label: "Module 10", minutes: 3,
      title: "Getting value safely: the AI use-case playbook",
      summary: "Speed where it is safe, control where it matters.",
      slides: { deck: "market", from: 97, to: 104 }, pages: { from: 37, to: 38 } }
  ],

  decks: [
    { id: "market", name: "Market Edition", note: "Slides for Modules 1–10" },
    { id: "insured", name: "Insured Edition", note: "Module 0 · Rudra-X policyholders", insured: true }
  ],

  handbook: {
    title: "Course Handbook",
    note: "Reading companion to Modules 1–10",
    chapters: [
      { label: "About this programme", page: 2 },
      { label: "1. How generative AI actually works", page: 4 },
      { label: "2. How AI fails you: the legal risk map", page: 8 },
      { label: "3. Ethics, court rules and regulation", page: 12 },
      { label: "4. Prompting for accurate output", page: 16 },
      { label: "5. The verification protocol and the review record", page: 20 },
      { label: "6. Confidentiality and data handling", page: 24 },
      { label: "7. Individual controls: the daily checklist", page: 27 },
      { label: "8A. Firm governance", page: 29 },
      { label: "8B. Evidence readiness", page: 32 },
      { label: "9. When it goes wrong: incident response", page: 34 },
      { label: "10. Getting value safely: the use-case playbook", page: 37 },
      { label: "Sources", page: 39 }
    ]
  },

  deskReference: {
    title: "Desk Reference",
    note: "Checklists and templates for everyday AI use. 8 pages, yours to keep.",
    file: "downloads/RudraX_AI_Desk_Reference.pdf",
    size: "0.7 MB"
  }
};
