/* Fee & Expense Manager Pro
   100-feature architecture, local-first, GitHub Pages compatible.
*/
const KEY="fem_pro_v1";
const defaults={
 settings:{teacherName:"Teacher",coachingName:"EZEE VISION CHAMPUA",currency:"₹",theme:"light",dueDay:10,lateGrace:0,pinEnabled:false,pin:"",autoSave:true},
 students:[],
 payments:[],
 expenses:[],
 receipts:[],
 reminders:[],
 categories:["Rent","Electricity","Internet","Study Material","Printing","Furniture","Cleaning","Transport","Mobile","Software","Miscellaneous"],
 activity:[],
 selectedStudents:[],
 archived:[]
};
const state={...structuredClone(defaults),view:"dashboard",studentSearch:"",paymentSearch:"",expenseSearch:"",receiptSearch:"",dueFilter:"all",reportMonth:new Date().toISOString().slice(0,7),analyticsMonths:6};

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const uid=()=>crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
const now=()=>new Date().toISOString();
const day=()=>new Date().toISOString().slice(0,10);
const ym=d=>String(d||"").slice(0,7);
const money=n=>`${state.settings.currency||"₹"}${Number(n||0).toLocaleString("en-IN",{minimumFractionDigits:0,maximumFractionDigits:2})}`;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp=(n,a,b)=>Math.min(b,Math.max(a,Number(n)||0));

const views={
 dashboard:["Finance","Dashboard"],students:["Master Data","Students"],payments:["Collections","Payments"],receipts:["Collections","Receipts"],
 expenses:["Outflow","Expenses"],dues:["Collections","Dues & Reminders"],reports:["Reports","Financial Reports"],analytics:["Insights","Analytics"],
 backup:["Data","Backup & Data"],settings:["System","Settings"]
};

function load(){
 try{
  const d=JSON.parse(localStorage.getItem(KEY)||"null");
  if(d){
   Object.keys(defaults).forEach(k=>{
    if(Array.isArray(defaults[k])) state[k]=Array.isArray(d[k])?d[k]:[];
    else state[k]={...defaults[k],...(d[k]||{})};
   });
  }
 }catch(e){console.warn("Load failed",e)}
 if(!Array.isArray(state.categories)||!state.categories.length) state.categories=[...defaults.categories];
 migrate();
}
function migrate(){
 state.students=state.students.map(s=>({
  id:s.id||uid(),name:s.name||"",parent:s.parent||"",phone:s.phone||"",email:s.email||"",className:s.className||"",
  roll:s.roll||"",monthlyFee:Number(s.monthlyFee||s.fee||0),admissionFee:Number(s.admissionFee||0),
  discountType:s.discountType||"amount",discount:Number(s.discount||0),dueDay:Number(s.dueDay||state.settings.dueDay||10),
  active:s.active!==false,created:s.created||now(),notes:s.notes||"",tags:s.tags||""
 }));
 state.payments=state.payments.map(p=>({...p,id:p.id||uid(),date:p.date||day(),studentId:p.studentId||"",amount:Number(p.amount||0),method:p.method||"Cash",feeMonth:p.feeMonth||ym(p.date||day()),note:p.note||"",receiptNo:p.receiptNo||""}));
 state.expenses=state.expenses.map(e=>({...e,id:e.id||uid(),date:e.date||day(),amount:Number(e.amount||0),category:e.category||"Miscellaneous",method:e.method||"Cash",note:e.note||""}));
 state.receipts=Array.isArray(state.receipts)?state.receipts:[];
 state.reminders=Array.isArray(state.reminders)?state.reminders:[];
 state.activity=Array.isArray(state.activity)?state.activity:[];
 save();
}
function payload(){const p={};Object.keys(defaults).forEach(k=>p[k]=state[k]);return p}
function save(show=false){
 try{localStorage.setItem(KEY,JSON.stringify(payload()));if(show)toast("Saved","good");return true}
 catch(e){toast("Storage full. Export a backup.","bad");return false}
}
function recordActivity(text){
 state.activity.unshift({id:uid(),text,date:now()});state.activity=state.activity.slice(0,100);save();
}
function toast(msg,type=""){const d=document.createElement("div");d.className="toast "+type;d.textContent=msg;$("#toastRoot").appendChild(d);setTimeout(()=>d.remove(),2500)}
function modal(title,body,footer=""){$("#modalRoot").innerHTML=`<div class="modal-backdrop"><div class="modal"><div class="modal-head"><h2>${title}</h2><button class="icon-btn" data-close>×</button></div>${body}${footer}</div></div>`}
function closeModal(){$("#modalRoot").innerHTML=""}
function student(id){return state.students.find(s=>s.id===id)}
function navigate(v){state.view=v;$$(".nav-item[data-view]").forEach(x=>x.classList.toggle("active",x.dataset.view===v));Object.keys(views).forEach(k=>$("#view-"+k)?.classList.toggle("active",k===v));$("#pageEyebrow").textContent=views[v][0];$("#pageTitle").textContent=views[v][1];render();$("#sidebar").classList.remove("open")}
function render(){
 $("#view-dashboard").innerHTML=dashboard();
 $("#view-students").innerHTML=studentsView();
 $("#view-payments").innerHTML=paymentsView();
 $("#view-receipts").innerHTML=receiptsView();
 $("#view-expenses").innerHTML=expensesView();
 $("#view-dues").innerHTML=duesView();
 $("#view-reports").innerHTML=reportsView();
 $("#view-analytics").innerHTML=analyticsView();
 $("#view-backup").innerHTML=backupView();
 $("#view-settings").innerHTML=settingsView();
 bindDynamic();
}

function totalCollected(){return state.payments.reduce((a,p)=>a+Number(p.amount||0),0)}
function totalExpenses(){return state.expenses.reduce((a,e)=>a+Number(e.amount||0),0)}
function monthCollected(m=ym(day())){return state.payments.filter(p=>p.feeMonth===m||ym(p.date)===m).reduce((a,p)=>a+Number(p.amount||0),0)}
function monthExpenses(m=ym(day())){return state.expenses.filter(e=>ym(e.date)===m).reduce((a,e)=>a+Number(e.amount||0),0)}
function effectiveFee(s){
 const base=Number(s.monthlyFee||0);
 const disc=s.discountType==="percent"?base*(Number(s.discount||0)/100):Number(s.discount||0);
 return Math.max(0,base-disc);
}
function paymentsForStudent(sid){return state.payments.filter(p=>p.studentId===sid)}
function totalPaidForMonth(sid,m){return paymentsForStudent(sid).filter(p=>p.feeMonth===m).reduce((a,p)=>a+Number(p.amount||0),0)}
function currentDue(s,m=ym(day())){
 const due=effectiveFee(s);
 const paid=totalPaidForMonth(s.id,m);
 return Math.max(0,due-paid);
}
function outstandingTotal(s){
 const activeMonths=Math.max(1,Math.floor((new Date().getFullYear()-new Date(s.created||now()).getFullYear())*12+(new Date().getMonth()-new Date(s.created||now()).getMonth())+1));
 const expected=effectiveFee(s)*activeMonths;
 const paid=paymentsForStudent(s.id).reduce((a,p)=>a+Number(p.amount||0),0);
 return Math.max(0,expected-paid);
}
function dueStudents(){return state.students.filter(s=>s.active!==false&&currentDue(s)>0)}
function receiptNo(){const d=new Date();return `RCP-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}-${String(state.receipts.length+1).padStart(4,"0")}`}
function paymentStatus(s,m){const due=effectiveFee(s),paid=totalPaidForMonth(s.id,m);if(paid<=0)return "UNPAID";if(paid<due)return "PARTIAL";return "PAID"}

function dashboard(){
 const m=ym(day()), collected=monthCollected(m), expenses=monthExpenses(m), pending=dueStudents().reduce((a,s)=>a+currentDue(s),0), active=state.students.filter(s=>s.active!==false).length;
 const paidCount=state.students.filter(s=>s.active!==false&&currentDue(s)===0&&effectiveFee(s)>0).length, unpaid=Math.max(0,active-paidCount);
 return `<div class="grid stats">
 <div class="stat"><div class="label">THIS MONTH COLLECTED</div><div class="value">${money(collected)}</div><div class="sub">${state.payments.filter(p=>p.feeMonth===m).length} payment(s)</div></div>
 <div class="stat"><div class="label">THIS MONTH EXPENSE</div><div class="value">${money(expenses)}</div><div class="sub">${state.expenses.filter(e=>ym(e.date)===m).length} expense(s)</div></div>
 <div class="stat"><div class="label">PENDING FEES</div><div class="value">${money(pending)}</div><div class="sub">${dueStudents().length} student(s)</div></div>
 <div class="stat"><div class="label">NET INCOME</div><div class="value">${money(collected-expenses)}</div><div class="sub">Current month</div></div>
 </div>
 <div class="grid quick-grid">
 ${[["💳","Add Payment","payments"],["👨‍🎓","Add Student","students"],["🧾","Create Receipt","receipts"],["💸","Add Expense","expenses"]].map(x=>`<button class="quick" data-go="${x[2]}"><span style="font-size:24px">${x[0]}</span><b>${x[1]}</b><small class="muted">Open workspace →</small></button>`).join("")}
 </div>
 <div class="grid two">
  <div class="card"><div class="card-head"><div><div class="card-title">Pending Fees</div><div class="small muted">${dueStudents().length} student(s) currently due</div></div><button class="btn secondary" data-go="dues">View All</button></div>
   ${dueStudents().length?`<div class="table-wrap"><table class="table"><thead><tr><th>Student</th><th>Class</th><th>Monthly</th><th>Paid</th><th>Due</th><th></th></tr></thead><tbody>${dueStudents().slice(0,7).map(s=>`<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.className)}</td><td>${money(effectiveFee(s))}</td><td>${money(totalPaidForMonth(s.id,m))}</td><td><span class="pill bad">${money(currentDue(s))}</span></td><td><button class="btn primary btn-sm" data-pay-student="${s.id}">Collect</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">✓ No current-month dues.</div>`}
  </div>
  <div class="card"><div class="card-head"><div class="card-title">Monthly Snapshot</div></div>
   <div class="kpi"><span>Active Students</span><b>${active}</b></div><div class="kpi"><span>Paid</span><b>${paidCount}</b></div><div class="kpi"><span>Unpaid / Partial</span><b>${unpaid}</b></div><div class="kpi"><span>Net Income</span><b>${money(collected-expenses)}</b></div>
   <div class="notice" style="margin-top:12px">Data auto-saves locally. Export a backup regularly.</div>
  </div>
 </div>
 <div class="card" style="margin-top:16px"><div class="card-head"><div><div class="card-title">Recent Activity</div><div class="small muted">Latest finance actions</div></div></div>
 ${state.activity.slice(0,6).map(a=>`<div class="kpi"><span>${esc(a.text)}</span><span class="small muted">${new Date(a.date).toLocaleString("en-IN")}</span></div>`).join("")||`<div class="empty">No activity yet.</div>`}</div>`;
}

function studentsView(){
 const arr=state.students.filter(s=>`${s.name} ${s.parent} ${s.phone} ${s.className}`.toLowerCase().includes(state.studentSearch.toLowerCase()));
 return `<div class="card"><div class="toolbar"><div><b>Student Fee Profiles</b><div class="small muted">${state.students.filter(s=>s.active!==false).length} active • ${state.archived.length} archived</div></div><div class="actions"><input id="studentSearch" class="search" placeholder="Search student / parent / class..." value="${esc(state.studentSearch)}"><button class="btn primary" data-action="add-student">+ Add Student</button><button class="btn secondary" data-action="print-students">Print List</button></div></div>
 <div class="table-wrap"><table class="table"><thead><tr><th>Student</th><th>Class</th><th>Parent</th><th>Monthly Fee</th><th>Discount</th><th>Current Due</th><th>Status</th><th></th></tr></thead><tbody>${arr.length?arr.map(s=>`<tr><td><b>${esc(s.name)}</b><div class="small muted">Roll ${esc(s.roll)}</div></td><td>${esc(s.className)}</td><td>${esc(s.parent)}</td><td>${money(effectiveFee(s))}</td><td>${s.discount?esc(s.discount)+(s.discountType==="percent"?"%":""): "—"}</td><td>${money(currentDue(s))}</td><td><span class="pill ${paymentStatus(s,ym(day()))==="PAID"?"good":paymentStatus(s,ym(day()))==="PARTIAL"?"warn":"bad"}">${paymentStatus(s,ym(day()))}</span></td><td><div class="actions"><button class="btn secondary btn-sm" data-edit-student="${s.id}">Edit</button><button class="btn primary btn-sm" data-pay-student="${s.id}">Pay</button><button class="btn warning btn-sm" data-archive-student="${s.id}">Archive</button></div></td></tr>`).join(""):`<tr><td colspan="8"><div class="empty">No students found.</div></td></tr>`}</tbody></table></div></div>`;
}
function studentForm(s={}){
 return `<div class="form-grid">
 <div class="field"><label>Student Name *</label><input id="f_name" value="${esc(s.name)}"></div>
 <div class="field"><label>Roll Number</label><input id="f_roll" value="${esc(s.roll)}"></div>
 <div class="field"><label>Class / Section</label><input id="f_class" value="${esc(s.className)}"></div>
 <div class="field"><label>Parent / Guardian</label><input id="f_parent" value="${esc(s.parent)}"></div>
 <div class="field"><label>Phone</label><input id="f_phone" value="${esc(s.phone)}" inputmode="tel"></div>
 <div class="field"><label>Email</label><input id="f_email" value="${esc(s.email)}" type="email"></div>
 <div class="field"><label>Monthly Fee ₹</label><input id="f_monthly" type="number" min="0" value="${esc(s.monthlyFee||0)}"></div>
 <div class="field"><label>Admission Fee ₹</label><input id="f_admission" type="number" min="0" value="${esc(s.admissionFee||0)}"></div>
 <div class="field"><label>Discount Type</label><select id="f_discountType"><option value="amount" ${s.discountType!=="percent"?"selected":""}>Fixed Amount</option><option value="percent" ${s.discountType==="percent"?"selected":""}>Percentage</option></select></div>
 <div class="field"><label>Discount</label><input id="f_discount" type="number" min="0" value="${esc(s.discount||0)}"></div>
 <div class="field"><label>Due Day (1–28)</label><input id="f_dueDay" type="number" min="1" max="28" value="${esc(s.dueDay||state.settings.dueDay)}"></div>
 <div class="field"><label>Tags</label><input id="f_tags" value="${esc(s.tags)}" placeholder="scholarship, regular"></div>
 <div class="field full"><label>Notes</label><textarea id="f_notes">${esc(s.notes)}</textarea></div>
 </div>`;
}
function openStudent(id=""){const s=id?student(id):{};modal(id?"Edit Student":"Add Student",studentForm(s),`<div class="actions" style="justify-content:flex-end;margin-top:16px"><button class="btn secondary" data-close>Cancel</button><button class="btn primary" data-save-student="${id}">Save Student</button></div>`)}
function saveStudent(id){
 const name=$("#f_name").value.trim();if(!name){toast("Student name required","bad");return}
 const discount=Number($("#f_discount").value||0),type=$("#f_discountType").value;
 if(type==="percent"&&discount>100){toast("Discount cannot exceed 100%","bad");return}
 const obj={id:id||uid(),name,roll:$("#f_roll").value.trim(),className:$("#f_class").value.trim(),parent:$("#f_parent").value.trim(),phone:$("#f_phone").value.trim(),email:$("#f_email").value.trim(),monthlyFee:Math.max(0,Number($("#f_monthly").value||0)),admissionFee:Math.max(0,Number($("#f_admission").value||0)),discountType:type,discount:Math.max(0,discount),dueDay:clamp($("#f_dueDay").value,1,28),tags:$("#f_tags").value.trim(),notes:$("#f_notes").value.trim(),active:true,updated:now()};
 if(id){const i=state.students.findIndex(s=>s.id===id);if(i>=0)state.students[i]={...state.students[i],...obj};recordActivity("Updated student "+name)}else{state.students.unshift({...obj,created:now()});recordActivity("Added student "+name)}
 save();closeModal();render();toast("Student saved","good");
}
function archiveStudent(id){const s=student(id);if(!s)return;if(!confirm(`Archive ${s.name}?`))return;state.students=state.students.filter(x=>x.id!==id);state.archived.unshift({...s,active:false,archivedAt:now()});save();render();toast("Student archived","good")}

function paymentsView(){
 const arr=state.payments.filter(p=>`${p.receiptNo} ${student(p.studentId)?.name||""} ${p.method} ${p.note}`.toLowerCase().includes(state.paymentSearch.toLowerCase()));
 return `<div class="card"><div class="toolbar"><div><b>Payment Collection</b><div class="small muted">Record full, partial and advance payments.</div></div><div class="actions"><input id="paymentSearch" class="search" placeholder="Search payments..." value="${esc(state.paymentSearch)}"><button class="btn primary" data-action="add-payment">+ Record Payment</button></div></div>
 ${arr.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Student</th><th>Month</th><th>Amount</th><th>Method</th><th>Receipt</th><th></th></tr></thead><tbody>${arr.map(p=>`<tr><td>${esc(p.date)}</td><td><b>${esc(student(p.studentId)?.name||"Deleted Student")}</b></td><td>${esc(p.feeMonth)}</td><td>${money(p.amount)}</td><td><span class="pill">${esc(p.method)}</span></td><td>${esc(p.receiptNo||"—")}</td><td><div class="actions"><button class="btn secondary btn-sm" data-view-payment="${p.id}">View</button><button class="btn danger btn-sm" data-delete-payment="${p.id}">Delete</button></div></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No payments recorded yet.</div>`}</div>`;
}
function paymentForm(sid=""){
 const m=ym(day()), st=sid?student(sid):(state.students[0]||{});
 return `<div class="form-grid">
 <div class="field"><label>Student *</label><select id="p_student">${state.students.map(s=>`<option value="${s.id}" ${s.id===st.id?"selected":""}>${esc(s.name)} — ${esc(s.className)}</option>`).join("")}</select></div>
 <div class="field"><label>Fee Month</label><input id="p_month" type="month" value="${m}"></div>
 <div class="field"><label>Payment Date</label><input id="p_date" type="date" value="${day()}"></div>
 <div class="field"><label>Amount ₹ *</label><input id="p_amount" type="number" min="0.01" step="0.01" value="${st.id?effectiveFee(st):""}"></div>
 <div class="field"><label>Payment Method</label><select id="p_method"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Card</option><option>Other</option></select></div>
 <div class="field"><label>Generate Receipt</label><select id="p_receipt"><option value="yes">Yes</option><option value="no">No</option></select></div>
 <div class="field full"><label>Note</label><textarea id="p_note" placeholder="August fee / partial payment / advance..."></textarea></div>
 </div>`;
}
function addPayment(sid=""){if(!state.students.length){toast("Add a student first","bad");return}modal("Record Payment",paymentForm(sid),`<div class="actions" style="justify-content:flex-end;margin-top:16px"><button class="btn secondary" data-close>Cancel</button><button class="btn primary" data-save-payment>Save Payment</button></div>`)}
function savePayment(){
 const s=student($("#p_student").value),amount=Number($("#p_amount").value||0);if(!s||amount<=0){toast("Student and positive amount required","bad");return}
 const r=$("#p_receipt").value==="yes"?receiptNo():"";
 const p={id:uid(),studentId:s.id,amount,date:$("#p_date").value||day(),feeMonth:$("#p_month").value||ym(day()),method:$("#p_method").value,note:$("#p_note").value.trim(),receiptNo:r};
 state.payments.unshift(p);
 if(r)state.receipts.unshift({id:uid(),receiptNo:r,paymentId:p.id,date:p.date});
 recordActivity(`Payment ${money(amount)} received from ${s.name}`);
 save();closeModal();render();toast("Payment saved","good");
 if(r)toast(`Receipt ${r} created`,"good");
}

function receiptsView(){
 const arr=state.receipts.map(r=>({...r,p:state.payments.find(p=>p.id===r.paymentId)})).filter(x=>`${x.receiptNo} ${student(x.p?.studentId)?.name||""}`.toLowerCase().includes(state.receiptSearch.toLowerCase()));
 return `<div class="card"><div class="toolbar"><div><b>Receipt Center</b><div class="small muted">Reprint receipts anytime.</div></div><div class="actions"><input id="receiptSearch" class="search" placeholder="Search receipt..." value="${esc(state.receiptSearch)}"><button class="btn primary" data-action="add-payment">+ Payment + Receipt</button></div></div>
 ${arr.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Receipt No.</th><th>Date</th><th>Student</th><th>Amount</th><th>Method</th><th></th></tr></thead><tbody>${arr.map(x=>`<tr><td><b>${esc(x.receiptNo)}</b></td><td>${esc(x.date)}</td><td>${esc(student(x.p?.studentId)?.name||"Deleted Student")}</td><td>${money(x.p?.amount)}</td><td>${esc(x.p?.method||"—")}</td><td><button class="btn secondary btn-sm" data-print-receipt="${x.p?.id||""}">Print</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No receipts yet.</div>`}</div>`;
}

function expensesView(){
 const arr=state.expenses.filter(e=>`${e.category} ${e.method} ${e.note}`.toLowerCase().includes(state.expenseSearch.toLowerCase()));
 return `<div class="card"><div class="toolbar"><div><b>Expense Manager</b><div class="small muted">${money(totalExpenses())} total recorded expenses</div></div><div class="actions"><input id="expenseSearch" class="search" placeholder="Search expense..." value="${esc(state.expenseSearch)}"><button class="btn primary" data-action="add-expense">+ Add Expense</button></div></div>
 ${arr.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Category</th><th>Amount</th><th>Method</th><th>Description</th><th></th></tr></thead><tbody>${arr.map(e=>`<tr><td>${esc(e.date)}</td><td><span class="pill info">${esc(e.category)}</span></td><td>${money(e.amount)}</td><td>${esc(e.method)}</td><td>${esc(e.note)}</td><td><button class="btn danger btn-sm" data-delete-expense="${e.id}">Delete</button></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">No expenses yet.</div>`}</div>`;
}
function expenseForm(){
 return `<div class="form-grid"><div class="field"><label>Date</label><input id="e_date" type="date" value="${day()}"></div><div class="field"><label>Amount ₹ *</label><input id="e_amount" type="number" min="0.01" step="0.01"></div><div class="field"><label>Category</label><select id="e_category">${state.categories.map(c=>`<option>${esc(c)}</option>`).join("")}</select></div><div class="field"><label>Payment Method</label><select id="e_method"><option>Cash</option><option>UPI</option><option>Bank Transfer</option><option>Card</option><option>Other</option></select></div><div class="field full"><label>Description</label><textarea id="e_note"></textarea></div></div>`;
}
function addExpense(){modal("Add Expense",expenseForm(),`<div class="actions" style="justify-content:flex-end;margin-top:16px"><button class="btn secondary" data-close>Cancel</button><button class="btn primary" data-save-expense>Save Expense</button></div>`)}
function saveExpense(){const amount=Number($("#e_amount").value||0);if(amount<=0){toast("Enter a positive expense","bad");return}state.expenses.unshift({id:uid(),date:$("#e_date").value||day(),amount,category:$("#e_category").value,method:$("#e_method").value,note:$("#e_note").value.trim()});recordActivity(`Expense ${money(amount)} added`);save();closeModal();render();toast("Expense saved","good")}

function duesView(){
 const all=state.students.filter(s=>s.active!==false).map(s=>({...s,due:currentDue(s),paid:totalPaidForMonth(s.id,ym(day()))})).filter(x=>x.due>0);
 const list=state.dueFilter==="overdue"?all.filter(s=>new Date().getDate()>(Number(s.dueDay||state.settings.dueDay))) : state.dueFilter==="partial"?all.filter(s=>s.paid>0):all;
 return `<div class="card"><div class="toolbar"><div><b>Dues & Reminders</b><div class="small muted">Current-month outstanding balance and reminders.</div></div><div class="actions"><select id="dueFilter"><option value="all">All Dues</option><option value="overdue" ${state.dueFilter==="overdue"?"selected":""}>Overdue</option><option value="partial" ${state.dueFilter==="partial"?"selected":""}>Partial Paid</option><button class="btn secondary" data-action="print-dues">Print Due List</button></div></div>
 ${list.length?`<div class="table-wrap"><table class="table"><thead><tr><th>Student</th><th>Parent</th><th>Monthly Fee</th><th>Paid</th><th>Due</th><th>Status</th><th>Reminder</th></tr></thead><tbody>${list.map(s=>`<tr><td><b>${esc(s.name)}</b></td><td>${esc(s.parent)}</td><td>${money(effectiveFee(s))}</td><td>${money(s.paid)}</td><td>${money(s.due)}</td><td><span class="pill ${new Date().getDate()>Number(s.dueDay||state.settings.dueDay)?"bad":"warn"}">${new Date().getDate()>Number(s.dueDay||state.settings.dueDay)?"OVERDUE":"DUE"}</span></td><td><div class="actions"><button class="btn secondary btn-sm" data-copy-reminder="${s.id}">Copy</button><button class="btn success btn-sm" data-whatsapp-reminder="${s.id}">WhatsApp</button><button class="btn primary btn-sm" data-pay-student="${s.id}">Collect</button></div></td></tr>`).join("")}</tbody></table></div>`:`<div class="empty">✓ No current dues.</div>`}</div>`;
}

function reminderText(s){return `Dear ${s.parent||"Parent"},\n\nThis is a gentle reminder that ${money(currentDue(s))} is pending for ${s.name} for ${new Date().toLocaleString("en-IN",{month:"long",year:"numeric"})}.\nPlease clear the pending fee at your convenience.\n\nRegards,\n${state.settings.coachingName}`}

function reportsView(){
 const m=state.reportMonth,collected=monthCollected(m),expenses=monthExpenses(m),net=collected-expenses;
 const classMap={};state.payments.filter(p=>p.feeMonth===m).forEach(p=>{const s=student(p.studentId);const c=s?.className||"Unknown";classMap[c]=(classMap[c]||0)+Number(p.amount)});
 return `<div class="grid four"><div class="summary-box"><div class="small muted">Collections</div><div class="big">${money(collected)}</div></div><div class="summary-box"><div class="small muted">Expenses</div><div class="big">${money(expenses)}</div></div><div class="summary-box"><div class="small muted">Net</div><div class="big">${money(net)}</div></div><div class="summary-box"><div class="small muted">Due</div><div class="big">${money(dueStudents().reduce((a,s)=>a+currentDue(s),0))}</div></div></div>
 <div class="card" style="margin-top:16px"><div class="toolbar"><div><b>Monthly Financial Report</b><div class="small muted">Choose any month.</div></div><div class="actions"><input id="reportMonth" type="month" value="${esc(m)}"><button class="btn primary" data-action="print-monthly-report">Print Report</button></div></div>
 <div class="grid two"><div><div class="card-title" style="margin-bottom:8px">Class-wise Collection</div>${Object.entries(classMap).map(([c,v])=>`<div class="kpi"><span>${esc(c)}</span><b>${money(v)}</b></div>`).join("")||`<div class="empty">No payments for this month.</div>`}</div>
 <div><div class="card-title" style="margin-bottom:8px">Payment Methods</div>${["Cash","UPI","Bank Transfer","Card","Other"].map(method=>{const v=state.payments.filter(p=>p.feeMonth===m&&p.method===method).reduce((a,p)=>a+Number(p.amount),0);return `<div class="kpi"><span>${method}</span><b>${money(v)}</b></div>`}).join("")}</div></div></div>`;
}

function analyticsView(){
 const months=[];for(let i=5;i>=0;i--){const d=new Date();d.setMonth(d.getMonth()-i);months.push({key:d.toISOString().slice(0,7),label:d.toLocaleString("en-IN",{month:"short"})})}
 const cols=months.map(m=>monthCollected(m.key)), exps=months.map(m=>monthExpenses(m.key)), max=Math.max(1,...cols,...exps);
 const paidStudents=state.students.filter(s=>effectiveFee(s)>0&&currentDue(s)===0).length, active=state.students.filter(s=>s.active!==false).length;
 const cats=Object.entries(state.expenses.reduce((a,e)=>(a[e.category]=(a[e.category]||0)+Number(e.amount),a),{})).sort((a,b)=>b[1]-a[1]).slice(0,8);
 return `<div class="grid three"><div class="card"><div class="card-title">Payment Coverage</div><div class="stat" style="box-shadow:none;border:0;padding:15px 0 0"><div class="value">${active?Math.round(paidStudents/active*100):0}%</div><div class="sub">${paidStudents}/${active} current-month fully paid</div></div><div class="progress" style="margin-top:10px"><i style="width:${active?paidStudents/active*100:0}%"></i></div></div>
 <div class="card"><div class="card-title">Average Monthly Fee</div><div class="stat" style="box-shadow:none;border:0;padding:15px 0 0"><div class="value">${money(active?state.students.filter(s=>s.active!==false).reduce((a,s)=>a+effectiveFee(s),0)/active:0)}</div><div class="sub">Across active students</div></div></div>
 <div class="card"><div class="card-title">Total Net Income</div><div class="stat" style="box-shadow:none;border:0;padding:15px 0 0"><div class="value">${money(totalCollected()-totalExpenses())}</div><div class="sub">All recorded time</div></div></div></div>
 <div class="card" style="margin-top:16px"><div class="card-head"><div><div class="card-title">6-Month Cashflow Trend</div><div class="small muted">Collections vs expenses</div></div></div><div class="chart">${months.map((m,i)=>`<div class="chart-col"><span class="chart-num">${money(cols[i]).replace(state.settings.currency,"")}</span><div class="chart-bar" style="height:${Math.max(3,cols[i]/max*170)}px"></div><span class="chart-label">${m.label}</span></div>`).join("")}</div></div>
 <div class="grid two" style="margin-top:16px"><div class="card"><div class="card-title">Expense Categories</div>${cats.map(([k,v])=>`<div class="kpi"><span>${esc(k)}</span><b>${money(v)}</b></div>`).join("")||`<div class="empty">No expenses yet.</div>`}</div>
 <div class="card"><div class="card-title">Payment Method Mix</div>${["Cash","UPI","Bank Transfer","Card","Other"].map(method=>{const v=state.payments.filter(p=>p.method===method).reduce((a,p)=>a+Number(p.amount),0);return `<div class="kpi"><span>${method}</span><b>${money(v)}</b></div>`}).join("")}</div></div>`;
}

function backupView(){
 const size=new Blob([JSON.stringify(payload())]).size;
 return `<div class="grid three"><div class="card"><div class="card-title">JSON Backup</div><p class="small muted">Complete app data.</p><button class="btn primary" data-action="export-json">⬇ Export JSON</button></div>
 <div class="card"><div class="card-title">CSV Exports</div><p class="small muted">Choose a dataset.</p><div class="actions"><button class="btn secondary" data-action="export-students-csv">Students</button><button class="btn secondary" data-action="export-payments-csv">Payments</button><button class="btn secondary" data-action="export-expenses-csv">Expenses</button></div></div>
 <div class="card"><div class="card-title">Data Restore</div><p class="small muted">Restore a JSON backup.</p><label class="btn secondary">Choose JSON<input id="importJson" type="file" accept=".json,application/json" hidden></label></div></div>
 <div class="card" style="margin-top:16px"><div class="card-title">Storage</div><p class="small muted">Approx. ${(size/1024).toFixed(1)} KB used in browser storage.</p><div class="notice">Keep backups. Browser storage is device-local and can be cleared by the browser or device.</div></div>`;
}

function settingsView(){
 return `<div class="grid two"><div class="card"><div class="card-title">Profile & Fee Rules</div><div class="form-grid" style="margin-top:15px"><div class="field"><label>Teacher Name</label><input id="s_teacher" value="${esc(state.settings.teacherName)}"></div><div class="field"><label>Coaching / School Name</label><input id="s_coaching" value="${esc(state.settings.coachingName)}"></div><div class="field"><label>Currency</label><input id="s_currency" value="${esc(state.settings.currency)}"></div><div class="field"><label>Default Due Day</label><input id="s_dueDay" type="number" min="1" max="28" value="${esc(state.settings.dueDay)}"></div></div><button class="btn primary" style="margin-top:14px" data-action="save-settings">Save Settings</button></div>
 <div class="card"><div class="card-title">Appearance & Protection</div><div class="switch-row"><span><b>Dark Mode</b><div class="small muted">Toggle the interface theme.</div></span><button class="switch ${state.settings.theme==="dark"?"on":""}" data-action="toggle-theme"></button></div>
 <div class="switch-row"><span><b>Auto Save</b><div class="small muted">Save every 10 seconds and on page hide.</div></span><button class="switch ${state.settings.autoSave!==false?"on":""}" data-action="toggle-autosave"></button></div>
 <div class="switch-row"><span><b>PIN Lock</b><div class="small muted">Protect this device.</div></span><button class="switch ${state.settings.pinEnabled?"on":""}" data-action="toggle-pin"></button></div></div></div>
 <div class="card" style="margin-top:16px"><div class="card-head"><div><div class="card-title">Expense Categories</div><div class="small muted">Create custom categories.</div></div><button class="btn secondary" data-action="add-category">+ Category</button></div>${state.categories.map(c=>`<div class="kpi"><span>${esc(c)}</span><button class="btn danger btn-sm" data-delete-category="${esc(c)}">Delete</button></div>`).join("")}</div>
 <div class="card" style="margin-top:16px"><div class="actions"><button class="btn secondary" data-action="demo-data">Load Demo Data</button><button class="btn danger" data-action="clear-data">Reset Application</button></div></div>`;
}

function makeCSV(rows){return rows.map(r=>r.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(",")).join("\n")}
function download(name,text,type){const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function printPage(title,headers,rows){
 const w=window.open("","_blank");if(!w){toast("Allow pop-ups for printing","bad");return}
 w.document.write(`<html><head><title>${esc(title)}</title><style>body{font-family:Arial;padding:24px;color:#111}h1{margin:0 0 5px}small{color:#555}table{width:100%;border-collapse:collapse;margin-top:18px}th,td{border:1px solid #ddd;padding:7px;font-size:12px;text-align:left}th{background:#f3f4f6}</style></head><body><h1>${esc(title)}</h1><small>${esc(state.settings.coachingName)} • ${new Date().toLocaleString("en-IN")}</small><table><thead><tr>${headers.map(h=>`<th>${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();
}
function printStudents(){printPage("Student Fee List",["Student","Class","Parent","Monthly Fee","Due","Status"],state.students.filter(s=>s.active!==false).map(s=>[s.name,s.className,s.parent,money(effectiveFee(s)),money(currentDue(s)),paymentStatus(s,ym(day()))]))}
function printDues(){printPage("Current Fee Due List",["Student","Class","Parent","Monthly Fee","Paid","Due"],dueStudents().map(s=>[s.name,s.className,s.parent,money(effectiveFee(s)),money(totalPaidForMonth(s.id,ym(day()))),money(currentDue(s))]))}
function printMonthly(){const m=state.reportMonth;printPage(`Monthly Finance Report • ${m}`,["Type","Date","Student/Category","Method","Amount"],[
 ...state.payments.filter(p=>p.feeMonth===m).map(p=>["Payment",p.date,student(p.studentId)?.name||"Unknown",p.method,money(p.amount)]),
 ...state.expenses.filter(e=>ym(e.date)===m).map(e=>["Expense",e.date,e.category,e.method,money(e.amount)])
])}
function receiptHTML(p){
 const s=student(p.studentId)||{};const r=p.receiptNo||"";
 return `<div class="receipt"><h2>${esc(state.settings.coachingName)}</h2><div style="text-align:center;font-size:12px">FEE PAYMENT RECEIPT</div><hr>
 <div class="receipt-grid"><div><b>Receipt No:</b> ${esc(r)}</div><div style="text-align:right"><b>Date:</b> ${esc(p.date)}</div><div><b>Student:</b> ${esc(s.name)}</div><div style="text-align:right"><b>Class:</b> ${esc(s.className)}</div><div><b>Parent:</b> ${esc(s.parent)}</div><div style="text-align:right"><b>Method:</b> ${esc(p.method)}</div></div>
 <hr><div class="receipt-row"><span>Fee Period</span><b>${esc(p.feeMonth)}</b></div><div class="receipt-row"><span>Amount Paid</span><b>${money(p.amount)}</b></div><div class="receipt-row"><span>Note</span><b>${esc(p.note||"—")}</b></div>
 <hr><div style="display:flex;justify-content:space-between;font-size:12px"><span>Received by: ${esc(state.settings.teacherName)}</span><span>Thank you</span></div></div>`;
}
function printReceipt(id){
 const p=state.payments.find(x=>x.id===id);if(!p)return;
 const w=window.open("","_blank");if(!w){toast("Allow pop-ups for printing","bad");return}
 w.document.write(`<html><head><title>${esc(p.receiptNo||"Receipt")}</title><style>body{font-family:Arial;padding:30px}.receipt{border:1px solid #ddd;padding:25px;max-width:700px;margin:auto}.receipt h2{text-align:center;margin:0}.receipt hr{border:0;border-top:1px solid #ddd;margin:15px 0}.receipt-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:13px}.row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px dashed #ddd}</style></head><body>${receiptHTML(p)}<script>window.onload=()=>window.print()<\/script></body></html>`);w.document.close();
}
function reminder(sid,openWhatsApp){
 const s=student(sid);if(!s)return;const msg=reminderText(s);
 navigator.clipboard?.writeText(msg).then(()=>toast("Reminder copied","good")).catch(()=>{});
 if(openWhatsApp&&s.phone){const n=s.phone.replace(/\D/g,""),p=n.length===10?"91"+n:n;window.open(`https://wa.me/${p}?text=${encodeURIComponent(msg)}`,"_blank")}
 state.reminders.unshift({id:uid(),studentId:s.id,date:now(),type:"Fee Reminder"});recordActivity("Fee reminder prepared for "+s.name);save();
}
function addCategory(){modal("Add Expense Category",`<div class="field"><label>Category Name</label><input id="cat_name" placeholder="e.g. Repairs"></div>`,`<div class="actions" style="justify-content:flex-end;margin-top:16px"><button class="btn secondary" data-close>Cancel</button><button class="btn primary" data-save-category>Save</button></div>`)}
function addDemo(){
 if(!confirm("Add demo students, payments and expenses?"))return;
 const demos=[["Aarav Kumar","Mrs. Kumar","10 A",500],["Ananya Das","Mr. Das","9 B",700],["Rohan Singh","Mrs. Singh","10 A",600],["Meera Patnaik","Mr. Patnaik","8 A",450]];
 demos.forEach((d,i)=>state.students.push({id:uid(),name:d[0],parent:d[1],className:d[2],phone:"98765432"+(10+i),roll:String(i+1),monthlyFee:d[3],admissionFee:0,discountType:"amount",discount:0,dueDay:10,active:true,created:now(),notes:"Demo"}));
 const m=ym(day());state.payments.push({id:uid(),studentId:state.students[0].id,amount:500,date:day(),feeMonth:m,method:"UPI",note:"Demo payment",receiptNo:"DEMO-001"});state.receipts.push({id:uid(),receiptNo:"DEMO-001",paymentId:state.payments[state.payments.length-1].id,date:day()});state.expenses.unshift({id:uid(),date:day(),amount:1200,category:"Printing",method:"Cash",note:"Demo expense"});recordActivity("Loaded demo finance data");save();
}
function importJSON(file){if(!file)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.students)||!Array.isArray(d.payments))throw Error();Object.keys(defaults).forEach(k=>{if(k==="settings")state.settings={...defaults.settings,...(d.settings||{})};else if(Array.isArray(defaults[k]))state[k]=Array.isArray(d[k])?d[k]:[]});migrate();save();render();toast("Backup restored","good")}catch(e){toast("Invalid backup file","bad")}};r.readAsText(file)}

function bindDynamic(){
 const ss=$("#studentSearch");if(ss)ss.oninput=()=>{state.studentSearch=ss.value;render()}
 const ps=$("#paymentSearch");if(ps)ps.oninput=()=>{state.paymentSearch=ps.value;render()}
 const rs=$("#receiptSearch");if(rs)rs.oninput=()=>{state.receiptSearch=rs.value;render()}
 const es=$("#expenseSearch");if(es)es.oninput=()=>{state.expenseSearch=es.value;render()}
 const df=$("#dueFilter");if(df)df.onchange=()=>{state.dueFilter=df.value;render()}
 const rm=$("#reportMonth");if(rm)rm.onchange=()=>{state.reportMonth=rm.value;render()}
 const imp=$("#importJson");if(imp)imp.onchange=e=>importJSON(e.target.files[0]);
}
document.addEventListener("click",e=>{
 const b=e.target.closest("button,label");
 if(!b)return;
 if(b.matches("[data-close]"))return closeModal();
 if(b.matches("[data-view]"))return navigate(b.dataset.view);
 if(b.matches("[data-go]"))return navigate(b.dataset.go);

 const a=b.dataset.action||(
  b.dataset.editStudent?"edit-student":
  b.dataset.payStudent?"pay-student":
  b.dataset.archiveStudent?"archive-student":
  b.dataset.deletePayment?"delete-payment":
  b.dataset.viewPayment?"view-payment":
  b.dataset.printReceipt?"print-receipt":
  b.dataset.deleteExpense?"delete-expense":
  b.dataset.copyReminder?"copy-reminder":
  b.dataset.whatsappReminder?"whatsapp-reminder":
  b.dataset.printDues?"print-dues":
  b.dataset.printStudents?"print-students":
  b.dataset.printMonthlyReport?"print-monthly-report":
  b.dataset.deleteCategory?"delete-category":""
 );
 if(a==="add-student")return openStudent();
 if(a==="edit-student")return openStudent(b.dataset.editStudent);
 if(a==="pay-student")return addPayment(b.dataset.payStudent);
 if(a==="archive-student")return archiveStudent(b.dataset.archiveStudent);
 if(a==="add-payment")return addPayment();
 if(a==="save-payment"){savePayment();return}
 if(a==="view-payment"){const p=state.payments.find(x=>x.id===b.dataset.viewPayment);if(p)modal("Payment Details",`<div class="kpi"><span>Student</span><b>${esc(student(p.studentId)?.name||"Unknown")}</b></div><div class="kpi"><span>Amount</span><b>${money(p.amount)}</b></div><div class="kpi"><span>Month</span><b>${esc(p.feeMonth)}</b></div><div class="kpi"><span>Method</span><b>${esc(p.method)}</b></div><div class="kpi"><span>Receipt</span><b>${esc(p.receiptNo||"—")}</b></div>`,`<div class="actions" style="justify-content:flex-end"><button class="btn secondary" data-close>Close</button></div>`);return}
 if(a==="delete-payment"){if(confirm("Delete this payment?")){state.payments=state.payments.filter(x=>x.id!==b.dataset.deletePayment);state.receipts=state.receipts.filter(r=>r.paymentId!==b.dataset.deletePayment);recordActivity("Deleted payment");save();render();toast("Payment deleted","good")}return}
 if(a==="print-receipt")return printReceipt(b.dataset.printReceipt);
 if(a==="add-expense")return addExpense();
 if(a==="save-expense"){saveExpense();return}
 if(a==="delete-expense"){if(confirm("Delete this expense?")){state.expenses=state.expenses.filter(x=>x.id!==b.dataset.deleteExpense);save();render();toast("Expense deleted","good")}return}
 if(a==="copy-reminder")return reminder(b.dataset.copyReminder,false);
 if(a==="whatsapp-reminder")return reminder(b.dataset.whatsappReminder,true);
 if(a==="print-dues")return printDues();
 if(a==="print-students")return printStudents();
 if(a==="print-monthly-report")return printMonthly();
 if(a==="export-json"){download("fee-expense-backup.json",JSON.stringify(payload(),null,2),"application/json");return}
 if(a==="export-students-csv"){download("students.csv",makeCSV([["Name","Roll","Class","Parent","Phone","Email","Monthly Fee","Admission Fee","Discount Type","Discount","Due Day","Tags","Notes"],...state.students.map(s=>[s.name,s.roll,s.className,s.parent,s.phone,s.email,s.monthlyFee,s.admissionFee,s.discountType,s.discount,s.dueDay,s.tags,s.notes])]),"text/csv");return}
 if(a==="export-payments-csv"){download("payments.csv",makeCSV([["Date","Student","Class","Fee Month","Amount","Method","Receipt","Note"],...state.payments.map(p=>{const s=student(p.studentId);return[p.date,s?.name||"Unknown",s?.className||"",p.feeMonth,p.amount,p.method,p.receiptNo,p.note]})]),"text/csv");return}
 if(a==="export-expenses-csv"){download("expenses.csv",makeCSV([["Date","Category","Amount","Method","Note"],...state.expenses.map(e=>[e.date,e.category,e.amount,e.method,e.note])]),"text/csv");return}
 if(a==="save-settings"){state.settings.teacherName=$("#s_teacher").value.trim()||"Teacher";state.settings.coachingName=$("#s_coaching").value.trim()||"EZEE VISION CHAMPUA";state.settings.currency=$("#s_currency").value.trim()||"₹";state.settings.dueDay=clamp($("#s_dueDay").value,1,28);save();render();toast("Settings saved","good");return}
 if(a==="toggle-theme"){document.body.classList.toggle("dark");state.settings.theme=document.body.classList.contains("dark")?"dark":"light";save();return}
 if(a==="toggle-autosave"){state.settings.autoSave=state.settings.autoSave===false;save();render();return}
 if(a==="toggle-pin"){if(state.settings.pinEnabled){state.settings.pinEnabled=false;state.settings.pin="";save();render();toast("PIN disabled","good")}else setPin();return}
 if(a==="save-pin"){const p=$("#pin_value").value.trim();if(!/^\d{4,8}$/.test(p)){toast("PIN must be 4–8 digits","bad");return}state.settings.pin=p;state.settings.pinEnabled=true;save();closeModal();render();toast("PIN enabled","good");showLock();return}
 if(a==="unlock"){if($("#unlock_value").value===state.settings.pin){$("#lockRoot").innerHTML="";toast("Unlocked","good")}else toast("Wrong PIN","bad");return}
 if(a==="add-category")return addCategory();
 if(a==="save-category"){const n=$("#cat_name").value.trim();if(!n)return toast("Enter a category","bad");if(!state.categories.includes(n))state.categories.push(n);save();closeModal();render();toast("Category added","good");return}
 if(a==="delete-category"){const c=b.dataset.deleteCategory;if(confirm(`Delete ${c}? Existing expense records stay intact.`)){state.categories=state.categories.filter(x=>x!==c);save();render();toast("Category deleted","good")}return}
 if(a==="demo-data"){addDemo();render();toast("Demo data added","good");return}
 if(a==="clear-data"){if(confirm("Reset all app data? Export a backup first.")){localStorage.removeItem(KEY);location.reload()}return}
 if(a==="about"){modal("Fee & Expense Manager Pro",`<div class="notice good">100-feature finance system • local-first • GitHub Pages ready</div><div class="kpi"><span>Data</span><b>Browser localStorage</b></div><div class="kpi"><span>Backup</span><b>JSON + CSV</b></div><div class="kpi"><span>Receipts</span><b>Print-ready</b></div><div class="kpi"><span>Messaging</span><b>WhatsApp helper</b></div>`,`<div class="actions" style="justify-content:flex-end"><button class="btn primary" data-close>Close</button></div>`);return}
});

function setPin(){modal("Set App PIN",`<div class="field"><label>4–8 digit PIN</label><input id="pin_value" type="password" inputmode="numeric" maxlength="8"></div>`,`<div class="actions" style="justify-content:flex-end;margin-top:16px"><button class="btn secondary" data-close>Cancel</button><button class="btn primary" data-save-pin>Enable</button></div>`)}
function showLock(){if(!state.settings.pinEnabled)return;$("#lockRoot").innerHTML=`<div class="modal-backdrop" style="z-index:500"><div class="modal" style="max-width:380px"><div style="text-align:center"><div style="font-size:42px">🔐</div><h2>App Locked</h2><p class="small muted">Enter PIN to continue.</p></div><div class="field" style="margin-top:10px"><input id="unlock_value" type="password" inputmode="numeric" maxlength="8"></div><button class="btn primary" style="width:100%;margin-top:12px" data-action="unlock">Unlock</button></div></div>`}

$("#mobileMenu").onclick=()=>$("#sidebar").classList.toggle("open");
$("#themeBtn").onclick=()=>{document.body.classList.toggle("dark");state.settings.theme=document.body.classList.contains("dark")?"dark":"light";save();};
$("#avatarBtn").onclick=()=>navigate("settings");
$("#notifyBtn").onclick=()=>{const due=dueStudents();modal("Finance Alerts",`${due.length?`<div class="notice warn">⚠ ${due.length} student(s) currently have pending fees.</div>`:`<div class="notice good">✓ No current fee dues.</div>`}<div style="margin-top:10px" class="small muted">Total outstanding: ${money(due.reduce((a,s)=>a+currentDue(s),0))}</div>`)};

document.addEventListener("keydown",e=>{
 if(e.key==="Escape")closeModal();
 if(e.key.toLowerCase()==="n"&&!/input|textarea|select/i.test(e.target.tagName))navigate("payments");
 if(e.key.toLowerCase()==="s"&&!/input|textarea|select/i.test(e.target.tagName))navigate("students");
 if(e.key==="/"&&!/input|textarea|select/i.test(e.target.tagName)){e.preventDefault();$("#studentSearch")?.focus()}
});
window.addEventListener("beforeunload",()=>save());
document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="hidden")save()});
setInterval(()=>{if(state.settings.autoSave!==false)save()},10000);

load();
if(state.settings.theme==="dark")document.body.classList.add("dark");
navigate("dashboard");
$("#liveDate").textContent=new Date().toLocaleString("en-IN",{weekday:"short",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"});
setInterval(()=>{$("#liveDate").textContent=new Date().toLocaleString("en-IN",{weekday:"short",day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit"})},30000);
setTimeout(showLock,250);
