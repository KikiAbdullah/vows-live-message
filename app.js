// Firebase Initialization
// IMPORTANT: REPLACE THE CONFIG BELOW WITH YOUR REAL FIREBASE CONFIGURATION
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCPVpFq8FL2ySobVvriCvh8iOsYno2PyUo",
  authDomain: "vows-2e1e0.firebaseapp.com",
  databaseURL: "https://vows-2e1e0-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "vows-2e1e0",
  storageBucket: "vows-2e1e0.firebasestorage.app",
  messagingSenderId: "994508920204",
  appId: "1:994508920204:web:2cf528228ff0dc91bb32a9",
  measurementId: "G-2J0ZEYF7QX"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.database();
const messagesRef = db.ref('messages');

let globalInterval = 3; // Default interval in seconds

// ==========================================
// LOGIC FOR LOGO NAVIGATION
// ==========================================
// Clicking logo goes to settings.html
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll('.logo').forEach(img => {
        img.addEventListener('click', () => {
            if (!window.location.pathname.endsWith('settings.html')) {
                window.location.href = 'settings.html';
            }
        });
    });
});

// ==========================================
// LOGIC FOR DISPLAY SCREEN (index.html)
// ==========================================
const chatContainer = document.getElementById('chatContainer');
const exportBtn = document.getElementById('exportBtn');
const newChatContainer = document.querySelector('.new-chat');

if (chatContainer) {
    // Array to hold all messages for export
    let allMessages = [];
    // Queue for paced rendering
    let messageDisplayQueue = [];
    let isProcessingQueue = false;
    const sessionStartTime = Date.now();

    // Listen for new messages using child_added
    messagesRef.on('child_added', (snapshot) => {
        const data = snapshot.val();
        
        // Store for export
        allMessages.push(data);

        // Add to display queue
        messageDisplayQueue.push(data);

        // Start processing if not already running
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
        
        // Render the message UI
        renderMessage(msg);

        // Auto-scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;

        // Pacing logic: 
        // If it's a "live" message (sent after page load or very recently), wait based on globalInterval.
        // If it's an old/historical message, we can show it faster (e.g. 50ms) to populate the screen.
        const msgAge = Date.now() - msg.timestamp;
        const isLive = msgAge < (Date.now() - sessionStartTime + 5000); // within last 5s since session start
        
        const waitTime = isLive ? (globalInterval * 1000) : 50; 
        
        setTimeout(processDisplayQueue, waitTime);
    }

    function renderMessage(data) {
        const card = document.createElement('div');
        card.className = 'message-card';
        
        // Convert timestamp to readable time string
        const timeString = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        card.innerHTML = `
            <div class="message-header">
                <span class="user-name">${escapeHTML(data.name)}</span>
                <span class="timestamp">${timeString}</span>
            </div>
            <div class="message-text">
                ${escapeHTML(data.message)}
            </div>
        `;

        chatContainer.appendChild(card);

        // Update the big focused display container (.new-chat) on the left
        if (newChatContainer) {
            newChatContainer.innerHTML = ''; // reset to trigger animation again
            const bigCard = document.createElement('div');
            bigCard.className = 'big-message-card';
            bigCard.innerHTML = `
                <span class="user-name user-name-big">${escapeHTML(data.name)}</span>
                <div class="message-text message-text-big">
                    "${escapeHTML(data.message)}"
                </div>
            `;
            newChatContainer.appendChild(bigCard);
        }

        // Trigger Animations
        // Use requestAnimationFrame to ensure the browser registers the initial CSS state before adding classes
        requestAnimationFrame(() => {
            // Add 'show' class for fade + slide up animation
            card.classList.add('show');
            // Add 'highlight' class for neon glow
            card.classList.add('highlight');

            // Remove highlight after a few seconds
            setTimeout(() => {
                if(card) card.classList.remove('highlight');
            }, 3000);
        });
    }

    // Export Functionality
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const dataStr = JSON.stringify(allMessages, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'dj_chat_export.json';
            a.click();
            
            URL.revokeObjectURL(url);
        });
    }
}

// ==========================================
// LOGIC FOR INPUT SCREEN (input.html)
// ==========================================
const messageForm = document.getElementById('messageForm');
const userNameInput = document.getElementById('userName');
const userMessageInput = document.getElementById('userMessage');
const submitBtn = document.getElementById('submitBtn');
const statusAlert = document.getElementById('statusAlert');

if (messageForm) {
    messageForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const name = userNameInput.value.trim();
        const message = userMessageInput.value.trim();

        if (!name || !message) {
            showStatus('Please fill in both fields.', 'error');
            return;
        }

        // Disable button while sending
        submitBtn.disabled = true;
        submitBtn.textContent = 'SENDING...';

        // Push data to Firebase under 'messages'
        const newMsgData = {
            name: name,
            message: message,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        messagesRef.push(newMsgData)
            .then(() => {
                // Success
                messageForm.reset();
                showStatus('Message sent!', 'success');
                // Give user a moment of success before putting focus back or allowing next
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'SEND MESSAGE';
                }, 1000);
            })
            .catch((error) => {
                // Error (e.g. permission denied)
                console.error("Error setting data: ", error);
                showStatus('Failed to send message.', 'error');
                submitBtn.disabled = false;
                submitBtn.textContent = 'SEND MESSAGE';
            });
    });

    function showStatus(text, type) {
        statusAlert.style.display = 'block';
        statusAlert.textContent = text;
        statusAlert.className = 'mt-3 ' + (type === 'error' ? 'text-danger' : 'text-success');
        
        // Hide after 3 seconds
        setTimeout(() => {
            statusAlert.style.display = 'none';
        }, 3000);
    }
}

// Utility: HTML Escaping to prevent basic XSS
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// ==========================================
// DYNAMIC QR CODE GENERATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const qrElement = document.getElementById("qrcode");
    if (qrElement) {
        // Construct the URL for input.html based on current location
        let currentUrl = window.location.href;
        // Strip out index.html if present, or just use directory
        let baseUrl = currentUrl.split('?')[0].split('#')[0];
        if (baseUrl.endsWith('index.html')) {
            baseUrl = baseUrl.replace('index.html', '');
        }
        if (!baseUrl.endsWith('/')) {
            baseUrl += '/';
        }
        const inputUrl = baseUrl + "input.html";

        new QRCode(qrElement, {
            text: inputUrl,
            width: 100,
            height: 100,
            colorDark: "#ffffff",
            colorLight: "#000000",
            correctLevel: QRCode.CorrectLevel.H
        });
    }
});

// ==========================================
// LOGIC FOR REALTIME SETTINGS (Global Themes)
// ==========================================
const settingsRef = db.ref('settings');

// Helper to parse Hex to RGB
function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

const applyColorVar = (hex, prefix) => {
    if(!hex) return;
    const rgb = hexToRgb(hex);
    if(rgb) {
        document.documentElement.style.setProperty('--' + prefix + '-color', hex);
        document.documentElement.style.setProperty('--' + prefix + '-r', rgb.r);
        document.documentElement.style.setProperty('--' + prefix + '-g', rgb.g);
        document.documentElement.style.setProperty('--' + prefix + '-b', rgb.b);
    }
};

// 1. Listen for Setting Changes (Applies to ALL pages)
settingsRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        // Apply Global Colors
        applyColorVar(data.primaryColor, 'primary');
        applyColorVar(data.secondaryColor, 'secondary');
        applyColorVar(data.bgColor, 'bg');
        applyColorVar(data.fontColor, 'text');

        // Apply Global Timing Interval
        if (data.msgInterval) {
            globalInterval = parseFloat(data.msgInterval);
        }

        // Apply Web Title
        if (data.webTitle) {
            document.title = data.webTitle;
            document.querySelectorAll('.custom-web-title').forEach(el => {
                el.textContent = data.webTitle;
            });
        }
        
        // Update Logos (Global)
        if (data.logoBase64) {
            document.querySelectorAll('.logo').forEach(img => {
                img.src = data.logoBase64;
            });
        }

        // Sync Data to Settings Form if we are on settings page
        if (document.getElementById('settingsForm')) {
            const safeSetVal = (id, val) => { if(document.getElementById(id) && val) document.getElementById(id).value = val; };
            safeSetVal('primaryColor', data.primaryColor);
            safeSetVal('secondaryColor', data.secondaryColor);
            safeSetVal('bgColor', data.bgColor);
            safeSetVal('fontColor', data.fontColor);
            safeSetVal('webTitle', data.webTitle);
            safeSetVal('msgInterval', data.msgInterval);

            // Update visible hex labels
            document.querySelectorAll('.form-control-color').forEach(input => {
                const hexText = input.nextElementSibling;
                if(hexText && hexText.classList.contains('colorHexText')) {
                    hexText.textContent = input.value;
                }
            });
        }
    }
});

// 2. Logic to Save Data From Settings Page
const activeSettingsForm = document.getElementById('settingsForm');
if (activeSettingsForm) {
    const primaryColorInput = document.getElementById('primaryColor');
    const secondaryColorInput = document.getElementById('secondaryColor');
    const bgColorInput = document.getElementById('bgColor');
    const fontColorInput = document.getElementById('fontColor');
    const webTitleInput = document.getElementById('webTitle');
    const msgIntervalInput = document.getElementById('msgInterval');
    const logoImageInput = document.getElementById('logoImage');
    
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    const settingsAlert = document.getElementById('settingsAlert');
    const previewLogo = document.getElementById('previewLogo');

    // Update Hex text labels on change
    document.querySelectorAll('.form-control-color').forEach(input => {
        input.addEventListener('input', (e) => {
            const hexText = e.target.nextElementSibling;
            if(hexText && hexText.classList.contains('colorHexText')) {
                hexText.textContent = e.target.value;
            }
        });
    });

    // Preview logo locally when selected
    logoImageInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                previewLogo.src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    activeSettingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveSettingsBtn.disabled = true;
        saveSettingsBtn.textContent = 'SAVING...';

        const file = logoImageInput.files[0];

        // Ensure we capture all fields
        const updates = {
            primaryColor: primaryColorInput.value,
            secondaryColor: secondaryColorInput.value,
            bgColor: bgColorInput.value,
            fontColor: fontColorInput.value,
            webTitle: webTitleInput.value.trim(),
            msgInterval: parseFloat(msgIntervalInput.value) || 3
        };

        const pushToDb = (base64) => {
            if (base64) updates.logoBase64 = base64;
            
            settingsRef.update(updates).then(() => {
                showSettingsAlert('Global Settings Successfully Updated!', 'success');
                saveSettingsBtn.disabled = false;
                saveSettingsBtn.textContent = 'SAVE ALL SETTINGS';
            }).catch(err => {
                console.error("Firebase update failed:", err);
                showSettingsAlert('Failed to save settings.', 'error');
                saveSettingsBtn.disabled = false;
                saveSettingsBtn.textContent = 'SAVE ALL SETTINGS';
            });
        };

        if (file) {
            if (file.size > 1500000) { // Max 1.5MB constraint
                showSettingsAlert('Image is too large! Maximum 1.5MB allowed.', 'error');
                saveSettingsBtn.disabled = false;
                saveSettingsBtn.textContent = 'SAVE ALL SETTINGS';
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => { pushToDb(event.target.result); };
            reader.readAsDataURL(file);
        } else {
            pushToDb(null); // Save without modifying logo if not uploaded
        }
    });

    function showSettingsAlert(text, type) {
        settingsAlert.style.display = 'block';
        settingsAlert.textContent = text;
        settingsAlert.className = 'mt-4 py-2 px-3 rounded text-center ' + (type === 'error' ? 'bg-danger text-white' : 'bg-success text-white');
        setTimeout(() => { settingsAlert.style.display = 'none'; }, 4000);
    }
}
