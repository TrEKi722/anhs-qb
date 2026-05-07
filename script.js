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

function wireModal(modalId, openId, closeId) {
    const modal = document.getElementById(modalId);
    document.getElementById(openId).onclick = () => modal.style.display = 'flex';
    document.getElementById(closeId).onclick = () => modal.style.display = 'none';
    return modal;
}

var acntModal   = wireModal('acnt-modal',   'login-btn',        'acnt-close');
var uploadModal = wireModal('upload-modal', 'upload-quote-btn', 'upload-close');
var createModal = wireModal('create-modal', 'create-quote-btn', 'create-close');

window.onclick = function(event) {
    [acntModal, uploadModal, createModal].forEach(m => {
        if (event.target === m) m.style.display = 'none';
    });
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

async function postToUploadApi(fileOrBlob, filename, folder, token) {
    const formData = new FormData();
    formData.append('file', fileOrBlob, filename);
    formData.append('folder', folder);
    const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = null; }
    return { ok: res.ok, status: res.status, data, text };
}

async function uploadFile() {
    const file = document.getElementById('file-input').files[0];
    const folder = new URLSearchParams(window.location.search).get('folder');
    if (!file) return showToast('Please choose a file.');
    if (!folder) return showToast('No folder in URL.');

    const { data: sessionData } = await supabaseC.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) return showToast('You must be logged in to upload.');

    try {
        const { ok, status, data, text } = await postToUploadApi(file, file.name, folder, token);
        if (!ok || !data) {
            resultEl.textContent = `Error ${status}: ` + (data?.error || text.slice(0, 200));
        } else {
            showToast('Uploaded successfully!');
            uploadModal.style.display = 'none';
            resultEl.textContent = '';
        }
    } catch (err) {
        resultEl.textContent = 'Request failed: ' + err.message;
    }
}

/* ------------- */
/* --- Create -- */
/* ------------- */

const TEMPLATES = {
    "1": {
      "photo": {
        "cx": 450,
        "cy": 1378,
        "w": 581,
        "h": 697,
        "angle": -18.2
      },
      "quote": {
        "cx": 775,
        "cy": 515,
        "maxW": 1170,
        "size": 56,
        "weight": "normal",
        "color": "white"
      },
      "attribution": {
        "cx": 1091,
        "cy": 910,
        "maxW": 632,
        "size": 65,
        "weight": "normal",
        "color": "white"
      }
    },
    "2": {
      "photo": {
        "cx": 1142,
        "cy": 1462,
        "w": 537,
        "h": 648,
        "angle": 20.4
      },
      "quote": {
        "cx": 771,
        "cy": 534,
        "maxW": 1170,
        "size": 56,
        "weight": "normal",
        "color": "white"
      },
      "attribution": {
        "cx": 1092,
        "cy": 911,
        "maxW": 630,
        "size": 65,
        "weight": "normal",
        "color": "white"
      }
    },
    "3": {
      "photo": {
        "cx": 437,
        "cy": 493,
        "w": 539,
        "h": 643,
        "angle": 15
      },
      "quote": {
        "cx": 771,
        "cy": 1448,
        "maxW": 1170,
        "size": 56,
        "weight": "normal",
        "color": "white"
      },
      "attribution": {
        "cx": 1091,
        "cy": 1828,
        "maxW": 630,
        "size": 65,
        "weight": "normal",
        "color": "white"
      }
    },
    "4": {
      "photo": {
        "cx": 1044,
        "cy": 428,
        "w": 530,
        "h": 645,
        "angle": -26.5
      },
      "quote": {
        "cx": 771,
        "cy": 1439,
        "maxW": 1170,
        "size": 56,
        "weight": "normal",
        "color": "white"
      },
      "attribution": {
        "cx": 1092,
        "cy": 1829,
        "maxW": 630,
        "size": 65,
        "weight": "normal",
        "color": "white"
      }
    },
    "5": {
      "photo": {
        "cx": 401,
        "cy": 445,
        "w": 535,
        "h": 645,
        "angle": 14.6
      },
      "quote": {
        "cx": 836,
        "cy": 1175,
        "maxW": 1170,
        "size": 56,
        "weight": "normal",
        "color": "white"
      },
      "attribution": {
        "cx": 1155,
        "cy": 1552,
        "maxW": 630,
        "size": 65,
        "weight": "normal",
        "color": "white"
      }
    },
    "6": {
      "photo": {
        "cx": 1158,
        "cy": 1447,
        "w": 535,
        "h": 645,
        "angle": 20.6
      },
      "quote": {
        "cx": 693,
        "cy": 795,
        "maxW": 1170,
        "size": 56,
        "weight": "normal",
        "color": "white"
      },
      "attribution": {
        "cx": 335,
        "cy": 1100,
        "maxW": 630,
        "size": 65,
        "weight": "normal",
        "color": "white"
      }
    }
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
        const objectUrl = photoFile ? URL.createObjectURL(photoFile) : null;
        const [templateImg, photoImg] = await Promise.all([
            loadImage(`media/templates/${templateNum}.png`),
            objectUrl ? loadImage(objectUrl) : Promise.resolve(null),
        ]);
        if (objectUrl) URL.revokeObjectURL(objectUrl);

        const canvas = document.createElement('canvas');
        canvas.width = templateImg.naturalWidth;
        canvas.height = templateImg.naturalHeight;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(templateImg, 0, 0);

        if (t.photo && photoImg) {
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

        await document.fonts.load(`${t.quote.size}px Sigher`);
        drawCenteredText(ctx, quoteText, t.quote);
        drawCenteredText(ctx, `- ${attributionText}`, t.attribution);

        const blob = await new Promise((resolve, reject) =>
            canvas.toBlob(b => b ? resolve(b) : reject(new Error('Failed to generate image')), 'image/png')
        );

        const { ok } = await postToUploadApi(blob, `quote-${Date.now()}.png`, folder, token);
        if (!ok) {
            showToast('Upload failed.');
        } else {
            showToast('Quote created!');
            createModal.style.display = 'none';
            loadGallery();
        }

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