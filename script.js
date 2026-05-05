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
    gallery.innerHTML = '';

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

var createModal = document.getElementById("create-modal");
var createButton = document.getElementById("create-quote-btn");
var createSpan = document.getElementById("create-close");

createButton.onclick = function() {
    createModal.style.display = "flex";
}

createSpan.onclick = function() {
    createModal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == uploadModal) {
        uploadModal.style.display = "none";
    }
    if (event.target == acntModal) {
        acntModal.style.display = "none";
    }
    if (event.target == createModal) {
        createModal.style.display = "none";
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

async function uploadFile() {
  const file = document.getElementById('file-input').files[0];
  const folder = new URLSearchParams(window.location.search).get('folder');
  if (!file) return showToast('Please choose a file.');
  if (!folder) return showToast('No folder in URL.');

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

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }

    if (!res.ok || !data) {
      resultEl.textContent = `Error ${res.status}: ` + (data?.error || res.statusText || text.slice(0, 200));
    } else {
      showToast('Uploaded successfully!');
      uploadModal.style.display = 'none';
      resultEl.textContent = '';
    }
  } catch (err) {
    resultEl.textContent = 'Request failed: ' + err.message;
  }
};

/* ------------- */
/* --- Create -- */
/* ------------- */

// Pixel coordinates are relative to each template's natural image size.
// photo zone: { cx, cy } is the center of the photo area; w/h are its dimensions; angle is degrees.
// quote/attribution: { cx, cy } is the center of the text block; maxW caps line width.
// All coordinates need calibration once the real template files exist.
const TEMPLATES = {
    "1": {
        photo:       { cx: 200, cy: 250, w: 530, h: 640, angle: -18 },
        quote:       { cx: 775, cy: 492, maxW: 1184, size: 60, weight: "normal",   color: "white" },
        attribution: { cx: 1114, cy: 918, maxW: 632, size: 35, weight: "normal", color: "white" },
    },
    "2": {
        photo:       { cx: 200, cy: 250, w: 530, h: 640, angle: 20 },
        quote:       { cx: 465, cy: 600, maxW: 700, size: 52, weight: "normal",   color: "white" },
        attribution: { cx: 465, cy: 780, maxW: 500, size: 32, weight: "normal", color: "white" },
    },
    "3": {
        photo:       { cx: 200, cy: 250, w: 530, h: 640, angle: 14 },
        quote:       { cx: 465, cy: 600, maxW: 700, size: 52, weight: "normal",   color: "white" },
        attribution: { cx: 465, cy: 780, maxW: 500, size: 32, weight: "normal", color: "white" },
    },
    "4": {
        photo:       { cx: 200, cy: 250, w: 530, h: 640, angle: -26 },
        quote:       { cx: 465, cy: 600, maxW: 700, size: 52, weight: "normal",   color: "white" },
        attribution: { cx: 465, cy: 780, maxW: 500, size: 32, weight: "normal", color: "white" },
    },
    "5": {
        photo:       { cx: 200, cy: 250, w: 530, h: 640, angle: 14 },
        quote:       { cx: 465, cy: 600, maxW: 700, size: 52, weight: "normal",   color: "white" },
        attribution: { cx: 465, cy: 780, maxW: 500, size: 32, weight: "normal", color: "white" },
    },
    "6": {
        photo:       { cx: 200, cy: 250, w: 530, h: 640, angle: 20 },
        quote:       { cx: 465, cy: 600, maxW: 700, size: 52, weight: "normal",   color: "white" },
        attribution: { cx: 465, cy: 780, maxW: 500, size: 32, weight: "normal", color: "white" },
    },
};

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
}

function wrapLines(ctx, text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
        const test = line ? line + ' ' + word : word;
        if (ctx.measureText(test).width > maxW && line) {
            lines.push(line);
            line = word;
        } else {
            line = test;
        }
    }
    if (line) lines.push(line);
    return lines;
}

function drawCenteredText(ctx, text, zone) {
    ctx.font = `${zone.weight} ${zone.size}px Sigher`;
    ctx.fillStyle = zone.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lineH = zone.size * 1.3;
    const lines = wrapLines(ctx, text, zone.maxW);
    const totalH = lines.length * lineH;
    let y = zone.cy - totalH / 2 + lineH / 2;
    for (const line of lines) {
        ctx.fillText(line, zone.cx, y);
        y += lineH;
    }
}

// Show/hide photo input based on whether the selected template needs one.
document.querySelectorAll('input[name="template"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const needsPhoto = !!TEMPLATES[radio.value]?.photo;
        document.getElementById('photo-section').style.display = needsPhoto ? '' : 'none';
    });
});

document.getElementById('create-submit-btn').onclick = async function () {
    const templateNum = document.querySelector('input[name="template"]:checked')?.value;
    const quoteText = document.getElementById('quote-input').value.trim();
    const attributionText = document.getElementById('attribution-input').value.trim();
    const photoFile = document.getElementById('photo-input').files[0];

    if (!templateNum) return showToast('Please select a template.');
    if (!quoteText) return showToast('Please enter a quote.');
    if (!attributionText) return showToast('Please enter an attribution.');

    const t = TEMPLATES[templateNum];
    if (t.photo && !photoFile) return showToast('This template requires a photo.');

    const folder = new URLSearchParams(window.location.search).get('folder');
    if (!folder) return showToast('No folder in URL.');

    const { data: sessionData } = await supabaseC.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return showToast('You must be logged in.');

    showToast('Creating quote...');

    try {
        const templateImg = await loadImage(`media/templates/${templateNum}.png`);
        const canvas = document.createElement('canvas');
        canvas.width = templateImg.naturalWidth;
        canvas.height = templateImg.naturalHeight;
        const ctx = canvas.getContext('2d');

        // 1. draw template as base
        ctx.drawImage(templateImg, 0, 0);

        // 2. draw user photo on top, clipped and rotated into its zone
        if (t.photo && photoFile) {
            const photoImg = await loadImage(URL.createObjectURL(photoFile));
            const z = t.photo;
            ctx.save();
            ctx.translate(z.cx, z.cy);
            ctx.rotate(z.angle * Math.PI / 180);
            ctx.beginPath();
            ctx.rect(-z.w / 2, -z.h / 2, z.w, z.h);
            ctx.clip();
            const scale = Math.max(z.w / photoImg.naturalWidth, z.h / photoImg.naturalHeight);
            const sw = photoImg.naturalWidth * scale;
            const sh = photoImg.naturalHeight * scale;
            ctx.drawImage(photoImg, -sw / 2, -sh / 2, sw, sh);
            ctx.restore();
        }

        // 3. draw text
        await document.fonts.ready;
        drawCenteredText(ctx, quoteText, t.quote);
        drawCenteredText(ctx, `- ${attributionText}`, t.attribution);

        // 4. export as PNG and upload
        canvas.toBlob(async (blob) => {
            const formData = new FormData();
            formData.append('file', blob, `quote-${Date.now()}.png`);
            formData.append('folder', folder);

            const res = await fetch('/api/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            const data = await res.json().catch(() => null);
            if (!res.ok || !data) {
                showToast('Upload failed.');
            } else {
                showToast('Quote created!');
                createModal.style.display = 'none';
                loadGallery();
            }
        }, 'image/png');

    } catch (err) {
        showToast('Something went wrong.');
        console.error(err);
    }
};

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