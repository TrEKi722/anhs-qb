/* ------------------------ */
/* ---- Initialization ---- */
/* ------------------------ */

document.addEventListener("DOMContentLoaded", (event) => {
    const data = supabaseC.auth.getSession();
    if (!!data.session) {
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
}

loadGallery();

/* ----------- */
/* -- Modals -- */
/* ----------- */

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
        showToast("Account created! Please check your email to confirm your address.");
        acntModal.style.display = "none";
    } else {
        const signupErrors = {
            "Invalid access code.": "Incorrect access code.",
            "User already registered": "An account with that email already exists.",
            "Password should be at least 8 characters": "Password must be at least 8 characters.",
            "Unable to validate email address: invalid format": "Please enter a valid email address.",
            "Too many requests": "Too many attempts. Please wait a moment and try again.",
        };
        showToast(signupErrors[data.error] ?? data.error ?? "Sign up failed. Please try again.");
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