import { useState } from "react";

const API = import.meta.env.VITE_API_BASE ?? "https://azspace-production.railway.app";

export default function Analyze() {
  const [tle1, setTle1] = useState("");
  const [tle2, setTle2] = useState("");
  const [hours, setHours] = useState(12);
  const [step, setStep] = useState(60);
  const [thr, setThr] = useState(5);
  const [maxcat, setMaxcat] = useState(200);
  const [catalog, setCatalog] = useState("https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!tle1.startsWith("1 ") || !tle2.startsWith("2 ")) {
      setError('Please paste a valid 2-line TLE (lines must start with "1 " and "2 ").'); return;
    }
    setError(null); setLoading(true); setResult(null);
    const payload = {
      user_tle: { name: "USER-SAT", tle1, tle2 },
      catalog_url: catalog,
      window_hours: hours,
      step_seconds: step,
      threshold_km: thr,
      max_catalog: maxcat
    };
    try {
      const r = await fetch(`${API}/analyze`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.detail ?? "Request failed");
      setResult(data);
    } catch (e:any) {
      setError(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{maxWidth: 900, margin: "40px auto", padding: 16, fontFamily: "system-ui, sans-serif"}}>
      <h1>Conjunction & Space-Weather Analyzer</h1>
      <p>Paste a TLE and scan against a public CelesTrak catalog, plus NOAA SWPC status.</p>
      <div style={{border:"1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 12}}>
        <label>TLE Line 1</label>
        <textarea rows={2} value={tle1} onChange={e=>setTle1(e.target.value)} style={{width:"100%"}} />
        <label style={{marginTop: 8, display:"block"}}>TLE Line 2</label>
        <textarea rows={2} value={tle2} onChange={e=>setTle2(e.target.value)} style={{width:"100%"}} />
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12, marginTop: 12}}>
          <div>
            <label>Catalog URL</label>
            <input value={catalog} onChange={e=>setCatalog(e.target.value)} style={{width:"100%"}} />
          </div>
          <div>
            <label>Window (hours)</label>
            <input type="number" value={hours} onChange={e=>setHours(parseFloat(e.target.value))} style={{width:"100%"}} />
          </div>
          <div>
            <label>Step (seconds)</label>
            <input type="number" value={step} onChange={e=>setStep(parseFloat(e.target.value))} style={{width:"100%"}} />
          </div>
          <div>
            <label>Threshold (km)</label>
            <input type="number" value={thr} onChange={e=>setThr(parseFloat(e.target.value))} style={{width:"100%"}} />
          </div>
          <div>
            <label>Max catalog</label>
            <input type="number" value={maxcat} onChange={e=>setMaxcat(parseInt(e.target.value))} style={{width:"100%"}} />
          </div>
        </div>
        <button onClick={run} disabled={loading} style={{marginTop: 12, padding:"10px 16px", borderRadius:8, border:"none", background:"black", color:"white"}}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
      </div>

      {error && <p style={{color:"crimson", marginTop:12}}>{error}</p>}
      {result && (
        <div style={{border:"1px solid #ddd", borderRadius: 12, padding: 16, marginTop: 12}}>
          <h3>Results</h3>
          <pre style={{whiteSpace:"pre-wrap"}}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
