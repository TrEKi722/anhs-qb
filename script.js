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
/* -- Modal -- */
/* ----------- */

var modal = document.getElementById("login-modal");
var btn = document.getElementById("login-btn");
var span = document.getElementsByClassName("close")[0];

btn.onclick = function() {
    modal.style.display = "flex";
}

span.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
if (event.target == modal) {
    modal.style.display = "none";
}
}

/* ------------ */
/* - Supabase - */
/* ------------ */

const SUPABASE_URL = "https://pdvxvgcigowwnfqpjjni.supabase.co/rest/v1/";
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
        modal.style.display = "none";
    }
}