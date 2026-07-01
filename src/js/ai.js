import { getState, save } from './state.js';
import { esc, toast } from './utils.js';

let aiInited = false;
let aiChatHistory = [];

const AI_MAP = {
  newton: `Newton's 3 Laws — simplified:

**1. Inertia** — Objects stay at rest or keep moving unless a force acts on them. Bus brakes → you lurch forward.

**2. F = ma** — Force = mass × acceleration. Same force on a bicycle vs a truck — bicycle wins.

**3. Action-Reaction** — Every action has an equal & opposite reaction. You push ground → ground pushes you up. Rockets work this way.`,
  photosynthesis: `Photosynthesis = plants making food from sunlight.

**Equation:** CO₂ + H₂O + Sunlight → Glucose + O₂

**Where:** Chloroplasts (the green parts).

**Two stages:**
1. Light reactions → split water, release O₂
2. Calvin cycle → CO₂ becomes glucose

Why it matters: it's why we breathe and why plants are green.`,
  'opportunity cost': `**Opportunity cost** = what you give up when you choose something.

You have 2 hours. Study or Netflix?
If you Netflix, opportunity cost = the marks you lost.

**Real talk:** Every hour wasted scrolling has an opportunity cost. Your board exam is paying the price.`,
  recursion: `**Recursion** = a function that calls itself.

Stand between two mirrors — they reflect forever. That's recursion.

**Python:**
\`\`\`
def factorial(n):
    if n==1: return 1
    return n * factorial(n-1)
\`\`\`

Always need a base case or it crashes. Used in: sorting, trees, file systems.`,
  gravity: `**Gravity** = attraction between masses.

Newton: F = G·(m₁·m₂)/r²
More mass = stronger pull. More distance = weaker pull.

Einstein: gravity is spacetime curving around mass. Earth follows the Sun's curve — that's the orbit.

For exams: memorise Newton's formula.`,
  osmosis: `**Osmosis** = water moving through a semi-permeable membrane from low → high solute concentration.

Potato in salt water → loses water → shrivels.
Potato in plain water → absorbs water → firms up.

**Vocab:** Hypotonic (swells), Hypertonic (shrinks), Isotonic (no change).`,
  derivatives: `**Derivatives** = how fast something changes.

f(x) = x² → f'(x) = 2x. At x=3, slope = 6.

Think: speedometer of math. Position → derivative → velocity → derivative → acceleration.

**Rules:**
- Power: d/dx(xⁿ) = n·xⁿ⁻¹
- Chain rule: f'(g(x)) · g'(x)`,
  integration: `**Integration** = reverse of differentiation. Finds area under a curve.

**Power rule:** ∫xⁿ dx = xⁿ⁺¹/(n+1) + C

**Common integrals:**
- ∫sin(x) dx = -cos(x) + C
- ∫cos(x) dx = sin(x) + C
- ∫eˣ dx = eˣ + C
- ∫1/x dx = ln|x| + C

Always add +C for indefinite integrals.`,
  quadratic: `**Quadratic equations:** ax² + bx + c = 0

**Formula:** x = [-b ± √(b²-4ac)] / 2a

**Discriminant (b²-4ac):**
- > 0 → two real roots
- = 0 → one real root
- < 0 → no real roots

**Vertex form:** y = a(x-h)² + k`,
  thermodynamics: `**Laws of Thermodynamics:**

**1st Law:** Energy can't be created or destroyed. ΔU = Q - W
**2nd Law:** Entropy always increases. Heat flows hot → cold spontaneously.
**3rd Law:** Absolute zero (0 K) is unreachable.

For exams: memorise the first law equation and what entropy means.`,
  ohmslaw: `**Ohm's Law:** V = IR

Double resistance → half current (if voltage constant).

**Power:** P = VI = I²R = V²/R

**Series:** R_total = R1 + R2
**Parallel:** 1/R_total = 1/R1 + 1/R2`,
  mitosis: `**Mitosis** = cell division producing 2 identical daughter cells.

**Phases (PMAT):**
- **P**rophase — chromosomes condense
- **M**etaphase — chromosomes line up at equator
- **A**naphase — sister chromatids pulled apart
- **T**elophase — cells divide

Result: 2 genetically identical cells. Used for: growth, repair.`,
  meiosis: `**Meiosis** = cell division producing 4 unique gametes.

Two rounds: Meiosis I (halves chromosome count) + Meiosis II.
Result: 4 haploid cells. Crossing over makes each genetically unique.

Used for: sperm and egg production.`,
  acids: `**Acids & Bases:**

pH < 7 = acid. pH > 7 = base. pH 7 = neutral.

**Strong acids:** HCl, H₂SO₄, HNO₃
**Neutralisation:** Acid + Base → Salt + Water
Example: HCl + NaOH → NaCl + H₂O

Litmus: red in acid, blue in base.`,
  waves: `**Waves:** v = fλ (speed = frequency × wavelength)

**Transverse:** particles move perpendicular (light, water).
**Longitudinal:** particles move parallel (sound).

Sound ≈ 340 m/s. Light = 3×10⁸ m/s.
Period T = 1/f`,
  mendelian: `**Mendelian Genetics:**

Dominant (A) masks recessive (a).
AA or Aa = dominant phenotype. aa = recessive.

**Monohybrid cross (Aa × Aa):**
Ratio: 3 dominant : 1 recessive

**Test cross:** breed with aa to find unknown genotype.`,
  forces: `**Forces & Motion (F = ma):**

- Weight: W = mg
- Friction: f = μN
- Momentum: p = mv (conserved in closed systems)

Equilibrium: net force = 0, so acceleration = 0.
Draw free body diagrams: show ALL forces separately.`,
  workenergy: `**Work, Energy, Power:**

- Work: W = Fs cosθ (Joules)
- KE = ½mv²
- PE = mgh
- KE + PE = constant (no friction)
- Power: P = W/t (Watts)
- Efficiency = (useful output / total input) × 100%`,
  supply_demand: `**Supply & Demand:**

Price ↑ → demand ↓ (inverse). Price ↑ → supply ↑ (direct).

Equilibrium = where supply meets demand.

Elastic demand: luxury goods (sensitive to price).
Inelastic demand: necessities (not sensitive to price).`,
  default: `Good question! Here's how to learn anything:

**Step 1:** Define it in your own words. Can't? You don't understand it yet.

**Step 2:** Find a real example you already know.

**Step 3:** Ask "why does this work?" not just "what is this?"

**Step 4:** Explain it to an imaginary 10-year-old.

Ask me the specific topic and I'll break it down properly.`
};

const AI_TOPICS = { ...AI_MAP };

const AI_RULES = [
  { keys: ['newton', 'laws of motion', 'inertia', 'f=ma', 'action reaction'], id: 'newton' },
  { keys: ['photosynthesis', 'chlorophyll', 'glucose', 'plant food'], id: 'photosynthesis' },
  { keys: ['opportunity cost', 'tradeoff', 'trade-off', 'scarcity'], id: 'opportunity cost' },
  { keys: ['recursion', 'recursive', 'base case', 'factorial'], id: 'recursion' },
  { keys: ['gravity', 'gravitation', 'free fall', 'orbital'], id: 'gravity' },
  { keys: ['osmosis', 'diffusion', 'semi-permeable', 'hypotonic', 'hypertonic', 'isotonic'], id: 'osmosis' },
  { keys: ['derivative', 'differentiation', 'dy/dx', 'rate of change', 'slope of curve'], id: 'derivatives' },
  { keys: ['integral', 'integration', 'area under', 'antiderivative'], id: 'integration' },
  { keys: ['quadratic', 'parabola', 'discriminant', 'completing the square'], id: 'quadratic' },
  { keys: ['thermodynamics', 'entropy', 'heat engine', 'internal energy'], id: 'thermodynamics' },
  { keys: ['ohm', 'resistance', 'voltage', 'current', 'series circuit', 'parallel circuit'], id: 'ohmslaw' },
  { keys: ['electricity', 'electric field', 'charge', 'conductor', 'capacitor'], id: 'ohmslaw' },
  { keys: ['mitosis', 'pmat', 'prophase', 'metaphase', 'anaphase', 'telophase'], id: 'mitosis' },
  { keys: ['meiosis', 'gamete', 'haploid', 'diploid', 'crossing over'], id: 'meiosis' },
  { keys: ['acid', 'base', 'ph ', 'alkali', 'neutralis', 'litmus', 'indicator'], id: 'acids' },
  { keys: ['wave', 'frequency', 'wavelength', 'amplitude', 'transverse', 'longitudinal'], id: 'waves' },
  { keys: ['mendel', 'genetics', 'dominant', 'recessive', 'genotype', 'phenotype', 'allele'], id: 'mendelian' },
  { keys: ['friction', 'normal force', 'equilibrium', 'momentum', 'free body'], id: 'forces' },
  { keys: ['work done', 'kinetic energy', 'potential energy', 'conservation of energy', 'joule', 'watt', 'power'], id: 'workenergy' },
  { keys: ['supply', 'demand', 'elasticity', 'equilibrium price', 'inflation', 'market'], id: 'supply_demand' }
];

function getAIR(msg) {
  const m = msg.toLowerCase().trim();
  for (const rule of AI_RULES) {
    if (rule.keys.some(k => m.includes(k))) {
      return AI_TOPICS[rule.id] || AI_MAP.default;
    }
  }
  return AI_MAP.default;
}

async function callAnthropic(message) {
  const state = getState();
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': state.settings.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 600,
      system: `You are a sharp, no-nonsense AI study coach inside Student OS, a productivity app for Indian students preparing for board exams. The user's name is ${state.name}, they are Level ${state.level} with ${state.xp} XP.

Rules:
- Keep answers concise and exam-focused (under 200 words)
- Use **bold** for key terms
- Use line breaks for clarity
- Be direct, slightly brutal — no fluff
- If it's a concept question, give the core idea + one real-world example + exam tip
- If it's motivational, be honest and push them`,
      messages: aiChatHistory.slice(-10)
    })
  });

  if (!res.ok) {
    if (res.status === 401) throw new Error('invalid_key');
    if (res.status === 429) throw new Error('rate_limit');
    throw new Error('api_error');
  }

  const data = await res.json();
  return data.content?.[0]?.text || 'No response received.';
}

async function callGemini(message) {
  const state = getState();
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${state.settings.apiKey}`;

  const history = aiChatHistory.slice(-10).map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      systemInstruction: {
        parts: [{ text: `You are a sharp, no-nonsense AI study coach inside Student OS. The user's name is ${state.name}, they are Level ${state.level} with ${state.xp} XP. Keep answers concise and exam-focused (under 200 words). Use **bold** for key terms. Be direct, slightly brutal — no fluff.` }]
      },
      generationConfig: { maxOutputTokens: 600 }
    })
  });

  if (!res.ok) {
    if (res.status === 400 || res.status === 403) throw new Error('invalid_key');
    if (res.status === 429) throw new Error('rate_limit');
    throw new Error('api_error');
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response received.';
}

export function initAI() {
  if (aiInited) return;
  aiInited = true;
  addAIMsg('Hey! 👋 I\'m your AI study assistant.\n\nAsk me about any topic — physics, chemistry, math, or economics. I\'ll break it down so it actually makes sense.');
}

export async function sendAI() {
  const inp = document.getElementById('ai-inp');
  const msg = inp.value.trim();
  if (!msg) return;

  inp.value = '';
  inp.style.height = 'auto';

  addUserMsg(msg);
  aiChatHistory.push({ role: 'user', content: msg });

  const msgs = document.getElementById('msgs');
  const te = document.createElement('div');
  te.className = 'mrow';
  te.innerHTML = '<div class="mav">🤖</div><div class="mbub"><div class="typing"><div class="td"></div><div class="td"></div><div class="td"></div></div></div>';
  msgs.appendChild(te);
  msgs.scrollTop = msgs.scrollHeight;

  const state = getState();
  const apiKey = state.settings.apiKey || '';
  const provider = state.settings.provider || 'anthropic';

  try {
    let reply;
    if (apiKey && ((provider === 'anthropic' && apiKey.startsWith('sk-ant-')) || (provider === 'gemini' && apiKey.startsWith('AIzaSy')))) {
      if (provider === 'gemini') {
        reply = await callGemini(msg);
      } else {
        reply = await callAnthropic(msg);
      }
      aiChatHistory.push({ role: 'assistant', content: reply });
      if (aiChatHistory.length > 20) aiChatHistory = aiChatHistory.slice(-20);
    } else {
      await new Promise(r => setTimeout(r, 700 + Math.random() * 500));
      const localAnswer = getAIR(msg);
      if (localAnswer === AI_MAP.default && !apiKey) {
        reply = localAnswer + '\n\n---\n💡 **Want real AI answers?** Add your API key in Settings → AI API Key. Claude will answer *anything* you ask.';
      } else {
        reply = localAnswer;
      }
    }
    te.remove();
    addAIMsg(reply);
  } catch (err) {
    te.remove();
    if (err.message === 'invalid_key') {
      addAIMsg('**API key invalid.** Go to Settings → AI API Key and paste a valid key from your provider console.');
    } else if (err.message === 'rate_limit') {
      addAIMsg('**Rate limited.** Too many requests. Wait a minute and try again.');
    } else {
      addAIMsg(getAIR(msg));
    }
  }
}

export function useChip(btn) {
  const inp = document.getElementById('ai-inp');
  if (inp) {
    inp.value = btn.textContent;
    inp.focus();
  }
}

export function aiKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendAI();
  }
}

export function autoR(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 110) + 'px';
}

export function clearChat() {
  const msgs = document.getElementById('msgs');
  if (msgs) msgs.innerHTML = '';
  aiInited = false;
  aiChatHistory = [];
  initAI();
}

function addUserMsg(text) {
  const msgs = document.getElementById('msgs');
  if (!msgs) return;
  const el = document.createElement('div');
  el.className = 'mrow u';
  el.innerHTML = '<div class="mav">👤</div><div class="mbub">' + esc(text) + '</div>';
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

export function addAIMsg(text) {
  const msgs = document.getElementById('msgs');
  if (!msgs) return;
  const el = document.createElement('div');
  el.className = 'mrow';
  const fmt = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`\n]+)`/g, '<code style="background:rgba(255,255,255,.08);padding:2px 5px;border-radius:4px;font-size:12px">$1</code>')
    .replace(/\n/g, '<br>');
  el.innerHTML = '<div class="mav">🤖</div><div class="mbub">' + fmt + '<button class="mcopy" onclick="copyBubble(this)">📋</button></div>';
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
}

window.copyBubble = function (btn) {
  navigator.clipboard.writeText(btn.parentElement.innerText.trim()).then(() => {
    btn.textContent = '✓';
    setTimeout(() => { btn.textContent = '📋'; }, 1400);
  }).catch(() => {});
};
