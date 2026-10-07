const ERP_PASSWORD = "Sakib";
const ERP_AUTH = "YARN_ERP_AUTH";

// আপনার নির্দিষ্ট Google Spreadsheet ID
const SPREADSHEET_ID = "1nxyl3IOMQhc7ZKTiggZTQeNXV4DtqiBtkBuF7YKQdc8";

// আপনার Google Client ID
const CLIENT_ID = "1024920820782-cq7ujbej5i4f4lmkc44q0j0e1ban9dae.apps.googleusercontent.com";
const SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets";

let tokenClient = null;
let accessToken = null;

function requirePassword(){
  if(sessionStorage.getItem(ERP_AUTH)==="1") return true;
  document.body.innerHTML='<div class="loginScreen"><div class="loginBox"><div class="loginLogo">SAG FASHON LTD</div><h2>Password Protected</h2><p>Enter password to open SAG FASHON LTD</p><form id="loginForm"><input id="erpPassword" type="password" autocomplete="off" placeholder="Password" autofocus><button type="submit">Open ERP</button><div id="loginError"></div></form></div></div>';
  document.getElementById("loginForm").onsubmit=e=>{e.preventDefault();if(document.getElementById("erpPassword").value===ERP_PASSWORD){sessionStorage.setItem(ERP_AUTH,"1");location.reload()}else{document.getElementById("loginError").textContent="Incorrect Password";document.getElementById("erpPassword").select()}};
  return false;
}
if(!requirePassword()) throw new Error("ERP locked");

const ADDITIONAL_FIELDS=["proformaInvoice","sourceBuyer","sourceOrder","buyer","order","customer","yarnBrand","lot","count","fiver","blandRatio","quality","color","workOrder","dyeingFactory","batch","yknc","knittingFactory","fabrication","gsm","mcD","fd"];

// Default Data Structure Initializer
function createEmptyDataStructure() {
  const initAdd = {};
  ADDITIONAL_FIELDS.forEach(k => initAdd[k] = []);
  return {"raw":[],"dyed":[],"grey":[],"reqDyeing":[],"reqKnitting":[],"loose":[],"additional": initAdd};
}

let D = createEmptyDataStructure();
let edit = {};

// Google Identity Services Setup
function initGoogleAuth() {
  if (typeof google !== "undefined" && google.accounts) {
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (tokenResponse) => {
        if (tokenResponse.access_token) {
          accessToken = tokenResponse.access_token;
          showStatus("Google Sheets Connected! Loading data...");
          await loadFromGoogleSheet();
        } else {
          showStatus("Google Authentication Failed!", true);
        }
      },
    });
    tokenClient.requestAccessToken({ prompt: '' });
  } else {
    setTimeout(initGoogleAuth, 500);
  }
}

// UI Status Message
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
  if (!isError && (message.includes("Success") || message.includes("Loaded"))) {
    setTimeout(() => { statusDiv.style.display = "none"; }, 3000);
  }
}

// Load Data from Google Sheet
async function loadFromGoogleSheet() {
  try {
    const readUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/ERP_DATA!A2`;
    const response = await fetch(readUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const result = await response.json();
    if (result.values && result.values[0] && result.values[0][0]) {
      const parsedData = JSON.parse(result.values[0][0]);
      D = normalizeRestoredERP(parsedData);
      postLoadProcess();
      showStatus("Data Loaded Successfully!");
      go(getPageState().page, getPageState().sub);
    } else {
      showStatus("No existing data found in Sheet. Initialized empty database.");
      postLoadProcess();
      go(getPageState().page, getPageState().sub);
    }
  } catch (err) {
    console.error("Error loading data from Google Sheet:", err);
    showStatus("Failed to load data from Google Sheets!", true);
  }
}

// Save Data to Google Sheet
async function saveToGoogleSheet() {
  if (!accessToken) {
    alert("Google Drive access token missing. Please refresh.");
    return false;
  }
  showStatus("Saving to Google Sheets...");
  try {
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/ERP_DATA!A2?valueInputOption=USER_ENTERED`;
    const jsonString = JSON.stringify(D);
    const response = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        values: [[jsonString]]
      })
    });
    
    if (response.ok) {
      showStatus("Saved Successfully to Google Sheets!");
      return true;
    } else {
      const errRes = await response.json();
      console.error("Save Error Response:", errRes);
      showStatus("Save Failed! Check Permissions.", true);
      return false;
    }
  } catch (err) {
    console.error("Error saving data to Google Sheet:", err);
    showStatus("Network Error: Data Not Saved!", true);
    return false;
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
 D.raw??=[];D.dyed??=[];D.grey??=[];D.reqDyeing??=[];D.reqKnitting??=[];D.loose??=[];
 if(!D.additional || Array.isArray(D.additional) || typeof D.additional !== "object"){
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
 if(D.additional && D.additional[field] && Array.isArray(D.additional[field])) {
   vals.push(...D.additional[field]);
 }
 return [...new Set(vals.map(titleCaseText).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}

function additionalOptionRows(field){
 const vals=(D.additional && Array.isArray(D.additional[field]))?[...D.additional[field]].reverse():[];
 return vals.map(v=>'<div class="savedOption"><span>'+esc(v)+'</span><button class="btn del" data-afield="'+field+'" data-avalue="'+encodeURIComponent(v)+'">Delete</button></div>').join("")||'<div class="empty">No Saved Values.</div>';
}

function additionalInfo(){
 const labels={proformaInvoice:"Proforma Invoice",sourceBuyer:"Source Buyer",sourceOrder:"Source Order",buyer:"Buyer",order:"Order",customer:"Customer",yarnBrand:"Yarn Brand",lot:"Lot",count:"Count",fiver:"Fiver",blandRatio:"Bland Ratios",quality:"Quality",color:"Colour",workOrder:"Work Order",dyeingFactory:"Dyeing Factory",batch:"Batch",yknc:"YKNC",knittingFactory:"Knitting Factory",fabrication:"Fabrication",gsm:"GSM",mcD:"MC / D",fd:"F / D"};
 const content = document.getElementById("content");
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
   
   const isSaved = await save();
   if(isSaved){
     input.value = "";
     additionalInfo();
   }
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

function cloneERPData(){try{return JSON.parse(JSON.stringify(D))}catch(e){return createEmptyDataStructure()}}

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
 out.loose.forEach(r=>{r.category="Loose Yarn"});
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
 setPageState(p,sub); document.getElementById("title").textContent=titles[p];
 if(p==="dashboard")dash(); else if(p==="additional")additionalInfo(); else if(["raw","dyed","grey","loose","reqDyeing","reqKnitting"].includes(p))entry(p);
 else if(p==="stock"){if(sub&&["raw","dyed","grey","loose"].includes(sub))stock(sub);else stockMenu()}
 else if(p==="backup")backupRestoreMenu(); else statementMenu(sub);
}
nav.forEach(([p,t])=>{let b=document.createElement("button");b.textContent=t;b.onclick=()=>go(p);document.getElementById("nav").appendChild(b)});

function entry(t){
 let fs=F[t];
 const content = document.getElementById("content");
 content.innerHTML='<div class="entryPage"><div class="panel entryFormPanel"><h2>'+titles[t]+'</h2>'+'<form id="f" class="form">'+fs.map(f=>'<div class="field '+(f[0]==="remarks"?"wide":"")+'"><label>'+f[1]+'</label>'+fieldHTML(f)+'</div>').join("")+'<div class="actions"><button class="btn">Save</button></div></form></div><div class="panel entryDataPanel"><div class="exportBar"><input id="entrySearch" class="tableSearch" placeholder="Search..." autocomplete="off"><button class="btn" id="entrySearchBtn">Search</button><button class="btn" id="entryClearBtn">Clear</button><button class="btn exportBtn" id="entryExport">Download Excel</button></div><div id="tbl"></div></div></div>';
 const form=document.getElementById("f");
 form.onsubmit=async e=>{
  e.preventDefault(); let o=Object.fromEntries(new FormData(form));
  fs.forEach(z=>{if(z[2]==="text"&&o[z[0]]!==undefined)o[z[0]]=titleCaseText(o[z[0]])});
  if(t==="loose"){o.category="Loose Yarn";o.transaction=String(o.transaction||"").trim()}
  const missing=fs.filter(z=>z[0]!=="remarks"&&!String(o[z[0]]??"").trim()).map(z=>z[1]);
  if(missing.length){alert("Entry Not Saved!\n\nPlease Fill In The Following Required Field(s):\n\n"+missing.join("\n"));return}
  if(!validateAgainstAdditionalInfo(t,o))return;
  o.id=edit[t]||Date.now();
  D[t]=edit[t]?D[t].map(x=>x.id==o.id?o:x):[...D[t],o]; delete edit[t]; 
  
  const success = await save();
  if (success) {
    entry(t);
  }
 };
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
 let fs=F[t],qi=fs.findIndex(f=>f[0]==="quantity");
 const tbl = document.getElementById("tbl");
 tbl.innerHTML='<div class="tableWrap dataScroll"><table id="entryTable"><thead><tr>'+fs.map(f=>'<th>'+titleCaseText(f[1])+'</th>').join("")+'<th>Actions</th></tr></thead><tbody>'+[...D[t]].reverse().map(r=>'<tr>'+fs.map(f=>'<td>'+esc(f[0]==="quantity"?formatQty(r[f[0]]):r[f[0]])+'</td>').join("")+'<td><button type="button" class="btn rowEdit" data-key="'+esc(t)+'" data-id="'+esc(String(r.id))+'">Edit</button> <button type="button" class="btn del rowDelete" data-key="'+esc(t)+'" data-id="'+esc(String(r.id))+'">Delete</button></td></tr>').join("")+'</tbody><tfoot><tr class="subtotalRow">'+fs.map((f,i)=>'<td data-subtotal-col="'+i+'">'+(i===0?"Subtotal":(i===qi?"0.00":""))+'</td>').join("")+'<td></td></tr></tfoot></table></div>';
 document.getElementById("entryTable").dataset.subtotalCols=String(qi); updateTableSubtotals("entryTable",[qi]);
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

function dash(){
 const cards=[["Raw Yarn Stock","raw"],["Dyed Yarn Stock","dyed"],["Grey Fabrics Stock","grey"],["Loose Yarn Stock","loose"]];
 const rawGroups=groups("raw"),rawTotal=rawGroups.reduce((a,z)=>a+z.balance,0);
 const rawCats=["Grey Yarn","Lycra Yarn","Polyester Yarn"].map(cat=>{const total=rawGroups.filter(z=>String(z.r.category||"").trim().toLowerCase()===cat.toLowerCase()).reduce((a,z)=>a+z.balance,0);return '<div class="rawCategoryStock"><span>'+cat+'</span><strong>'+total.toFixed(2)+'</strong></div>'}).join("");
 const content = document.getElementById("content");
 content.innerHTML='<div class="cards"><div class="card rawStockCard" onclick="go(\'stock\',\'raw\')"><b>Raw Yarn Stock</b><strong>'+rawTotal.toFixed(2)+' KG</strong><div class="rawCategoryList">'+rawCats+'</div></div>'+cards.slice(1).map(x=>'<div class="card" onclick="go(\'stock\',\''+x[1]+'\')"><b>'+x[0]+'</b><strong>'+groups(x[1]).reduce((a,z)=>a+z.balance,0).toFixed(2)+' KG</strong></div>').join("")+'</div>';
}

function stockType(t,tr){const x=String(tr||"").trim().toUpperCase();if(STOCK_RECEIVE[t].has(x))return "received";if(STOCK_DELIVERY[t].has(x))return "delivered";return ""}
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
 D[t].forEach(r=>{
  const typ=stockType(t,r.transaction);if(!typ)return;
  const tr=String(r.transaction||"").trim().toUpperCase(),k=fs.map(x=>String(r[x]??"").trim().toLowerCase()).join("|");
  if(!m[k])m[k]={r:{...r},received:0,delivery:0,returnQty:0,receivedDate:""};
  if(STOCK_RECEIVE[t].has(tr)){
   if(tr===primaryReceive){const d=String(r.date??"").trim();if(d&&(!m[k].receivedDate||d<m[k].receivedDate))m[k].receivedDate=d;m[k].received+=N(r.quantity)}
   else if(tr.includes("RETURN FROM"))m[k].returnQty+=N(r.quantity);
   else m[k].received+=N(r.quantity);
  }else if(STOCK_DELIVERY[t].has(tr))m[k].delivery+=N(r.quantity);
 });
 return Object.values(m).map(x=>({...x,r:{...x.r,receivedDate:x.receivedDate},balance:x.received+x.returnQty-x.delivery}));
}

function stockMenu(){
 const content = document.getElementById("content");
 content.innerHTML='<div class="choices"><button class="choice" onclick="go(\'stock\',\'raw\')">Raw Yarn Stock</button><button class="choice" onclick="go(\'stock\',\'dyed\')">Dyed Yarn Stock</button><button class="choice" onclick="go(\'stock\',\'grey\')">Grey Fabrics Stock</button><button class="choice" onclick="go(\'stock\',\'loose\')">Loose Yarn Stock</button></div><div class="panel" id="sv">Select Stock.</div>';
}
function stock(t){
 setPageState("stock",t);
 const fs=stockFields(t),rs=groups(t),title={raw:"Raw Yarn Stock",dyed:"Dyed Yarn Stock",grey:"Grey Fabrics Stock",loose:"Loose Yarn Stock"}[t];
 const sv = document.getElementById("sv");
 sv.innerHTML='<div class="exportBar"><input id="stockSearch" class="tableSearch" placeholder="Search..." autocomplete="off"><button class="btn" id="stockSearchBtn">Search</button><button class="btn" id="stockClearBtn">Clear</button><button class="btn exportBtn" id="stockExport">Download Excel</button></div><h2>'+title+'</h2><div class="tableWrap dataScroll"><table id="stockTable"><thead><tr><th>Received Date</th>'+fs.map(x=>'<th>'+titleCaseText(x)+'</th>').join("")+'<th>Total Received</th><th>Total Delivery</th><th>Balance</th></tr></thead><tbody>'+rs.map(x=>'<tr><td>'+esc(x.receivedDate||"")+'</td>'+fs.map(k=>'<td>'+esc(x.r[k])+'</td>').join("")+'<td>'+formatQty(x.received)+'</td><td>'+formatQty(x.delivery)+'</td><td>'+formatQty(x.balance)+'</td></tr>').join("")+'</tbody><tfoot><tr class="subtotalRow"><td>Subtotal</td>'+fs.map(()=>'<td></td>').join("")+'<td data-subtotal-col="'+(fs.length+1)+'">0.00</td><td data-subtotal-col="'+(fs.length+2)+'">0.00</td><td data-subtotal-col="'+(fs.length+3)+'">0.00</td></tr></tfoot></table></div>';
 document.getElementById("stockTable").dataset.subtotalCols=[fs.length+1,fs.length+2,fs.length+3].join(",");
 updateTableSubtotals("stockTable",[fs.length+1,fs.length+2,fs.length+3]);
}

function statementMenu(sub=""){
 const content = document.getElementById("content");
 content.innerHTML='<div class="choices"><button class="choice" onclick="go(\'statements\',\'dyeing\')">Dyeing Statement</button><button class="choice" onclick="go(\'statements\',\'knitting\')">Knitting Statement</button><button class="choice" onclick="go(\'statements\',\'reqDyeing\')">Requirement Statement (Dyeing)</button><button class="choice" onclick="go(\'statements\',\'reqKnitting\')">Requirement Statement (Knitting)</button></div><div class="panel" id="st">Select Statement.</div>';
 if(sub&&["dyeing","knitting","reqDyeing","reqKnitting"].includes(sub))statement(sub);
}

function backupRestoreMenu(){
 const content = document.getElementById("content");
 content.innerHTML='<div class="panel"><h2>Backup & Restore</h2><div class="backupGrid"><div class="backupCard"><h3>JSON Backup / Restore</h3><button class="btn backupAction" onclick="sagFullJsonBackup()">Full JSON Backup</button> <button class="btn backupAction secondary" onclick="document.getElementById(\'sagJsonRestore\').click()">Full JSON Restore</button><input id="sagJsonRestore" type="file" accept=".json,application/json" style="display:none" onchange="sagFullJsonRestore(this)"></div></div></div>';
}

window.addEventListener("load", () => {
  initGoogleAuth();
});