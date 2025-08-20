# 🕯️ Deep Cut

_An AI-fueled multiplayer ritual disguised as a party game._

![screenshot](./public/screenshot.png) <!-- optional -->

---

## 🎥 Demo Video

[Watch on YouTube](https://youtube.com/your-demo-link-here)

---

## 🏆 Category

**Games & Entertainment**

---

## 👻 What is Deep Cut?

**Deep Cut** is a surreal, chaotic, and emotionally charged AI party game powered by a ghostly game host named **Kiro**.

Inspired by games like _Cards Against Humanity_ and _Jackbox_, Deep Cut uses AI not just to generate content — but to create a living, breathing experience that reacts to your group’s energy in real time.

Each session is a one-time ritual: strange, personal, and impossible to repeat.

---

## 🧠 How We Used Kiro

Kiro wasn’t just a tool — **Kiro _was_ our co-dev**. We used it across all three modes of creation:

### 1. Spec-to-Code

We started with Kiro’s **spec feature**, which generated an **Implementation Plan** (`/.kiro/specs/implementation-plan.md`).  
That plan broke the build into 18 milestones, covering everything from Supabase schema & RLS policies to real-time game state, AI edge functions, voting, scoring, error recovery, and polish.

This gave us a crisp blueprint so we could parallelize backend, realtime, and UI work without losing the “ritual” flow.

---

### 2. Agent Hooks

We wired up **Kiro hooks** to automate the boring but critical parts of development:

- **Schema drift checks** – block PRs if DB migrations diverge from the spec.
- **Edge Function contract tests** – smoke-test OpenAI prompt pipelines + moderation fallback.
- **Realtime perf budgets** – measure subscription fan-out latency in CI.
- **Spec sync** – when specs changed, hooks opened TODO issues mapped back to the plan.

These hooks acted like a silent game master, enforcing rules and letting us focus on creative chaos.

---

### 3. Vibe Coding

Once the mechanics were stable, we switched into **Kiro’s vibe mode** to tune the game’s aesthetic:

- **Tailwind palette** → eerie gradients and spectral hues.
- **Typography** → ritualistic yet readable scale.
- **Framer Motion** → staggered card entrances, whisper-like opacity fades, jittery prompt reveals.
- **Atmosphere prompts** → iterated until the UI felt haunted without sacrificing usability.

This made the difference between a functional card game and an **immersive ritual**.

---

## 🔮 How the Game Flows

Gameplay is structured around rounds of:

- Prompt presentation
- Personal hallucinations (unique AI-generated choices)
- Group voting
- Kiro insights

Every 3 rounds, Kiro judges the vibe. If you flowed, you continue. If not… the ritual ends, and Kiro prescribes a new theme.

---

## 🧪 Tech Stack

- **Next.js + React + Tailwind CSS**
- **Framer Motion** for animations and transitions
- **Supabase** for real-time multiplayer and room logic
- **OpenAI GPT-4o** for Kiro’s voice:
  - Prompt & card generation
  - Personalized player choices
  - Ritual whispers & judgments

---

## 🧙‍♂️ Why We Built This

Most AI games just generate text. We wanted one that feels **possessed**:  
Where the AI doesn’t just create content, but **reacts, judges, and adapts** based on your group’s energy.

---

## 🧪 Testing Instructions

\`\`\`bash
git clone https://github.com/kyisaiah47/deep-cut
cd deep-cut
npm install
cp .env.local.example .env.local # add SUPABASE_URL, SUPABASE_ANON_KEY, OPENAI_API_KEY
npm run dev
\`\`\`

- Requires Node 18+
- Open two browsers at \`http://localhost:3000\` to see realtime multiplayer flow.

---

## 🙏 Credits

Created for the **Code with Kiro Hackathon** by  
Isaiah Kim ([@kyisaiah47](https://github.com/kyisaiah47)) + ChatGPT rituals

---

## 📜 License

Licensed under the [MIT License](./LICENSE).

---

## 💬 Sample Themes to Try

> - Cottagecore Rage
> - Emotional Damage Lite
> - Rotwave Romance
> - Deli-Sliced Trauma
> - The Apology Era
> - Softcore Brutality

---

## ⚠️ Warning

**Kiro remembers nothing.**  
Once the ritual ends, only the shame remains.
