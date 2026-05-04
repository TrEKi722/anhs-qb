/* ------------------------ */
/* ---- Initialization ---- */
/* ------------------------ */

document.addEventListener("DOMContentLoaded", async (event) => {
    const { data } = await supabaseC.auth.getSession();
    if (data.session) {
        authenticated = true;
        document.getElementById("login-btn-container").style.display = "none";
        document.getElementById("actions-container").style.display = "flex";
    }

    if (window.location.pathname == "/" && !window.location.search) {
        window.location.href = "/?folder=2026";
    }
});

/* ----------- */
/* - Gallery - */
/* ----------- */

const CDN = "https://cdn.ekinney.com";
const WORKER = "https://list-cdn-objects.722kinney.workers.dev";
const PREFIX = "qb/" + new URLSearchParams(window.location.search).get("folder");

async function loadGallery() {
    const res = await fetch(`${WORKER}/list?prefix=${PREFIX}`);
    const keys = await res.json();
    const gallery = document.getElementById("gallery");

    for (const key of keys) {
        const img = document.createElement("img");
        img.src = `${CDN}/${key}`;
        gallery.appendChild(img);
    }
    shuffleArray(Array.from(gallery.children)).forEach(img => gallery.appendChild(img));
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}  

loadGallery();

/* ------------ */
/* -- Modals -- */
/* ------------ */

var acntModal = document.getElementById("acnt-modal");
var loginBtn = document.getElementById("login-btn");
var acntSpan = document.getElementsByClassName("close")[0];

loginBtn.onclick = function() {
    acntModal.style.display = "flex";
}

acntSpan.onclick = function() {
    acntModal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == acntModal) {
        acntModal.style.display = "none";
    }
}
var uploadModal = document.getElementById("upload-modal");
var uploadButton = document.getElementById("upload-quote-btn");
var uploadSpan = document.getElementsByClassName("close")[1];

uploadButton.onclick = function() {
    uploadModal.style.display = "flex";
}

uploadSpan.onclick = function() {
    uploadModal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == uploadModal) {
        uploadModal.style.display = "none";
    }
}

/* ------------ */
/* - Supabase - */
/* ------------ */

const SUPABASE_URL = "https://pdvxvgcigowwnfqpjjni.supabase.co/";
const SUPABASE_KEY = "sb_publishable_CjflF9tunFsNyONxBlHazw_6E2metQ-";
const supabaseC = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let authenticated = false;

async function login(em, pa) {
    if (!em || !pa) return showToast("Please enter both email and password.");

    const { data, error } = await supabaseC.auth.signInWithPassword({
        email: em,
        password: pa,
    })

    if (!error) {
        authenticated = true;
        document.getElementById("login-btn-container").style.display = "none";
        document.getElementById("actions-container").style.display = "flex";
        acntModal.style.display = "none";
    } else {
        const loginErrors = {
            "Invalid login credentials": "Incorrect email or password.",
            "Email not confirmed": "Please verify your email before signing in.",
            "User not found": "No account found with that email.",
            "Too many requests": "Too many attempts. Please wait a moment and try again.",
        };
        showToast(loginErrors[error.message] ?? "Sign in failed. Please try again.");
        console.log(error);
    }
}

async function signup(em, pa, paConfirm, code) {
    if (!em || !pa || !paConfirm || !code) return showToast("Please fill in all fields.");
    if (pa !== paConfirm) return showToast("Passwords do not match.");

    let res, data;
    try {
        res = await fetch("/api/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: em, password: pa, accessCode: code }),
        });
        data = await res.json();
    } catch {
        return showToast("Network error. Please try again.");
    }

    if (data.success) {
        showToast("Account created! You can now log in.");
        acntModal.style.display = "none";
    } else {
        const signupErrors = {
            "Invalid access code.": "Incorrect access code.",
            "User already registered": "An account with that email already exists.",
            "Password should be at least 12 characters.": "Password must be at least 12 characters.",
            "Unable to validate email address: invalid format": "Please enter a valid email address.",
            "Too many requests": "Too many attempts. Please wait a moment and try again.",
        };
        const err = data.error ?? "";
        const mapped = signupErrors[err]
            ?? (err.toLowerCase().includes("password") ? "Password must be at least 12 characters and include uppercase, lowercase, a number, and a symbol." : null)
            ?? err
            ?? "Sign up failed. Please try again.";
        showToast(mapped);
        console.log(data.error);
    }
}

async function logout() {
    const { error } = await supabaseC.auth.signOut();
    if (!error) {
        authenticated = false;
        document.getElementById("login-btn-container").style.display = "flex";
        document.getElementById("actions-container").style.display = "none";
    }
}

/* ------------ */
/* -- Upload -- */
/* ------------ */
const form = document.getElementById('upload-form');
const resultEl = document.getElementById('result');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const file = document.getElementById('file-input').files[0];
  const folder = document.getElementById('folder-input').value.trim();
  if (!file) return showToast('Please choose a file.');
  if (!folder) return showToast('Please enter a folder.');

  const { data: sessionData } = await supabaseC.auth.getSession();
  const token = sessionData?.session?.access_token;
  if (!token) return showToast('You must be logged in to upload.');

  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) {
      resultEl.textContent = 'Error: ' + (data.error || res.statusText);
    } else {
      resultEl.textContent = 'Uploaded successfully:\n' + JSON.stringify(data, null, 2);
    }
  } catch (err) {
    resultEl.textContent = 'Request failed: ' + err.message;
  }
});

/* ------------- */
/* --- Toast --- */
/* ------------- */

function showToast(message) {
    const toast = document.getElementById('toast');
    if (toast) {
        toast.innerText = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }
}