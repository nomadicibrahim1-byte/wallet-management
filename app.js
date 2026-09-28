const KEY='wallet_app_v1';
let db=JSON.parse(localStorage.getItem(KEY)||'null');
if(!db){db={users:[
{id:1,username:'rahim',password:'1234',name:'Rahim',balance:5000,status:'ACTIVE'},
{id:2,username:'karim',password:'1234',name:'Karim',balance:2500,status:'ACTIVE'}],
transactions:[],withdrawals:[],logs:[]};save();}
let session=JSON.parse(sessionStorage.getItem('session')||'null');

function save(){localStorage.setItem(KEY,JSON.stringify(db))}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
function money(n){return '₹'+Number(n||0).toLocaleString('en-IN')}
function id(prefix){return prefix+Date.now().toString().slice(-8)}
function log(action,target,amount,reason){db.logs.unshift({id:id('LOG'),action,target,amount:amount||0,reason:reason||'',time:new Date().toLocaleString()});save()}

function render(){if(!session)return login();session.role==='admin'?admin():customer()}
function login(){
document.getElementById('app').innerHTML=`<div class="login card">
<h1>Wallet Management</h1><p class="muted">Secure account access</p>
<label>Username</label><input id="u" class="input" placeholder="Username">
<label>Password</label><input id="p" type="password" class="input" placeholder="Password">
<button class="btn" style="width:100%" onclick="doLogin()">Login</button>
<p class="muted">Admin access: admin / admin123</p></div>`}
function doLogin(){
let u=document.getElementById('u').value,p=document.getElementById('p').value;
if(u==='admin'&&p==='admin123'){session={role:'admin',username:'admin'};sessionStorage.setItem('session',JSON.stringify(session));render();return}
let x=db.users.find(a=>a.username===u&&a.password===p);
if(x&&x.status==='ACTIVE'){session={role:'customer',id:x.id};sessionStorage.setItem('session',JSON.stringify(session));render()}else alert('Invalid login or account is blocked')}
function logout(){session=null;sessionStorage.removeItem('session');render()}

function admin(){
let pending=db.withdrawals.filter(x=>x.status==='PENDING').length;
document.getElementById('app').innerHTML=`<div class="top"><div class="brand">Wallet Management</div><button class="btn gray" onclick="logout()">Logout</button></div>
<div class="wrap"><div class="grid">
<div class="card">Total Users<div class="stat">${db.users.length}</div></div>
<div class="card">Total Balance<div class="stat">${money(db.users.reduce((a,b)=>a+b.balance,0))}</div></div>
<div class="card">Pending Withdrawals<div class="stat">${pending}</div></div>
<div class="card">Transactions<div class="stat">${db.transactions.length}</div></div></div>
<div class="nav"><button class="btn active" onclick="admin()">Dashboard</button><button class="btn" onclick="usersPage()">Users</button><button class="btn" onclick="withdrawalsPage()">Withdrawals</button><button class="btn" onclick="transactionsPage()">Transactions</button><button class="btn" onclick="logsPage()">Admin Logs</button></div>
<div id="adminContent"><div class="card"><h2>Quick Actions</h2><button class="btn" onclick="createUserForm()">Create User</button></div></div></div>`}
function usersPage(){
document.getElementById('adminContent').innerHTML=`<div class="card"><div class="row"><h2 style="margin-right:auto">Users</h2><button class="btn" onclick="createUserForm()">+ Create User</button></div>
<table class="table"><tr><th>User</th><th>Balance</th><th>Status</th><th>Actions</th></tr>${db.users.map(u=>`<tr><td>${esc(u.username)}<br><span class="muted">${esc(u.name)}</span></td><td>${money(u.balance)}</td><td><span class="badge ${u.status==='ACTIVE'?'approved':'blocked'}">${u.status}</span></td><td><button class="btn" onclick="adjust(${u.id})">Balance</button> <button class="btn ${u.status==='ACTIVE'?'red':'green'}" onclick="toggleUser(${u.id})">${u.status==='ACTIVE'?'Block':'Unblock'}</button></td></tr>`).join('')}</table></div>`}
function createUserForm(){
document.getElementById('adminContent').innerHTML=`<div class="card"><h2>Create User</h2><input id="nu" class="input" placeholder="Username"><input id="nn" class="input" placeholder="Full Name"><input id="np" class="input" placeholder="Password"><input id="nb" type="number" class="input" placeholder="Initial Balance"><button class="btn" onclick="createUser()">Create User</button></div>`}
function createUser(){
let u=document.getElementById('nu').value.trim(),n=document.getElementById('nn').value.trim(),p=document.getElementById('np').value,b=Number(document.getElementById('nb').value||0);
if(!u||!p||db.users.some(x=>x.username===u))return alert('Username is required and must be unique');
let x={id:Date.now(),username:u,name:n,password:p,balance:b,status:'ACTIVE'};db.users.push(x);log('CREATE_USER',u,b,'Initial balance');save();usersPage();alert('User created')}
function adjust(uid){
let u=db.users.find(x=>x.id===uid);let amount=prompt('Enter amount (positive to add, negative to subtract):','0');if(amount===null)return;
amount=Number(amount);if(!Number.isFinite(amount)||u.balance+amount<0)return alert('Invalid amount');
u.balance+=amount;log('BALANCE_ADJUST',u.username,amount,'Admin balance adjustment');save();usersPage()}
function toggleUser(uid){let u=db.users.find(x=>x.id===uid);u.status=u.status==='ACTIVE'?'BLOCKED':'ACTIVE';log(u.status==='ACTIVE'?'UNBLOCK_USER':'BLOCK_USER',u.username,0,'Admin control');save();usersPage()}
function withdrawalsPage(){
document.getElementById('adminContent').innerHTML=`<div class="card"><h2>Bank Withdrawals</h2><table class="table"><tr><th>Customer</th><th>Amount</th><th>Bank Details</th><th>Status</th><th>Action</th></tr>${db.withdrawals.map(w=>`<tr><td>${esc(w.username)}</td><td>${money(w.amount)}</td><td>${esc(w.bank)}<br>${esc(w.holder)}<br>${esc(w.account)}<br>${esc(w.ifsc)}</td><td><span class="badge ${w.status.toLowerCase()}">${w.status}</span></td><td>${w.status==='PENDING'?`<button class="btn green" onclick="withdrawAction('${w.id}','APPROVED')">Approve</button><button class="btn red" onclick="withdrawAction('${w.id}','REJECTED')">Reject</button><button class="btn gray" onclick="withdrawAction('${w.id}','FROZEN')">Freeze</button>`:'—'}</td></tr>`).join('')}</table></div>`}
function withdrawAction(wid,status){
let w=db.withdrawals.find(x=>x.id===wid),u=db.users.find(x=>x.id===w.userId);
if(status==='APPROVED'){if(u.balance<w.amount)return alert('Insufficient user balance');u.balance-=w.amount}
w.status=status;w.updatedAt=new Date().toLocaleString();log('WITHDRAWAL_'+status,w.username,w.amount,'Admin decision');save();withdrawalsPage()}
function transactionsPage(){
document.getElementById('adminContent').innerHTML=`<div class="card"><h2>Transactions</h2><table class="table"><tr><th>ID</th><th>Sender</th><th>Receiver</th><th>Amount</th><th>Status</th></tr>${db.transactions.map(t=>`<tr><td>${t.id}</td><td>${esc(t.sender)}</td><td>${esc(t.receiver)}</td><td>${money(t.amount)}</td><td>${t.status}</td></tr>`).join('')||'<tr><td colspan="5">No transactions</td></tr>'}</table></div>`}
function logsPage(){
document.getElementById('adminContent').innerHTML=`<div class="card"><h2>Admin Logs</h2><table class="table"><tr><th>Time</th><th>Action</th><th>Target</th><th>Amount</th><th>Reason</th></tr>${db.logs.map(l=>`<tr><td>${l.time}</td><td>${l.action}</td><td>${esc(l.target)}</td><td>${money(l.amount)}</td><td>${esc(l.reason)}</td></tr>`).join('')}</table></div>`}

function customer(){
let u=db.users.find(x=>x.id===session.id);
if(!u||u.status!=='ACTIVE'){return logout()}
document.getElementById('app').innerHTML=`<div class="top"><div class="brand">My Wallet</div><button class="btn gray" onclick="logout()">Logout</button></div>
<div class="wrap"><div class="card"><span class="muted">Available Balance</span><div class="stat">${money(u.balance)}</div><p>Welcome, ${esc(u.name||u.username)}</p></div>
<div class="nav"><button class="btn" onclick="customer()">Dashboard</button><button class="btn" onclick="transferForm()">Transfer</button><button class="btn" onclick="withdrawForm()">Bank Withdrawal</button><button class="btn" onclick="historyPage()">History</button></div>
<div id="customerContent" class="card"><h2>Account Overview</h2><p class="muted">Manage your wallet activity from this panel.</p></div></div>`}
function transferForm(){
document.getElementById('customerContent').innerHTML=`<h2>Transfer Money</h2><input id="to" class="input" placeholder="Receiver Username"><input id="ta" type="number" class="input" placeholder="Amount"><button class="btn" onclick="transfer()">Submit Transfer</button>`}
function transfer(){
let u=db.users.find(x=>x.id===session.id),to=document.getElementById('to').value.trim(),a=Number(document.getElementById('ta').value),r=db.users.find(x=>x.username===to);
if(!r||r.id===u.id||r.status!=='ACTIVE'||a<=0||u.balance<a)return alert('Invalid receiver or amount');
u.balance-=a;r.balance+=a;db.transactions.unshift({id:id('TXN'),sender:u.username,receiver:r.username,amount:a,status:'APPROVED',time:new Date().toLocaleString()});save();alert('Transfer completed');customer()}
function withdrawForm(){
document.getElementById('customerContent').innerHTML=`<h2>Bank Withdrawal</h2><input id="bn" class="input" placeholder="Bank Name"><input id="bh" class="input" placeholder="Account Holder"><input id="ba" class="input" placeholder="Account Number"><input id="ifsc" class="input" placeholder="IFSC"><input id="wa" type="number" class="input" placeholder="Withdrawal Amount"><button class="btn" onclick="requestWithdrawal()">Submit Request</button><div class="notice">Request will remain PENDING until reviewed by Admin.</div>`}
function requestWithdrawal(){
let u=db.users.find(x=>x.id===session.id),a=Number(document.getElementById('wa').value);
if(a<=0||a>u.balance)return alert('Invalid amount');
db.withdrawals.unshift({id:id('WD'),userId:u.id,username:u.username,bank:document.getElementById('bn').value,holder:document.getElementById('bh').value,account:document.getElementById('ba').value,ifsc:document.getElementById('ifsc').value,amount:a,status:'PENDING',time:new Date().toLocaleString()});save();alert('Withdrawal request submitted');customer()}
function historyPage(){
let u=db.users.find(x=>x.id===session.id),tx=db.transactions.filter(t=>t.sender===u.username||t.receiver===u.username),wd=db.withdrawals.filter(w=>w.userId===u.id);
document.getElementById('customerContent').innerHTML=`<h2>Transaction History</h2><table class="table"><tr><th>ID</th><th>Type</th><th>Amount</th><th>Status</th></tr>${tx.map(t=>`<tr><td>${t.id}</td><td>${t.sender===u.username?'Transfer':'Received'}</td><td>${money(t.amount)}</td><td>${t.status}</td></tr>`).join('')}${wd.map(w=>`<tr><td>${w.id}</td><td>Bank Withdrawal</td><td>${money(w.amount)}</td><td>${w.status}</td></tr>`).join('')||''}</table>`}
render();