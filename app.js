const ERP_PASSWORD = "Sakib";
const ERP_AUTH = "YARN_ERP_AUTH";

// আপনার কপি করা Google Apps Script-এর Web App URL
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzMNWCvOODQM9si4Lkw4zWUbEaoSgjMpKzYE5vCsAV6wU2kL5dO3DpoHwK8H8yKUrYwpw/exec";

function requirePassword(){
  if(sessionStorage.getItem(ERP_AUTH)==="1") return true;
  document.body.innerHTML='<div class="loginScreen"><div class="loginBox"><div class="loginLogo">SAG FASHON LTD</div><h2>Password Protected</h2><p>Enter password to open SAG FASHON LTD</p><form id="loginForm"><input id="erpPassword" type="password" autocomplete="off" placeholder="Password" autofocus><button type="submit">Open ERP</button><div id="loginError"></div></form></div></div>';
  document.getElementById("loginForm").onsubmit=e=>{e.preventDefault();if(document.getElementById("erpPassword").value===ERP_PASSWORD){sessionStorage.setItem(ERP_AUTH,"1");location.reload()}else{document.getElementById("loginError").textContent="Incorrect Password";document.getElementById("erpPassword").select()}};
  return false;
}
if(!requirePassword()) throw new Error("ERP locked");

const ADDITIONAL_FIELDS=["proformaInvoice","sourceBuyer","sourceOrder","buyer","order","customer","yarnBrand","lot","count","fiver","blandRatio","quality","color","workOrder","dyeingFactory","batch","yknc","knittingFactory","fabrication","gsm","mcD","fd"];

function createEmptyDataStructure() {
  const initAdd = {};
  ADDITIONAL_FIELDS.forEach(k => initAdd[k] = []);
  return {"raw":[],"dyed":[],"grey":[],"reqDyeing":[],"reqKnitting":[],"loose":[],"additional": initAdd};
}

let D = createEmptyDataStructure();
let edit = {};

function showStatus(message, isError = false) {
  let statusDiv = document.getElementById("erpStatus");
  if (!statusDiv) {
    statusDiv = document.createElement("div");
    statusDiv.id = "erpStatus";
    statusDiv.style.cssText = "position:fixed;bottom:15px;right:15px;padding:10px 18px;background:#0284c7;color:#fff;border-radius:6px;font-weight:bold;z-index:9999;box-shadow:0 4px 10px rgba(0,0,0,0.15);font-size:12px;";
    document.body.appendChild(statusDiv);
  }
  statusDiv.style.background = isError ? "#ef4444" : "#0284c7";
  statusDiv.style.display = "block";
  statusDiv.textContent = message;
  if (!isError) {
    setTimeout(() => { statusDiv.style.display = "none"; }, 3000);
  }
}

// Save Data to Google Sheet
async function saveToGoogleSheet() {
  showStatus("Saving to Google Sheets...");
  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify(D)
    });
    const resText = await response.text();
    if (resText.includes("SUCCESS")) {
      showStatus("Saved Successfully to Google Sheets!");
      return true;
    } else {
      showStatus("Save Failed!", true);
      return false;
    }
  } catch (err) {
    console.error("Save Error:", err);
    showStatus("Network Error: Not Saved!", true);
    return false;
  }
}

// Load Data from Google Sheet
async function loadFromGoogleSheet() {
  showStatus("Loading data from Google Sheets...");
  try {
    const response = await fetch(APPS_SCRIPT_URL);
    const textData = await response.text();
    if (textData && textData.trim() !== "") {
      const parsed = JSON.parse(textData);
      D = normalizeRestoredERP(parsed);
      postLoadProcess();
      showStatus("Data Loaded Successfully!");
      const curr = getPageState();
      go(curr.page, curr.sub);
    } else {
      showStatus("Google Sheet Ready.");
    }
  } catch (err) {
    console.error("Load Error:", err);
    showStatus("Load Failed!", true);
  }
}

async function save() {
  return await saveToGoogleSheet();
}

const F={
 raw:[
  ["date","Date","date"],["category","Category","select",["Grey Yarn","Lycra Yarn","Polyester Yarn"]],
  ["transaction","Transaction","select",["Raw Yarn Received From Spinning","Raw Yarn Return From Dyeing","Raw Yarn Return From Knitting","Raw Yarn Return From Re-Conning","Raw Yarn Delivery To Spinning","Raw Yarn Delivery To Dyeing","Raw Yarn Delivery To Knitting","Raw Yarn Delivery To Re-Conning","Raw Yarn Sale"]],
  ["invoice","Invoice","text"],["proformaInvoice","Proforma Invoice","text"],["sourceBuyer","Source Buyer","text"],["sourceOrder","Source Order","text"],["buyer","Buyer","text"],["order","Order","text"],["customer","Customer","text"],["yarnBrand","Yarn Brand","text"],["lot","Lot","text"],["count","Count","text"],["fiver","Fiver","text"],["blandRatio","Bland Ratios","text"],["quality","Quality","text"],["color","Colour","text"],["quantity","Quantity","number"],["remarks","Remarks","text"]
 ],
 dyed:[
  ["date","Date","date"],["category","Category","select",["Dyed Yarn"]],
  ["transaction","Transaction","select",["Dyed Yarn Received From Dyeing","Dyed Yarn Return From Knitting","Dyed Yarn Return From Re-Conning","Dyed Yarn Delivery To Dyeing","Dyed Yarn Delivery To Kintting","Dyed Yarn Delivery To Re-Conning","Dyed Yarn Sale"]],
  ["invoice","Invoice","text"],["workOrder","Work Order","text"],["buyer","Buyer","text"],["order","Order","text"],["customer","Customer","text"],["dyeingFactory","Dyeing Factory","text"],["batch","Batch","text"],["count","Count","text"],["fiver","Fiver","text"],["blandRatio","Bland Ratios","text"],["quality","Quality","text"],["color","Colour","text"],["quantity","Quantity","number"],["remarks","Remarks","text"]
 ],
 grey:[
  ["date","Date","date"],["category","Category","select",["Grey Fabrics"]],
  ["transaction","Transaction","select",["Grey Fabrics Received From Knitting","Grey Fabrics Return From Dyeing","Grey Fabrics Delivery To Knitting","Grey Fabrics Delivery To Dyeing","Grey Fabrics Sale"]],
  ["invoice","Invoice","text"],["yknc","YKNC","text"],["buyer","Buyer","text"],["order","Order","text"],["customer","Customer","text"],["knittingFactory","Knitting Factory","text"],["fabrication","Fabrication","text"],["gsm","GSM","text"],["mcD","MC / D","text"],["fd","F / D","text"],["color","Colour","text"],["quantity","Quantity","number"],["remarks","Remarks","text"]
 ],
 loose:[
  ["date","Date","date"],
  ["category","Category","select",["Loose Yarn"]],
  ["transaction","Transaction","select",["Loose Yarn Received Form Knitting","Loose Yarn Sale"]],
  ["yknc","YKNC","text"],["buyer","Buyer","text"],["order","Order","text"],["customer","Customer","text"],["yarnBrand","Yarn Brand","text"],["lot","Lot","text"],["count","Count","text"],["fiver","Fiver","text"],["blandRatio","Bland Ratio","text"],["quality","Quality","text"],["color","Colour","text"],["quantity","Quantity","number"],["remarks","Remarks","text"]
 ],
 reqDyeing:[["date","Date","date"],["buyer","Buyer","text"],["order","Order","text"],["quantity","Quantity","number"],["remarks","Remarks","text"]],
 reqKnitting:[["date","Date","date"],["buyer","Buyer","text"],["order","Order","text"],["quantity","Quantity","number"],["remarks","Remarks","text"]],
 additional:[
  ["proformaInvoice","Proforma Invoice","text"],["sourceBuyer","Source Buyer","text"],["sourceOrder","Source Order","text"],["buyer","Buyer","text"],["order","Order","text"],["customer","Customer","text"],["yarnBrand","Yarn Brand","text"],["lot","Lot","text"],["count","Count","text"],["fiver","Fiver","text"],["blandRatio","Bland Ratios","text"],["quality","Quality","text"],["color","Colour","text"],["workOrder","Work Order","text"],["dyeingFactory","Dyeing Factory","text"],["batch","Batch","text"],["yknc","YKNC","text"],["knittingFactory","Knitting Factory","text"],["fabrication","Fabrication","text"],["gsm","GSM","text"],["mcD","MC / D","text"],["fd","F / D","text"]
 ]
};

const titles={dashboard:"Dashboard",raw:"Raw Yarn Entry",dyed:"Dyed Yarn Entry",grey:"Grey Fabric Entry",loose:"Loose Yarn Entry",reqDyeing:"Requirement Entry (Dyeing)",reqKnitting:"Requirement Entry (Knitting)",additional:"Additional Info",stock:"Stock",statements:"Statements",backup:"Backup & Restore"};
const nav=[
 ["dashboard","Dashboard"],["raw","Raw Yarn Entry"],["dyed","Dyed Yarn Entry"],["grey","Grey Fabric Entry"],["loose","Loose Yarn Entry"],
 ["reqDyeing","Requirement Entry (Dyeing)"],["reqKnitting","Requirement Entry (Knitting)"],["additional","Additional Info"],["stock","Stock"],["statements","Statements"],["backup","Backup & Restore"]
];

function titleCaseText(v){return String(v??"").toLowerCase().replace(/(^|[\s\-\/()]+)([a-z])/g,(m,p,c)=>p+c.toUpperCase())}

function postLoadProcess(){
 if(!D || typeof D !== "object") D = createEmptyDataStructure();
 D.raw = Array.isArray(D.raw) ? D.raw : [];
 D.dyed = Array.isArray(D.dyed) ? D.dyed : [];
 D.grey = Array.isArray(D.grey) ? D.grey : [];
 D.reqDyeing = Array.isArray(D.reqDyeing) ? D.reqDyeing : [];
 D.reqKnitting = Array.isArray(D.reqKnitting) ? D.reqKnitting : [];
 D.loose = Array.isArray(D.loose) ? D.loose : [];

 if(!D.additional || typeof D.additional !== "object" || Array.isArray(D.additional)){
  D.additional = {};
 }
 ADDITIONAL_FIELDS.forEach(k => {
  if(!Array.isArray(D.additional[k])) D.additional[k] = [];
 });

 D.raw.forEach(r=>{if(r.proformaInvoice===undefined){r.proformaInvoice=r.invoice||"";r.invoice=""}});
 D.dyed.forEach(r=>{if(r.workOrder===undefined){r.workOrder=r.invoice||"";r.invoice=""}});
 D.grey.forEach(r=>{r.workOrder="";r.yknc=r.yknc||""});
 D.loose.forEach(r=>{r.category="Loose Yarn";r.transaction=r.transaction==="Loose Yarn Received From Knitting"?"Loose Yarn Received Form Knitting":(r.transaction==="Loose Yarn Sell"?"Loose Yarn Sale":(r.transaction||""));});
}

function esc(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function N(x){return Number(x||0)}

function allTextValues(field){
 const vals=[];
 if(D && D.additional && D.additional[field] && Array.isArray(D.additional[field])) {
   vals.push(...D.additional[field]);
 }
 return [...new Set(vals.map(titleCaseText).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}

function additionalOptionRows(field){
 const vals=(D && D.additional && Array.isArray(D.additional[field]))?[...D.additional[field]].reverse():[];
 return vals.map(v=>'<div class="savedOption"><span>'+esc(v)+'</span><button class="btn del" data-afield="'+field+'" data-avalue="'+encodeURIComponent(v)+'">Delete</button></div>').join("")||'<div class="empty">No Saved Values.</div>';
}

function additionalInfo(){
 const labels={proformaInvoice:"Proforma Invoice",sourceBuyer:"Source Buyer",sourceOrder:"Source Order",buyer:"Buyer",order:"Order",customer:"Customer",yarnBrand:"Yarn Brand",lot:"Lot",count:"Count",fiver:"Fiver",blandRatio:"Bland Ratios",quality:"Quality",color:"Colour",workOrder:"Work Order",dyeingFactory:"Dyeing Factory",batch:"Batch",yknc:"YKNC",knittingFactory:"Knitting Factory",fabrication:"Fabrication",gsm:"GSM",mcD:"MC / D",fd:"F / D"};
 const content = document.getElementById("content");
 if(!content) return;
 content.innerHTML='<div class="panel additionalPanel"><h2>Additional Info</h2><div class="additionalGrid">'+
 ADDITIONAL_FIELDS.map(k=>'<div class="additionalCard"><label>'+labels[k]+'</label><div class="additionalInputRow"><input type="text" id="add_'+k+'" autocomplete="off" placeholder="Enter '+labels[k]+'"><button class="btn addInfoBtn" data-addfield="'+k+'">Save</button></div><div class="additionalTools"><input class="additionalSearch" data-searchfield="'+k+'" placeholder="Search..." autocomplete="off"><button class="btn exportBtn additionalExport" data-exportfield="'+k+'">Download Excel</button></div><div class="savedOptions" id="saved_'+k+'">'+additionalOptionRows(k)+'</div></div>').join("")+'</div>';
 
 ADDITIONAL_FIELDS.forEach(k=>{
  const input=document.getElementById("add_"+k); 
  if(input) input.addEventListener("input",()=>input.value=titleCaseText(input.value));
  const search=document.querySelector('.additionalSearch[data-searchfield="'+k+'"]'); 
  if(search) search.addEventListener("input",()=>filterAdditionalValues(k,search.value));
 });

 content.querySelectorAll(".addInfoBtn").forEach(b=>{
  b.onclick = async ()=>{
   const k = b.dataset.addfield;
   const input = document.getElementById("add_"+k);
   const v = normalizeKeyValue(input.value);
   if(!v){alert("Please Enter A Value.");return;}
   
   if(!Array.isArray(D.additional[k])) D.additional[k] = [];
   if(!D.additional[k].includes(v)){
     D.additional[k].push(v);
   }
   D.additional[k] = [...new Set(D.additional[k])];
   
   await save();
   if(input) input.value = "";
   additionalInfo();
  };
 });

 content.querySelectorAll(".savedOptions .del").forEach(b=>{
  b.onclick = async ()=>{
   const k=b.dataset.afield,v=decodeURIComponent(b.dataset.avalue);
   if(confirm('Delete "'+v+'"?')){
     D.additional[k]=D.additional[k].filter(x=>x!==v);
     await save();
     additionalInfo();
   }
  };
 });
}

function filterAdditionalValues(field,query){
 const q=String(query||"").trim().toLowerCase(),box=document.getElementById("saved_"+field); if(!box)return;
 const vals=allTextValues(field).filter(v=>!q||String(v).toLowerCase().includes(q));
 box.innerHTML=vals.map(v=>'<div class="savedOption"><span>'+esc(v)+'</span><button class="btn del" data-afield="'+field+'" data-avalue="'+encodeURIComponent(v)+'">Delete</button></div>').join("")||'<div class="empty">No Matching Values.</div>';
 box.querySelectorAll(".del").forEach(b=>b.onclick=async ()=>{const k=b.dataset.afield,v=decodeURIComponent(b.dataset.avalue);if(confirm('Delete "'+v+'"?')){D.additional[k]=D.additional[k].filter(x=>x!==v);await save();additionalInfo();}});
}

function normalizeKeyValue(v){return titleCaseText(String(v??"").trim()).replace(/\s+/g," ")}

function validateAgainstAdditionalInfo(t,o){
 if(t==="additional")return true;
 const errors=[];
 (F[t]||[]).forEach(f=>{
  const name=f[0],value=normalizeKeyValue(o[name]);
  if(!ADDITIONAL_FIELDS.includes(name)||!value)return;
  const allowed=allTextValues(name).map(normalizeKeyValue);
  if(!allowed.includes(value))errors.push(f[1]+': "'+value+'"');
 });
 if(errors.length){alert("Entry Not Saved!\n\nThe Following Value(s) Are Not Available In Additional Info:\n\n"+errors.join("\n")+"\n\nPlease Save These Values In Additional Info First.");return false}
 return true;
}

function normalizeAdditionalData(value){
 const out={}; ADDITIONAL_FIELDS.forEach(k=>out[k]=[]);
 if(value&&!Array.isArray(value)&&typeof value==="object"){
  ADDITIONAL_FIELDS.forEach(k=>{const v=value[k];if(Array.isArray(v))out[k]=v.map(x=>String(x??"")).filter(x=>x!=="");else if(v!==undefined&&v!==null&&String(v)!=="")out[k]=[String(v)]});
 }
 ADDITIONAL_FIELDS.forEach(k=>out[k]=[...new Set(out[k])]); return out;
}

function normalizeRestoredERP(value){
 if(!value||typeof value!=="object"||Array.isArray(value)) return createEmptyDataStructure();
 const out=JSON.parse(JSON.stringify(value));
 ["raw","dyed","grey","loose","reqDyeing","reqKnitting"].forEach(k=>{if(!Array.isArray(out[k]))out[k]=[]});
 out.additional=normalizeAdditionalData(out.additional);
 if(Array.isArray(out.loose)) out.loose.forEach(r=>{r.category="Loose Yarn"});
 return out;
}

const PAGE_STATE_KEY="YARN_ERP_PAGE_STATE";
function setPageState(page,sub=""){
 const state=JSON.stringify({page,sub:sub||""});
 try{sessionStorage.setItem(PAGE_STATE_KEY,state)}catch(e){}
}
function getPageState(){
 try{const x=JSON.parse(sessionStorage.getItem(PAGE_STATE_KEY)||"");if(x&&titles[x.page])return x}catch(e){}
 return {page:"dashboard",sub:""}
}

function go(p,sub=""){
 setPageState(p,sub); 
 const titleElem = document.getElementById("title");
 if(titleElem) titleElem.textContent=titles[p] || "Dashboard";
 if(p==="dashboard")dash(); 
 else if(p==="additional")additionalInfo(); 
 else if(["raw","dyed","grey","loose","reqDyeing","reqKnitting"].includes(p))entry(p);
 else if(p==="stock"){if(sub&&["raw","dyed","grey","loose"].includes(sub))stock(sub);else stockMenu()}
 else if(p==="backup")backupRestoreMenu(); 
 else statementMenu(sub);
}

function renderNav() {
 const navContainer = document.getElementById("nav");
 if(!navContainer) return;
 navContainer.innerHTML = "";
 nav.forEach(([p,t])=>{
   let b=document.createElement("button");
   b.textContent=t;
   b.onclick=()=>go(p);
   navContainer.appendChild(b);
 });
}

function entry(t){
 let fs=F[t] || [];
 const content = document.getElementById("content");
 if(!content) return;
 content.innerHTML='<div class="entryPage"><div class="panel entryFormPanel"><h2>'+titles[t]+'</h2>'+'<form id="f" class="form">'+fs.map(f=>'<div class="field '+(f[0]==="remarks"?"wide":"")+'"><label>'+f[1]+'</label>'+fieldHTML(f)+'</div>').join("")+'<div class="actions"><button class="btn">Save</button></div></form></div><div class="panel entryDataPanel"><div class="exportBar"><input id="entrySearch" class="tableSearch" placeholder="Search..." autocomplete="off"><button class="btn" id="entrySearchBtn">Search</button><button class="btn" id="entryClearBtn">Clear</button><button class="btn exportBtn" id="entryExport">Download Excel</button></div><div id="tbl"></div></div></div>';
 const form=document.getElementById("f");
 if(form){
   form.onsubmit=async e=>{
    e.preventDefault(); let o=Object.fromEntries(new FormData(form));
    fs.forEach(z=>{if(z[2]==="text"&&o[z[0]]!==undefined)o[z[0]]=titleCaseText(o[z[0]])});
    if(t==="loose"){o.category="Loose Yarn";o.transaction=String(o.transaction||"").trim()}
    const missing=fs.filter(z=>z[0]!=="remarks"&&!String(o[z[0]]??"").trim()).map(z=>z[1]);
    if(missing.length){alert("Entry Not Saved!\n\nPlease Fill In The Following Required Field(s):\n\n"+missing.join("\n"));return}
    if(!validateAgainstAdditionalInfo(t,o))return;
    o.id=edit[t]||Date.now();
    D[t]=edit[t]?D[t].map(x=>x.id==o.id?o:x):[...D[t],o]; delete edit[t]; 
    
    await save();
    entry(t);
   };
 }
 renderTable(t);
}

function fieldHTML(f){
 const [name,label,type,opts]=f;
 if(type==="select"){
  const extra=name==="category"||name==="transaction"?[]:allTextValues(name);
  const choices=[...new Set([...(opts||[]),...extra])];
  const fixed=(name==="category"||name==="transaction")&&choices.length===1;
  return '<select name="'+name+'"'+(fixed?' class="fixedField"':'')+'>'+(!fixed?'<option></option>':"")+choices.map(x=>'<option>'+titleCaseText(x)+'</option>').join("")+'</select>';
 }
 const dl=type==="text"?' list="list_'+name+'"':"";
 return '<input name="'+name+'" type="'+type+'" step="0.01" autocomplete="off"'+dl+'>'+(type==="text"?'<datalist id="list_'+name+'">'+allTextValues(name).map(v=>'<option value="'+esc(v)+'"></option>').join("")+'</datalist>':"");
}

function renderTable(t){
 let fs=F[t] || [],qi=fs.findIndex(f=>f[0]==="quantity");
 const tbl = document.getElementById("tbl");
 if(!tbl) return;
 const list = Array.isArray(D[t]) ? D[t] : [];
 tbl.innerHTML='<div class="tableWrap dataScroll"><table id="entryTable"><thead><tr>'+fs.map(f=>'<th>'+titleCaseText(f[1])+'</th>').join("")+'<th>Actions</th></tr></thead><tbody>'+[...list].reverse().map(r=>'<tr>'+fs.map(f=>'<td>'+esc(f[0]==="quantity"?formatQty(r[f[0]]):r[f[0]])+'</td>').join("")+'<td><button type="button" class="btn rowEdit" data-key="'+esc(t)+'" data-id="'+esc(String(r.id))+'">Edit</button> <button type="button" class="btn del rowDelete" data-key="'+esc(t)+'" data-id="'+esc(String(r.id))+'">Delete</button></td></tr>').join("")+'</tbody><tfoot><tr class="subtotalRow">'+fs.map((f,i)=>'<td data-subtotal-col="'+i+'">'+(i===0?"Subtotal":(i===qi?"0.00":""))+'</td>').join("")+'<td></td></tr></tfoot></table></div>';
 const entryTable = document.getElementById("entryTable");
 if(entryTable) {
   entryTable.dataset.subtotalCols=String(qi); 
   updateTableSubtotals("entryTable",[qi]);
 }
}

function formatQty(x){const n=Number(x);return Number.isFinite(n)?n.toFixed(2):"0.00"}
function updateTableSubtotals(tableId,qtyCols){
 const table=document.getElementById(tableId);if(!table)return;const totals={};qtyCols.forEach(i=>totals[i]=0);
 table.querySelectorAll("tbody tr").forEach(tr=>{if(tr.style.display==="none")return;qtyCols.forEach(i=>{const n=parseFloat(String(tr.cells[i]?.textContent||"").replace(/,/g,""));if(Number.isFinite(n))totals[i]+=n})});
 qtyCols.forEach(i=>{const c=table.querySelector('tfoot [data-subtotal-col="'+i+'"]');if(c)c.textContent=formatQty(totals[i])});
}

function editRow(t,id){let r=D[t].find(x=>String(x.id)===String(id));if(!r)return;edit[t]=r.id;F[t].forEach(f=>{let e=document.querySelector('[name="'+f[0]+'"]');if(e)e.value=r[f[0]]||""})}
async function delRow(t,id){if(confirm("Delete this entry?")){D[t]=D[t].filter(x=>String(x.id)!==String(id));await save();entry(t)}}

document.addEventListener("click",e=>{
 const editBtn=e.target.closest(".rowEdit");
 if(editBtn){editRow(editBtn.dataset.key,editBtn.dataset.id);return}
 const delBtn=e.target.closest(".rowDelete");
 if(delBtn){delRow(delBtn.dataset.key,delBtn.dataset.id);return}
});

const STOCK_RECEIVE={
 raw:new Set(["GREY YARN RECEIVED FROM SPINNING","GREY YARN RETURN FROM DYEING","GREY YARN RETURN FROM KNITTING","GREY YARN RETURN FROM RE-CONNING"]),
 dyed:new Set(["DYED YARN RECEIVED FROM DYEING","DYED YARN RETURN FROM KNITTING","DYED YARN RETURN FROM RE-CONNING"]),
 grey:new Set(["GREY FABRICS RECEIVED FROM KNITTING","GREY FABRICS RETURN FROM DYEING"]),
 loose:new Set(["LOOSE YARN RECEIVED FORM KNITTING"])
};
const STOCK_DELIVERY={
 raw:new Set(["GREY YARN DELIVERY TO SPINNING","GREY YARN DELIVERY TO DYEING","GREY YARN DELIVERY TO KNITTING","GREY YARN DELIVERY TO RE-CONNING","GREY YARN SALE"]),
 dyed:new Set(["DYED YARN DELIVERY TO DYEING","DYED YARN DELIVERY TO KINTTING","DYED YARN DELIVERY TO RE-CONNING","DYED YARN SALE"]),
 grey:new Set(["GREY FABRICS DELIVERY TO KNITTING","GREY FABRICS DELIVERY TO DYEING","GREY FABRIC SALE"]),
 loose:new Set(["LOOSE YARN SALE"])
};
function stockType(t,tr){const x=String(tr||"").trim().toUpperCase();if(STOCK_RECEIVE[t] && STOCK_RECEIVE[t].has(x))return "received";if(STOCK_DELIVERY[t] && STOCK_DELIVERY[t].has(x))return "delivered";return ""}
function stockFields(t){
 if(t==="raw")return ["category","proformaInvoice","sourceBuyer","sourceOrder","yarnBrand","lot","count","fiver","blandRatio","quality","color"];
 if(t==="dyed")return ["category","workOrder","buyer","order","dyeingFactory","batch","count","fiver","blandRatio","quality","color"];
 if(t==="loose")return ["category","yknc","buyer","order","yarnBrand","lot","count","fiver","blandRatio","quality","color"];
 return ["category","yknc","buyer","order","knittingFactory","fabrication","gsm","mcD","fd","color"];
}
function primaryReceivedTransaction(t){
 if(t==="raw")return "GREY YARN RECEIVED FROM SPINNING";
 if(t==="dyed")return "DYED YARN RECEIVED FROM DYEING";
 if(t==="loose")return "LOOSE YARN RECEIVED FORM KNITTING";
 return "GREY FABRICS RECEIVED FROM KNITTING";
}
function groups(t){
 const fs=stockFields(t),m={},primaryReceive=primaryReceivedTransaction(t);
 const list = Array.isArray(D[t]) ? D[t] : [];
 list.forEach(r=>{
  const typ=stockType(t,r.transaction);if(!typ)return;
  const tr=String(r.transaction||"").trim().toUpperCase(),k=fs.map(x=>String(r[x]??"").trim().toLowerCase()).join("|");
  if(!m[k])m[k]={r:{...r},received:0,delivery:0,returnQty:0,receivedDate:""};
  if(STOCK_RECEIVE[t] && STOCK_RECEIVE[t].has(tr)){
   if(tr===primaryReceive){const d=String(r.date??"").trim();if(d&&(!m[k].receivedDate||d<m[k].receivedDate))m[k].receivedDate=d;m[k].received+=N(r.quantity)}
   else if(tr.includes("RETURN FROM"))m[k].returnQty+=N(r.quantity);
   else m[k].received+=N(r.quantity);
  }else if(STOCK_DELIVERY[t] && STOCK_DELIVERY[t].has(tr))m[k].delivery+=N(r.quantity);
 });
 return Object.values(m).map(x=>({...x,r:{...x.r,receivedDate:x.receivedDate},balance:x.received+x.returnQty-x.delivery}));
}

function dash(){
 const cards=[["Raw Yarn Stock","raw"],["Dyed Yarn Stock","dyed"],["Grey Fabrics Stock","grey"],["Loose Yarn Stock","loose"]];
 const rawGroups=groups("raw"),rawTotal=rawGroups.reduce((a,z)=>a+z.balance,0);
 const rawCats=["Grey Yarn","Lycra Yarn","Polyester Yarn"].map(cat=>{const total=rawGroups.filter(z=>String(z.r.category||"").trim().toLowerCase()===cat.toLowerCase()).reduce((a,z)=>a+z.balance,0);return '<div class="rawCategoryStock"><span>'+cat+'</span><strong>'+total.toFixed(2)+'</strong></div>'}).join("");
 const content = document.getElementById("content");
 if(!content) return;
 content.innerHTML='<div class="cards"><div class="card rawStockCard" onclick="go(\'stock\',\'raw\')"><b>Raw Yarn Stock</b><strong>'+rawTotal.toFixed(2)+' KG</strong><div class="rawCategoryList">'+rawCats+'</div></div>'+cards.slice(1).map(x=>'<div class="card" onclick="go(\'stock\',\''+x[1]+'\')"><b>'+x[0]+'</b><strong>'+groups(x[1]).reduce((a,z)=>a+z.balance,0).toFixed(2)+' KG</strong></div>').join("")+'</div>';
}

function stockMenu(){
 const content = document.getElementById("content");
 if(!content) return;
 content.innerHTML='<div class="choices"><button class="choice" onclick="go(\'stock\',\'raw\')">Raw Yarn Stock</button><button class="choice" onclick="go(\'stock\',\'dyed\')">Dyed Yarn Stock</button><button class="choice" onclick="go(\'stock\',\'grey\')">Grey Fabrics Stock</button><button class="choice" onclick="go(\'stock\',\'loose\')">Loose Yarn Stock</button></div><div class="panel" id="sv">Select Stock.</div>';
}

function stock(t){
 setPageState("stock",t);
 const fs=stockFields(t),rs=groups(t),title={raw:"Raw Yarn Stock",dyed:"Dyed Yarn Stock",grey:"Grey Fabrics Stock",loose:"Loose Yarn Stock"}[t];
 const sv = document.getElementById("sv");
 if(!sv) return;
 sv.innerHTML='<div class="exportBar"><input id="stockSearch" class="tableSearch" placeholder="Search..." autocomplete="off"><button class="btn" id="stockSearchBtn">Search</button><button class="btn" id="stockClearBtn">Clear</button><button class="btn exportBtn" id="stockExport">Download Excel</button></div><h2>'+title+'</h2><div class="tableWrap dataScroll"><table id="stockTable"><thead><tr><th>Received Date</th>'+fs.map(x=>'<th>'+titleCaseText(x)+'</th>').join("")+'<th>Total Received</th><th>Total Delivery</th><th>Balance</th></tr></thead><tbody>'+rs.map(x=>'<tr><td>'+esc(x.receivedDate||"")+'</td>'+fs.map(k=>'<td>'+esc(x.r[k])+'</td>').join("")+'<td>'+formatQty(x.received)+'</td><td>'+formatQty(x.delivery)+'</td><td>'+formatQty(x.balance)+'</td></tr>').join("")+'</tbody><tfoot><tr class="subtotalRow"><td>Subtotal</td>'+fs.map(()=>'<td></td>').join("")+'<td data-subtotal-col="'+(fs.length+1)+'">0.00</td><td data-subtotal-col="'+(fs.length+2)+'">0.00</td><td data-subtotal-col="'+(fs.length+3)+'">0.00</td></tr></tfoot></table></div>';
 const stockTable = document.getElementById("stockTable");
 if(stockTable){
   stockTable.dataset.subtotalCols=[fs.length+1,fs.length+2,fs.length+3].join(",");
   updateTableSubtotals("stockTable",[fs.length+1,fs.length+2,fs.length+3]);
 }
}

function statementMenu(sub=""){
 const content = document.getElementById("content");
 if(!content) return;
 content.innerHTML='<div class="choices"><button class="choice" onclick="go(\'statements\',\'dyeing\')">Dyeing Statement</button><button class="choice" onclick="go(\'statements\',\'knitting\')">Knitting Statement</button><button class="choice" onclick="go(\'statements\',\'reqDyeing\')">Requirement Statement (Dyeing)</button><button class="choice" onclick="go(\'statements\',\'reqKnitting\')">Requirement Statement (Knitting)</button></div><div class="panel" id="st">Select Statement.</div>';
 if(sub&&["dyeing","knitting","reqDyeing","reqKnitting"].includes(sub))statement(sub);
}

function backupRestoreMenu(){
 const content = document.getElementById("content");
 if(!content) return;
 content.innerHTML='<div class="panel"><h2>Backup & Restore</h2><div class="backupGrid"><div class="backupCard"><h3>JSON Backup / Restore</h3><button class="btn backupAction" onclick="sagFullJsonBackup()">Full JSON Backup</button> <button class="btn backupAction secondary" onclick="document.getElementById(\'sagJsonRestore\').click()">Full JSON Restore</button><input id="sagJsonRestore" type="file" accept=".json,application/json" style="display:none" onchange="sagFullJsonRestore(this)"></div></div></div>';
}

window.addEventListener("load", () => {
  postLoadProcess();
  renderNav();
  const initPage = getPageState();
  go(initPage.page, initPage.sub);
  loadFromGoogleSheet();
});