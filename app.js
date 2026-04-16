// Firebase Initialization
// IMPORTANT: REPLACE THE CONFIG BELOW WITH YOUR REAL FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyCPVpFq8FL2ySobVvriCvh8iOsYno2PyUo",
  authDomain: "vows-2e1e0.firebaseapp.com",
  databaseURL:
    "https://vows-2e1e0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "vows-2e1e0",
  storageBucket: "vows-2e1e0.firebasestorage.app",
  messagingSenderId: "994508920204",
  appId: "1:994508920204:web:2cf528228ff0dc91bb32a9",
  measurementId: "G-2J0ZEYF7QX",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const messagesRef = db.ref("messages");
const reactionsRef = db.ref("reactions");
const settingsRef = db.ref("settings");

// ==========================================
// CONFIGURATION VARIABLES
// ==========================================
let globalInterval = 3;
let profanityWords = []; // Loaded from DB
const maxDisplayMessages = 10; // Ubah ini untuk menampilkan 10, 20, atau 30 chat terakhir

// ==========================================
// PROFANITY FILTER
// ==========================================
function filterProfanity(text) {
  if (!profanityWords || profanityWords.length === 0) return text;
  let filtered = text;
  profanityWords.forEach((word) => {
    if (!word) return;
    const regex = new RegExp(word, "gi"); // case insensitive
    const replacer = "*".repeat(word.length);
    filtered = filtered.replace(regex, replacer);
  });
  return filtered;
}

// ==========================================
// LOGIC FOR LOGO NAVIGATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".logo").forEach((img) => {
    img.addEventListener("click", () => {
      if (!window.location.pathname.endsWith("settings.html")) {
        window.location.href = "settings.html";
      }
    });
  });
});

// ==========================================
// LOGIC FOR DISPLAY SCREEN (index.html)
// ==========================================
const chatContainer = document.getElementById("chatContainer");
const newChatContainer = document.querySelector(".new-chat");

if (chatContainer) {
  let messageDisplayQueue = [];
  let isProcessingQueue = false;
  const sessionStartTime = Date.now();

  // Listen for message deletion
  messagesRef.on("child_removed", () => {
    chatContainer.innerHTML = "";
    if (newChatContainer) newChatContainer.innerHTML = "";
  });

  // FIX: Using limitToLast directly on Push Keys since they are chronologically ordered.
  // This skips the need for database indexing and instantly pulls only the latest items.
  messagesRef.limitToLast(maxDisplayMessages).on("child_added", (snapshot) => {
    const data = snapshot.val();
    messageDisplayQueue.push(data);

    if (!isProcessingQueue) {
      processDisplayQueue();
    }
  });

  function processDisplayQueue() {
    if (messageDisplayQueue.length === 0) {
      isProcessingQueue = false;
      return;
    }

    isProcessingQueue = true;
    const msg = messageDisplayQueue.shift();

    renderMessage(msg);

    chatContainer.scrollTop = chatContainer.scrollHeight;

    const msgAge = Date.now() - msg.timestamp;
    const isLive = msgAge < Date.now() - sessionStartTime + 5000;

    const waitTime = isLive ? globalInterval * 1000 : 50;

    setTimeout(processDisplayQueue, waitTime);
  }

  function renderMessage(data) {
    const card = document.createElement("div");
    card.className = "message-card";

    const timeString = new Date(data.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    // Apply profanity filter to rendered output
    const safeName = filterProfanity(escapeHTML(data.name));
    const safeMsg = filterProfanity(escapeHTML(data.message));

    card.innerHTML = `
              <div class="message-header">
                  <span class="user-name">${safeName}</span>
              </div>
              <div class="message-text">
                  ${safeMsg}
              </div>
          `;

    chatContainer.appendChild(card);

    if (newChatContainer) {
      newChatContainer.innerHTML = "";
      const bigCard = document.createElement("div");
      bigCard.className = "big-message-card";
      bigCard.innerHTML = `
                  <div class="message-text message-text-big">
                      "${safeMsg}"
                  </div>
                  <span class="user-name user-name-big">From: ${safeName}</span>
              `;
      newChatContainer.appendChild(bigCard);
    }

    // OPTIMIZATION: DOM Pruning to prevent lagging on old laptops.
    // Keep only X active DOM nodes in the chat container based on maxDisplayMessages
    if (chatContainer.childElementCount > maxDisplayMessages) {
      chatContainer.removeChild(chatContainer.firstChild);
    }

    requestAnimationFrame(() => {
      card.classList.add("show");
      card.classList.add("highlight");
      setTimeout(() => {
        if (card) card.classList.remove("highlight");
      }, 3000);
    });
  }
}

// ==========================================
// LOGIC FOR INPUT SCREEN (input.html)
// ==========================================
const messageForm = document.getElementById("messageForm");
const userNameInput = document.getElementById("userName");
const userMessageInput = document.getElementById("userMessage");
const submitBtn = document.getElementById("submitBtn");
const statusAlert = document.getElementById("statusAlert");

if (messageForm) {
  // Character counter logic
  const charCounter = document.getElementById("charCounter");
  if (charCounter && userMessageInput) {
    userMessageInput.addEventListener("input", () => {
      const len = userMessageInput.value.length;
      charCounter.textContent = `${len}/200`;
      // Feedback: turn red if reaching limit
      if (len >= 200) {
        charCounter.style.color = "var(--primary-color)";
        charCounter.style.fontWeight = "bold";
      } else {
        charCounter.style.color = "rgba(255, 255, 255, 0.5)";
        charCounter.style.fontWeight = "normal";
      }
    });
  }

  messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = userNameInput.value.trim();
    const message = userMessageInput.value.trim();

    if (!name || !message) {
      showStatus("Please fill in both fields.", "error");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "SENDING...";

    const newMsgData = {
      name: name,
      message: message,
      timestamp: firebase.database.ServerValue.TIMESTAMP,
    };

    messagesRef
      .push(newMsgData)
      .then(() => {
        messageForm.reset();
        showStatus("Message sent!", "success");
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = "SEND MESSAGE";
        }, 1000);
      })
      .catch((error) => {
        console.error("Error setting data: ", error);
        showStatus("Failed to send message.", "error");
        submitBtn.disabled = false;
        submitBtn.textContent = "SEND MESSAGE";
      });
  });

  function showStatus(text, type) {
    statusAlert.style.display = "block";
    statusAlert.textContent = text;
    statusAlert.className =
      "mt-3 " + (type === "error" ? "text-danger" : "text-success");
    setTimeout(() => {
      statusAlert.style.display = "none";
    }, 3000);
  }

  // EMOJI REACTIONS (Input Side)
  document.querySelectorAll(".emoji-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const emojiValue = e.target.getAttribute("data-emoji");
      reactionsRef.push({
        emoji: emojiValue,
        timestamp: firebase.database.ServerValue.TIMESTAMP,
      });
      // Visual feedback
      btn.style.transform = "scale(0.8)";
      setTimeout(() => {
        btn.style.transform = "scale(1)";
      }, 100);
    });
  });
}

// ==========================================
// EMOJI RAIN (Display Side)
// ==========================================
const emojiRainContainer = document.getElementById("emojiRainContainer");
if (emojiRainContainer) {
  let firstLoad = true;
  reactionsRef.on("child_added", (snapshot) => {
    // Ignore old historical emojis to prevent screen flooded on F5
    if (firstLoad) return;
    const data = snapshot.val();
    if (data && data.emoji) {
      createFallingEmoji(data.emoji);
    }
  });
  // Allow taking in live events after initial fetch
  setTimeout(() => {
    firstLoad = false;
  }, 2000);
}

function createFallingEmoji(emojiChar) {
  if (!emojiRainContainer) return;

  // OPTIMIZATION: Throttle Emojis to max 30 elements on screen at once to prevent GPU crashing
  if (document.querySelectorAll(".falling-emoji").length > 30) return;

  const emoji = document.createElement("div");
  emoji.className = "falling-emoji";
  emoji.innerText = emojiChar;

  // Randomize layout
  emoji.style.left = Math.random() * 100 + "vw";
  emoji.style.animationDuration = Math.random() * 2 + 3 + "s"; // 3s - 5s

  emojiRainContainer.appendChild(emoji);

  // Remove element after animation
  setTimeout(() => {
    emoji.remove();
  }, 5000);
}

// Utility: HTML Escaping
function escapeHTML(str) {
  return str.replace(
    /[&<>'"]/g,
    (tag) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[
        tag
      ] || tag)
  );
}

// ==========================================
// QR CODE GENERATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  const qrElement = document.getElementById("qrcode");
  if (qrElement) {
    // Construct the URL for input.html based on current location
    let currentUrl = window.location.href;
    // Strip out index.html if present, or just use directory
    let baseUrl = currentUrl.split("?")[0].split("#")[0];
    if (baseUrl.endsWith("index.html")) {
      baseUrl = baseUrl.replace("index.html", "");
    }
    if (!baseUrl.endsWith("/")) {
      baseUrl += "/";
    }
    const inputUrl = baseUrl + "input.html";

    new QRCode(qrElement, {
      text: inputUrl,
      width: 180,
      height: 180,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H,
    });
  }
});

// ==========================================
// REALTIME GLOBAL SETTINGS
// ==========================================
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

const applyColorVar = (hex, prefix) => {
  if (!hex) return;
  const rgb = hexToRgb(hex);
  if (rgb) {
    document.documentElement.style.setProperty("--" + prefix + "-color", hex);
    document.documentElement.style.setProperty("--" + prefix + "-r", rgb.r);
    document.documentElement.style.setProperty("--" + prefix + "-g", rgb.g);
    document.documentElement.style.setProperty("--" + prefix + "-b", rgb.b);
  }
};

settingsRef.on("value", (snapshot) => {
  const data = snapshot.val();
  if (!data) return;

  applyColorVar(data.primaryColor, "primary");
  applyColorVar(data.secondaryColor, "secondary");
  applyColorVar(data.bgColor, "bg");
  applyColorVar(data.fontColor, "text");

  if (data.msgInterval) globalInterval = parseFloat(data.msgInterval);

  if (data.webTitle) {
    document.title = data.webTitle;
    document
      .querySelectorAll(".custom-web-title")
      .forEach((el) => (el.textContent = data.webTitle));
  }

  if (data.logoBase64) {
    document
      .querySelectorAll(".logo")
      .forEach((img) => (img.src = data.logoBase64));
  }

  // Profanity array parse
  if (data.profanityList) {
    profanityWords = data.profanityList
      .split(",")
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
  }

  // Render Sponsor Banner
  const sponsorBanner = document.getElementById("sponsorBanner");
  const sponsorTrack = document.getElementById("sponsorTrack");
  if (sponsorBanner && sponsorTrack) {
    const sponsorsToRender = [];
    if (data.sponsor1) sponsorsToRender.push(data.sponsor1);
    if (data.sponsor2) sponsorsToRender.push(data.sponsor2);
    if (data.sponsor3) sponsorsToRender.push(data.sponsor3);

    if (sponsorsToRender.length > 0) {
      sponsorBanner.style.display = "block";
      sponsorTrack.innerHTML = "";
      
      // Function to make a full set of logos
      const createContent = () => {
        const div = document.createElement("div");
        div.className = "sponsor-content";
        sponsorsToRender.forEach((src) => {
          const img = document.createElement("img");
          img.src = src;
          img.className = "sponsor-logo";
          div.appendChild(img);
        });
        return div;
      }

      // Add 4 sets to guarantee it wraps around seamlessly on ultra-wide screens
      sponsorTrack.appendChild(createContent());
      sponsorTrack.appendChild(createContent());
      sponsorTrack.appendChild(createContent());
      sponsorTrack.appendChild(createContent());
    } else {
      sponsorBanner.style.display = "none";
    }
  }

  // Settings Page Sync
  if (document.getElementById("settingsForm")) {
    const safeSetVal = (id, val) => {
      if (document.getElementById(id) && val)
        document.getElementById(id).value = val;
    };
    safeSetVal("primaryColor", data.primaryColor);
    safeSetVal("secondaryColor", data.secondaryColor);
    safeSetVal("bgColor", data.bgColor);
    safeSetVal("fontColor", data.fontColor);
    safeSetVal("webTitle", data.webTitle);
    safeSetVal("msgInterval", data.msgInterval);
    safeSetVal("profanityList", data.profanityList);

    document.querySelectorAll(".form-control-color").forEach((input) => {
      const hexText = input.nextElementSibling;
      if (hexText && hexText.classList.contains("colorHexText"))
        hexText.textContent = input.value;
    });
  }
});

// ==========================================
// SETTINGS PANEL UI LOGIC (Admin Gates & Forms)
// ==========================================
const loginBtn = document.getElementById("loginBtn");
if (loginBtn) {
  loginBtn.addEventListener("click", () => {
    const pwd = document.getElementById("adminPassword").value;
    if (pwd === "VOWS2026" || pwd === "vows2026") {
      document.getElementById("loginGate").style.display = "none";
      document.getElementById("adminPanel").style.display = "flex";
    } else {
      document.getElementById("loginError").style.display = "block";
    }
  });
}

const clearChatBtn = document.getElementById("clearChatBtn");
if (clearChatBtn) {
  clearChatBtn.addEventListener("click", () => {
    if (confirm("Are you SURE you want to delete all messages and emojis?")) {
      messagesRef.remove();
      reactionsRef.remove();
      alert("All data cleared successfully.");
    }
  });
}

const exportDataBtn = document.getElementById("exportBtn");
if (exportDataBtn) {
  exportDataBtn.addEventListener("click", () => {
    messagesRef.once("value", (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        alert("No data available to export.");
        return;
      }
      const msgs = Object.values(data);
      const dataStr = JSON.stringify(msgs, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vows_data_export.json";
      a.click();
      URL.revokeObjectURL(url);
    });
  });
}

const activeSettingsForm = document.getElementById("settingsForm");
if (activeSettingsForm) {
  const getFileBase64 = (id) =>
    new Promise((resolve) => {
      const file = document.getElementById(id).files[0];
      if (!file) return resolve(null);
      // Check size (500kb max per sponsor, 1.5MB for main logo)
      const isMain = id === "logoImage";
      if (file.size > (isMain ? 1500000 : 500000)) {
        alert(`${id}: Image too large!`);
        return resolve(null);
      }
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });

  document.getElementById("logoImage").addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) =>
        (document.getElementById("previewLogo").src = event.target.result);
      reader.readAsDataURL(file);
    }
  });

  document.querySelectorAll(".form-control-color").forEach((input) => {
    input.addEventListener("input", (e) => {
      const hexText = e.target.nextElementSibling;
      if (hexText && hexText.classList.contains("colorHexText"))
        hexText.textContent = e.target.value;
    });
  });

  activeSettingsForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const saveSettingsBtn = document.getElementById("saveSettingsBtn");
    saveSettingsBtn.disabled = true;
    saveSettingsBtn.textContent = "SAVING...";

    const updates = {
      primaryColor: document.getElementById("primaryColor").value,
      secondaryColor: document.getElementById("secondaryColor").value,
      bgColor: document.getElementById("bgColor").value,
      fontColor: document.getElementById("fontColor").value,
      webTitle: document.getElementById("webTitle").value.trim(),
      msgInterval:
        parseFloat(document.getElementById("msgInterval").value) || 3,
      profanityList: document.getElementById("profanityList").value,
    };

    const mainLogo = await getFileBase64("logoImage");
    const spon1 = await getFileBase64("sponsor1");
    const spon2 = await getFileBase64("sponsor2");
    const spon3 = await getFileBase64("sponsor3");

    if (mainLogo) updates.logoBase64 = mainLogo;
    if (spon1) updates.sponsor1 = spon1;
    if (spon2) updates.sponsor2 = spon2;
    if (spon3) updates.sponsor3 = spon3;

    settingsRef
      .update(updates)
      .then(() => {
        const alertBox = document.getElementById("settingsAlert");
        alertBox.style.display = "block";
        alertBox.textContent = "Global Settings Successfully Updated!";
        alertBox.className =
          "mt-4 py-2 px-3 rounded text-center bg-success text-white";
        setTimeout(() => (alertBox.style.display = "none"), 4000);
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to save settings.");
      })
      .finally(() => {
        saveSettingsBtn.disabled = false;
        saveSettingsBtn.textContent = "SAVE ALL SETTINGS";
      });
  });
}
