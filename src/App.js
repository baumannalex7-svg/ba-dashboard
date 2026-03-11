import { useState, useMemo } from "react";

// ─── Brand Tokens ──────────────────────────────────────────────────────────────
const B = {
  navy:      "#0B1C2D",
  navyMid:   "#122336",
  navyLight: "#1A3149",
  gold:      "#C9A84C",
  goldLight: "#E2C47A",
  goldPale:  "#F5EDD6",
  white:     "#F8F5F0",
  slate:     "#8FA3B8",
  slateLight:"#B8CCDC",
  red:       "#C0392B",
  amber:     "#D4892A",
  green:     "#2A7A4B",
  border:    "rgba(201,168,76,0.18)",
  borderSoft:"rgba(201,168,76,0.08)",
};

const STATUSES = ["Planning","Executing","Monitoring","On Hold","Closing","Completed"];

const statusMeta = {
  Planning:   { color: "#4A90D9", label: "PLANNING"   },
  Executing:  { color: B.green,   label: "EXECUTING"  },
  Monitoring: { color: B.amber,   label: "MONITORING" },
  "On Hold":  { color: B.red,     label: "ON HOLD"    },
  Closing:    { color: "#8B5CF6", label: "CLOSING"    },
  Completed:  { color: B.gold,    label: "COMPLETED"  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt   = (n, d=2) => (n===null||isNaN(n)) ? "—" : Number(n).toFixed(d);
const fmtC  = (n) => (n===null||isNaN(n)) ? "—" : "$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtAbs= (n) => (n===null||isNaN(n)) ? "—" : "$"+Math.abs(Number(n)).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});

const indexColor = (v, goodHigh=true) => {
  if (v===null||isNaN(v)) return B.slate;
  if (goodHigh) { return v>=1.0 ? B.green : v>=0.9 ? B.amber : B.red; }
  else          { return v<=1.0 ? B.green : v<=1.1 ? B.amber : B.red; }
};

// ─── Gauge SVG ─────────────────────────────────────────────────────────────────
function Gauge({ value }) {
  const clamped = Math.min(Math.max(isNaN(value)||value===null ? 0 : value, 0), 2);
  const pct = clamped / 2;
  const angle = pct * 180;
  const R = 52, cx = 64, cy = 64;
  const toXY = (deg) => {
    const r = (deg * Math.PI) / 180;
    return [cx + R * Math.cos(r - Math.PI), cy + R * Math.sin(r - Math.PI)];
  };
  const arc = (a1, a2, col) => {
    const [x1,y1] = toXY(a1), [x2,y2] = toXY(a2);
    const lg = a2-a1 > 180 ? 1 : 0;
    return <path d={`M${x1} ${y1} A${R} ${R} 0 ${lg} 1 ${x2} ${y2}`} fill="none" stroke={col} strokeWidth="9" strokeLinecap="round"/>;
  };
  const [nx,ny] = toXY(angle);
  const col = indexColor(value);
  return (
    <svg viewBox="0 0 128 72" style={{width:"100%",maxWidth:130,display:"block",margin:"4px auto 0"}}>
      {arc(0,60,B.red)}{arc(60,120,B.amber)}{arc(120,180,B.green)}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={B.white} strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
      <circle cx={cx} cy={cy} r="4" fill={col} stroke={B.white} strokeWidth="1.5"/>
    </svg>
  );
}

// ─── Shared Input ──────────────────────────────────────────────────────────────
function Field({ label, name, type="text", value, onChange, options, hint, span }) {
  const base = {
    background: B.navyLight,
    border: `1px solid ${B.border}`,
    borderRadius: 6,
    color: B.white,
    padding: "10px 14px",
    fontFamily: "'Jost', sans-serif",
    fontSize: 13,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  };
  return (
    <div style={{ gridColumn: span ? `span ${span}` : undefined, display:"flex", flexDirection:"column", gap:5 }}>
      <label style={{ fontSize:10, color:B.slate, letterSpacing:"0.14em", fontFamily:"'Jost',sans-serif", textTransform:"uppercase", fontWeight:500 }}>
        {label}{hint && <span style={{color:B.navyLight,marginLeft:6,color:"#5A7A9A"}}>{hint}</span>}
      </label>
      {options
        ? <select name={name} value={value} onChange={onChange} style={base}>
            {options.map(o=><option key={o} value={o}>{o}</option>)}
          </select>
        : <input type={type} name={name} value={value} onChange={onChange} style={base}/>
      }
    </div>
  );
}

// ─── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({ label, value, rawValue, sub, gauge, goodHigh=true, color, prefix="", suffix="", large }) {
  const col = color || (rawValue!==undefined ? indexColor(rawValue, goodHigh) : B.white);
  return (
    <div style={{
      background: `linear-gradient(160deg, ${B.navyMid} 0%, ${B.navy} 100%)`,
      border: `1px solid ${B.border}`,
      borderRadius: 10,
      padding: "18px 20px 16px",
      display:"flex", flexDirection:"column", gap:4,
      boxShadow: "0 2px 16px rgba(0,0,0,0.25)",
      position:"relative", overflow:"hidden",
    }}>
      {/* gold accent line */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg, ${B.gold}, transparent)`}}/>
      <div style={{ fontSize:9.5, color:B.slate, letterSpacing:"0.15em", fontFamily:"'Jost',sans-serif", textTransform:"uppercase", fontWeight:600 }}>{label}</div>
      {gauge && rawValue!==null && !isNaN(rawValue) && <Gauge value={rawValue}/>}
      <div style={{ fontSize: large ? 32 : 26, fontWeight:300, color:col, fontFamily:"'Cormorant Garamond',serif", lineHeight:1.05, letterSpacing:"-0.01em", marginTop: gauge ? 0 : 4 }}>
        {prefix}{value}{suffix}
      </div>
      {sub && <div style={{fontSize:11,color:"#4A6A84",fontFamily:"'Jost',sans-serif",lineHeight:1.4,marginTop:2}}>{sub}</div>}
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHead({ title }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,marginTop:8}}>
      <div style={{width:3,height:16,background:B.gold,borderRadius:2,flexShrink:0}}/>
      <div style={{fontSize:10,color:B.gold,fontFamily:"'Jost',sans-serif",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600}}>{title}</div>
      <div style={{flex:1,height:1,background:B.border}}/>
    </div>
  );
}

// ─── Default State ─────────────────────────────────────────────────────────────
const empty = {
  name:"", description:"", sponsor:"", manager:"", status:"Executing",
  startDate:"", plannedEndDate:"",
  bac:"", pv:"", ev:"", ac:"",
  plannedDuration:"", elapsedDays:"",
};

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]       = useState("input");
  const [project, setProject] = useState(empty);
  const [saved, setSaved]     = useState(null);
  const [errors, setErrors]   = useState({});

  const onChange = e => setProject(p => ({...p, [e.target.name]: e.target.value}));

  const validate = () => {
    const e = {};
    if (!project.name.trim()) e.name = true;
    const nums = ["bac","pv","ev","ac"];
    nums.forEach(k => { if (!project[k] || isNaN(parseFloat(project[k]))) e[k]=true; });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleGenerate = () => {
    if (!validate()) return;
    setSaved({...project});
    setView("dashboard");
  };

  const evm = useMemo(() => {
    if (!saved) return null;
    const bac=parseFloat(saved.bac), pv=parseFloat(saved.pv),
          ev=parseFloat(saved.ev),  ac=parseFloat(saved.ac);
    if ([bac,pv,ev,ac].some(v=>isNaN(v)||v<0)) return null;
    const cpi   = ac===0 ? null : ev/ac;
    const spi   = pv===0 ? null : ev/pv;
    const cv    = ev-ac, sv = ev-pv;
    const etc   = (cpi&&cpi!==0) ? (bac-ev)/cpi : null;
    const eac   = ac + (etc??0);
    const vac   = bac-eac;
    const tcpi  = (bac-ac)===0 ? null : (bac-ev)/(bac-ac);
    const pct   = bac===0 ? 0 : (ev/bac)*100;
    const pd    = parseFloat(saved.plannedDuration);
    const ed    = parseFloat(saved.elapsedDays);
    const estDur= (spi&&spi!==0&&!isNaN(pd)) ? pd/spi : null;
    const remDays= (estDur!==null&&!isNaN(ed)) ? estDur-ed : null;
    return {bac,pv,ev,ac,cpi,spi,cv,sv,etc,eac,vac,tcpi,pct,estDur,remDays};
  }, [saved]);

  const health = useMemo(() => {
    if (!evm?.cpi||!evm?.spi) return null;
    if (evm.cpi>=1&&evm.spi>=1)     return {label:"ON TRACK",   color:B.green,  icon:"●"};
    if (evm.cpi>=0.9&&evm.spi>=0.9) return {label:"AT RISK",    color:B.amber,  icon:"◆"};
    return                                  {label:"CRITICAL",   color:B.red,    icon:"▲"};
  }, [evm]);

  // ── styles ──
  const S = {
    app: { minHeight:"100vh", background:B.navy, fontFamily:"'Jost',sans-serif", color:B.white, overflowX:"hidden" },
    topbar: {
      background:`linear-gradient(90deg, ${B.navyMid} 0%, #0D2033 100%)`,
      borderBottom:`1px solid ${B.border}`,
      padding:"0 40px",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      height:72, flexShrink:0,
      boxShadow:"0 2px 20px rgba(0,0,0,0.4)",
    },
    logoArea: { display:"flex", alignItems:"center", gap:16 },
    logoText: { fontFamily:"'Cormorant Garamond',serif", fontSize:20, fontWeight:400, color:B.white, lineHeight:1.2 },
    logoSub:  { fontFamily:"'Jost',sans-serif", fontSize:9.5, color:B.gold, letterSpacing:"0.2em", textTransform:"uppercase", fontWeight:600 },
    divider:  { width:1, height:32, background:B.border, margin:"0 16px" },
    pageTitle:{ fontFamily:"'Jost',sans-serif", fontSize:11, color:B.slate, letterSpacing:"0.15em", textTransform:"uppercase" },
    nav:      { display:"flex", gap:8 },
    navBtn: (active) => ({
      padding:"7px 20px", borderRadius:5,
      border: active ? `1px solid ${B.gold}` : `1px solid ${B.border}`,
      background: active ? `rgba(201,168,76,0.12)` : "transparent",
      color: active ? B.gold : B.slate,
      fontFamily:"'Jost',sans-serif", fontSize:11,
      cursor:"pointer", letterSpacing:"0.1em", textTransform:"uppercase", fontWeight:500,
      transition:"all 0.2s",
    }),
    // hero strip
    hero: {
      background:`linear-gradient(135deg, #0D2033 0%, ${B.navy} 60%, #0A1520 100%)`,
      borderBottom:`1px solid ${B.border}`,
      padding:"36px 40px 32px",
      position:"relative", overflow:"hidden",
    },
    heroTitle:{ fontFamily:"'Cormorant Garamond',serif", fontSize:"clamp(28px,4vw,44px)", fontWeight:300, margin:0, lineHeight:1.15, color:B.white },
    heroAccent:{ color:B.gold },
    heroSub:  { fontFamily:"'Jost',sans-serif", fontSize:12, color:B.slate, marginTop:8, letterSpacing:"0.06em" },
    main:     { maxWidth:1080, margin:"0 auto", padding:"36px 40px 80px" },
    formGrid: { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(220px,1fr))", gap:16 },
    grid3:    { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(200px,1fr))", gap:14 },
    grid2:    { display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(240px,1fr))", gap:14 },
    infoBox:  {
      background:`linear-gradient(160deg,${B.navyMid},${B.navy})`,
      border:`1px solid ${B.border}`, borderRadius:10, padding:"20px 24px",
      boxShadow:"0 2px 16px rgba(0,0,0,0.2)",
    },
    hint: {
      background:`rgba(201,168,76,0.06)`, border:`1px solid rgba(201,168,76,0.15)`,
      borderRadius:8, padding:"12px 16px",
      fontFamily:"'Jost',sans-serif", fontSize:12, color:"#6A8EA8", lineHeight:1.7,
      marginBottom:18,
    },
    generateBtn: {
      marginTop:28, padding:"13px 40px",
      background:`linear-gradient(135deg, ${B.gold} 0%, #A8792A 100%)`,
      border:"none", borderRadius:7,
      color:B.navy, fontFamily:"'Jost',sans-serif", fontSize:12,
      letterSpacing:"0.14em", textTransform:"uppercase", fontWeight:700,
      cursor:"pointer", boxShadow:`0 4px 18px rgba(201,168,76,0.35)`,
      transition:"transform 0.15s, box-shadow 0.15s",
    },
    progressTrack: { height:6, borderRadius:3, background:`rgba(255,255,255,0.06)`, overflow:"hidden", marginTop:8 },
    footer: {
      borderTop:`1px solid ${B.border}`, marginTop:60, paddingTop:24,
      fontFamily:"'Jost',sans-serif", fontSize:11, color:"#2A4A64",
      display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:8,
    },
  };

  return (
    <div style={S.app}>
      {/* ── Top Bar ── */}
      <div style={S.topbar}>
        <div style={S.logoArea}>
          <div>
            <div style={S.logoText}>Baumann <span style={{color:B.gold}}>&</span> Associates</div>
            <div style={S.logoSub}>Project Management Consulting</div>
          </div>
          <div style={S.divider}/>
          <div style={S.pageTitle}>Project Performance Dashboard</div>
        </div>
        <div style={S.nav}>
          <button style={S.navBtn(view==="input")} onClick={()=>setView("input")}>◎ Parameters</button>
          <button style={S.navBtn(view==="dashboard")} onClick={()=>saved&&setView("dashboard")} disabled={!saved}>▦ Dashboard</button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={S.hero}>
        {/* decorative diagonal */}
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:320,background:`linear-gradient(135deg,transparent 40%,rgba(201,168,76,0.04))`,pointerEvents:"none"}}/>
        <div style={{position:"absolute",right:40,top:"50%",transform:"translateY(-50%)",opacity:0.04,fontSize:120,fontFamily:"'Cormorant Garamond',serif",fontWeight:300,lineHeight:1,userSelect:"none"}}>EVM</div>
        <div style={{maxWidth:1080,margin:"0 auto"}}>
          <div style={{fontSize:10,color:B.gold,letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,marginBottom:10,fontFamily:"'Jost',sans-serif"}}>
            PMI PMBOK® · ANSI/EIA-748 · Earned Value Management
          </div>
          <h1 style={S.heroTitle}>
            Project <span style={S.heroAccent}>Performance</span> Intelligence
          </h1>
          <p style={S.heroSub}>
            Real-time EVM analysis · Cost & Schedule performance · Completion forecasting · PMI-compliant reporting
          </p>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={S.main}>

        {/* ════════════════ INPUT VIEW ════════════════ */}
        {view==="input" && (
          <>
            {/* Project Info */}
            <div style={{marginBottom:36}}>
              <SectionHead title="Project Information"/>
              <div style={S.formGrid}>
                <Field label="Project Name *" name="name" value={project.name} onChange={onChange} span={2}
                  hint={errors.name?"Required":""}/>
                <Field label="Project Manager" name="manager" value={project.manager} onChange={onChange}/>
                <Field label="Project Sponsor" name="sponsor" value={project.sponsor} onChange={onChange}/>
                <Field label="Project Status" name="status" value={project.status} onChange={onChange} options={STATUSES}/>
                <Field label="Start Date" name="startDate" type="date" value={project.startDate} onChange={onChange}/>
                <Field label="Planned End Date" name="plannedEndDate" type="date" value={project.plannedEndDate} onChange={onChange}/>
                <Field label="Project Description" name="description" value={project.description} onChange={onChange} span={3}/>
              </div>
            </div>

            {/* EVM Inputs */}
            <div style={{marginBottom:36}}>
              <SectionHead title="Earned Value Metrics — EVM Inputs"/>
              <div style={S.hint}>
                <strong style={{color:B.gold}}>PMBOK® Definitions:</strong>&nbsp;
                <strong style={{color:B.slateLight}}>BAC</strong> = Total approved budget &nbsp;·&nbsp;
                <strong style={{color:B.slateLight}}>PV</strong> = Budgeted cost of work <em>scheduled</em> to date &nbsp;·&nbsp;
                <strong style={{color:B.slateLight}}>EV</strong> = Budgeted cost of work <em>performed</em> to date &nbsp;·&nbsp;
                <strong style={{color:B.slateLight}}>AC</strong> = Actual cost <em>incurred</em> to date
              </div>
              <div style={S.formGrid}>
                {["bac","pv","ev","ac"].map(k => ({
                  bac:{label:"BAC — Budget at Completion ($)",hint:"Total approved budget"},
                  pv: {label:"PV — Planned Value ($)",       hint:"Scheduled budget to date"},
                  ev: {label:"EV — Earned Value ($)",        hint:"Value of work completed"},
                  ac: {label:"AC — Actual Cost ($)",         hint:"Actual spend to date"},
                }[k])).map((f,i)=>(
                  <Field key={i} label={f.label+"*"} name={["bac","pv","ev","ac"][i]}
                    type="number" value={project[["bac","pv","ev","ac"][i]]}
                    onChange={onChange} hint={errors[["bac","pv","ev","ac"][i]] ? "Required" : f.hint}/>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div style={{marginBottom:36}}>
              <SectionHead title="Schedule Parameters"/>
              <div style={{...S.formGrid, gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))"}}>
                <Field label="Original Planned Duration (days)" name="plannedDuration" type="number" value={project.plannedDuration} onChange={onChange}/>
                <Field label="Elapsed Days to Date" name="elapsedDays" type="number" value={project.elapsedDays} onChange={onChange}/>
              </div>
            </div>

            {Object.keys(errors).length>0 && (
              <div style={{color:B.red,fontFamily:"'Jost',sans-serif",fontSize:12,marginBottom:12,letterSpacing:"0.05em"}}>
                ▲ Please complete all required fields marked with *
              </div>
            )}

            <button style={S.generateBtn} onClick={handleGenerate}>
              Generate Dashboard →
            </button>
          </>
        )}

        {/* ════════════════ DASHBOARD VIEW ════════════════ */}
        {view==="dashboard" && saved && (
          <>
            {/* Project Header Card */}
            <div style={{...S.infoBox, marginBottom:28, display:"flex", flexWrap:"wrap", gap:20, alignItems:"center", justifyContent:"space-between"}}>
              <div style={{flex:1,minWidth:260}}>
                <div style={{fontFamily:"'Cormorant Garamond',serif", fontSize:28, fontWeight:400, color:B.white, lineHeight:1.15, marginBottom:6}}>
                  {saved.name}
                </div>
                <div style={{fontFamily:"'Jost',sans-serif", fontSize:12, color:B.slate, lineHeight:1.8}}>
                  {saved.manager && <><span style={{color:"#4A6A84"}}>Project Manager:</span> <span style={{color:B.slateLight}}>{saved.manager}</span>&emsp;</>}
                  {saved.sponsor && <><span style={{color:"#4A6A84"}}>Sponsor:</span> <span style={{color:B.slateLight}}>{saved.sponsor}</span>&emsp;</>}
                  {saved.startDate && <><span style={{color:"#4A6A84"}}>Start:</span> <span style={{color:B.slateLight}}>{saved.startDate}</span>&emsp;</>}
                  {saved.plannedEndDate && <><span style={{color:"#4A6A84"}}>Planned End:</span> <span style={{color:B.slateLight}}>{saved.plannedEndDate}</span></>}
                </div>
                {saved.description && <div style={{fontFamily:"'Jost',sans-serif",fontSize:12,color:"#3A5A74",marginTop:8}}>{saved.description}</div>}
              </div>
              <div style={{display:"flex",gap:12,flexShrink:0}}>
                {health && (
                  <div style={{background:`${health.color}18`,border:`1px solid ${health.color}40`,borderRadius:8,padding:"12px 22px",textAlign:"center",minWidth:90}}>
                    <div style={{fontSize:18,color:health.color,lineHeight:1}}>{health.icon}</div>
                    <div style={{fontFamily:"'Jost',sans-serif",fontSize:10,color:health.color,letterSpacing:"0.12em",marginTop:4,fontWeight:600}}>{health.label}</div>
                  </div>
                )}
                <div style={{background:`${statusMeta[saved.status].color}18`,border:`1px solid ${statusMeta[saved.status].color}40`,borderRadius:8,padding:"12px 22px",textAlign:"center",minWidth:90}}>
                  <div style={{fontFamily:"'Jost',sans-serif",fontSize:10,color:"#4A6A84",letterSpacing:"0.12em",marginBottom:4,fontWeight:600}}>STATUS</div>
                  <div style={{fontFamily:"'Jost',sans-serif",fontSize:11,color:statusMeta[saved.status].color,letterSpacing:"0.1em",fontWeight:600}}>{statusMeta[saved.status].label}</div>
                </div>
              </div>
            </div>

            {evm ? (<>
              {/* % Complete bar */}
              <div style={{...S.infoBox, marginBottom:24}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                  <div style={{fontFamily:"'Jost',sans-serif",fontSize:10,color:B.slate,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600}}>Schedule % Complete &nbsp;<span style={{color:"#2A4A64"}}>(EV / BAC)</span></div>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:B.gold,fontWeight:400}}>{fmt(evm.pct,1)}%</div>
                </div>
                <div style={S.progressTrack}>
                  <div style={{height:"100%",width:`${Math.min(evm.pct,100)}%`,background:`linear-gradient(90deg,${B.gold},${B.goldLight})`,borderRadius:3,transition:"width 1s ease"}}/>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                  <div style={{fontFamily:"'Jost',sans-serif",fontSize:10,color:"#2A4A64"}}>EV: {fmtC(evm.ev)}</div>
                  <div style={{fontFamily:"'Jost',sans-serif",fontSize:10,color:"#2A4A64"}}>BAC: {fmtC(evm.bac)}</div>
                </div>
              </div>

              {/* Performance Indices */}
              <div style={{marginBottom:28}}>
                <SectionHead title="Performance Indices"/>
                <div style={S.grid2}>
                  <MetricCard label="CPI — Cost Performance Index" rawValue={evm.cpi}
                    value={fmt(evm.cpi)} sub="CPI = EV ÷ AC  ·  Values >1.0 indicate under-budget performance"
                    gauge goodHigh color={indexColor(evm.cpi)}/>
                  <MetricCard label="SPI — Schedule Performance Index" rawValue={evm.spi}
                    value={fmt(evm.spi)} sub="SPI = EV ÷ PV  ·  Values >1.0 indicate ahead-of-schedule performance"
                    gauge goodHigh color={indexColor(evm.spi)}/>
                </div>
                <div style={{marginTop:14}}>
                  <MetricCard label="TCPI — To-Complete Performance Index" rawValue={evm.tcpi}
                    value={fmt(evm.tcpi)} sub="Efficiency required on remaining work to meet BAC  ·  Values >1.1 indicate recovery is needed"
                    color={indexColor(evm.tcpi,false)}/>
                </div>
              </div>

              {/* Variance Analysis */}
              <div style={{marginBottom:28}}>
                <SectionHead title="Variance Analysis"/>
                <div style={S.grid3}>
                  <MetricCard label="CV — Cost Variance" value={fmtC(evm.cv)}
                    sub="EV − AC  ·  Negative = over budget"
                    color={evm.cv>=0 ? B.green : B.red}/>
                  <MetricCard label="SV — Schedule Variance" value={fmtC(evm.sv)}
                    sub="EV − PV  ·  Negative = behind schedule"
                    color={evm.sv>=0 ? B.green : B.red}/>
                  <MetricCard label="VAC — Variance at Completion" value={fmtC(evm.vac)}
                    sub="BAC − EAC  ·  Projected final surplus or deficit"
                    color={evm.vac>=0 ? B.green : B.red}/>
                </div>
              </div>

              {/* Forecasts */}
              <div style={{marginBottom:28}}>
                <SectionHead title="Cost Forecasts & Projections"/>
                <div style={S.grid3}>
                  <MetricCard label="BAC — Budget at Completion" value={fmtC(evm.bac)}
                    sub="Original total approved budget" color={B.slateLight}/>
                  <MetricCard label="EAC — Estimate at Completion" value={fmtC(evm.eac)}
                    sub="AC + (BAC−EV)÷CPI  ·  Projected final cost"
                    color={evm.eac<=evm.bac ? B.green : B.red}/>
                  <MetricCard label="ETC — Estimate to Complete" value={fmtC(evm.etc)}
                    sub="Remaining cost forecast at current CPI efficiency"
                    color={B.gold}/>
                </div>
                {evm.estDur!==null && (
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginTop:14}}>
                    <MetricCard label="Estimated Total Duration" value={`${fmt(evm.estDur,0)} days`}
                      sub="Planned Duration ÷ SPI  ·  Schedule-adjusted forecast" color={B.amber}/>
                    {evm.remDays!==null && (
                      <MetricCard label="Remaining Days (Forecast)" value={`${fmt(evm.remDays,0)} days`}
                        sub="Estimated duration minus days already elapsed"
                        color={evm.remDays<=0 ? B.red : B.slateLight}/>
                    )}
                  </div>
                )}
              </div>

              {/* Raw EVM Table */}
              <div style={{marginBottom:28}}>
                <SectionHead title="EVM Data Summary"/>
                <div style={{...S.infoBox}}>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:0}}>
                    {[
                      ["Planned Value (PV)",      fmtC(evm.pv)],
                      ["Earned Value (EV)",        fmtC(evm.ev)],
                      ["Actual Cost (AC)",         fmtC(evm.ac)],
                      ["Budget at Completion (BAC)",fmtC(evm.bac)],
                      ["Estimate at Completion (EAC)",fmtC(evm.eac)],
                      ["Estimate to Complete (ETC)", fmtC(evm.etc)],
                    ].map(([k,v])=>(
                      <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"11px 6px",borderBottom:`1px solid ${B.borderSoft}`,fontFamily:"'Jost',sans-serif",fontSize:12}}>
                        <span style={{color:"#3A5A74"}}>{k}</span>
                        <span style={{color:B.slateLight,fontWeight:500}}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* PMI Interpretation */}
              <div>
                <SectionHead title="PMI Performance Interpretation"/>
                <div style={{...S.infoBox}}>
                  <div style={{display:"flex",flexDirection:"column",gap:12}}>
                    {[
                      {
                        dot: indexColor(evm.cpi),
                        label:"Cost Performance",
                        text: evm.cpi>=1
                          ? `Project is performing under budget. For every $1.00 spent, $${fmt(evm.cpi)} of budgeted value is delivered (CPI = ${fmt(evm.cpi)}). Cost efficiency is favorable.`
                          : `Project is over budget. Only $${fmt(evm.cpi)} of value delivered per $1.00 spent (CPI = ${fmt(evm.cpi)}). A cost recovery plan should be evaluated.`,
                      },
                      {
                        dot: indexColor(evm.spi),
                        label:"Schedule Performance",
                        text: evm.spi>=1
                          ? `Project is ahead of schedule, performing at ${fmt(evm.spi*100,0)}% of planned rate (SPI = ${fmt(evm.spi)}). Schedule float is available.`
                          : `Project is behind schedule. Only ${fmt(evm.spi*100,0)}% of planned work has been completed on time (SPI = ${fmt(evm.spi)}). Schedule recovery actions are recommended.`,
                      },
                      {
                        dot: evm.eac<=evm.bac ? B.green : B.red,
                        label:"Budget Forecast",
                        text: evm.eac<=evm.bac
                          ? `Project is forecast to finish ${fmtAbs(evm.vac)} UNDER the approved budget (EAC = ${fmtC(evm.eac)} vs BAC = ${fmtC(evm.bac)}).`
                          : `Project is forecast to finish ${fmtAbs(evm.vac)} OVER the approved budget (EAC = ${fmtC(evm.eac)} vs BAC = ${fmtC(evm.bac)}). Budget escalation approval may be required.`,
                      },
                      evm.tcpi!==null && {
                        dot: indexColor(evm.tcpi,false),
                        label:"Completion Efficiency (TCPI)",
                        text: evm.tcpi<=1.1
                          ? `The required efficiency to complete remaining work within the original budget is ${fmt(evm.tcpi)} — considered achievable given current performance.`
                          : `Completing within budget requires a ${fmt(evm.tcpi)} work efficiency factor — significantly above current performance. Project recovery or re-baselining is recommended.`,
                      },
                    ].filter(Boolean).map((item,i)=>(
                      <div key={i} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:i<3?`1px solid ${B.borderSoft}`:"none"}}>
                        <div style={{width:3,borderRadius:2,background:item.dot,flexShrink:0,alignSelf:"stretch",minHeight:16}}/>
                        <div>
                          <div style={{fontFamily:"'Jost',sans-serif",fontSize:10,color:B.gold,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600,marginBottom:4}}>{item.label}</div>
                          <div style={{fontFamily:"'Jost',sans-serif",fontSize:13,color:B.slateLight,lineHeight:1.65}}>{item.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </>) : (
              <div style={{...S.infoBox,textAlign:"center",padding:"48px 24px"}}>
                <div style={{fontSize:40,marginBottom:12,opacity:0.4}}>◈</div>
                <div style={{fontFamily:"'Jost',sans-serif",color:B.slate,fontSize:14,marginBottom:20}}>
                  EVM metrics unavailable — please ensure BAC, PV, EV, and AC contain valid numeric values.
                </div>
                <button style={S.generateBtn} onClick={()=>setView("input")}>← Update Parameters</button>
              </div>
            )}

            {/* Footer */}
            <div style={S.footer}>
              <span>Baumann & Associates Consulting Ltd. · Vancouver, BC, Canada</span>
              <span>Formulas per PMI PMBOK® Guide 7th Ed. · ANSI/EIA-748 EVM Standard</span>
            </div>
          </>
        )}

      </div>
    </div>
  );
}
