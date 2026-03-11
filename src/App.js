import { useState, useMemo } from "react";

// ─── Brand Tokens ──────────────────────────────────────────────────────────────
const B = {
  navy:       "#FFFFFF",
  navyMid:    "#F4F4F4",
  navyLight:  "#E8E8E8",
  gold:       "#C0392B",
  goldLight:  "#E05545",
  goldPale:   "#FDECEA",
  white:      "#111111",
  slate:      "#555555",
  slateLight: "#222222",
  red:        "#C0392B",
  amber:      "#D4892A",
  green:      "#2A7A4B",
  border:     "rgba(192,57,43,0.18)",
  borderSoft: "rgba(192,57,43,0.08)",
};

const STATUSES = ["Planning","Executing","Monitoring","On Hold","Closing","Completed"];
const statusMeta = {
  Planning:   { color:"#4A90D9", label:"PLANNING"   },
  Executing:  { color:B.green,   label:"EXECUTING"  },
  Monitoring: { color:B.amber,   label:"MONITORING" },
  "On Hold":  { color:B.red,     label:"ON HOLD"    },
  Closing:    { color:"#8B5CF6", label:"CLOSING"    },
  Completed:  { color:B.gold,    label:"COMPLETED"  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────
const fmt    = (n,d=2) => (n===null||isNaN(n)) ? "—" : Number(n).toFixed(d);
const fmtC   = (n) => (n===null||isNaN(n)) ? "—" : "$"+Number(n).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtAbs = (n) => (n===null||isNaN(n)) ? "—" : "$"+Math.abs(Number(n)).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const todayStr = () => new Date().toISOString().split("T")[0];

const indexColor = (v, goodHigh=true) => {
  if (v===null||isNaN(v)) return B.slate;
  if (goodHigh) return v>=1.0 ? B.green : v>=0.9 ? B.amber : B.red;
  else          return v<=1.0 ? B.green : v<=1.1 ? B.amber : B.red;
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src=src; s.onload=resolve; s.onerror=reject;
    document.head.appendChild(s);
  });
}

// ─── Gauge ─────────────────────────────────────────────────────────────────────
function Gauge({ value }) {
  const clamped = Math.min(Math.max(isNaN(value)||value===null?0:value,0),2);
  const angle = (clamped/2)*180;
  const R=52,cx=64,cy=64;
  const toXY = deg => { const r=(deg*Math.PI)/180; return [cx+R*Math.cos(r-Math.PI),cy+R*Math.sin(r-Math.PI)]; };
  const arc = (a1,a2,col) => {
    const [x1,y1]=toXY(a1),[x2,y2]=toXY(a2),lg=a2-a1>180?1:0;
    return <path d={`M${x1} ${y1} A${R} ${R} 0 ${lg} 1 ${x2} ${y2}`} fill="none" stroke={col} strokeWidth="9" strokeLinecap="round"/>;
  };
  const [nx,ny]=toXY(angle);
  return (
    <svg viewBox="0 0 128 72" style={{width:"100%",maxWidth:130,display:"block",margin:"4px auto 0"}}>
      {arc(0,60,B.red)}{arc(60,120,B.amber)}{arc(120,180,B.green)}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={B.white} strokeWidth="2.5" strokeLinecap="round" opacity="0.9"/>
      <circle cx={cx} cy={cy} r="4" fill={indexColor(value)} stroke={B.white} strokeWidth="1.5"/>
    </svg>
  );
}

// ─── Field ─────────────────────────────────────────────────────────────────────
function Field({ label, name, type="text", value, onChange, options, hint, span }) {
  const base = {
    background:B.navyLight, border:`1px solid ${B.border}`, borderRadius:6,
    color:B.white, padding:"10px 14px", fontFamily:"'Jost',sans-serif",
    fontSize:13, outline:"none", width:"100%", boxSizing:"border-box",
  };
  return (
    <div style={{gridColumn:span?`span ${span}`:undefined,display:"flex",flexDirection:"column",gap:5}}>
      <label style={{fontSize:10,color:B.slate,letterSpacing:"0.14em",fontFamily:"'Jost',sans-serif",textTransform:"uppercase",fontWeight:500}}>
        {label}{hint&&<span style={{color:B.red,marginLeft:6}}>{hint}</span>}
      </label>
      {options
        ? <select name={name} value={value} onChange={onChange} style={base}>{options.map(o=><option key={o}>{o}</option>)}</select>
        : <input type={type} name={name} value={value} onChange={onChange} style={base}/>
      }
    </div>
  );
}

// ─── MetricCard ────────────────────────────────────────────────────────────────
function MetricCard({ label, value, rawValue, sub, gauge, goodHigh=true, color }) {
  const col = color||(rawValue!==undefined?indexColor(rawValue,goodHigh):B.white);
  return (
    <div style={{background:`linear-gradient(160deg,${B.navyMid},${B.navy})`,border:`1px solid ${B.border}`,borderRadius:10,padding:"18px 20px 16px",display:"flex",flexDirection:"column",gap:4,boxShadow:"0 2px 12px rgba(0,0,0,0.06)",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${B.gold},transparent)`}}/>
      <div style={{fontSize:9.5,color:B.slate,letterSpacing:"0.15em",fontFamily:"'Jost',sans-serif",textTransform:"uppercase",fontWeight:600}}>{label}</div>
      {gauge&&rawValue!==null&&!isNaN(rawValue)&&<Gauge value={rawValue}/>}
      <div style={{fontSize:26,fontWeight:300,color:col,fontFamily:"'Cormorant Garamond',serif",lineHeight:1.05,marginTop:gauge?0:4}}>{value}</div>
      {sub&&<div style={{fontSize:11,color:"#777",fontFamily:"'Jost',sans-serif",lineHeight:1.4,marginTop:2}}>{sub}</div>}
    </div>
  );
}

// ─── SectionHead ───────────────────────────────────────────────────────────────
function SectionHead({ title }) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16,marginTop:8}}>
      <div style={{width:3,height:16,background:B.gold,borderRadius:2,flexShrink:0}}/>
      <div style={{fontSize:10,color:B.gold,fontFamily:"'Jost',sans-serif",letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600}}>{title}</div>
      <div style={{flex:1,height:1,background:B.border}}/>
    </div>
  );
}

const empty = {
  name:"",description:"",sponsor:"",manager:"",status:"Executing",
  startDate:"",plannedEndDate:"",reportDate:todayStr(),
  bac:"",pv:"",ev:"",ac:"",
  plannedDuration:"",elapsedDays:"",
};

// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [view,      setView]      = useState("input");
  const [project,   setProject]   = useState(empty);
  const [saved,     setSaved]     = useState(null);
  const [errors,    setErrors]    = useState({});
  const [exporting, setExporting] = useState(null);

  const onChange = e => setProject(p=>({...p,[e.target.name]:e.target.value}));

  const validate = () => {
    const e={};
    if(!project.name.trim()) e.name=true;
    ["bac","pv","ev","ac"].forEach(k=>{if(!project[k]||isNaN(parseFloat(project[k])))e[k]=true;});
    setErrors(e); return Object.keys(e).length===0;
  };

  const handleGenerate = () => { if(validate()){setSaved({...project});setView("dashboard");} };

  const evm = useMemo(()=>{
    if(!saved)return null;
    const bac=parseFloat(saved.bac),pv=parseFloat(saved.pv),ev=parseFloat(saved.ev),ac=parseFloat(saved.ac);
    if([bac,pv,ev,ac].some(v=>isNaN(v)||v<0))return null;
    const cpi=ac===0?null:ev/ac, spi=pv===0?null:ev/pv;
    const cv=ev-ac,sv=ev-pv;
    const etc=(cpi&&cpi!==0)?(bac-ev)/cpi:null;
    const eac=ac+(etc??0),vac=bac-eac;
    const tcpi=(bac-ac)===0?null:(bac-ev)/(bac-ac);
    const pct=bac===0?0:(ev/bac)*100;
    const pd=parseFloat(saved.plannedDuration),ed=parseFloat(saved.elapsedDays);
    const estDur=(spi&&spi!==0&&!isNaN(pd))?pd/spi:null;
    const remDays=(estDur!==null&&!isNaN(ed))?estDur-ed:null;
    return {bac,pv,ev,ac,cpi,spi,cv,sv,etc,eac,vac,tcpi,pct,estDur,remDays};
  },[saved]);

  const health = useMemo(()=>{
    if(!evm?.cpi||!evm?.spi)return null;
    if(evm.cpi>=1&&evm.spi>=1)     return{label:"ON TRACK",color:B.green,icon:"●"};
    if(evm.cpi>=0.9&&evm.spi>=0.9) return{label:"AT RISK", color:B.amber,icon:"◆"};
    return                               {label:"CRITICAL",color:B.red,  icon:"▲"};
  },[evm]);

  const interpretations = useMemo(()=>{
    if(!evm)return[];
    return[
      {label:"Cost Performance",
       text:evm.cpi>=1
        ?`Project is performing under budget. For every $1.00 spent, $${fmt(evm.cpi)} of budgeted value is delivered (CPI = ${fmt(evm.cpi)}). Cost efficiency is favorable.`
        :`Project is over budget. Only $${fmt(evm.cpi)} of value delivered per $1.00 spent (CPI = ${fmt(evm.cpi)}). A cost recovery plan should be evaluated.`},
      {label:"Schedule Performance",
       text:evm.spi>=1
        ?`Project is ahead of schedule, performing at ${fmt(evm.spi*100,0)}% of planned rate (SPI = ${fmt(evm.spi)}). Schedule float is available.`
        :`Project is behind schedule. Only ${fmt(evm.spi*100,0)}% of planned work has been completed on time (SPI = ${fmt(evm.spi)}). Schedule recovery actions are recommended.`},
      {label:"Budget Forecast",
       text:evm.eac<=evm.bac
        ?`Project is forecast to finish ${fmtAbs(evm.vac)} UNDER the approved budget (EAC = ${fmtC(evm.eac)} vs BAC = ${fmtC(evm.bac)}).`
        :`Project is forecast to finish ${fmtAbs(evm.vac)} OVER the approved budget (EAC = ${fmtC(evm.eac)} vs BAC = ${fmtC(evm.bac)}). Budget escalation approval may be required.`},
      evm.tcpi!==null&&{label:"Completion Efficiency (TCPI)",
       text:evm.tcpi<=1.1
        ?`The required efficiency to complete remaining work within the original budget is ${fmt(evm.tcpi)} — considered achievable given current performance.`
        :`Completing within budget requires a ${fmt(evm.tcpi)} work efficiency factor — significantly above current performance. Project recovery or re-baselining is recommended.`},
    ].filter(Boolean);
  },[evm]);

  // ═══════════════════════════════════════════════════════════
  // EXPORT: EXCEL
  // ═══════════════════════════════════════════════════════════
  const exportExcel = async () => {
    setExporting("excel");
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js");
      const XLSX=window.XLSX, wb=XLSX.utils.book_new();

      const ws1=XLSX.utils.aoa_to_sheet([
        ["BAUMANN & ASSOCIATES — PROJECT PERFORMANCE REPORT"],
        ["Report Date:", saved.reportDate||""],
        [],
        ["PROJECT INFORMATION"],
        ["Project Name",    saved.name],
        ["Project Manager", saved.manager||""],
        ["Project Sponsor", saved.sponsor||""],
        ["Status",          saved.status],
        ["Start Date",      saved.startDate||""],
        ["Planned End Date",saved.plannedEndDate||""],
        ["Description",     saved.description||""],
      ]);
      ws1["!cols"]=[{wch:36},{wch:30}];
      XLSX.utils.book_append_sheet(wb,ws1,"Project Summary");

      const ws2=XLSX.utils.aoa_to_sheet([
        ["BAUMANN & ASSOCIATES — EVM METRICS"],
        ["Report Date:", saved.reportDate||""],
        [],
        ["PERFORMANCE INDICES"],
        ["Metric","Value","Formula","Interpretation"],
        ["CPI — Cost Performance Index",     evm?fmt(evm.cpi):"","EV / AC",            evm?.cpi>=1?"Under Budget ✓":"Over Budget ✗"],
        ["SPI — Schedule Performance Index", evm?fmt(evm.spi):"","EV / PV",            evm?.spi>=1?"Ahead of Schedule ✓":"Behind Schedule ✗"],
        ["TCPI — To-Complete Perf. Index",   evm?fmt(evm.tcpi):"","(BAC−EV)/(BAC−AC)", evm?.tcpi<=1.1?"Achievable ✓":"Requires Recovery ✗"],
        [],
        ["VARIANCE ANALYSIS"],
        ["Metric","Value","Formula","Interpretation"],
        ["CV — Cost Variance",           evm?fmtC(evm.cv):"","EV − AC",  evm?.cv>=0?"Favorable ✓":"Unfavorable ✗"],
        ["SV — Schedule Variance",       evm?fmtC(evm.sv):"","EV − PV",  evm?.sv>=0?"Favorable ✓":"Unfavorable ✗"],
        ["VAC — Variance at Completion", evm?fmtC(evm.vac):"","BAC − EAC",evm?.vac>=0?"Under Budget ✓":"Over Budget ✗"],
        [],
        ["FORECASTS"],
        ["Metric","Value","Formula",""],
        ["BAC — Budget at Completion",    evm?fmtC(evm.bac):"","Original approved budget",""],
        ["EAC — Estimate at Completion",  evm?fmtC(evm.eac):"","AC + (BAC−EV)/CPI",""],
        ["ETC — Estimate to Complete",    evm?fmtC(evm.etc):"","(BAC−EV)/CPI",""],
        [],
        ["SCHEDULE FORECAST"],
        ["Planned Duration (days)",    saved.plannedDuration||""],
        ["Elapsed Days",               saved.elapsedDays||""],
        ["Estimated Total Duration",   evm?.estDur?fmt(evm.estDur,0)+" days":"—"],
        ["Remaining Days (Forecast)",  evm?.remDays!==null?fmt(evm.remDays,0)+" days":"—"],
        [],
        ["% Schedule Complete (EV/BAC)", evm?fmt(evm.pct,1)+"%":"—"],
        ["Overall Health Status",        health?health.label:"—"],
      ]);
      ws2["!cols"]=[{wch:36},{wch:20},{wch:24},{wch:24}];
      XLSX.utils.book_append_sheet(wb,ws2,"EVM Metrics");

      const ws3=XLSX.utils.aoa_to_sheet([
        ["BAUMANN & ASSOCIATES — PMI PERFORMANCE INTERPRETATION"],
        ["Report Date:", saved.reportDate||""],
        [],
        ["Section","Interpretation"],
        ...interpretations.map(i=>[i.label,i.text]),
        [],
        ["","Formulas per PMI PMBOK® Guide 7th Edition · ANSI/EIA-748 EVM Standard"],
      ]);
      ws3["!cols"]=[{wch:30},{wch:90}];
      XLSX.utils.book_append_sheet(wb,ws3,"Interpretation");

      XLSX.writeFile(wb,`BA_Project_Report_${saved.name.replace(/\s+/g,"_")}_${saved.reportDate||"export"}.xlsx`);
    } catch(e){alert("Excel export failed: "+e.message);}
    setExporting(null);
  };

  // ═══════════════════════════════════════════════════════════
  // EXPORT: PDF
  // ═══════════════════════════════════════════════════════════
  const exportPDF = async () => {
    setExporting("pdf");
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js");
      const {jsPDF}=window.jspdf;
      const doc=new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
      const W=210,M=18;

      const pageHeader = () => {
        doc.setFillColor(192,57,43); doc.rect(0,0,W,10,"F");
        doc.setFontSize(7); doc.setTextColor(255,255,255);
        doc.text("BAUMANN & ASSOCIATES · PROJECT PERFORMANCE REPORT",M,6.5);
        doc.text(`Report Date: ${saved.reportDate||""}`,W-M,6.5,{align:"right"});
      };

      // cover strip
      doc.setFillColor(192,57,43); doc.rect(0,0,W,28,"F");
      doc.setFontSize(18); doc.setTextColor(255,255,255); doc.setFont("helvetica","bold");
      doc.text("PROJECT PERFORMANCE REPORT",M,14);
      doc.setFontSize(9); doc.setFont("helvetica","normal");
      doc.text("Baumann & Associates Consulting Ltd.  ·  PMI PMBOK® Compliant  ·  EVM Analysis",M,22);
      doc.text(`Report Date: ${saved.reportDate||""}`,W-M,22,{align:"right"});

      let y=36;

      // Section heading helper
      const sHead = (title) => {
        doc.setFontSize(11); doc.setTextColor(192,57,43); doc.setFont("helvetica","bold");
        doc.text(title,M,y); y+=2;
        doc.setDrawColor(192,57,43); doc.setLineWidth(0.4); doc.line(M,y,W-M,y); y+=5;
      };

      sHead("PROJECT INFORMATION");
      doc.autoTable({
        startY:y, margin:{left:M,right:M},
        head:[], body:[
          ["Project Name",    saved.name],
          ["Project Manager", saved.manager||"—"],
          ["Project Sponsor", saved.sponsor||"—"],
          ["Status",          saved.status],
          ["Start Date",      saved.startDate||"—"],
          ["Planned End Date",saved.plannedEndDate||"—"],
          ...(saved.description?[["Description",saved.description]]:[]),
        ],
        styles:{fontSize:9,cellPadding:2.5,textColor:[30,30,30]},
        columnStyles:{0:{fontStyle:"bold",cellWidth:55,fillColor:[244,244,244]},1:{cellWidth:"auto"}},
        theme:"plain",
      });
      y=doc.lastAutoTable.finalY+6;

      if(health){
        const hcol=health.color===B.green?[42,122,75]:health.color===B.amber?[212,137,42]:[192,57,43];
        doc.setFillColor(...hcol); doc.roundedRect(M,y,60,12,2,2,"F");
        doc.setFontSize(9); doc.setTextColor(255,255,255); doc.setFont("helvetica","bold");
        doc.text(`OVERALL STATUS: ${health.label}`,M+30,y+7.5,{align:"center"});
        y+=18;
      }

      sHead("EVM PERFORMANCE METRICS");
      doc.autoTable({
        startY:y, margin:{left:M,right:M},
        head:[["Metric","Value","Formula","Status"]],
        body:[
          ["% Complete (EV/BAC)",              evm?fmt(evm.pct,1)+"%":"—", "EV÷BAC×100",         ""],
          ["CPI — Cost Performance Index",     evm?fmt(evm.cpi):"—",       "EV÷AC",              evm?.cpi>=1?"Under Budget ✓":"Over Budget ✗"],
          ["SPI — Schedule Performance Index", evm?fmt(evm.spi):"—",       "EV÷PV",              evm?.spi>=1?"Ahead ✓":"Behind ✗"],
          ["TCPI — To-Complete Perf. Index",   evm?fmt(evm.tcpi):"—",      "(BAC−EV)÷(BAC−AC)",  evm?.tcpi<=1.1?"Achievable ✓":"Recovery Needed ✗"],
          ["CV — Cost Variance",               evm?fmtC(evm.cv):"—",       "EV−AC",              evm?.cv>=0?"Favorable ✓":"Unfavorable ✗"],
          ["SV — Schedule Variance",           evm?fmtC(evm.sv):"—",       "EV−PV",              evm?.sv>=0?"Favorable ✓":"Unfavorable ✗"],
          ["VAC — Variance at Completion",     evm?fmtC(evm.vac):"—",      "BAC−EAC",            evm?.vac>=0?"Under Budget ✓":"Over Budget ✗"],
          ["BAC — Budget at Completion",       evm?fmtC(evm.bac):"—",      "Approved total",     ""],
          ["EAC — Estimate at Completion",     evm?fmtC(evm.eac):"—",      "AC+(BAC−EV)÷CPI",    ""],
          ["ETC — Estimate to Complete",       evm?fmtC(evm.etc):"—",      "(BAC−EV)÷CPI",       ""],
          ...(evm?.estDur?[["Estimated Total Duration",fmt(evm.estDur,0)+" days","Planned÷SPI",""]]:[] ),
          ...(evm?.remDays!==null?[["Remaining Days (Forecast)",fmt(evm.remDays,0)+" days","Est−Elapsed",""]]:[] ),
        ],
        styles:{fontSize:8.5,cellPadding:2.5,textColor:[30,30,30]},
        headStyles:{fillColor:[192,57,43],textColor:[255,255,255],fontStyle:"bold"},
        columnStyles:{0:{cellWidth:68,fontStyle:"bold"},1:{cellWidth:30},2:{cellWidth:42},3:{cellWidth:"auto"}},
        alternateRowStyles:{fillColor:[250,250,250]},
        theme:"grid",
      });
      y=doc.lastAutoTable.finalY+8;

      if(y>240){doc.addPage();pageHeader();y=18;}
      sHead("PMI PERFORMANCE INTERPRETATION");
      for(const item of interpretations){
        if(y>265){doc.addPage();pageHeader();y=18;}
        doc.setFillColor(244,244,244); doc.rect(M,y,W-M*2,6,"F");
        doc.setFontSize(8); doc.setFont("helvetica","bold"); doc.setTextColor(192,57,43);
        doc.text(item.label.toUpperCase(),M+2,y+4); y+=7;
        doc.setFont("helvetica","normal"); doc.setTextColor(50,50,50); doc.setFontSize(8.5);
        const lines=doc.splitTextToSize(item.text,W-M*2);
        doc.text(lines,M,y); y+=lines.length*4.5+5;
      }

      const n=doc.internal.getNumberOfPages();
      for(let i=1;i<=n;i++){
        doc.setPage(i);
        doc.setFillColor(240,240,240); doc.rect(0,285,W,12,"F");
        doc.setFontSize(7); doc.setTextColor(120,120,120); doc.setFont("helvetica","normal");
        doc.text("Baumann & Associates Consulting Ltd. · Vancouver, BC, Canada",M,291);
        doc.text(`PMI PMBOK® 7th Ed. · ANSI/EIA-748 · Page ${i} of ${n}`,W-M,291,{align:"right"});
      }
      doc.save(`BA_Project_Report_${saved.name.replace(/\s+/g,"_")}_${saved.reportDate||"export"}.pdf`);
    } catch(e){alert("PDF export failed: "+e.message);}
    setExporting(null);
  };

  // ═══════════════════════════════════════════════════════════
  // EXPORT: WORD
  // ═══════════════════════════════════════════════════════════
  const exportWord = async () => {
    setExporting("word");
    try {
      const rd=saved.reportDate||"";
      const rows=[
        ["% Complete (EV/BAC)",              evm?fmt(evm.pct,1)+"%":"—","EV÷BAC×100"],
        ["CPI — Cost Performance Index",     evm?fmt(evm.cpi):"—",      "EV÷AC"],
        ["SPI — Schedule Performance Index", evm?fmt(evm.spi):"—",      "EV÷PV"],
        ["TCPI — To-Complete Perf. Index",   evm?fmt(evm.tcpi):"—",     "(BAC−EV)÷(BAC−AC)"],
        ["CV — Cost Variance",               evm?fmtC(evm.cv):"—",      "EV−AC"],
        ["SV — Schedule Variance",           evm?fmtC(evm.sv):"—",      "EV−PV"],
        ["VAC — Variance at Completion",     evm?fmtC(evm.vac):"—",     "BAC−EAC"],
        ["BAC — Budget at Completion",       evm?fmtC(evm.bac):"—",     "Approved total"],
        ["EAC — Estimate at Completion",     evm?fmtC(evm.eac):"—",     "AC+(BAC−EV)÷CPI"],
        ["ETC — Estimate to Complete",       evm?fmtC(evm.etc):"—",     "(BAC−EV)÷CPI"],
        ...(evm?.estDur?[["Estimated Total Duration",fmt(evm.estDur,0)+" days","Planned÷SPI"]]:[] ),
        ...(evm?.remDays!==null?[["Remaining Days",fmt(evm.remDays,0)+" days","Est−Elapsed"]]:[] ),
      ];
      const tr=([l,v,f])=>`<tr>
        <td style="background:#f4f4f4;font-weight:bold;padding:6px 10px;border:1px solid #ddd;width:44%">${l}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;width:20%">${v}</td>
        <td style="padding:6px 10px;border:1px solid #ddd;color:#555">${f}</td></tr>`;

      const html=`<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset='utf-8'><style>
body{font-family:Calibri,Arial,sans-serif;font-size:10pt;color:#111;margin:40px}
h2{font-size:13pt;color:#C0392B;border-bottom:2px solid #C0392B;padding-bottom:4px;margin:24px 0 10px}
table{width:100%;border-collapse:collapse;margin-bottom:14px}
th{background:#C0392B;color:white;padding:7px 10px;text-align:left}
.footer{margin-top:40px;font-size:8pt;color:#aaa;border-top:1px solid #eee;padding-top:8px}
</style></head><body>
<div style="background:#C0392B;color:white;padding:18px 24px;margin:-40px -40px 28px">
<div style="font-size:19pt;font-weight:bold;margin-bottom:4px">PROJECT PERFORMANCE REPORT</div>
<div style="font-size:9pt;opacity:0.85">Baumann &amp; Associates Consulting Ltd. &nbsp;·&nbsp; PMI PMBOK® Compliant &nbsp;·&nbsp; EVM Analysis</div>
</div>
<table style="margin-bottom:6px"><tr>
<td style="font-size:9pt;color:#555;width:120px">Report Date:</td>
<td style="font-size:10pt;font-weight:bold">${rd}</td>
${health?`<td style="text-align:right"><span style="background:${health.color};color:white;padding:4px 14px;border-radius:4px;font-weight:bold;font-size:10pt">${health.label}</span></td>`:""}
</tr></table>
<h2>Project Information</h2>
<table><tr><th style="width:40%">Field</th><th>Details</th></tr>
<tr><td style="background:#f4f4f4;font-weight:bold;padding:6px 10px;border:1px solid #ddd">Project Name</td><td style="padding:6px 10px;border:1px solid #ddd">${saved.name}</td></tr>
<tr><td style="background:#f4f4f4;font-weight:bold;padding:6px 10px;border:1px solid #ddd">Project Manager</td><td style="padding:6px 10px;border:1px solid #ddd">${saved.manager||"—"}</td></tr>
<tr><td style="background:#f4f4f4;font-weight:bold;padding:6px 10px;border:1px solid #ddd">Project Sponsor</td><td style="padding:6px 10px;border:1px solid #ddd">${saved.sponsor||"—"}</td></tr>
<tr><td style="background:#f4f4f4;font-weight:bold;padding:6px 10px;border:1px solid #ddd">Status</td><td style="padding:6px 10px;border:1px solid #ddd">${saved.status}</td></tr>
<tr><td style="background:#f4f4f4;font-weight:bold;padding:6px 10px;border:1px solid #ddd">Start Date</td><td style="padding:6px 10px;border:1px solid #ddd">${saved.startDate||"—"}</td></tr>
<tr><td style="background:#f4f4f4;font-weight:bold;padding:6px 10px;border:1px solid #ddd">Planned End Date</td><td style="padding:6px 10px;border:1px solid #ddd">${saved.plannedEndDate||"—"}</td></tr>
${saved.description?`<tr><td style="background:#f4f4f4;font-weight:bold;padding:6px 10px;border:1px solid #ddd">Description</td><td style="padding:6px 10px;border:1px solid #ddd">${saved.description}</td></tr>`:""}
</table>
<h2>EVM Performance Metrics</h2>
<table><tr><th style="width:44%">Metric</th><th style="width:20%">Value</th><th>Formula</th></tr>
${rows.map(tr).join("")}
</table>
<h2>PMI Performance Interpretation</h2>
${interpretations.map(i=>`<h3 style="color:#C0392B;font-size:11pt;margin:14px 0 4px">${i.label}</h3><p style="margin:0 0 8px;font-size:10pt;line-height:1.6">${i.text}</p>`).join("")}
<div class="footer">Baumann and Associates Consulting Ltd. &nbsp;·&nbsp; Vancouver, BC, Canada<br/>Formulas per PMI PMBOK® Guide 7th Edition &nbsp;·&nbsp; ANSI/EIA-748 EVM Standard</div>
</body></html>`;

      const blob=new Blob([html],{type:"application/msword"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url; a.download=`BA_Project_Report_${saved.name.replace(/\s+/g,"_")}_${rd||"export"}.doc`;
      a.click(); URL.revokeObjectURL(url);
    } catch(e){alert("Word export failed: "+e.message);}
    setExporting(null);
  };

  // ─── Styles ────────────────────────────────────────────────────────────────
  const S = {
    app:      {minHeight:"100vh",background:B.navy,fontFamily:"'Jost',sans-serif",color:B.white,overflowX:"hidden"},
    topbar:   {background:"linear-gradient(90deg,#F4F4F4,#FFFFFF)",borderBottom:`1px solid ${B.border}`,padding:"0 40px",display:"flex",alignItems:"center",justifyContent:"space-between",height:72,boxShadow:"0 2px 12px rgba(0,0,0,0.08)"},
    logoText: {fontFamily:"'Cormorant Garamond',serif",fontSize:20,fontWeight:400,color:B.white,lineHeight:1.2},
    logoSub:  {fontFamily:"'Jost',sans-serif",fontSize:9.5,color:B.gold,letterSpacing:"0.2em",textTransform:"uppercase",fontWeight:600},
    navBtn:   (a)=>({padding:"7px 20px",borderRadius:5,border:a?`1px solid ${B.gold}`:`1px solid ${B.border}`,background:a?"rgba(192,57,43,0.08)":"transparent",color:a?B.gold:B.slate,fontFamily:"'Jost',sans-serif",fontSize:11,cursor:"pointer",letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:500,transition:"all 0.2s"}),
    hero:     {background:"linear-gradient(135deg,#F0F0F0,#FFFFFF 60%,#F8F8F8)",borderBottom:`1px solid ${B.border}`,padding:"36px 40px 32px",position:"relative",overflow:"hidden"},
    main:     {maxWidth:1080,margin:"0 auto",padding:"36px 40px 80px"},
    formGrid: {display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:16},
    grid3:    {display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14},
    grid2:    {display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:14},
    infoBox:  {background:`linear-gradient(160deg,${B.navyMid},${B.navy})`,border:`1px solid ${B.border}`,borderRadius:10,padding:"20px 24px",boxShadow:"0 2px 12px rgba(0,0,0,0.05)"},
    hint:     {background:"rgba(192,57,43,0.04)",border:"1px solid rgba(192,57,43,0.15)",borderRadius:8,padding:"12px 16px",fontFamily:"'Jost',sans-serif",fontSize:12,color:"#555",lineHeight:1.7,marginBottom:18},
    genBtn:   {marginTop:28,padding:"13px 40px",background:`linear-gradient(135deg,${B.gold},#8B1A10)`,border:"none",borderRadius:7,color:"#fff",fontFamily:"'Jost',sans-serif",fontSize:12,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:700,cursor:"pointer",boxShadow:"0 4px 18px rgba(192,57,43,0.3)"},
    progTrack:{height:6,borderRadius:3,background:"rgba(0,0,0,0.06)",overflow:"hidden",marginTop:8},
    footer:   {borderTop:`1px solid ${B.border}`,marginTop:60,paddingTop:24,fontFamily:"'Jost',sans-serif",fontSize:11,color:"#AAAAAA",display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8},
    expBtn:   (col,dis)=>({display:"flex",alignItems:"center",gap:8,padding:"10px 20px",borderRadius:7,border:`1px solid ${col}44`,background:dis?"#eee":`${col}10`,color:dis?"#aaa":col,fontFamily:"'Jost',sans-serif",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",fontWeight:600,cursor:dis?"not-allowed":"pointer",opacity:dis?0.6:1,transition:"all 0.2s"}),
  };

  return (
    <div style={S.app}>
      {/* Top Bar */}
      <div style={S.topbar}>
        <div style={{display:"flex",alignItems:"center",gap:16}}>
          <div>
            <div style={S.logoText}>Baumann <span style={{color:B.gold}}>&</span> Associates</div>
            <div style={S.logoSub}>Project Management Consulting</div>
          </div>
          <div style={{width:1,height:32,background:B.border,margin:"0 16px"}}/>
          <div style={{fontFamily:"'Jost',sans-serif",fontSize:11,color:B.slate,letterSpacing:"0.15em",textTransform:"uppercase"}}>Project Performance Dashboard</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button style={S.navBtn(view==="input")} onClick={()=>setView("input")}>◎ Parameters</button>
          <button style={S.navBtn(view==="dashboard")} onClick={()=>saved&&setView("dashboard")} disabled={!saved}>▦ Dashboard</button>
        </div>
      </div>

      {/* Hero */}
      <div style={S.hero}>
        <div style={{position:"absolute",right:0,top:0,bottom:0,width:320,background:"linear-gradient(135deg,transparent 40%,rgba(192,57,43,0.04))",pointerEvents:"none"}}/>
        <div style={{position:"absolute",right:40,top:"50%",transform:"translateY(-50%)",opacity:0.04,fontSize:120,fontFamily:"'Cormorant Garamond',serif",fontWeight:300,userSelect:"none"}}>EVM</div>
        <div style={{maxWidth:1080,margin:"0 auto"}}>
          <div style={{fontSize:10,color:B.gold,letterSpacing:"0.18em",textTransform:"uppercase",fontWeight:600,marginBottom:10,fontFamily:"'Jost',sans-serif"}}>PMI PMBOK® · ANSI/EIA-748 · Earned Value Management</div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(28px,4vw,44px)",fontWeight:300,margin:0,lineHeight:1.15,color:B.white}}>Project <span style={{color:B.gold}}>Performance</span> Intelligence</h1>
          <p style={{fontFamily:"'Jost',sans-serif",fontSize:12,color:B.slate,marginTop:8,letterSpacing:"0.06em"}}>Real-time EVM analysis · Cost & Schedule performance · Completion forecasting · PMI-compliant reporting</p>
        </div>
      </div>

      <div style={S.main}>

        {/* ══ INPUT ══ */}
        {view==="input"&&(<>
          <div style={{marginBottom:36}}>
            <SectionHead title="Project Information"/>
            <div style={S.formGrid}>
              <Field label="Project Name *" name="name" value={project.name} onChange={onChange} span={2} hint={errors.name?"Required":""}/>
              <Field label="Project Manager" name="manager" value={project.manager} onChange={onChange}/>
              <Field label="Project Sponsor" name="sponsor" value={project.sponsor} onChange={onChange}/>
              <Field label="Project Status" name="status" value={project.status} onChange={onChange} options={STATUSES}/>
              <Field label="Start Date" name="startDate" type="date" value={project.startDate} onChange={onChange}/>
              <Field label="Planned End Date" name="plannedEndDate" type="date" value={project.plannedEndDate} onChange={onChange}/>
              <Field label="Report Date" name="reportDate" type="date" value={project.reportDate} onChange={onChange}/>
              <Field label="Project Description" name="description" value={project.description} onChange={onChange} span={3}/>
            </div>
          </div>

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
              {[{k:"bac",l:"BAC — Budget at Completion ($)",h:"Total approved budget"},{k:"pv",l:"PV — Planned Value ($)",h:"Scheduled budget to date"},{k:"ev",l:"EV — Earned Value ($)",h:"Value of work completed"},{k:"ac",l:"AC — Actual Cost ($)",h:"Actual spend to date"}].map(({k,l,h})=>(
                <Field key={k} label={l+" *"} name={k} type="number" value={project[k]} onChange={onChange} hint={errors[k]?"Required":h}/>
              ))}
            </div>
          </div>

          <div style={{marginBottom:36}}>
            <SectionHead title="Schedule Parameters"/>
            <div style={{...S.formGrid,gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))"}}>
              <Field label="Original Planned Duration (days)" name="plannedDuration" type="number" value={project.plannedDuration} onChange={onChange}/>
              <Field label="Elapsed Days to Date" name="elapsedDays" type="number" value={project.elapsedDays} onChange={onChange}/>
            </div>
          </div>

          {Object.keys(errors).length>0&&<div style={{color:B.red,fontFamily:"'Jost',sans-serif",fontSize:12,marginBottom:12}}>▲ Please complete all required fields marked with *</div>}
          <button style={S.genBtn} onClick={handleGenerate}>Generate Dashboard →</button>
        </>)}

        {/* ══ DASHBOARD ══ */}
        {view==="dashboard"&&saved&&(<>

          {/* Header card */}
          <div style={{...S.infoBox,marginBottom:28,display:"flex",flexWrap:"wrap",gap:20,alignItems:"center",justifyContent:"space-between"}}>
            <div style={{flex:1,minWidth:260}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:28,fontWeight:400,color:B.white,lineHeight:1.15,marginBottom:6}}>{saved.name}</div>
              <div style={{fontFamily:"'Jost',sans-serif",fontSize:12,color:B.slate,lineHeight:1.8}}>
                {saved.manager&&<><span style={{color:"#888"}}>PM:</span> <span style={{color:B.slateLight}}>{saved.manager}</span>&emsp;</>}
                {saved.sponsor&&<><span style={{color:"#888"}}>Sponsor:</span> <span style={{color:B.slateLight}}>{saved.sponsor}</span>&emsp;</>}
                {saved.startDate&&<><span style={{color:"#888"}}>Start:</span> <span style={{color:B.slateLight}}>{saved.startDate}</span>&emsp;</>}
                {saved.plannedEndDate&&<><span style={{color:"#888"}}>End:</span> <span style={{color:B.slateLight}}>{saved.plannedEndDate}</span>&emsp;</>}
                {saved.reportDate&&<><span style={{color:"#888"}}>Report Date:</span> <span style={{color:B.gold,fontWeight:600}}>{saved.reportDate}</span></>}
              </div>
              {saved.description&&<div style={{fontFamily:"'Jost',sans-serif",fontSize:12,color:"#888",marginTop:6}}>{saved.description}</div>}
            </div>
            <div style={{display:"flex",gap:12,flexShrink:0}}>
              {health&&(
                <div style={{background:`${health.color}18`,border:`1px solid ${health.color}40`,borderRadius:8,padding:"12px 22px",textAlign:"center",minWidth:90}}>
                  <div style={{fontSize:18,color:health.color}}>{health.icon}</div>
                  <div style={{fontFamily:"'Jost',sans-serif",fontSize:10,color:health.color,letterSpacing:"0.12em",marginTop:4,fontWeight:600}}>{health.label}</div>
                </div>
              )}
              <div style={{background:`${statusMeta[saved.status].color}18`,border:`1px solid ${statusMeta[saved.status].color}40`,borderRadius:8,padding:"12px 22px",textAlign:"center",minWidth:90}}>
                <div style={{fontFamily:"'Jost',sans-serif",fontSize:10,color:"#888",letterSpacing:"0.12em",marginBottom:4,fontWeight:600}}>STATUS</div>
                <div style={{fontFamily:"'Jost',sans-serif",fontSize:11,color:statusMeta[saved.status].color,letterSpacing:"0.1em",fontWeight:600}}>{statusMeta[saved.status].label}</div>
              </div>
            </div>
          </div>

          {/* ── Export Bar ── */}
          <div style={{...S.infoBox,marginBottom:28,padding:"16px 24px"}}>
            <div style={{display:"flex",alignItems:"center",flexWrap:"wrap",gap:12}}>
              <div style={{fontFamily:"'Jost',sans-serif",fontSize:10,color:B.slate,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600,marginRight:4}}>Export Snapshot:</div>
              <button style={S.expBtn("#2A7A4B",!!exporting)} onClick={exportExcel} disabled={!!exporting}>
                {exporting==="excel"?"Generating…":"⬇ Excel (.xlsx)"}
              </button>
              <button style={S.expBtn("#C0392B",!!exporting)} onClick={exportPDF} disabled={!!exporting}>
                {exporting==="pdf"?"Generating…":"⬇ PDF (.pdf)"}
              </button>
              <button style={S.expBtn("#1A5FA8",!!exporting)} onClick={exportWord} disabled={!!exporting}>
                {exporting==="word"?"Generating…":"⬇ Word (.doc)"}
              </button>
              {exporting&&<div style={{fontFamily:"'Jost',sans-serif",fontSize:11,color:B.amber,marginLeft:4}}>⟳ Preparing {exporting} file…</div>}
            </div>
          </div>

          {evm?(<>
            {/* % Complete */}
            <div style={{...S.infoBox,marginBottom:24}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",marginBottom:6}}>
                <div style={{fontFamily:"'Jost',sans-serif",fontSize:10,color:B.slate,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600}}>Schedule % Complete <span style={{color:"#aaa"}}>(EV / BAC)</span></div>
                <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,color:B.gold}}>{fmt(evm.pct,1)}%</div>
              </div>
              <div style={S.progTrack}>
                <div style={{height:"100%",width:`${Math.min(evm.pct,100)}%`,background:`linear-gradient(90deg,${B.gold},${B.goldLight})`,borderRadius:3,transition:"width 1s ease"}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}>
                <div style={{fontFamily:"'Jost',sans-serif",fontSize:10,color:"#aaa"}}>EV: {fmtC(evm.ev)}</div>
                <div style={{fontFamily:"'Jost',sans-serif",fontSize:10,color:"#aaa"}}>BAC: {fmtC(evm.bac)}</div>
              </div>
            </div>

            {/* Indices */}
            <div style={{marginBottom:28}}>
              <SectionHead title="Performance Indices"/>
              <div style={S.grid2}>
                <MetricCard label="CPI — Cost Performance Index" rawValue={evm.cpi} value={fmt(evm.cpi)} sub="CPI = EV ÷ AC  ·  Values >1.0 = under-budget" gauge goodHigh color={indexColor(evm.cpi)}/>
                <MetricCard label="SPI — Schedule Performance Index" rawValue={evm.spi} value={fmt(evm.spi)} sub="SPI = EV ÷ PV  ·  Values >1.0 = ahead of schedule" gauge goodHigh color={indexColor(evm.spi)}/>
              </div>
              <div style={{marginTop:14}}>
                <MetricCard label="TCPI — To-Complete Performance Index" rawValue={evm.tcpi} value={fmt(evm.tcpi)} sub="Efficiency required on remaining work to meet BAC  ·  >1.1 = recovery needed" color={indexColor(evm.tcpi,false)}/>
              </div>
            </div>

            {/* Variances */}
            <div style={{marginBottom:28}}>
              <SectionHead title="Variance Analysis"/>
              <div style={S.grid3}>
                <MetricCard label="CV — Cost Variance" value={fmtC(evm.cv)} sub="EV − AC  ·  Negative = over budget" color={evm.cv>=0?B.green:B.red}/>
                <MetricCard label="SV — Schedule Variance" value={fmtC(evm.sv)} sub="EV − PV  ·  Negative = behind schedule" color={evm.sv>=0?B.green:B.red}/>
                <MetricCard label="VAC — Variance at Completion" value={fmtC(evm.vac)} sub="BAC − EAC  ·  Projected final surplus or deficit" color={evm.vac>=0?B.green:B.red}/>
              </div>
            </div>

            {/* Forecasts */}
            <div style={{marginBottom:28}}>
              <SectionHead title="Cost Forecasts & Projections"/>
              <div style={S.grid3}>
                <MetricCard label="BAC — Budget at Completion" value={fmtC(evm.bac)} sub="Original total approved budget" color={B.slateLight}/>
                <MetricCard label="EAC — Estimate at Completion" value={fmtC(evm.eac)} sub="AC + (BAC−EV)÷CPI  ·  Projected final cost" color={evm.eac<=evm.bac?B.green:B.red}/>
                <MetricCard label="ETC — Estimate to Complete" value={fmtC(evm.etc)} sub="Remaining cost forecast at current CPI" color={B.gold}/>
              </div>
              {evm.estDur!==null&&(
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14,marginTop:14}}>
                  <MetricCard label="Estimated Total Duration" value={`${fmt(evm.estDur,0)} days`} sub="Planned Duration ÷ SPI" color={B.amber}/>
                  {evm.remDays!==null&&<MetricCard label="Remaining Days (Forecast)" value={`${fmt(evm.remDays,0)} days`} sub="Estimated duration minus elapsed days" color={evm.remDays<=0?B.red:B.slateLight}/>}
                </div>
              )}
            </div>

            {/* Raw EVM table */}
            <div style={{marginBottom:28}}>
              <SectionHead title="EVM Data Summary"/>
              <div style={S.infoBox}>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))"}}>
                  {[["Planned Value (PV)",fmtC(evm.pv)],["Earned Value (EV)",fmtC(evm.ev)],["Actual Cost (AC)",fmtC(evm.ac)],["Budget at Completion (BAC)",fmtC(evm.bac)],["Estimate at Completion (EAC)",fmtC(evm.eac)],["Estimate to Complete (ETC)",fmtC(evm.etc)]].map(([k,v])=>(
                    <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"11px 6px",borderBottom:`1px solid ${B.borderSoft}`,fontFamily:"'Jost',sans-serif",fontSize:12}}>
                      <span style={{color:"#888"}}>{k}</span>
                      <span style={{color:B.slateLight,fontWeight:500}}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interpretation */}
            <div>
              <SectionHead title="PMI Performance Interpretation"/>
              <div style={S.infoBox}>
                <div style={{display:"flex",flexDirection:"column",gap:12}}>
                  {interpretations.map((item,i)=>(
                    <div key={i} style={{display:"flex",gap:14,padding:"12px 0",borderBottom:i<interpretations.length-1?`1px solid ${B.borderSoft}`:"none"}}>
                      <div style={{width:3,borderRadius:2,background:i===0?indexColor(evm.cpi):i===1?indexColor(evm.spi):i===2?(evm.vac>=0?B.green:B.red):indexColor(evm.tcpi,false),flexShrink:0,alignSelf:"stretch",minHeight:16}}/>
                      <div>
                        <div style={{fontFamily:"'Jost',sans-serif",fontSize:10,color:B.gold,letterSpacing:"0.14em",textTransform:"uppercase",fontWeight:600,marginBottom:4}}>{item.label}</div>
                        <div style={{fontFamily:"'Jost',sans-serif",fontSize:13,color:B.slateLight,lineHeight:1.65}}>{item.text}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </>):(
            <div style={{...S.infoBox,textAlign:"center",padding:"48px 24px"}}>
              <div style={{fontSize:40,marginBottom:12,opacity:0.3}}>◈</div>
              <div style={{fontFamily:"'Jost',sans-serif",color:B.slate,fontSize:14,marginBottom:20}}>EVM metrics unavailable — please ensure BAC, PV, EV, and AC contain valid numeric values.</div>
              <button style={S.genBtn} onClick={()=>setView("input")}>← Update Parameters</button>
            </div>
          )}

          <div style={S.footer}>
            <span>Baumann & Associates Consulting Ltd. · Vancouver, BC, Canada</span>
            <span>Formulas per PMI PMBOK® Guide 7th Ed. · ANSI/EIA-748 EVM Standard</span>
          </div>
        </>)}

      </div>
    </div>
  );
}
