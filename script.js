/* ----------- */
/* - Gallery - */
/* ----------- */

const CDN = "https://cdn.ekinney.com";
const WORKER = "https://list-cdn-objects.722kinney.workers.dev";
const PREFIX = "qb/";

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
    if (!em || !pa) return alert("Please enter both email and password.");

    const { data, error } = await supabaseC.auth.signInWithPassword({
        email: em,
        password: pa,
    })

    if (!error) {
        authenticated = true;
        document.getElementById("login-btn-container").style.display = "none";
        document.getElementById("actions-container").style.display = "flex";
        modal.style.display = "none";
    }
}

async function signup(em, pa, paConfirm) {
    if (!em || !pa || !paConfirm) return alert("Please fill in all fields.");
    if (pa !== paConfirm) return alert("Passwords do not match.");

    const { data, error } = await supabaseC.auth.signUp({
        email: em,
        password: pa,
    });

    if (!error) {
        authenticated = true;
        document.getElementById("login-btn-container").style.display = "none";
        document.getElementById("actions-container").style.display = "flex";
        modal.style.display = "none";
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

/* ------------------------ */
/* ---- Initialization ---- */
/* ------------------------ */

document.DOMContentLoaded = () => {
    if (supabaseC.auth.getSession()) {
        authenticated = true;
        document.getElementById("login-btn-container").style.display = "none";
        document.getElementById("actions-container").style.display = "flex";
    }
}