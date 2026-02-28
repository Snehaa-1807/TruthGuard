import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CATEGORIES = [
  {
    id:"sensationalist", icon:"📢", label:"Sensationalist Fake News", color:"#EF4444",
    desc:"Loud, emotional, designed to provoke outrage and sharing.",
    signals:[
      { signal:"ALL CAPS words", example:"BREAKING: GOVERNMENT CONFIRMS SECRET PLAN!!!", why:"Creates urgency and panic. Real journalism uses standard capitalisation." },
      { signal:"Excessive !!! or ???", example:"They're HIDING this from you!!!", why:"Emotional manipulation. Credible outlets never use triple punctuation." },
      { signal:"Vague 'whistleblower'", example:"An anonymous insider has revealed…", why:"Real sources are named and verifiable. Anonymous insiders can't be fact-checked." },
      { signal:"Call to share", example:"Share before they DELETE this!", why:"Manufactured urgency pressures people to spread before thinking critically." },
      { signal:"Conspiracy framing", example:"The deep state globalist cabal…", why:"Loaded political jargon designed to appeal to existing distrust." },
    ],
    realExample:"A peer-reviewed study in the New England Journal of Medicine found that aerobic exercise reduces cardiovascular risk by 30%.",
    fakeExample:"SHOCKING: Exercise is a LIE invented by Big Pharma to sell supplements!!! Anonymous doctors CONFIRM this cover-up!!!",
  },
  {
    id:"medical", icon:"💊", label:"Calm Medical Misinformation", color:"#F59E0B",
    desc:"Sounds credible but contains unverifiable medical claims. The banana article is a perfect example.",
    signals:[
      { signal:"Generic 'doctors warn'", example:"Doctors warn that eating bananas at night causes heart failure.", why:"Named doctors can be verified. 'Doctors' without names cannot." },
      { signal:"'Circulating online'", example:"A message circulating online claims…", why:"This phrase signals unverified social media content, not journalism." },
      { signal:"'No official statement'", example:"…though no hospital or institution has confirmed this.", why:"The article itself admits the claim has no official backing." },
      { signal:"Unverified mechanism", example:"…due to dangerous chemical reactions in the stomach.", why:"Vague science-sounding language with no source or study behind it." },
      { signal:"No clinical data", example:"Consuming X after Y PM causes Z.", why:"Real medical findings cite trial sizes, confidence intervals, and journals." },
    ],
    realExample:"Researchers at Harvard found in a 22,000-participant study published in JAMA that bananas are high in potassium and beneficial for heart health.",
    fakeExample:"Eating Bananas at Night Causes Sudden Heart Failure, Doctors Warn. A message circulating online claims consuming bananas after 8 PM leads to heart failure due to chemical reactions. No hospital has released an official statement.",
  },
  {
    id:"pseudoscience", icon:"🧪", label:"Pseudoscience & Health Hoaxes", color:"#8B5CF6",
    desc:"Fake remedies and suppressed cures — designed to exploit health anxiety.",
    signals:[
      { signal:"'Big Pharma is hiding this'", example:"The cure doctors don't want you to know about.", why:"Creates an unfalsifiable claim — any debunking 'proves' the conspiracy." },
      { signal:"'Doctors are paid to lie'", example:"Your doctor won't tell you this because…", why:"Undermines medical authority so people self-treat with unproven remedies." },
      { signal:"Miracle / cure-all language", example:"This one herb cures cancer, diabetes, AND COVID.", why:"No single substance cures multiple unrelated diseases. Red flag always." },
      { signal:"'Thousands claim cured'", example:"Thousands of patients report being cured.", why:"Anecdotal claims with no control group, sample size, or methodology." },
      { signal:"No peer-reviewed study", example:"Laboratory tests confirm this remedy works.", why:"'Laboratory tests' means nothing without a published methodology and journal." },
    ],
    realExample:"A randomised controlled trial of 2,100 patients published in The Lancet found the immunotherapy drug reduced tumour size in 73% of stage-3 lung cancer patients.",
    fakeExample:"Top oncologists SILENCED: Lemon juice DESTROYS cancer tumours in 30 days. Big Pharma has been HIDING this for decades. Thousands already cured. Try it at home NOW!",
  },
  {
    id:"political", icon:"🏛️", label:"Political Misinformation", color:"#3B82F6",
    desc:"Fabricated or distorted political claims designed to inflame and mislead.",
    signals:[
      { signal:"Leaked 'secret documents'", example:"Leaked documents PROVE the president planned…", why:"Real leaks go through journalists who verify authenticity. Social-media 'leaks' rarely do." },
      { signal:"Anonymous political insiders", example:"Sources within the intelligence community confirm…", why:"Named officials on record are verifiable. Anonymous 'insiders' are not." },
      { signal:"Absolute certainty language", example:"This PROVES beyond any doubt that…", why:"Real journalism uses qualified language: 'suggests', 'indicates', 'according to'." },
      { signal:"No linked primary source", example:"The government is secretly doing X.", why:"Real political reporting links to official records, votes, bills, or statements." },
      { signal:"Voter/election fraud framing", example:"The election was stolen through coordinated fraud.", why:"Extraordinary claims require extraordinary evidence — specific, verifiable, documented." },
    ],
    realExample:"The Senate passed the infrastructure bill 68–31. The full bill text is available on congress.gov. The White House issued a statement at 3pm ET.",
    fakeExample:"SECRET DOCS EXPOSE: Government plotted mass surveillance of citizens since 2010. Anonymous intelligence insiders confirm. Mainstream media REFUSES to report this BOMBSHELL.",
  },
];

const CHECKLIST = [
  { q:"Is the source named and verifiable?",              pass:"Named journalist + publication", fail:"Anonymous insider / whistleblower" },
  { q:"Is there a linked primary source?",                pass:"Links to study, vote, official report", fail:"No sources linked at all" },
  { q:"Does the language stay measured?",                 pass:"'suggests', 'found', 'indicates'", fail:"'PROVES', '100% confirmed', '!!!')" },
  { q:"Is the claim backed by a real institution?",       pass:"Harvard, NIH, WHO, named hospital", fail:"'doctors', 'experts', 'scientists' (unnamed)" },
  { q:"Could you find this in a reputable outlet?",       pass:"BBC, Reuters, AP, peer-reviewed journal", fail:"Only on social media / fringe sites" },
  { q:"Does it push you to share urgently?",              pass:"No call to action", fail:"'Share before they delete this!'" },
  { q:"Is there clinical / statistical evidence?",        pass:"Sample sizes, percentages, p-values", fail:"'Thousands claim', 'studies show' (uncited)" },
];

export default function Learn() {
  const [activeCategory, setActiveCategory] = useState("sensationalist");
  const [checklistState, setChecklistState] = useState({});
  const navigate = useNavigate();
  const cat = CATEGORIES.find(c => c.id === activeCategory);

  const toggleCheck = (i, val) => setChecklistState(s => ({ ...s, [i]: val }));
  const passCount = Object.values(checklistState).filter(v => v === "pass").length;
  const failCount = Object.values(checklistState).filter(v => v === "fail").length;
  const answered  = passCount + failCount;

  return (
    <div className="fade-in">
      <div style={{ marginBottom:"2rem" }}>
        <h1 style={{ fontSize:"1.75rem", fontWeight:800, color:"var(--text)", letterSpacing:"-0.02em", marginBottom:4 }}>📚 Learn to Spot Fake News</h1>
        <p style={{ color:"var(--text3)", fontSize:"0.875rem" }}>Understand the patterns behind misinformation — so you can spot it yourself.</p>
      </div>

      {/* Category tabs */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1.5rem", flexWrap:"wrap" }}>
        {CATEGORIES.map(c => (
          <button key={c.id} onClick={() => setActiveCategory(c.id)}
            style={{ padding:"8px 16px", borderRadius:10, border:`1.5px solid ${activeCategory===c.id ? c.color : "var(--border2)"}`, background: activeCategory===c.id ? c.color+"12" : "#fff", color: activeCategory===c.id ? c.color : "var(--text2)", fontFamily:"var(--font-body)", fontWeight:600, fontSize:"0.82rem", cursor:"pointer", transition:"all 0.15s", display:"flex", alignItems:"center", gap:6 }}>
            <span>{c.icon}</span>{c.label}
          </button>
        ))}
      </div>

      {/* Active category */}
      {cat && (
        <div className="fade-in">
          <div className="card" style={{ marginBottom:"1.5rem", borderLeft:`4px solid ${cat.color}` }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:"0.75rem" }}>
              <span style={{ fontSize:"1.75rem" }}>{cat.icon}</span>
              <div>
                <h2 style={{ fontSize:"1.2rem", fontWeight:800, color:"var(--text)" }}>{cat.label}</h2>
                <p style={{ fontSize:"0.875rem", color:"var(--text3)" }}>{cat.desc}</p>
              </div>
            </div>
          </div>

          {/* Red flag signals */}
          <h3 style={{ fontSize:"1rem", fontWeight:700, color:"var(--text)", marginBottom:"1rem" }}>🚩 Key Red Flag Signals</h3>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px, 1fr))", gap:"1rem", marginBottom:"1.5rem" }}>
            {cat.signals.map((s, i) => (
              <div key={i} className="card" style={{ borderTop:`3px solid ${cat.color}` }}>
                <div style={{ fontWeight:700, color:"var(--text)", marginBottom:4, fontSize:"0.9rem" }}>🚩 {s.signal}</div>
                <div style={{ fontSize:"0.8rem", color:"var(--text3)", fontStyle:"italic", marginBottom:"0.5rem", padding:"6px 10px", background:"var(--surface2)", borderRadius:6, borderLeft:`3px solid ${cat.color}` }}>
                  "{s.example}"
                </div>
                <p style={{ fontSize:"0.8rem", color:"var(--text2)", lineHeight:1.5 }}>{s.why}</p>
              </div>
            ))}
          </div>

          {/* Side-by-side examples */}
          <h3 style={{ fontSize:"1rem", fontWeight:700, color:"var(--text)", marginBottom:"1rem" }}>📰 Real vs Fake — Side by Side</h3>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"2rem" }}>
            <div className="card" style={{ borderTop:"3px solid var(--success)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:"0.75rem" }}>
                <span className="badge badge-real">✅ REAL</span>
                <span style={{ fontSize:"0.75rem", color:"var(--text3)" }}>Credible example</span>
              </div>
              <p style={{ fontSize:"0.875rem", color:"var(--text)", lineHeight:1.7 }}>{cat.realExample}</p>
            </div>
            <div className="card" style={{ borderTop:"3px solid var(--danger)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:"0.75rem" }}>
                <span className="badge badge-fake">🚨 FAKE</span>
                <span style={{ fontSize:"0.75rem", color:"var(--text3)" }}>Misinformation example</span>
              </div>
              <p style={{ fontSize:"0.875rem", color:"var(--text)", lineHeight:1.7 }}>{cat.fakeExample}</p>
            </div>
          </div>

          <div style={{ textAlign:"center", marginBottom:"2.5rem" }}>
            <button className="btn btn-primary" onClick={() => navigate("/check")}>
              ⚡ Try analysing an article now
            </button>
          </div>
        </div>
      )}

      {/* Interactive checklist */}
      <div className="card" style={{ borderTop:"3px solid var(--primary)" }}>
        <h3 style={{ fontSize:"1rem", fontWeight:700, color:"var(--text)", marginBottom:4 }}>🧾 Article Credibility Checklist</h3>
        <p style={{ fontSize:"0.8rem", color:"var(--text3)", marginBottom:"1.25rem" }}>Use this on any article before sharing. Check each question:</p>

        <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", marginBottom:"1.25rem" }}>
          {CHECKLIST.map((item, i) => (
            <div key={i} style={{ padding:"0.875rem", borderRadius:10, border:"1.5px solid var(--border)", background: checklistState[i]==="pass" ? "var(--success-light)" : checklistState[i]==="fail" ? "var(--danger-light)" : "var(--surface)" }}>
              <div style={{ fontWeight:600, fontSize:"0.875rem", color:"var(--text)", marginBottom:8 }}>{item.q}</div>
              <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                <button onClick={() => toggleCheck(i, "pass")}
                  style={{ padding:"5px 14px", borderRadius:8, border:`1.5px solid ${checklistState[i]==="pass" ? "var(--success)" : "var(--border2)"}`, background: checklistState[i]==="pass" ? "var(--success)" : "#fff", color: checklistState[i]==="pass" ? "#fff" : "var(--text2)", fontFamily:"var(--font-body)", fontSize:"0.78rem", fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>
                  ✓ {item.pass}
                </button>
                <button onClick={() => toggleCheck(i, "fail")}
                  style={{ padding:"5px 14px", borderRadius:8, border:`1.5px solid ${checklistState[i]==="fail" ? "var(--danger)" : "var(--border2)"}`, background: checklistState[i]==="fail" ? "var(--danger)" : "#fff", color: checklistState[i]==="fail" ? "#fff" : "var(--text2)", fontFamily:"var(--font-body)", fontSize:"0.78rem", fontWeight:600, cursor:"pointer", transition:"all 0.15s" }}>
                  ✗ {item.fail}
                </button>
              </div>
            </div>
          ))}
        </div>

        {answered > 0 && (
          <div style={{ padding:"1rem", borderRadius:10, background: failCount >= 3 ? "var(--danger-light)" : failCount >= 1 ? "var(--warning-light)" : "var(--success-light)", border:`1px solid ${failCount>=3?"var(--danger-border)":failCount>=1?"#FDE68A":"var(--success-border)"}` }}>
            <div style={{ fontWeight:700, fontSize:"0.95rem", marginBottom:4, color: failCount>=3?"var(--danger)":failCount>=1?"#92400E":"var(--success)" }}>
              {failCount===0 && passCount > 0 ? "✅ Looks credible" : failCount >= 3 ? "🚨 High risk of misinformation" : "⚠ Proceed with caution"}
            </div>
            <p style={{ fontSize:"0.82rem", color:"var(--text2)" }}>
              {answered}/{CHECKLIST.length} questions answered · {passCount} credibility signals · {failCount} red flags
              {failCount > 0 ? " — Consider verifying with TruthGuard or a reputable source before sharing." : " — Always good to double-check with multiple sources."}
            </p>
            {answered < CHECKLIST.length && <button style={{ background:"none", border:"none", color:"var(--primary)", fontSize:"0.78rem", cursor:"pointer", fontFamily:"var(--font-body)", fontWeight:600, marginTop:4, padding:0 }} onClick={() => setChecklistState({})}>Reset checklist</button>}
          </div>
        )}
      </div>
    </div>
  );
}