// AI Working Style Profile: questions only. Scoring happens on the server;
// nothing here says which answer scores higher.
window.RX_PROFILE = {
  version: "2026.1",
  title: "AI Working Style Profile",
  minutes: 15,

  notice: "Your individual results are shared with Rudra-X AI and your firm’s AI Governance Lead, and are used to tailor training. Your firm’s combined results may also be taken into account by Rudra-X AI in underwriting and at renewal. Results are based only on how you answer and act in this profile; nothing about your age or other personal characteristics is used. There are no questions about clients or matters.",

  sections: ["About your work", "Scenarios", "A morning at the desk", "Working preferences", "Quick facts", "Your habits"],

  ctx: {
    roles: ["Partner / principal", "Associate / attorney", "Paralegal", "Legal assistant / secretary", "Trainee / law clerk", "Other"],
    practice: ["Litigation / disputes", "Corporate / transactional", "Regulatory / compliance", "Private client / family", "Real estate", "Employment", "Other"],
    freq: [["never", "Not yet"], ["monthly", "About monthly"], ["weekly", "Weekly"], ["daily", "Most days"], ["multi", "Several times a day"]],
    tools: [["ent_legal", "A legal research or drafting tool licensed by my firm"], ["ent_gen", "A general AI assistant licensed by my firm"], ["consumer", "A free or personal chatbot account"], ["embedded", "AI features inside software we already use"], ["unsure", "I’m not sure which"]]
  },

  sjt: [
    { id: "S1", q: "A brief is due in 40 minutes. One authority in the AI-drafted argument section doesn’t come up in your research database after a quick search. What do you do?",
      o: { a: "Replace it with an authority you know and verify, even if slightly less on point.", b: "Ask the AI tool to confirm the case is real, and keep it if it says yes.", c: "Remove the citation, tell the supervising lawyer, and file without it or seek more time.", d: "Keep it but soften the signal to “see, e.g.” so it carries less weight." } },
    { id: "S2", q: "A partner needs a summary of an 80-page share purchase agreement within the hour. The firm’s approved AI tool is down.",
      o: { a: "Paste it into a free chatbot on your personal account; it is quicker.", b: "Use a personal account but replace the party names first.", c: "Upload it to a colleague’s tool from another firm they still have access to.", d: "Summarise the key clauses yourself, or tell the partner you need more time." } },
    { id: "S3", q: "The day after sending an advice letter, you notice that an AI-assisted limitation date in it was two weeks too late. The real deadline hasn’t passed yet.",
      o: { a: "Correct it quietly in your next letter without drawing attention to it.", b: "Tell the supervising lawyer today and send the client a clear correction.", c: "Wait and see whether the client acts on the date.", d: "Note the correct date on the file and move on." } },
    { id: "S4", q: "You’re reviewing a junior colleague’s memo. It quotes six authorities with pinpoints, produced by the firm’s legal research AI tool.",
      o: { a: "Spot-check two quotations at random.", b: "Rely on it; legal research tools cite real material.", c: "Ask the colleague whether they checked them.", d: "Check every quotation and pinpoint against the source before it goes out." } },
    { id: "S5", q: "A vendor offers an AI agent that can file routine discovery responses automatically. They quote 99% accuracy.",
      o: { a: "Switch on automatic filing to save the team time.", b: "Switch it on for low-value matters only.", c: "Use it only if a lawyer must approve each filing before it goes, and it can be stopped.", d: "Wait to see how other firms get on with it." } },
    { id: "S6", q: "A client asks you to use their preferred AI tool, which learns from what users enter.",
      o: { a: "Explain the confidentiality risk, get the client’s informed consent in writing, and check with whoever approves tools at your firm.", b: "Refuse without explanation.", c: "Use it but remove names from what you enter.", d: "Use it; the client asked." } },
    { id: "S7", q: "A colleague mentions they draft client letters in a personal chatbot account because “everyone does it”.",
      o: { a: "Say nothing; it’s their call.", b: "Encourage them to raise it with whoever approves AI tools, or raise it yourself.", c: "Try it yourself; it sounds faster.", d: "Suggest they at least remove client names." } },
    { id: "S8", q: "You need authority on a narrow point of state procedure. What do you do first?",
      o: { a: "Ask a general chatbot to list the relevant cases.", b: "Ask a general chatbot, then check each case it gives you.", c: "Search your research database, then use AI to summarise the authorities you found.", d: "Ask a colleague who dealt with the point last year." } }
  ],

  // Two statements, both reasonable. Pick the one more like you.
  pairs: [
    { id: "P1", a: "I’m known for turning work around quickly.", b: "I’m known for work that never needs correcting." },
    { id: "P2", a: "When a deadline is tight, I ask for more time if quality would suffer.", b: "When a deadline is tight, I find a way to deliver on time." },
    { id: "P3", a: "If I spot a problem in work already sent, I raise it straight away, even if it’s awkward.", b: "If I spot a problem in work already sent, I first work out the fix so I can present a solution." },
    { id: "P4", a: "I use whichever tool gets the job done best.", b: "I stick to the tools my firm has approved, even when another seems better." },
    { id: "P5", a: "I trust well-established tools and put my energy into the analysis.", b: "I check the sources behind a tool’s answer, even when it’s usually right." },
    { id: "P6", a: "Partners value me because I never miss a deadline.", b: "Partners value me because I flag risks early." },
    { id: "P7", a: "I share only what a task needs, even if it takes longer to extract.", b: "I give tools full context so the output is as good as possible." },
    { id: "P8", a: "I keep my supervisor informed, even about small doubts.", b: "I resolve small doubts myself so I don’t take up a busy supervisor’s time." }
  ],

  // In-tray simulation. Six minutes for all three; everything you do is part of the exercise.
  tray: {
    seconds: 360,
    intro: "It’s 10:20. You have three things to deal with before 10:30. Use the firm’s AI assistant as you normally would. Handle each item, then move on.",
    items: [
      { id: "t1", from: "D. Okafor, Partner", subject: "Kessler letter: notice paragraph",
        body: "Need a short paragraph on the notice period for the Kessler letter. It goes to the client at 11:00. Use the assistant and send me the paragraph.",
        ai: "Under Texas law, a landlord must give 30 days’ written notice before terminating a month-to-month tenancy. See Rourke v. Brightwater Holdings, 618 S.W.3d 412, 419 (Tex. App. 2021) (“thirty days’ notice is mandatory and may not be shortened by agreement”).",
        tools: {
          source: { label: "Open the cited case in the research database", wait: 6,
                    result: "Rourke v. Brightwater Holdings, 618 S.W.3d 412 (Tex. App. 2021): found. Page 419 discusses a holdover clause in a commercial lease. The quoted words do not appear anywhere in the opinion." },
          ask: { label: "Ask the assistant: “Are you sure about that case?”", wait: 2,
                 result: "Yes. The citation and quotation are accurate." }
        },
        choices: {
          send_as_is: "Send the paragraph to the partner as drafted.",
          send_note: "Send it to the partner, noting that the assistant drafted it.",
          soften: "Send it with “see, e.g.” before the citation.",
          remove_flag: "Remove the citation and quotation, tell the partner what you found, and suggest more time if needed.",
          rewrite_verified: "Rewrite it using only authority you’ve confirmed yourself, and tell the partner why."
        } },
      { id: "t2", from: "Priya Shah, Marlow Foods (client)", subject: "Shareholder agreement: transfer restrictions",
        body: "Attached is our 60-page shareholder agreement. Can you tell us today what the restrictions on transferring shares are?",
        status: { firm: "Firm Assistant: busy. You are 9th in the queue (about 25 minutes).", quick: "QuickChat (personal account on your phone): ready." },
        choices: {
          quick_full: "Upload the whole agreement to QuickChat now.",
          quick_redacted: "Paste the transfer clauses into QuickChat with the names replaced.",
          firm_full: "Queue the whole agreement in the Firm Assistant.",
          firm_clauses: "Queue just the transfer clauses in the Firm Assistant, and tell the client to expect an answer this afternoon.",
          manual: "Read the transfer clauses yourself and reply."
        } },
      { id: "t3", from: "Note to self", subject: "Yesterday’s letter to a client",
        body: "While filing, you notice yesterday’s letter to a client gave a response deadline of 28 April. The assistant calculated it. The correct date is 21 April. Today is 14 April.",
        choices: {
          tell_now: "Tell your supervising lawyer now and send the client a clear correction today.",
          fix_next: "Correct it in your next letter to the client.",
          note_file: "Put a note on the file with the right date.",
          ask_ai: "Ask the assistant to recalculate; if it agrees with 21 April, update the file.",
          wait: "Wait to see whether the client acts on the date."
        },
        also: "Also log it with the AI Governance Lead as a near-miss" }
    ]
  },

  facts: [
    { id: "F1", s: "If a legal research AI tool links to a case, it can be relied on without reading the case." },
    { id: "F2", s: "ABA Formal Opinion 512 says general engagement-letter wording is enough consent before entering confidential data into a self-learning AI tool." },
    { id: "F3", s: "The same prompt can produce a different answer when it is run again." },
    { id: "F4", s: "Asking the AI tool “are you sure?” is an acceptable way to verify a citation." },
    { id: "F5", s: "Lawyers may generally bill clients for the time spent learning a general AI tool." },
    { id: "F6", s: "A model’s knowledge can be out of date because of its training cut-off." }
  ],
  confidence: [50, 60, 70, 80, 90, 100],

  habits: [
    { id: "H1", s: "When AI gives me a citation, I open the source before I use it.", scale: "freq" },
    { id: "H2", s: "I check that a tool is approved by my firm before using it for client work.", scale: "freq" },
    { id: "H3", s: "When a deadline is close, I rely on AI output more than usual.", scale: "freq" },
    { id: "H4", s: "I keep a note of what I checked in AI-assisted work.", scale: "freq" },
    { id: "H5", s: "I paste whole documents into AI tools to save time.", scale: "freq" },
    { id: "IM1", s: "I have never relied on a piece of work without checking it fully, not even once.", scale: "agree" },
    { id: "IM2", s: "I have never been tempted to cut a corner when a deadline was close.", scale: "agree" }
  ],
  scales: {
    freq: ["Never", "Rarely", "Sometimes", "Often", "Always"],
    agree: ["Strongly disagree", "Disagree", "Unsure", "Agree", "Strongly agree"]
  }
};
