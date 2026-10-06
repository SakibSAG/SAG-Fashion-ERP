const ERP_PASSWORD="Sakib";
const ERP_AUTH="YARN_ERP_AUTH";

function requirePassword(){
  if(sessionStorage.getItem(ERP_AUTH)==="1") return true;
  document.body.innerHTML='<div class="loginScreen"><div class="loginBox"><div class="loginLogo">SAG FASHON LTD</div><h2>Password Protected</h2><p>Enter password to open SAG FASHON LTD</p><form id="loginForm"><input id="erpPassword" type="password" autocomplete="off" placeholder="Password" autofocus><button type="submit">Open ERP</button><div id="loginError"></div></form></div></div>';
  document.getElementById("loginForm").onsubmit=e=>{e.preventDefault();if(document.getElementById("erpPassword").value===ERP_PASSWORD){sessionStorage.setItem(ERP_AUTH,"1");location.reload()}else{document.getElementById("loginError").textContent="Incorrect Password";document.getElementById("erpPassword").select()}};
  return false;
}
if(!requirePassword()) throw new Error("ERP locked");

let D={raw:[],dyed:[],grey:[],reqDyeing:[],reqKnitting:[],loose:[],additional:{},documents:[]};
let edit={};
let googleTokenClient=null,googleReady=false,googleSignedIn=false,googleLoading=false,googleConnectPromise=null,pendingGoogleSave=new Set();
const GOOGLE_CLIENT_ID="1024920820782-cq7ujbej5i4f4lmkc44q0j0e1ban9dae.apps.googleusercontent.com";
const SPREADSHEET_ID="1nxyl3IOMQhc7ZKTiggZTQeNXV4DtqiBtkBuF7YKQdc8";
const SCOPES="https://www.googleapis.com/auth/spreadsheets";
const SHEETS={raw:"Raw_Yarn_Entry",dyed:"Dyed_Yarn_Entry",grey:"Grey_Fabric_Entry",loose:"Loose_Yarn_Entry",reqDyeing:"Requirement_Dyeing",reqKnitting:"Requirement_Knitting",additional:"Additional_Info"};
const DOC_META_FIELDS=["__docId","__docType","__docNumber","__docStatus","__docDate","__docCustomer","__docCustomerAddress","__docBagRoll","__docCreatedAt","__docUpdatedAt","__docCancelledAt"];


const F={
 raw:[
  ["date","Date","date"],["category","Category","select",["Grey Yarn","Lycra Yarn","Polyester Yarn"]],
  ["transaction","Transaction","select",["Raw Yarn Received From Spinning","Raw Yarn Return From Dyeing","Raw Yarn Return From Knitting","Raw Yarn Return From Re-Conning","Raw Yarn Delivery To Spinning","Raw Yarn Delivery To Dyeing","Raw Yarn Delivery To Knitting","Raw Yarn Delivery To Re-Conning","Raw Yarn Sale"]],
  ["invoice","Invoice","text"],["customerAddress","Customer Address","text"],["proformaInvoice","Proforma Invoice","text"],["sourceBuyer","Source Buyer","text"],["sourceOrder","Source Order","text"],["buyer","Buyer","text"],["order","Order","text"],["customer","Customer","text"],["yarnBrand","Yarn Brand","text"],["lot","Lot","text"],["count","Count","text"],["fiver","Fiver","text"],["blandRatio","Bland Ratios","text"],["quality","Quality","text"],["color","Colour","text"],["quantity","Quantity","number"],["remarks","Remarks","text"]
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
D.raw??=[];D.dyed??=[];D.grey??=[];D.reqDyeing??=[];D.reqKnitting??=[];D.loose??=[];

const ADDITIONAL_FIELDS=["customerAddress","proformaInvoice","sourceBuyer","sourceOrder","buyer","order","customer","yarnBrand","lot","count","fiver","blandRatio","quality","color","workOrder","dyeingFactory","batch","yknc","knittingFactory","fabrication","gsm","mcD","fd"];

if(!D.additional||Array.isArray(D.additional)){
 const oldAdditional=Array.isArray(D.additional)?D.additional:[];
 const migrated={}; ADDITIONAL_FIELDS.forEach(k=>migrated[k]=[]);
 oldAdditional.forEach(r=>ADDITIONAL_FIELDS.forEach(k=>{if(r&&r[k])migrated[k].push(titleCaseText(r[k]))}));
 ADDITIONAL_FIELDS.forEach(k=>migrated[k]=[...new Set(migrated[k])]);
 D.additional=migrated;
}else{
 ADDITIONAL_FIELDS.forEach(k=>{if(!Array.isArray(D.additional[k]))D.additional[k]=[]});
}
if(D.additional && !Array.isArray(D.additional) && Object.prototype.hasOwnProperty.call(D.additional,"category")) delete D.additional.category;

function esc(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function N(x){return Number(x||0)}
function updateGoogleStatus(msg,cls=""){const e=document.getElementById("googleStatus");if(e){e.textContent=msg;e.className="googleStatus "+cls}}
async function waitGoogle(){for(let i=0;i<180;i++){if(window.google?.accounts?.oauth2&&window.gapi)return true;await new Promise(r=>setTimeout(r,100))}return false}
async function initGoogle(){if(googleReady)return true;if(!(await waitGoogle()))return false;await new Promise((res,rej)=>gapi.load("client",{callback:res,onerror:rej}));await gapi.client.init({discoveryDocs:["https://sheets.googleapis.com/$discovery/rest?version=v4"]});googleTokenClient=google.accounts.oauth2.initTokenClient({client_id:GOOGLE_CLIENT_ID,scope:SCOPES,callback:()=>{}});googleReady=true;return true}
function authGoogle(prompt=""){return new Promise((resolve,reject)=>{if(!googleTokenClient)return reject(Error("Google authentication is not ready."));googleTokenClient.callback=r=>{if(r?.error)return reject(Object.assign(Error(r.error_description||r.error),{googleError:r.error}));if(!r?.access_token)return reject(Error("Google did not return an access token."));gapi.client.setToken({access_token:r.access_token});googleSignedIn=true;resolve(r)};googleTokenClient.requestAccessToken({prompt})})}
const errMsg=e=>e?.result?.error?.message||e?.error_description||e?.message||String(e);
async function ensureSheets(){const res=await gapi.client.sheets.spreadsheets.get({spreadsheetId:SPREADSHEET_ID});const have=new Set((res.result.sheets||[]).map(s=>s.properties.title));const missing=Object.values(SHEETS).filter(s=>!have.has(s));if(missing.length)await gapi.client.sheets.spreadsheets.batchUpdate({spreadsheetId:SPREADSHEET_ID,resource:{requests:missing.map(title=>({addSheet:{properties:{title}}}))}});const verify=await gapi.client.sheets.spreadsheets.get({spreadsheetId:SPREADSHEET_ID});const finalHave=new Set((verify.result.sheets||[]).map(s=>s.properties.title));const stillMissing=Object.values(SHEETS).filter(s=>!finalHave.has(s));if(stillMissing.length)throw Error("Google Sheets tabs could not be created: "+stillMissing.join(", "))}
function rowValues(t,r){return F[t].map(f=>r[f[0]]??"").concat(DOC_META_FIELDS.map(k=>r[k]??""))}
async function readSheet(name){const res=await gapi.client.sheets.spreadsheets.values.get({spreadsheetId:SPREADSHEET_ID,range:"'"+name+"'!A:ZZ"});const rows=res.result.values||[];if(!rows.length)return[];const h=rows[0];return rows.slice(1).filter(r=>r.some(v=>String(v??"")!=="")).map(r=>{const o={};h.forEach((k,i)=>o[k]=r[i]??"");return o})}
function documentMetaForRow(t,r){const docs=D.documents.filter(d=>d.module===t&&Array.isArray(d.transactionIds)&&d.transactionIds.some(x=>String(x)===String(r.id)));if(!docs.length)return{};const d=docs.find(x=>x.status!=="Cancelled")||docs[docs.length-1];const line=(d.lines||[]).find(x=>String(x.transactionId)===String(r.id));return{__docId:d.id,__docType:d.type,__docNumber:d.number,__docStatus:d.status||"Created",__docDate:d.date||"",__docCustomer:d.customer||"",__docCustomerAddress:d.customerAddress||"",__docBagRoll:line?.bagRoll??"",__docCreatedAt:d.createdAt||"",__docUpdatedAt:d.updatedAt||"",__docCancelledAt:d.cancelledAt||""}}
async function writeSheet(t){const name=SHEETS[t];const header=F[t].map(f=>f[0]).concat(DOC_META_FIELDS);const values=[header,...D[t].map(r=>rowValues(t,{...r,...documentMetaForRow(t,r)}))];await gapi.client.sheets.values.clear({spreadsheetId:SPREADSHEET_ID,range:"'"+name+"'!A:ZZ"});const res=await gapi.client.sheets.values.update({spreadsheetId:SPREADSHEET_ID,range:"'"+name+"'!A1",valueInputOption:"RAW",resource:{values}});if(!res?.result?.updatedRange)throw Error("Google Sheets did not confirm the save for tab: "+name);return res}
async function writeAdditional(){const values=[ADDITIONAL_FIELDS,...Array.from({length:Math.max(0,...ADDITIONAL_FIELDS.map(k=>D.additional[k]?.length||0))},(_,i)=>ADDITIONAL_FIELDS.map(k=>D.additional[k]?.[i]??""))];await gapi.client.sheets.values.clear({spreadsheetId:SPREADSHEET_ID,range:"'"+SHEETS.additional+"'!A:ZZ"});const res=await gapi.client.sheets.values.update({spreadsheetId:SPREADSHEET_ID,range:"'"+SHEETS.additional+"'!A1",valueInputOption:"RAW",resource:{values}});if(!res?.result?.updatedRange)throw Error("Google Sheets did not confirm the save for tab: "+SHEETS.additional);return res}
function rebuildDocuments(){const map=new Map();["raw","dyed","grey","loose"].forEach(t=>{(D[t]||[]).forEach(r=>{const id=String(r.__docId||"");if(!id)return;let d=map.get(id);if(!d){d={id,module:t,type:r.__docType||"",number:r.__docNumber||"",date:r.__docDate||r.date||"",customer:r.__docCustomer||r.customer||"",customerAddress:r.__docCustomerAddress||"",status:r.__docStatus||"Created",createdAt:r.__docCreatedAt||"",updatedAt:r.__docUpdatedAt||"",cancelledAt:r.__docCancelledAt||"",transactionIds:[],lines:[]};map.set(id,d)}d.transactionIds.push(r.id);const fields={};(DOC_FIELDS[t]||[]).forEach(k=>fields[k]=r[k]??"");d.lines.push({transactionId:r.id,fields,bagRoll:r.__docBagRoll||""});});});D.documents=[...map.values()]}
async function save(changed=null,retry=true){const list=changed?[changed]:["raw","dyed","grey","loose","reqDyeing","reqKnitting","additional"];list.forEach(t=>pendingGoogleSave.add(t));if(!googleReady||!googleSignedIn){updateGoogleStatus("Connecting to Google Sheets automatically...","googleLoading");return false}if(googleLoading)return true;try{googleLoading=true;await ensureSheets();while(pendingGoogleSave.size){const jobs=[...pendingGoogleSave];pendingGoogleSave.clear();for(const t of jobs){if(t==="additional")await writeAdditional();else await writeSheet(t)}}googleLoading=false;updateGoogleStatus("Live data connected to SAG_FASHON_ERP_DATA — 7 Google Sheet tabs ready — Auto-save ON","googleConnected");return true}catch(e){googleLoading=false;const status=errMsg(e),code=e?.status||e?.result?.error?.code;if(retry&&(code===401||code===403||/unauthorized|invalid.*credential|token/i.test(status))){try{googleSignedIn=false;await connectGoogle();return await save(changed,false)}catch(_){}}updateGoogleStatus("Google save failed: "+status,"googleError");console.error(e);return false}}
async function loadGoogle(){await ensureSheets();const out={raw:[],dyed:[],grey:[],loose:[],reqDyeing:[],reqKnitting:[],additional:{},documents:[]};for(const t of Object.keys(SHEETS)){if(t==="additional"){const rows=await readSheet(SHEETS.additional);ADDITIONAL_FIELDS.forEach((k,i)=>out.additional[k]=rows.map(r=>r[k]??"").filter(v=>String(v)!==""))}else out[t]=await readSheet(SHEETS[t])}out.loose.forEach(r=>r.category="Loose Yarn");D=out;rebuildDocuments()}
async function ensureGoogleConnected(){if(googleSignedIn&&googleReady)return true;if(googleConnectPromise)return await googleConnectPromise;googleConnectPromise=connectGoogle().finally(()=>{googleConnectPromise=null});return await googleConnectPromise}
async function connectGoogle(){try{updateGoogleStatus("Connecting to Google Sheets automatically...","googleLoading");if(!await initGoogle())throw Error("Google APIs did not finish loading.");try{await authGoogle("")}catch(e){if(e?.googleError==="interaction_required"||e?.googleError==="consent_required")await authGoogle("consent");else throw e}await loadGoogle();updateGoogleStatus("Live data connected to SAG_FASHON_ERP_DATA — 7 Google Sheet tabs ready — Auto-save ON","googleConnected");if(pendingGoogleSave.size){const jobs=[...pendingGoogleSave];pendingGoogleSave.clear();for(const t of jobs){if(t==="additional")await writeAdditional();else await writeSheet(t)}}return true}catch(e){googleSignedIn=false;updateGoogleStatus("Google connection failed: "+errMsg(e),"googleError");console.error(e);return false}}
function googleStartup(){ensureGoogleConnected().then(ok=>{if(ok){rebuildDocuments();go(getPageState().page,getPageState().sub)}})}
function save(changed=null){return saveGoogle(changed)}


D.raw.forEach(r=>{if(r.proformaInvoice===undefined){r.proformaInvoice=r.invoice||"";r.invoice=""}});
D.dyed.forEach(r=>{if(r.workOrder===undefined){r.workOrder=r.invoice||"";r.invoice=""}});
D.grey.forEach(r=>{r.workOrder="";r.yknc=r.yknc||""});
D.loose.forEach(r=>{r.category="Loose Yarn";r.transaction=r.transaction==="Loose Yarn Received From Knitting"?"Loose Yarn Received Form Knitting":(r.transaction==="Loose Yarn Sell"?"Loose Yarn Sale":(r.transaction||""));});

function allTextValues(field){
 const vals=[];
 if(D.additional && !Array.isArray(D.additional) && Array.isArray(D.additional[field])) vals.push(...D.additional[field]);
 return [...new Set(vals.map(titleCaseText).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
function additionalOptionRows(field){
 const vals=(D.additional && !Array.isArray(D.additional) && Array.isArray(D.additional[field]))?[...D.additional[field]].reverse():[];
 return vals.map(v=>'<div class="savedOption"><span>'+esc(v)+'</span><button class="del" data-afield="'+field+'" data-avalue="'+encodeURIComponent(v)+'">Delete</button></div>').join("")||'<div class="empty">No Saved Values.</div>';
}
function additionalInfo(){
 const labels={customerAddress:"Customer Address",proformaInvoice:"Proforma Invoice",sourceBuyer:"Source Buyer",sourceOrder:"Source Order",buyer:"Buyer",order:"Order",customer:"Customer",yarnBrand:"Yarn Brand",lot:"Lot",count:"Count",fiver:"Fiver",blandRatio:"Bland Ratios",quality:"Quality",color:"Colour",workOrder:"Work Order",dyeingFactory:"Dyeing Factory",batch:"Batch",yknc:"YKNC",knittingFactory:"Knitting Factory",fabrication:"Fabrication",gsm:"GSM",mcD:"MC / D",fd:"F / D"};
 content.innerHTML='<div class="panel additionalPanel"><h2>Additional Info</h2><div class="additionalGrid">'+
 ADDITIONAL_FIELDS.map(k=>'<div class="additionalCard"><label>'+labels[k]+'</label><div class="additionalInputRow"><input type="text" id="add_'+k+'" autocomplete="off" placeholder="Enter '+labels[k]+'"><button class="btn addInfoBtn" data-addfield="'+k+'">Save</button></div><div class="additionalTools"><input class="additionalSearch" data-searchfield="'+k+'" placeholder="Search..." autocomplete="off"><button class="btn exportBtn additionalExport" data-exportfield="'+k+'">Download Excel</button></div><div class="savedOptions" id="saved_'+k+'">'+additionalOptionRows(k)+'</div></div>').join("")+'</div>';
 ADDITIONAL_FIELDS.forEach(k=>{
  const input=document.getElementById("add_"+k); input.addEventListener("input",()=>input.value=titleCaseText(input.value));
  const search=document.querySelector('.additionalSearch[data-searchfield="'+k+'"]'); search.addEventListener("input",()=>filterAdditionalValues(k,search.value));
 });
 content.querySelectorAll(".addInfoBtn").forEach(b=>b.onclick=()=>{
  const k=b.dataset.addfield,input=document.getElementById("add_"+k),v=normalizeKeyValue(input.value);
  if(!v){alert("Please Enter A Value.");return}
  if(!D.additional[k].includes(v))D.additional[k].push(v);
  D.additional[k]=[...new Set(D.additional[k])]; save("additional"); additionalInfo();
 });
 content.querySelectorAll(".savedOptions .del").forEach(b=>b.onclick=()=>{
  const k=b.dataset.afield,v=decodeURIComponent(b.dataset.avalue);
  if(confirm('Delete "'+v+'"?')){D.additional[k]=D.additional[k].filter(x=>x!==v);save("additional");additionalInfo();}
 });
 content.querySelectorAll(".additionalExport").forEach(b=>b.onclick=()=>exportAdditionalFieldExcel(b.dataset.exportfield,labels[b.dataset.exportfield]));
}
function filterAdditionalValues(field,query){
 const q=String(query||"").trim().toLowerCase(),box=document.getElementById("saved_"+field); if(!box)return;
 const vals=allTextValues(field).filter(v=>!q||String(v).toLowerCase().includes(q));
 box.innerHTML=vals.map(v=>'<div class="savedOption"><span>'+esc(v)+'</span><button class="del" data-afield="'+field+'" data-avalue="'+encodeURIComponent(v)+'">Delete</button></div>').join("")||'<div class="empty">No Matching Values.</div>';
 box.querySelectorAll(".del").forEach(b=>b.onclick=()=>{const k=b.dataset.afield,v=decodeURIComponent(b.dataset.avalue);if(confirm('Delete "'+v+'"?')){D.additional[k]=D.additional[k].filter(x=>x!==v);save("additional");additionalInfo();}});
}
function exportAdditionalFieldExcel(field,label){
 const values=allTextValues(field),rows=values.map(v=>({[label]:v}));
 if(typeof XLSX!=="undefined"){const wb=XLSX.utils.book_new(),ws=XLSX.utils.json_to_sheet(rows.length?rows:[{[label]:""}]);XLSX.utils.book_append_sheet(wb,ws,"Data");XLSX.writeFile(wb,"SAG_FASHON_LTD_"+titleCaseText(label).replace(/[^A-Za-z0-9]+/g,"_")+".xlsx");}
 else exportTableExcel("saved_"+field,label);
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
function isControlledField(name){return ADDITIONAL_FIELDS.includes(name)}
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

function cloneERPData(){try{return JSON.parse(JSON.stringify(D))}catch(e){return {raw:[],dyed:[],grey:[],loose:[],reqDyeing:[],reqKnitting:[],additional:{}}}}
function normalizeAdditionalData(value){
 const out={}; ADDITIONAL_FIELDS.forEach(k=>out[k]=[]);
 if(value&&!Array.isArray(value)&&typeof value==="object"){
  ADDITIONAL_FIELDS.forEach(k=>{const v=value[k];if(Array.isArray(v))out[k]=v.map(x=>String(x??"")).filter(x=>x!=="");else if(v!==undefined&&v!==null&&String(v)!=="")out[k]=[String(v)]});
 }else if(Array.isArray(value)){
  value.forEach(row=>{if(!row||typeof row!=="object")return;ADDITIONAL_FIELDS.forEach(k=>{if(row[k]!==undefined&&row[k]!==null&&String(row[k])!=="")out[k].push(String(row[k]))})});
 }
 ADDITIONAL_FIELDS.forEach(k=>out[k]=[...new Set(out[k])]); return out;
}
function normalizeRestoredERP(value){
 if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Invalid ERP backup data.");
 const out=JSON.parse(JSON.stringify(value));
 ["raw","dyed","grey","loose","reqDyeing","reqKnitting","documents"].forEach(k=>{if(!Array.isArray(out[k]))out[k]=[]});
 out.additional=normalizeAdditionalData(out.additional);
 out.loose.forEach(r=>{r.category="Loose Yarn"});
 return out;
}
function backupData(){try{save();const snapshot=cloneERPData(),payload={backupType:"SAG FASHON LTD ERP FULL DATA BACKUP",backupMode:"FULL",backupVersion:"V20-MRR-INVOICE",createdAt:new Date().toISOString(),data:snapshot},blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="SAG_FASHON_LTD_ERP_FULL_BACKUP_"+sagBackupStamp()+".json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}catch(err){alert("Backup Failed!\n\n"+err.message)}}
function restoreData(input){const file=input&&input.files?input.files[0]:null;if(!file)return;const reader=new FileReader();reader.onload=function(){try{const payload=JSON.parse(reader.result),restored=normalizeRestoredERP(payload&&payload.data?payload.data:payload);if(!confirm("Restore Full ERP Data?\n\nAll current ERP data will be replaced by the selected backup.")){input.value="";return}D=restored;save();alert("Full ERP Restore Completed Successfully.");go("dashboard")}catch(err){alert("Restore Failed!\n\nThe selected file is not a valid SAG FASHON LTD ERP full backup.")}finally{input.value=""}};reader.readAsText(file)}

const PAGE_STATE_KEY="YARN_ERP_PAGE_STATE";
const PAGE_STATE_FALLBACK_KEY="YARN_ERP_PAGE_STATE_FALLBACK";
function setPageState(page,sub=""){
 const state=JSON.stringify({page,sub:sub||""});
 try{sessionStorage.setItem(PAGE_STATE_KEY,state)}catch(e){}
 try{localStorage.setItem(PAGE_STATE_FALLBACK_KEY,state)}catch(e){}
}
function getPageState(){
 try{const x=JSON.parse(sessionStorage.getItem(PAGE_STATE_KEY)||"");if(x&&titles[x.page])return x}catch(e){}
 try{
  const nav=performance.getEntriesByType("navigation")[0];
  const isReload=nav&&nav.type==="reload";
  if(isReload){const x=JSON.parse(localStorage.getItem(PAGE_STATE_FALLBACK_KEY)||"");if(x&&titles[x.page])return x}
 }catch(e){}
 return {page:"dashboard",sub:""}
}
function go(p,sub=""){
 setPageState(p,sub); document.getElementById("title").textContent=titles[p];
 if(p==="dashboard")dash(); else if(p==="additional")additionalInfo(); else if(["raw","dyed","grey","loose","reqDyeing","reqKnitting"].includes(p))entry(p);
 else if(p==="stock"){if(sub&&["raw","dyed","grey","loose"].includes(sub))stock(sub);else stockMenu()}
 else if(p==="backup")backupRestoreMenu(); else statementMenu(sub);
}
nav.forEach(([p,t])=>{let b=document.createElement("button");b.textContent=t;b.onclick=()=>go(p);document.getElementById("nav").appendChild(b)});


/* =========================================================
   MRR / INVOICE DOCUMENT SYSTEM
   - Received transactions -> MRR
   - Delivery transactions -> Invoice
   - Same Date + Customer required for selected rows
   - View / Edit / Print / Cancel supported
   ========================================================= */
const DOC_RECEIVE={
 raw:new Set(["RAW YARN RECEIVED FROM SPINNING","GREY YARN RECEIVED FROM SPINNING"]),
 dyed:new Set(["DYED YARN RECEIVED FROM DYEING"]),
 grey:new Set(["GREY FABRICS RECEIVED FROM KNITTING"]),
 loose:new Set(["LOOSE YARN RECEIVED FORM KNITTING"])
};
const DOC_DELIVERY={
 raw:new Set(["RAW YARN DELIVERY TO SPINNING","RAW YARN DELIVERY TO DYEING","RAW YARN DELIVERY TO KNITTING","RAW YARN DELIVERY TO RE-CONNING","GREY YARN DELIVERY TO SPINNING","GREY YARN DELIVERY TO DYEING","GREY YARN DELIVERY TO KNITTING","GREY YARN DELIVERY TO RE-CONNING","GREY YARN SALE"]),
 dyed:new Set(["DYED YARN DELIVERY TO DYEING","DYED YARN DELIVERY TO KINTTING","DYED YARN DELIVERY TO RE-CONNING","DYED YARN SALE"]),
 grey:new Set(["GREY FABRICS DELIVERY TO KNITTING","GREY FABRICS DELIVERY TO DYEING","GREY FABRIC SALE"]),
 loose:new Set(["LOOSE YARN SALE"])
};
const DOC_FIELDS={
 raw:["buyer","order","customer","yarnBrand","lot","count","fiver","blandRatio","quality","color","quantity","remarks"],
 dyed:["buyer","order","customer","dyeingFactory","batch","count","fiver","blandRatio","quality","color","quantity","remarks"],
 grey:["buyer","order","customer","knittingFactory","fabrication","gsm","mcD","fd","color","quantity","remarks"],
 loose:["yknc","buyer","order","customer","yarnBrand","lot","count","fiver","blandRatio","quality","color","quantity","remarks"]
};
const DOC_LABELS={
 buyer:"Buyer",order:"Order",customer:"Customer",customerAddress:"Customer Address",yarnBrand:"Yarn Brand",lot:"Lot",count:"Count",
 fiver:"Fiver",blandRatio:"Bland Ratios",quality:"Quality",color:"Colour",quantity:"Quantity",remarks:"Remarks",
 dyeingFactory:"Dyeing Factory",batch:"Batch",knittingFactory:"Knitting Factory",fabrication:"Fabrication",
 gsm:"GSM",mcD:"MC / D",fd:"F / D",yknc:"YKNC"
};
const FIXED_COMPANY_ADDRESS="167/5, West Mudafa, Tongi, Gazipur-1711, Bangladesh";
function documentDisplayFields(t){const f=[...(DOC_FIELDS[t]||[])],i=f.indexOf("quantity");if(i>=0)f.splice(i+1,0,"bagRoll");return f;}
const FIXED_PREPARED_BY="Sakib";
const DOC_SIGNATORIES=["Prepared By Sakib","Store Manager","Knitting & Dyeing Manager","Authorized Signature"];
function docTypeFor(t,tr){
 const x=String(tr||"").trim().toUpperCase();
 if(DOC_RECEIVE[t]&&DOC_RECEIVE[t].has(x))return "MRR";
 if(DOC_DELIVERY[t]&&DOC_DELIVERY[t].has(x))return "Invoice";
 return "";
}
function docNumberPrefix(type){return type==="MRR"?"MRR":"INV"}
function nextDocNumber(type){
 const prefix=docNumberPrefix(type), nums=D.documents.map(d=>{
   if(d.type!==type)return 0;
   const m=String(d.number||"").match(new RegExp("^"+prefix+"-(\\d+)$","i"));
   return m?Number(m[1]):0;
 });
 return prefix+"-"+String(Math.max(0,...nums)+1).padStart(6,"0");
}
function docForTransaction(t,id){
 return D.documents.find(d=>d.status!=="Cancelled" && d.module===t && Array.isArray(d.transactionIds) && d.transactionIds.some(x=>String(x)===String(id)));
}
function anyDocForTransaction(t,id){
 return D.documents.find(d=>d.module===t && Array.isArray(d.transactionIds) && d.transactionIds.some(x=>String(x)===String(id)));
}
function transactionDocumentStatus(t,r){
 const docs=D.documents.filter(d=>d.module===t && Array.isArray(d.transactionIds) && d.transactionIds.some(x=>String(x)===String(r.id)));
 if(!docs.length)return {status:"Pending",doc:null};
 const active=docs.find(d=>d.status!=="Cancelled");
 if(active)return {status:"Created",doc:active};
 return {status:"Cancelled",doc:docs[docs.length-1]};
}
function documentRowData(t,r){
 const o={};
 (DOC_FIELDS[t]||[]).forEach(k=>o[k]=r[k]??"");
 return o;
}
function commonDocDateCustomer(t,ids){
 const rows=ids.map(id=>D[t].find(r=>String(r.id)===String(id))).filter(Boolean);
 if(!rows.length)return {ok:false,message:"Please select at least one transaction."};
 const dates=[...new Set(rows.map(r=>String(r.date||"").trim()))];
 const customers=[...new Set(rows.map(r=>normalizeKeyValue(r.customer||"")))];
 if(dates.length!==1 || !dates[0])return {ok:false,message:"Selected transactions must have the same Date."};
 if(customers.length!==1 || !customers[0])return {ok:false,message:"Selected transactions must have the same Customer."};
 return {ok:true,rows,date:dates[0],customer:customers[0]};
}
function selectedTransactionIds(t){
 return [...document.querySelectorAll(".docSelect[data-key='"+t+"']:checked")].map(x=>x.dataset.id);
}
function docButtonHTML(t){
 return '<button type="button" class="btn docCreateBtn" data-doccreate="'+esc(t)+'">Invoice/MRR</button>';
}
function docActionHTML(t,r){
 const info=transactionDocumentStatus(t,r);
 if(!info.doc)return '<span class="docPending">Pending</span>';
 const actions='<button type="button" class="edit docViewBtn" data-docview="'+esc(t)+'" data-docid="'+esc(String(info.doc.id))+'">View</button>'+
   '<button type="button" class="edit docEditBtn" data-docedit="'+esc(t)+'" data-docid="'+esc(String(info.doc.id))+'">Edit</button>'+ 
   '<button type="button" class="del docPrintBtn" data-docprint="'+esc(String(info.doc.id))+'">Print</button>';
 const cancel=info.status==="Created"?'<button type="button" class="del docCancelBtn" data-doccancel="'+esc(t)+'" data-docid="'+esc(String(info.doc.id))+'">Cancel</button>':'';
 return actions+cancel;
}
function documentTransactionTable(t){
 const fs=F[t]||[];
 return '<table id="entryTable"><thead><tr><th>Select</th>'+fs.map(f=>'<th>'+titleCaseText(f[1])+'</th>').join("")+'<th>Document Status</th><th>Actions</th></tr></thead><tbody>'+
 [...D[t]].reverse().map(r=>{
   const dtype=docTypeFor(t,r.transaction), info=transactionDocumentStatus(t,r);
   const canSelect=!!dtype && info.status==="Pending";
   return '<tr><td>'+(canSelect?'<input type="checkbox" class="docSelect" data-key="'+esc(t)+'" data-id="'+esc(String(r.id))+'">':"—")+'</td>'+
   fs.map(f=>'<td>'+esc(f[0]==="quantity"?formatQty(r[f[0]]):r[f[0]])+'</td>').join("")+ '<td>'+esc(info.status)+'</td><td>'+docActionHTML(t,r)+'</td></tr>';
 }).join('')+'</tbody><tfoot><tr class="subtotalRow"><td></td>'+fs.map((f,i)=>'<td data-subtotal-col="'+i+'">'+(i===0?"Subtotal":(i===fs.findIndex(f=>f[0]==="quantity")?"0.00":""))+'</td>').join("")+'<td></td><td></td></tr></tfoot></table>';
}
function bindDocumentButtons(t){
 document.querySelectorAll(".docCreateBtn").forEach(b=>b.onclick=()=>createDocumentFromSelection(t));
 document.querySelectorAll(".docViewBtn").forEach(b=>b.onclick=()=>openDocument(t,b.dataset.docid,false));
 document.querySelectorAll(".docEditBtn").forEach(b=>b.onclick=()=>openDocument(t,b.dataset.docid,true));
 document.querySelectorAll(".docPrintBtn").forEach(b=>b.onclick=()=>printDocument(b.dataset.docprint));
 document.querySelectorAll(".docCancelBtn").forEach(b=>b.onclick=()=>cancelDocument(b.dataset.doccancel,b.dataset.docid));
}
function createDocumentFromSelection(t){
 const ids=selectedTransactionIds(t), check=commonDocDateCustomer(t,ids);
 if(!check.ok){alert(check.message);return}
 const types=[...new Set(check.rows.map(r=>docTypeFor(t,r.transaction)).filter(Boolean))];
 if(types.length!==1){alert("Please select only Received transactions for MRR OR only Delivery transactions for Invoice.");return}
 const type=types[0];
 if(check.rows.some(r=>transactionDocumentStatus(t,r).status==="Created")){alert("One or more selected transactions already have an active document.");return}
 openDocumentEditor(t,{mode:"create",type,date:check.date,customer:check.customer,rows:check.rows});
}
function customerAddressOptions(selected){
 const vals=allTextValues("customerAddress");
 return vals.map(v=>'<option value="'+esc(v)+'" '+(String(v)===String(selected||"")?'selected':'')+'>'+esc(v)+'</option>').join("");
}
function documentEditorRows(t,rows,readonly){
 const fields=DOC_FIELDS[t]||[],displayFields=documentDisplayFields(t);
 return rows.map((r,i)=>{
   return '<tr data-docrow="'+esc(String(r.id))+'"><td>'+String(i+1)+'</td>'+displayFields.map(k=>{
     if(k==="bagRoll")return '<td><input class="docBagRoll" type="text" value="'+esc(r.bagRoll??"")+'" placeholder="Bag/Roll" '+(readonly?'disabled':'')+'></td>';
     const type=k==="quantity"?"number":"text", value=esc(r[k]??"");
     return '<td><input class="docField" data-field="'+esc(k)+'" type="'+type+'" '+(type==='number'?'step="0.01"':'')+' value="'+value+'" '+(readonly?'disabled':'')+'></td>';
   }).join('')+'</tr>';
 }).join('');
}
function openDocument(t,id,editing){
 const d=D.documents.find(x=>String(x.id)===String(id));
 if(!d){alert("Document not found.");return}
 openDocumentEditor(t,{mode:editing?"edit":"view",document:d,type:d.type,date:d.date,customer:d.customer,customerAddress:d.customerAddress||"",rows:(d.lines||[]).map(x=>({id:x.transactionId,...x.fields,bagRoll:x.bagRoll??""}))});
}
function openDocumentEditor(t,opt){
 const d=opt.document||null, type=opt.type, number=d?d.number:nextDocNumber(type), date=d?d.date:opt.date, customer=d?d.customer:opt.customer;
 const rows=(opt.rows||[]).map(r=>({id:r.id,...documentRowData(t,r),...r}));
 const fields=DOC_FIELDS[t]||[],labels=fields.map(k=>DOC_LABELS[k]||k),readonly=opt.mode==="view";
 const savedAddress=d?.customerAddress||rows.find(r=>r.customerAddress)?.customerAddress||"";
 content.innerHTML='<div class="panel documentPanel">'+
 '<div class="documentHead documentEditableMeta"><div><h2>'+type+'</h2><div class="docCompany">SAG FASHON LTD</div><div class="docCompanyAddress">'+esc(FIXED_COMPANY_ADDRESS)+'</div></div><div class="docMeta"><div><b>'+type+' No:</b> '+esc(number)+'</div><div><b>Date:</b> <input id="docDate" type="date" value="'+esc(date)+'" '+(readonly?'disabled':'')+'></div><div><b>Customer:</b> <input id="docCustomer" type="text" value="'+esc(customer)+'" '+(readonly?'disabled':'')+'></div><div><b>Customer Address:</b> <select id="docCustomerAddress" '+(readonly?'disabled':'')+'><option value="">Select Customer Address</option>'+customerAddressOptions(savedAddress)+'</select></div><div><b>Module:</b> '+esc(titles[t])+'</div></div></div>'+ 
 '<div class="documentToolbar"><button class="choice" id="docBack">← Back To Transactions</button><span class="documentMode">'+(readonly?"View Document":(d?"Edit Document":"Create Document"))+'</span></div>'+ 
 '<div class="documentTableWrap"><table class="documentTable"><thead><tr><th>#</th>'+documentDisplayFields(t).map(k=>'<th>'+esc(k==='bagRoll'?'Bag/Roll':(DOC_LABELS[k]||k))+'</th>').join('')+'</tr></thead><tbody>'+documentEditorRows(t,rows,readonly)+'</tbody></table></div>'+ 
 '<div class="documentTotals"><div><b>Total Quantity:</b> <span id="docTotalQuantity">0.00</span></div><div><b>Total Bag/Roll:</b> <span id="docTotalBagRoll">0</span></div></div>'+ 
 '<div class="documentActions">'+(readonly?'<button class="btn" id="docEditNow">Edit</button>':'<button class="btn" id="docSave">Save '+type+'</button>')+'<button class="choice" id="docPrintNow">Print</button></div></div>';
 document.getElementById("docBack").onclick=()=>entry(t);
 const updateTotals=()=>{let qty=0,bag=0;content.querySelectorAll('.docField[data-field="quantity"]').forEach(e=>qty+=N(e.value));content.querySelectorAll('.docBagRoll').forEach(e=>{const n=Number(String(e.value).trim());if(Number.isFinite(n))bag+=n});document.getElementById('docTotalQuantity').textContent=formatQty(qty);document.getElementById('docTotalBagRoll').textContent=Number.isInteger(bag)?String(bag):bag.toFixed(2)};
 content.querySelectorAll('.docField[data-field="quantity"],.docBagRoll').forEach(e=>e.addEventListener('input',updateTotals));
 updateTotals();
 document.getElementById("docPrintNow").onclick=()=>{if(d)printDocument(d.id);else printCurrentDocument(t,type,number,date,customer,rows)};
 if(readonly)document.getElementById("docEditNow").onclick=()=>openDocument(t,d.id,true);
 if(!readonly)document.getElementById("docSave").onclick=()=>saveDocument(t,opt,number,date,customer,rows);
}
function collectDocumentRows(t,baseRows){
 const out=[];
 for(const r of baseRows){
   const tr=document.querySelector('tr[data-docrow="'+CSS.escape(String(r.id))+'"]'); if(!tr)continue;
   const fields={};
   for(const k of DOC_FIELDS[t]||[]){
     const e=tr.querySelector('.docField[data-field="'+k+'"]'); fields[k]=e?String(e.value??"").trim():"";
     if(k!=="remarks"&&!fields[k]){alert("Please fill "+(DOC_LABELS[k]||k)+" for all selected rows.");return null}
     if(k==="quantity"&&(!Number.isFinite(Number(fields[k]))||Number(fields[k])<=0)){alert("Quantity must be greater than 0.");return null}
   }
   const bagEl=tr.querySelector('.docBagRoll');
   const bagRoll=bagEl?String(bagEl.value??"").trim():"";
   if(!bagRoll){alert("Please fill Bag/Roll for all document rows.");return null}
   out.push({transactionId:r.id,fields,bagRoll});
 }
 return out;
}
function saveDocument(t,opt,number,date,customer,baseRows){
 const newDate=String(document.getElementById("docDate")?.value||date).trim();
 const newCustomer=normalizeKeyValue(document.getElementById("docCustomer")?.value||customer);
 const newCustomerAddress=String(document.getElementById("docCustomerAddress")?.value||"").trim();
 if(!newDate){alert("Date is required.");return} if(!newCustomer){alert("Customer is required.");return} if(!newCustomerAddress){alert("Customer Address is required. Please add/select it in Additional Info first.");return}
 const lines=collectDocumentRows(t,baseRows); if(!lines){return} if(!lines.length){alert("No document lines found.");return}
 const type=opt.type; let d=opt.document;
 if(!d){d={id:"DOC-"+Date.now()+"-"+Math.random().toString(36).slice(2,7),module:t,type,number,date:newDate,customer:newCustomer,customerAddress:newCustomerAddress,status:"Created",createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),transactionIds:lines.map(x=>x.transactionId),lines};D.documents.push(d)}
 else{d.date=newDate;d.customer=newCustomer;d.customerAddress=newCustomerAddress;d.lines=lines;d.transactionIds=lines.map(x=>x.transactionId);d.status="Created";d.updatedAt=new Date().toISOString()}
 const activeDoc=d;
 D[t].forEach(r=>{if(activeDoc.transactionIds.some(x=>String(x)===String(r.id))){const oldInvoice=String(r.invoice||"");r.date=activeDoc.date;r.customer=activeDoc.customer;if(type==="MRR"){const original=oldInvoice.split("/MRR-")[0].trim();r.invoice=(original?original+"/":"")+activeDoc.number}else{r.invoice=activeDoc.number}const line=activeDoc.lines.find(x=>String(x.transactionId)===String(r.id));if(line)Object.assign(r,line.fields)}});
 save(t);alert(type+" "+number+" saved successfully.");entry(t);
}
function printCurrentDocument(t,type,number,date,customer,rows){
 const lines=collectDocumentRows(t,rows);
 if(!lines)return;
 printDocumentHTML({module:t,type,number,date,customer,customerAddress:document.getElementById("docCustomerAddress")?.value||"",lines});
}
function printDocument(id){const d=D.documents.find(x=>String(x.id)===String(id));if(!d){alert("Document not found.");return}printDocumentHTML(d)}
function printDocumentHTML(d){
 const fields=DOC_FIELDS[d.module]||[];
 const displayFields=documentDisplayFields(d.module);
 const totalQty=(d.lines||[]).reduce((s,l)=>s+N(l.fields.quantity),0);
 const totalBag=(d.lines||[]).reduce((s,l)=>{const n=Number(l.bagRoll);return s+(Number.isFinite(n)?n:0)},0);
 const tableHead=displayFields.map(k=>'<th>'+esc(k==="bagRoll"?"Bag/Roll":(DOC_LABELS[k]||k))+'</th>').join('');
 const tableRows=(d.lines||[]).map((l,i)=>'<tr><td>'+(i+1)+'</td>'+displayFields.map(k=>'<td class="'+(k==="quantity"?"qty":"")+'">'+esc(k==="quantity"?formatQty(l.fields[k]??""):k==="bagRoll"?(l.bagRoll??""):(l.fields[k]??""))+'</td>').join('')+'</tr>').join('');
 const signatures=DOC_SIGNATORIES.map(x=>'<div class="sign">'+esc(x)+'</div>').join('');
 const html='<!doctype html><html><head><meta charset="utf-8"><title>'+esc(d.number)+'</title><style>'+
 'body{font-family:Arial,sans-serif;margin:30px;color:#111;font-size:12px}h1{margin:0;font-size:22px}.head{display:flex;justify-content:space-between;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:15px}.meta{text-align:right;line-height:1.7}.companyAddress{font-size:11px;margin-top:4px}.title{font-size:18px;font-weight:bold;margin:15px 0;text-align:center}table{border-collapse:collapse;width:100%}th,td{border:1px solid #999;padding:6px;text-align:left;vertical-align:top}th{background:#eee}.qty{text-align:right}.totals{display:flex;justify-content:flex-end;gap:40px;margin-top:10px;font-size:13px}.footer{margin-top:55px;display:grid;grid-template-columns:repeat(4,1fr);gap:25px}.sign{border-top:1px solid #333;text-align:center;padding-top:6px;min-height:20px}@media print{body{margin:10mm}}'+
 '</style></head><body><div class="head"><div><h1>SAG FASHON LTD</h1><div class="companyAddress">'+esc(FIXED_COMPANY_ADDRESS)+'</div></div><div class="meta"><div><b>'+esc(d.type)+' No:</b> '+esc(d.number)+'</div><div><b>Date:</b> '+esc(d.date)+'</div><div><b>Customer:</b> '+esc(d.customer)+'</div><div><b>Customer Address:</b> '+esc(d.customerAddress||"")+'</div></div></div><div class="title">'+esc(d.type)+'</div><table><thead><tr><th>#</th>'+tableHead+'</tr></thead><tbody>'+tableRows+'</tbody></table><div class="totals"><div><b>Total Quantity:</b> '+esc(formatQty(totalQty))+'</div><div><b>Total Bag/Roll:</b> '+esc(Number.isInteger(totalBag)?String(totalBag):totalBag.toFixed(2))+'</div></div><div class="footer">'+signatures+'</div><script>window.onload=()=>window.print()<\\/script></body></html>';
 const w=window.open("","_blank","width=1200,height=800");if(!w){alert("Please allow pop-ups to print documents.");return}w.document.write(html);w.document.close();
}
function cancelDocument(t,id){const d=D.documents.find(x=>String(x.id)===String(id));if(!d)return;if(!confirm("Cancel "+d.type+" "+d.number+"? The document will remain in history."))return;d.status="Cancelled";d.cancelledAt=new Date().toISOString();save(t);entry(t)}
function entry(t){
 let fs=F[t];
 content.innerHTML='<div class="entryPage"><div class="panel entryFormPanel"><h2>'+titles[t]+'</h2><form id="f" class="form">'+fs.map(f=>'<div class="field '+(f[0]==="remarks"?"wide":"")+'"><label>'+f[1]+'</label>'+fieldHTML(f)+'</div>').join("")+'<div class="actions"><button class="btn">Save</button></div></form></div><div class="panel entryDataPanel"><div class="exportBar"><input id="entrySearch" class="tableSearch" placeholder="Search..." autocomplete="off"><button class="btn" id="entrySearchBtn">Search</button><button class="btn" id="entryClearBtn">Clear</button>'+docButtonHTML(t)+'<button class="btn exportBtn" id="entryExport">Download Excel</button></div><div class="docHint">Select pending Received rows to create an MRR, or pending Delivery/Sale rows to create an Invoice. Selected rows must have the same Date and Customer.</div><div id="tbl"></div></div></div>';
 const form=document.getElementById("f");
 form.onsubmit=e=>{
   e.preventDefault();let o=Object.fromEntries(new FormData(form));
   fs.forEach(z=>{if(z[2]==="text"&&o[z[0]]!==undefined)o[z[0]]=titleCaseText(o[z[0]])});
   if(t==="loose"){o.category="Loose Yarn";o.transaction=String(o.transaction||"").trim()}
   const missing=fs.filter(z=>z[0]!=="remarks"&&!String(o[z[0]]??"").trim()).map(z=>z[1]);
   if(missing.length){alert("Entry Not Saved!\n\nPlease Fill In The Following Required Field(s):\n\n"+missing.join("\n"));return}
   if(!validateAgainstAdditionalInfo(t,o))return;
   o.id=edit[t]||Date.now();
   D[t]=edit[t]?D[t].map(x=>x.id==o.id?o:x):[...D[t],o];delete edit[t];save(t);entry(t);
 };
 document.getElementById("entryExport").onclick=()=>exportTableExcel("entryTable",titles[t]);
 document.getElementById("entrySearch").oninput=e=>autoFilterTable("entryTable",e.target.value);
 document.getElementById("entrySearchBtn").onclick=()=>filterTable("entryTable",document.getElementById("entrySearch").value,"exact");
 document.getElementById("entryClearBtn").onclick=()=>{document.getElementById("entrySearch").value="";filterTable("entryTable","")};
 bindDocumentButtons(t);
 renderTable(t);
}
function renderTable(t){
 let fs=F[t],qi=fs.findIndex(f=>f[0]==="quantity");
 tbl.innerHTML='<div class="tableWrap dataScroll">'+documentTransactionTable(t)+'</div>';
 document.getElementById("entryTable").dataset.subtotalCols=String(qi>=0?qi+1:0);
 updateTableSubtotals("entryTable",qi>=0?[qi+1]:[]);
 bindDocumentButtons(t);
}
function editRow(t,id){let r=D[t].find(x=>String(x.id)===String(id));if(!r)return;edit[t]=r.id;F[t].forEach(f=>{let e=document.querySelector('[name="'+f[0]+'"]');if(e)e.value=r[f[0]]||""})}
function delRow(t,id){if(confirm("Delete this entry?")){D[t]=D[t].filter(x=>String(x.id)!==String(id));save(t);entry(t)}}

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
function dash(){
 const cards=[["Raw Yarn Stock","raw"],["Dyed Yarn Stock","dyed"],["Grey Fabrics Stock","grey"],["Loose Yarn Stock","loose"]];
 const rawGroups=groups("raw"),rawTotal=rawGroups.reduce((a,z)=>a+z.balance,0);
 const rawCats=["Grey Yarn","Lycra Yarn","Polyester Yarn"].map(cat=>{const total=rawGroups.filter(z=>String(z.r.category||"").trim().toLowerCase()===cat.toLowerCase()).reduce((a,z)=>a+z.balance,0);return '<div class="rawCategoryStock"><span>'+cat+'</span><strong>'+total.toFixed(2)+'</strong></div>'}).join("");
 content.innerHTML='<div class="cards"><div class="card rawStockCard" onclick="go(\'stock\',\'raw\')"><b>Raw Yarn Stock</b><strong>'+rawTotal.toFixed(2)+' KG</strong><div class="rawCategoryList">'+rawCats+'</div></div>'+cards.slice(1).map(x=>'<div class="card" onclick="go(\'stock\',\''+x[1]+'\')"><b>'+x[0]+'</b><strong>'+groups(x[1]).reduce((a,z)=>a+z.balance,0).toFixed(2)+' KG</strong></div>').join("")+'</div>';
}
function stockMenu(){
 content.innerHTML='<div class="choices"><button class="choice" onclick="go(\'stock\',\'raw\')">Raw Yarn Stock</button><button class="choice" onclick="go(\'stock\',\'dyed\')">Dyed Yarn Stock</button><button class="choice" onclick="go(\'stock\',\'grey\')">Grey Fabrics Stock</button><button class="choice" onclick="go(\'stock\',\'loose\')">Loose Yarn Stock</button></div><div class="panel" id="sv">Select Stock.</div>';
}
function stock(t){
 setPageState("stock",t);
 const fs=stockFields(t),rs=groups(t),title={raw:"Raw Yarn Stock",dyed:"Dyed Yarn Stock",grey:"Grey Fabrics Stock",loose:"Loose Yarn Stock"}[t];
 sv.innerHTML='<div class="exportBar"><input id="stockSearch" class="tableSearch" placeholder="Search..." autocomplete="off"><button class="btn" id="stockSearchBtn">Search</button><button class="btn" id="stockClearBtn">Clear</button><button class="btn exportBtn" id="stockExport">Download Excel</button></div><h2>'+title+'</h2><div class="tableWrap dataScroll"><table id="stockTable"><thead><tr><th>Received Date</th>'+fs.map(x=>'<th>'+titleCaseText(x)+'</th>').join("")+'<th>Total Received</th><th>Total Delivery</th><th>Balance</th></tr></thead><tbody>'+rs.map(x=>'<tr><td>'+esc(x.receivedDate||"")+'</td>'+fs.map(k=>'<td>'+esc(x.r[k])+'</td>').join("")+'<td>'+formatQty(x.received)+'</td><td>'+formatQty(x.delivery)+'</td><td>'+formatQty(x.balance)+'</td></tr>').join("")+'</tbody><tfoot><tr class="subtotalRow"><td>Subtotal</td>'+fs.map(()=>'<td></td>').join("")+'<td data-subtotal-col="'+(fs.length+1)+'">0.00</td><td data-subtotal-col="'+(fs.length+2)+'">0.00</td><td data-subtotal-col="'+(fs.length+3)+'">0.00</td></tr></tfoot></table></div>';
 document.getElementById("stockTable").dataset.subtotalCols=[fs.length+1,fs.length+2,fs.length+3].join(",");
 updateTableSubtotals("stockTable",[fs.length+1,fs.length+2,fs.length+3]);
 document.getElementById("stockExport").onclick=()=>exportTableExcel("stockTable",title);
 document.getElementById("stockSearch").oninput=e=>autoFilterTable("stockTable",e.target.value);
 document.getElementById("stockSearchBtn").onclick=()=>filterTable("stockTable",document.getElementById("stockSearch").value,"exact");
 document.getElementById("stockClearBtn").onclick=()=>{document.getElementById("stockSearch").value="";filterTable("stockTable","")};
}

function statementMenu(sub=""){
 content.innerHTML='<div class="choices"><button class="choice" onclick="go(\'statements\',\'dyeing\')">Dyeing Statement</button><button class="choice" onclick="go(\'statements\',\'knitting\')">Knitting Statement</button><button class="choice" onclick="go(\'statements\',\'reqDyeing\')">Requirement Statement (Dyeing)</button><button class="choice" onclick="go(\'statements\',\'reqKnitting\')">Requirement Statement (Knitting)</button></div><div class="panel" id="st">Select Statement.</div>';
 if(sub&&["dyeing","knitting","reqDyeing","reqKnitting"].includes(sub))statement(sub);
}
function keyFor(x){return [x.buyer||"Not Specified",x.order||"Not Specified"].join("|")}
function statement(t){
 setPageState("statements",t); const m={};
 const add=(x,del,recv,cat,factory)=>{const k=keyFor(x);if(!m[k])m[k]={buyer:x.buyer||"Not Specified",order:x.order||"Not Specified",category:cat||"",factory:factory||"",del:0,recv:0};m[k].del+=del;m[k].recv+=recv};
 if(t==="dyeing"){
  D.raw.forEach(x=>{const tr=String(x.transaction||"").toUpperCase();if(tr==="GREY YARN DELIVERY TO DYEING")add(x,N(x.quantity),0,x.category,x.customer)});
  D.raw.forEach(x=>{const tr=String(x.transaction||"").toUpperCase();if(tr==="GREY YARN RETURN FROM DYEING")add(x,-N(x.quantity),0,x.category,x.customer)});
  D.dyed.forEach(x=>{const tr=String(x.transaction||"").toUpperCase();if(tr==="DYED YARN RECEIVED FROM DYEING")add(x,0,N(x.quantity),x.category,x.dyeingFactory)});
  D.dyed.forEach(x=>{const tr=String(x.transaction||"").toUpperCase();if(tr==="DYED YARN DELIVERY TO DYEING")add(x,0,-N(x.quantity),x.category,x.dyeingFactory)});
  const rows=Object.values(m).map(v=>[v.buyer,v.order,v.category,v.factory,v.del,v.recv,v.del-v.recv]);
  renderStatement("Dyeing Statement",["Buyer","Order","Category","Dyeing Factory","Yarn Delivered","Yarn Received","Short / Excess"],rows);return;
 }
 if(t==="knitting"){
  const mm={};
  const factoryValue=(x,fallback)=>String(x.knittingFactory||x.customer||fallback||"Not Specified").trim()||"Not Specified";
  const addK=(x,amount,kind,factory)=>{
   const buyer=x.buyer||"Not Specified",order=x.order||"Not Specified",fac=factoryValue(x,factory),k=[buyer,order,fac].join("|");
   if(!mm[k])mm[k]={buyer,order,factory:fac,del:0,greyRecv:0,looseRecv:0};
   if(kind==="del")mm[k].del+=amount; else if(kind==="return")mm[k].del-=amount; else if(kind==="greyRecv")mm[k].greyRecv+=amount; else if(kind==="looseRecv")mm[k].looseRecv+=amount; else if(kind==="recvDelivery")mm[k].greyRecv-=amount;
  };
  D.raw.forEach(x=>{const tr=String(x.transaction||"").toUpperCase();if(tr==="GREY YARN DELIVERY TO KNITTING")addK(x,N(x.quantity),"del",x.customer||x.knittingFactory);if(tr==="GREY YARN RETURN FROM KNITTING")addK(x,N(x.quantity),"return",x.customer||x.knittingFactory);if(tr==="GREY YARN DELIVERY TO RE-CONNING")addK(x,N(x.quantity),"del",x.customer||x.knittingFactory);if(tr==="GREY YARN RETURN FROM RE-CONNING")addK(x,N(x.quantity),"return",x.customer||x.knittingFactory)});
  D.dyed.forEach(x=>{const tr=String(x.transaction||"").toUpperCase();if(tr==="DYED YARN DELIVERY TO KINTTING")addK(x,N(x.quantity),"del",x.customer||x.knittingFactory);if(tr==="DYED YARN RETURN FROM KNITTING")addK(x,N(x.quantity),"return",x.customer||x.knittingFactory);if(tr==="DYED YARN DELIVERY TO RE-CONNING")addK(x,N(x.quantity),"del",x.customer||x.knittingFactory);if(tr==="DYED YARN RETURN FROM RE-CONNING")addK(x,N(x.quantity),"return",x.customer||x.knittingFactory)});
  D.grey.forEach(x=>{const tr=String(x.transaction||"").toUpperCase();if(tr==="GREY FABRICS RECEIVED FROM KNITTING")addK(x,N(x.quantity),"greyRecv",x.knittingFactory);if(tr==="GREY FABRICS DELIVERY TO KNITTING")addK(x,N(x.quantity),"recvDelivery",x.knittingFactory)});
  D.loose.forEach(x=>{const tr=String(x.transaction||"").toUpperCase();if(tr==="LOOSE YARN RECEIVED FORM KNITTING")addK(x,N(x.quantity),"looseRecv",x.customer||"Not Specified")});
  const rows=Object.values(mm).sort((a,b)=>(a.buyer+"|"+a.order+"|"+a.factory).localeCompare(b.buyer+"|"+b.order+"|"+b.factory)).map(v=>[v.buyer,v.order,v.factory,v.del,v.greyRecv,v.looseRecv,v.del-(v.greyRecv+v.looseRecv)]);
  renderStatement("Knitting Statement",["Buyer","Order","Knitting Factory","Yarn Delivered","Grey Fabrics Received","Loose Yarn Received","Short / Excess"],rows);return;
 }
 const reqKey=x=>keyFor(x),reqData=t==="reqDyeing"?D.reqDyeing:D.reqKnitting,delivered={};
 if(t==="reqDyeing"){
  D.raw.forEach(x=>{const tr=String(x.transaction||"").toUpperCase();if(tr==="GREY YARN DELIVERY TO DYEING")delivered[reqKey(x)]=(delivered[reqKey(x)]||0)+N(x.quantity);if(tr==="GREY YARN RETURN FROM DYEING")delivered[reqKey(x)]=(delivered[reqKey(x)]||0)-N(x.quantity)});
 }else{
  D.raw.forEach(x=>{const tr=String(x.transaction||"").toUpperCase();if(["GREY YARN DELIVERY TO KNITTING","GREY YARN DELIVERY TO RE-CONNING"].includes(tr))delivered[reqKey(x)]=(delivered[reqKey(x)]||0)+N(x.quantity);if(["GREY YARN RETURN FROM KNITTING","GREY YARN RETURN FROM RE-CONNING"].includes(tr))delivered[reqKey(x)]=(delivered[reqKey(x)]||0)-N(x.quantity)});
  D.dyed.forEach(x=>{const tr=String(x.transaction||"").toUpperCase();if(["DYED YARN DELIVERY TO KINTTING","DYED YARN DELIVERY TO RE-CONNING"].includes(tr))delivered[reqKey(x)]=(delivered[reqKey(x)]||0)+N(x.quantity);if(["DYED YARN RETURN FROM KNITTING","DYED YARN RETURN FROM RE-CONNING"].includes(tr))delivered[reqKey(x)]=(delivered[reqKey(x)]||0)-N(x.quantity)});
 }
 const req={};reqData.forEach(x=>{const k=reqKey(x);req[k]=(req[k]||0)+N(x.quantity)});
 const keys=[...new Set([...Object.keys(req),...Object.keys(delivered)])];
 const rows=keys.map(k=>{const [buyer,order]=k.split("|"),q=req[k]||0,d=delivered[k]||0;return[buyer,order,q,d,q-d]});
 renderStatement(t==="reqDyeing"?"Requirement Statement (Dyeing)":"Requirement Statement (Knitting)",["Buyer","Order","Requirement","Delivered","Balance"],rows);
}
function renderStatement(title,h,rows){
 const qtyCols=h.map((x,i)=>({x:String(x).toLowerCase(),i})).filter(o=>/quantity|delivered|received|requirement|balance|short|excess/.test(o.x)).map(o=>o.i);
 st.innerHTML='<div class="exportBar"><input id="statementSearch" class="tableSearch" placeholder="Search..." autocomplete="off"><button class="btn" id="statementSearchBtn">Search</button><button class="btn" id="statementClearBtn">Clear</button><button class="btn exportBtn" id="statementExport">Download Excel</button></div><h2>'+title+'</h2><div class="tableWrap dataScroll"><table id="statementTable"><thead><tr>'+h.map(x=>'<th>'+titleCaseText(x)+'</th>').join("")+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+esc(typeof x==="number"?formatQty(x):x)+'</td>').join("")+'</tr>').join("")+'</tbody><tfoot><tr class="subtotalRow">'+h.map((x,i)=>'<td data-subtotal-col="'+i+'">'+(i===0?"Subtotal":(qtyCols.includes(i)?"0.00":""))+'</td>').join("")+'</tr></tfoot></table></div>';
 document.getElementById("statementTable").dataset.subtotalCols=qtyCols.join(",");updateTableSubtotals("statementTable",qtyCols);
 document.getElementById("statementExport").onclick=()=>exportTableExcel("statementTable",title);
 document.getElementById("statementSearch").oninput=e=>autoFilterTable("statementTable",e.target.value);
 document.getElementById("statementSearchBtn").onclick=()=>filterTable("statementTable",document.getElementById("statementSearch").value,"exact");
 document.getElementById("statementClearBtn").onclick=()=>{document.getElementById("statementSearch").value="";filterTable("statementTable","")};
}

function formatQty(x){const n=Number(x);return Number.isFinite(n)?n.toFixed(2):"0.00"}
function updateTableSubtotals(tableId,qtyCols){
 const table=document.getElementById(tableId);if(!table)return;const totals={};qtyCols.forEach(i=>totals[i]=0);
 table.querySelectorAll("tbody tr").forEach(tr=>{if(tr.style.display==="none")return;qtyCols.forEach(i=>{const n=parseFloat(String(tr.cells[i]?.textContent||"").replace(/,/g,""));if(Number.isFinite(n))totals[i]+=n})});
 qtyCols.forEach(i=>{const c=table.querySelector('tfoot [data-subtotal-col="'+i+'"]');if(c)c.textContent=formatQty(totals[i])});
}
function exactSearchMatch(value,query){const a=String(value??"").trim().toLowerCase(),b=String(query??"").trim().toLowerCase();if(!b)return true;if(a===b)return true;const na=Number(a),nb=Number(b);return Number.isFinite(na)&&Number.isFinite(nb)&&a!==""&&b!==""&&na===nb}
function filterTable(tableId,query,mode="exact"){
 const table=document.getElementById(tableId);if(!table)return;const q=String(query||"").trim().toLowerCase();
 table.querySelectorAll("tbody tr").forEach(tr=>{if(!q){tr.style.display="";return}const cells=[...tr.cells];const isMatch=cells.some((cell,i)=>{if(tableId==="entryTable"&&i===cells.length-1)return false;const value=String(cell.textContent??"").trim().toLowerCase();return mode==="contains"?value.includes(q):exactSearchMatch(value,q)});tr.style.display=isMatch?"":"none"});
 const qtyCols=(table.dataset.subtotalCols||"").split(",").map(x=>Number(x)).filter(Number.isInteger);updateTableSubtotals(tableId,qtyCols);
}
function autoFilterTable(tableId,query){filterTable(tableId,query,"contains")}
function exportTableExcel(tableId,fileTitle){
 const table=document.getElementById(tableId);if(!table)return;const clone=table.cloneNode(true);
 clone.querySelectorAll("tr").forEach(tr=>{if(tr.cells.length){const last=tr.cells[tr.cells.length-1];if(last.textContent.trim()==="Actions"||last.querySelector(".edit,.del"))tr.deleteCell(tr.cells.length-1)}});
 const htmlDoc='<!DOCTYPE html><html><head><meta charset="UTF-8"><style>table{border-collapse:collapse}th,td{border:1px solid #999;padding:5px}th{font-weight:bold}</style></head><body>'+clone.outerHTML+'</body></html>';
 const blob=new Blob(["\ufeff",htmlDoc],{type:"application/vnd.ms-excel"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=titleCaseText(fileTitle).replace(/[^A-Za-z0-9]+/g,"_")+".xls";a.style.display="none";document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(url);a.remove()},1000);
}
document.addEventListener("input",e=>{if(e.target.matches('input[type="text"]'))e.target.value=titleCaseText(e.target.value)});

function sagBackupStamp(){const d=new Date(),p=n=>String(n).padStart(2,"0");return d.getFullYear()+"-"+p(d.getMonth()+1)+"-"+p(d.getDate())+"_"+p(d.getHours())+"-"+p(d.getMinutes())+"-"+p(d.getSeconds())}
function sagDownload(blob,name){const u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000)}
function sagFullJsonBackup(){try{save();const snapshot=cloneERPData(),payload={backupType:"SAG FASHON LTD ERP FULL DATA BACKUP",backupMode:"FULL",backupVersion:"V20-MRR-INVOICE",createdAt:new Date().toISOString(),data:snapshot};sagDownload(new Blob([JSON.stringify(payload,null,2)],{type:"application/json;charset=utf-8"}),"SAG_FASHON_LTD_ERP_FULL_BACKUP_"+sagBackupStamp()+".json");alert("Full JSON Backup Completed Successfully.\n\nAll ERP data, including Loose Yarn and Additional Info, has been included.")}catch(e){alert("JSON Backup Failed!\n\n"+e.message)}}
function sagFullJsonRestore(input){const f=input.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const p=JSON.parse(r.result),x=normalizeRestoredERP(p&&p.data?p.data:p);if(!confirm("Restore Full ERP Data?\n\nCurrent ERP data will be replaced by the selected backup.")){input.value="";return}D=x;save();alert("Full JSON Restore Completed Successfully.");go("dashboard")}catch(e){alert("JSON Restore Failed!\n\nThe selected file is not a valid SAG FASHON LTD ERP full backup.")}finally{input.value=""}};r.readAsText(f)}
function sagFullExcelBackup(){
 try{
  save();if(typeof XLSX==="undefined"){alert("Excel library is unavailable. Please reload the ERP with internet access.");return}
  const snapshot=cloneERPData(),wb=XLSX.utils.book_new();
  Object.keys(snapshot).forEach(k=>{
   const v=snapshot[k];let rows=[];
   if(k==="additional"&&v&&typeof v==="object"&&!Array.isArray(v)){const fields=ADDITIONAL_FIELDS.filter(field=>Array.isArray(v[field])),maxRows=fields.reduce((n,field)=>Math.max(n,v[field].length),0);rows=Array.from({length:maxRows},(_,i)=>{const row={};fields.forEach(field=>row[field]=String(v[field][i]??""));return row})}
   else if(Array.isArray(v))rows=v;
   else if(v&&typeof v==="object")rows=Object.keys(v).map(field=>({Field:field,Value:Array.isArray(v[field])?JSON.stringify(v[field]):String(v[field]??"")}));
   const ws=rows.length?XLSX.utils.json_to_sheet(rows):XLSX.utils.aoa_to_sheet([["No Data"]]);let s=String(k).replace(/[\\\/\?\*\[\]\:]/g,"_").slice(0,31)||"Data",n=1,o=s;while(wb.SheetNames.includes(s)){const q="_"+n++;s=o.slice(0,31-q.length)+q}XLSX.utils.book_append_sheet(wb,ws,s);
  });
  XLSX.writeFile(wb,"SAG_FASHON_LTD_ERP_FULL_BACKUP_"+sagBackupStamp()+".xlsx");alert("Full Excel Backup Completed Successfully.");
 }catch(e){alert("Excel Backup Failed!\n\n"+e.message)}
}
function sagFullExcelRestore(input){
 const f=input.files[0];if(!f)return;if(typeof XLSX==="undefined"){alert("Excel library is unavailable. Please reload the ERP with internet access.");input.value="";return}
 const r=new FileReader();r.onload=()=>{try{const wb=XLSX.read(r.result,{type:"array"}),x={};wb.SheetNames.forEach(s=>{const rows=XLSX.utils.sheet_to_json(wb.Sheets[s],{defval:""});if(s==="additional"){const a={},hasColumnFormat=rows.length&&Object.keys(rows[0]).some(k=>ADDITIONAL_FIELDS.includes(k));if(hasColumnFormat){ADDITIONAL_FIELDS.forEach(field=>a[field]=rows.map(row=>String(row[field]??"").trim()).filter(Boolean))}else{rows.forEach(row=>{if(row.Field)a[row.Field]=String(row.Value??"").trim()?(()=>{try{return JSON.parse(row.Value)}catch(_){return String(row.Value)}})():[]})}x.additional=a}else{x[s]=rows}});const restored=normalizeRestoredERP(x);if(!confirm("Restore Full Excel ERP Data?\n\nCurrent ERP data will be replaced by the selected backup.")){input.value="";return}D=restored;save();alert("Full Excel Restore Completed Successfully.");go("dashboard")}catch(e){alert("Excel Restore Failed!\n\nThe selected file is not a valid SAG FASHON LTD ERP full backup.")}finally{input.value=""}};r.readAsArrayBuffer(f)
}
function backupRestoreMenu(){
 content.innerHTML='<div class="panel"><h2>Backup & Restore</h2><div class="backupGrid"><div class="backupCard"><h3>JSON Backup / Restore</h3><button class="btn backupAction" onclick="sagFullJsonBackup()">Full JSON Backup</button><button class="btn backupAction secondary" onclick="document.getElementById(\'sagJsonRestore\').click()">Full JSON Restore</button><input id="sagJsonRestore" type="file" accept=".json,application/json" style="display:none" onchange="sagFullJsonRestore(this)"></div><div class="backupCard"><h3>Excel Backup / Restore</h3><button class="btn backupAction" onclick="sagFullExcelBackup()">Full Excel Backup</button><button class="btn backupAction secondary" onclick="document.getElementById(\'sagExcelRestore\').click()">Full Excel Restore</button><input id="sagExcelRestore" type="file" accept=".xlsx,.xls" style="display:none" onchange="sagFullExcelRestore(this)"></div></div><div class="backupWarning"><b>Important:</b> Restore replaces the current ERP data. Keep your backup file safely in Google Drive.</div></div>'
}

const initialPageState=getPageState();
go(initialPageState.page,initialPageState.sub);
googleStartup();