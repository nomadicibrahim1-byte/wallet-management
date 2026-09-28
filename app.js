// ===============================
// WALLET MANAGEMENT - SUPABASE
// ===============================

const SUPABASE_URL = "https://cdjahwzquvffqucskzbd.supabase.co";

// এখানে আপনার Publishable key বসাবেন
const SUPABASE_KEY = "PASTE_YOUR_PUBLISHABLE_KEY_HERE";

let supabaseClient = null;

async function loadSupabase() {
  if (window.supabase) {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
    return;
  }

  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  script.onload = () => {
    supabaseClient = window.supabase.createClient(
      SUPABASE_URL,
      SUPABASE_KEY
    );
    startApp();
  };

  document.head.appendChild(script);
}

function money(value) {
  return "₹" + Number(value || 0).toLocaleString("en-IN");
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (m) {
    return {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m];
  });
}

function showMessage(message) {
  alert(message);
}

// ===============================
// LOGIN
// ===============================

function showLogin() {
  document.getElementById("app").innerHTML = `
    <div class="login card">
      <h1>Wallet Management</h1>
      <p class="muted">Secure Account Login</p>

      <label>Email</label>
      <input id="loginEmail"
             class="input"
             type="email"
             placeholder="Email">

      <label>Password</label>
      <input id="loginPassword"
             class="input"
             type="password"
             placeholder="Password">

      <button class="btn"
              style="width:100%"
              onclick="loginUser()">
        Login
      </button>
    </div>
  `;
}

async function loginUser() {

  const email =
    document.getElementById("loginEmail").value.trim();

  const password =
    document.getElementById("loginPassword").value;

  if (!email || !password) {
    showMessage("Email এবং Password দিন");
    return;
  }

  const { data, error } =
    await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

  if (error) {
    showMessage(error.message);
    return;
  }

  loadUserPanel(data.user);
}

// ===============================
// LOGOUT
// ===============================

async function logout() {

  await supabaseClient.auth.signOut();

  showLogin();
}

// ===============================
// USER PANEL
// ===============================

async function loadUserPanel(authUser) {

  const { data, error } =
    await supabaseClient
      .from("users")
      .select("*")
      .eq("auth_id", authUser.id)
      .single();

  if (error || !data) {

    document.getElementById("app").innerHTML = `
      <div class="card">
        <h2>Account not found</h2>
        <p>Your account profile is not connected.</p>
        <button class="btn"
                onclick="logout()">
          Logout
        </button>
      </div>
    `;

    return;
  }

  if (data.status !== "ACTIVE") {

    document.getElementById("app").innerHTML = `
      <div class="card">
        <h2>Account Blocked</h2>
        <p>Your account is currently blocked.</p>
        <button class="btn"
                onclick="logout()">
          Logout
        </button>
      </div>
    `;

    return;
  }

  document.getElementById("app").innerHTML = `

    <div class="top">
      <div class="brand">
        Wallet Management
      </div>

      <button class="btn gray"
              onclick="logout()">
        Logout
      </button>
    </div>

    <div class="wrap">

      <div class="card">

        <span class="muted">
          Available Balance
        </span>

        <div class="stat">
          ${money(data.balance)}
        </div>

        <p>
          Welcome,
          ${escapeHTML(data.full_name || data.username)}
        </p>

      </div>

      <div class="nav">

        <button class="btn"
                onclick="loadUserPanel(authUser)">
          Dashboard
        </button>

        <button class="btn"
                onclick="showTransfer()">
          Transfer
        </button>

        <button class="btn"
                onclick="showWithdrawal()">
          Bank Withdrawal
        </button>

        <button class="btn"
                onclick="showHistory()">
          History
        </button>

      </div>

      <div id="customerContent"
           class="card">

        <h2>Account Overview</h2>

        <p class="muted">
          আপনার Wallet account পরিচালনা করুন।
        </p>

      </div>

    </div>
  `;
}

// ===============================
// TRANSFER
// ===============================

function showTransfer() {

  document.getElementById("customerContent").innerHTML = `

    <h2>Transfer Money</h2>

    <input id="receiver"
           class="input"
           placeholder="Receiver Username">

    <input id="transferAmount"
           class="input"
           type="number"
           placeholder="Amount">

    <button class="btn"
            onclick="transferMoney()">
      Submit Transfer
    </button>
  `;
}

async function transferMoney() {

  const receiver =
    document.getElementById("receiver").value.trim();

  const amount =
    Number(
      document.getElementById("transferAmount").value
    );

  if (!receiver || amount <= 0) {
    showMessage("সঠিক Username এবং Amount দিন");
    return;
  }

  showMessage(
    "Transfer system এখনো server-side security function-এর সঙ্গে যুক্ত করা হয়নি।"
  );
}

// ===============================
// BANK WITHDRAWAL
// ===============================

function showWithdrawal() {

  document.getElementById("customerContent").innerHTML = `

    <h2>Bank Withdrawal</h2>

    <input id="bankName"
           class="input"
           placeholder="Bank Name">

    <input id="accountHolder"
           class="input"
           placeholder="Account Holder">

    <input id="accountNumber"
           class="input"
           placeholder="Account Number">

    <input id="ifsc"
           class="input"
           placeholder="IFSC">

    <input id="withdrawAmount"
           class="input"
           type="number"
           placeholder="Withdrawal Amount">

    <button class="btn"
            onclick="requestWithdrawal()">
      Submit Request
    </button>

    <div class="notice">
      Withdrawal request Admin review না করা পর্যন্ত
      PENDING থাকবে।
    </div>
  `;
}

async function requestWithdrawal() {

  showMessage(
    "Withdrawal request system এখনো server-side security function-এর সঙ্গে যুক্ত করা হয়নি।"
  );
}

// ===============================
// HISTORY
// ===============================

async function showHistory() {

  const {
    data: {
      user
    }
  } = await supabaseClient.auth.getUser();

  if (!user) {
    showLogin();
    return;
  }

  const { data, error } =
    await supabaseClient
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false
      });

  if (error) {
    showMessage(error.message);
    return;
  }

  document.getElementById("customerContent").innerHTML = `

    <h2>Transaction History</h2>

    ${
      data.length
        ? data.map(t => `

          <div class="tx">

            <div>
              <strong>
                ${escapeHTML(t.type)}
              </strong>

              <small>
                ${new Date(t.created_at).toLocaleString("en-IN")}
              </small>
            </div>

            <div>
              <strong>
                ${money(t.amount)}
              </strong>

              <span>
                ${escapeHTML(t.status || "")}
              </span>
            </div>

          </div>

        `).join("")
        : "<p>No transactions found.</p>"
    }

  `;
}

// ===============================
// START
// ===============================

async function startApp() {

  const {
    data: {
      session
    }
  } = await supabaseClient.auth.getSession();

  if (!session) {
    showLogin();
    return;
  }

  loadUserPanel(session.user);
}

loadSupabase();
