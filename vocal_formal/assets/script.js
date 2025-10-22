const chat = document.getElementById("chat");
const micButton = document.getElementById("micButton");
const audioEl = document.getElementById("replyAudio");

let mediaRecorder;
let chunks = [];
let isRecording = false;
let listeningMsg = null;
let typing = null;

// === PERFORMANCE OPTIMIZATIONS ===
const MAX_MESSAGES = 50;
const MESSAGE_BUFFER = 10;

// Debounce per salvataggio
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Salva solo dopo 2 secondi di inattività
const debouncedSave = debounce(saveConversation, 2000);

// === PERSISTENZA CONVERSAZIONE ===
function saveConversation() {
  const messages = [];
  
  // Raccoglie tutti i messaggi dalla chat
  document.querySelectorAll('.msg').forEach(msg => {
    const bubble = msg.querySelector('.bubble');
    const text = bubble.textContent;
    const sender = msg.classList.contains('user') ? 'user' : 'bot';
    
    messages.push({
      text: text,
      sender: sender,
      timestamp: Date.now()
    });
  });
  
  // Salva nel browser (sessionStorage - si resetta quando chiudi la pagina)
  sessionStorage.setItem('chatHistory_vocal_formal', JSON.stringify(messages));
}

function loadConversation() {
  const saved = sessionStorage.getItem('chatHistory_vocal_formal');
  if (saved) {
    const messages = JSON.parse(saved);
    
    // Pulisce la chat attuale
    chat.innerHTML = '';
    
    // Ricrea tutti i messaggi salvati
    messages.forEach(msg => {
      addMessage(msg.text, msg.sender);
    });
  }
}

// Cleanup per evitare memory leaks
function cleanup() {
  const oldMessages = document.querySelectorAll('.msg:not(:last-child)');
  oldMessages.forEach(msg => {
    // Cleanup se necessario
  });
  
  // Garbage collection hint
  if (window.gc) {
    window.gc();
  }
}

// Cleanup ogni 5 minuti
setInterval(cleanup, 300000);

// Performance monitoring
function measurePerformance(name, fn) {
  const start = performance.now();
  const result = fn();
  const end = performance.now();
  console.log(`${name} took ${end - start} milliseconds`);
  return result;
}

// ===== funzioni chat =====
function addMessage(html, sender) {
  return measurePerformance('addMessage', () => {
    const msg = document.createElement("div");
    msg.classList.add("msg", sender);

    // Se ci sono troppi messaggi, rimuovi i più vecchi
    if (chat.children.length > MAX_MESSAGES) {
      const messagesToRemove = chat.children.length - MAX_MESSAGES + MESSAGE_BUFFER;
      for (let i = 0; i < messagesToRemove; i++) {
        if (chat.firstChild) {
          chat.removeChild(chat.firstChild);
        }
      }
    }

    const bubble = document.createElement("div");
    bubble.classList.add("bubble");
    bubble.innerHTML = html;

    // Lazy loading per immagini
    const images = bubble.querySelectorAll('img');
    images.forEach(img => {
      img.loading = 'lazy';
      img.decoding = 'async';
    });

    msg.appendChild(bubble);
    chat.appendChild(msg);
    
    // Scroll ottimizzato con requestAnimationFrame
    requestAnimationFrame(() => {
      chat.scrollTop = chat.scrollHeight;
    });

    // Salva con debounce
    debouncedSave();
    
    return msg;
  });
}

function addTypingIndicator() {
  const typing = document.createElement("div");
  typing.classList.add("msg", "bot");
  typing.innerHTML = `
    <div class="typing-indicator">
      <span></span><span></span><span></span>
    </div>`;
  chat.appendChild(typing);
  chat.scrollTop = chat.scrollHeight;
  return typing;
}

function base64ToBlob(base64, type) {
  const clean = base64.includes(",") ? base64.split(",")[1] : base64;
  const binary = atob(clean);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i);
  return new Blob([array], { type });
}

function playAudio(blob) {
  const url = URL.createObjectURL(blob);
  audioEl.src = url;
  audioEl.hidden = false;
  audioEl.load();
  audioEl.play().catch(() => {});
}

// ===== registrazione =====
async function startRecording(e) {
  e.preventDefault();
  if (isRecording) return;
  isRecording = true;
  micButton.classList.add("recording");
  micButton.setAttribute("aria-pressed", "true");

  listeningMsg = addMessage(
    `<div class="recording-light"></div> Sto ascoltando`,
    "user"
  );

  try {
    // Usa microfono selezionato
    const constraints = {
      audio: selectedMicrophone ? 
        { deviceId: { exact: selectedMicrophone } } : 
        true
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const opts = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? { mimeType: "audio/webm;codecs=opus" }
      : {};
    mediaRecorder = new MediaRecorder(stream, opts);
    chunks = [];

    mediaRecorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      sendAudioToN8N(blob);
      stream.getTracks().forEach(t => t.stop());
    };

    mediaRecorder.start();
  } catch (err) {
    isRecording = false;
    micButton.classList.remove("recording");
    addMessage(`⚠️ Errore microfono: ${err.message}`, "bot");
  }
}

function stopRecording(e) {
  e.preventDefault();
  if (!isRecording) return;
  isRecording = false;
  micButton.classList.remove("recording");
  micButton.setAttribute("aria-pressed", "false");
  micButton.classList.add("released");
  setTimeout(() => micButton.classList.remove("released"), 450);
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
}

// ===== invio e risposta =====
async function sendAudioToN8N(blob) {
  typing = addTypingIndicator();
  chat.setAttribute("aria-busy", "true");

  const form = new FormData();
  if (!sessionStorage.getItem("sessionId_vocale_formale")) {
    sessionStorage.setItem("sessionId_vocale_formale", crypto.randomUUID());
  }
  const sessionId = sessionStorage.getItem("sessionId_vocale_formale");

  form.append("sessionId", sessionId);
  form.append("file0", blob, "input.webm");

  try {
    const res = await fetch(
      "https://n8n.srv1060901.hstgr.cloud/webhook/e03d09eb-88f5-46ed-81b4-99974fc016ff",
      { method: "POST", body: form }
    );

    if (!res.ok) throw new Error(`Errore HTTP ${res.status}`);

    const ct = res.headers.get("content-type") || "";

    if (ct.includes("application/json")) {
      const data = await res.json();

      if (listeningMsg && data.userText) {
        listeningMsg.querySelector(".bubble").innerHTML = data.userText;
      } else if (listeningMsg) {
        listeningMsg.querySelector(".bubble").innerHTML = "🗣️ Messaggio vocale inviato";
      }

      if (typing) typing.remove();
      const replyText = data.output || data.text || data.reply || "🔊 Risposta vocale pronta.";
      addMessage(replyText, "bot");

      if (data.audio) {
        const audioBlob = base64ToBlob(data.audio, "audio/mpeg");
        playAudio(audioBlob);
      }
    } else {
      const audioBlob = await res.blob();
      if (listeningMsg) listeningMsg.querySelector(".bubble").innerHTML = "🗣️ Messaggio vocale inviato";
      if (typing) typing.remove();
      addMessage("🔊 Risposta vocale ricevuta", "bot");
      playAudio(audioBlob);
    }
  } catch (err) {
    if (typing) typing.remove();
    addMessage(`⚠️ Errore: ${err.message}`, "bot");
  } finally {
    listeningMsg = null;
    chat.removeAttribute("aria-busy");
  }
}

// ===== eventi =====
micButton.addEventListener("mousedown", startRecording);
micButton.addEventListener("touchstart", startRecording, { passive: false, capture: true });
micButton.addEventListener("mouseup", stopRecording);
micButton.addEventListener("mouseleave", stopRecording);
micButton.addEventListener("touchend", stopRecording, { passive: false, capture: true });
micButton.addEventListener("touchcancel", stopRecording, { passive: false, capture: true });

// Prevenire scroll durante touch su mobile
micButton.addEventListener("touchstart", (e) => {
  e.preventDefault();
}, { passive: false });

// Carica conversazione salvata all'avvio
window.addEventListener("load", loadConversation);

// === GESTIONE DISPOSITIVI AUDIO ===
let selectedMicrophone = null;
let selectedSpeaker = null;
let audioContext = null;

// Carica dispositivi disponibili
async function loadAudioDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const microphones = devices.filter(device => device.kind === 'audioinput');
    const speakers = devices.filter(device => device.kind === 'audiooutput');
    
    // Popola microfono
    const micSelect = document.getElementById('microphoneSelect');
    micSelect.innerHTML = '<option value="">Microfono predefinito</option>';
    microphones.forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Microfono ${device.deviceId.slice(0, 8)}`;
      micSelect.appendChild(option);
    });
    
    // Popola casse
    const speakerSelect = document.getElementById('speakerSelect');
    speakerSelect.innerHTML = '<option value="">Casse predefinite</option>';
    speakers.forEach(device => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || `Casse ${device.deviceId.slice(0, 8)}`;
      speakerSelect.appendChild(option);
    });
    
    // Carica preferenze salvate
    const savedMic = localStorage.getItem('selectedMicrophone');
    const savedSpeaker = localStorage.getItem('selectedSpeaker');
    
    if (savedMic) micSelect.value = savedMic;
    if (savedSpeaker) speakerSelect.value = savedSpeaker;
    
  } catch (error) {
    console.error('Errore caricamento dispositivi:', error);
  }
}

// Toggle pannello dispositivi
function toggleDevices() {
  const panel = document.getElementById('devicesPanel');
  const overlay = document.querySelector('.devices-overlay');
  
  if (panel.style.display === 'none') {
    // Mostra pannello
    panel.style.display = 'block';
    document.body.appendChild(createOverlay());
    loadAudioDevices();
  } else {
    // Nascondi pannello
    panel.style.display = 'none';
    if (overlay) overlay.remove();
  }
}

// Crea overlay per chiudere
function createOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'devices-overlay';
  overlay.onclick = toggleDevices;
  return overlay;
}

// Test microfono
async function testMicrophone() {
  const micSelect = document.getElementById('microphoneSelect');
  const deviceId = micSelect.value;
  
  try {
    const constraints = {
      audio: deviceId ? { deviceId: { exact: deviceId } } : true
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    // Mostra feedback visivo
    const button = document.querySelector('.test-mic');
    button.textContent = '🎤 Registrando...';
    button.style.background = '#ef4444';
    
    // Ferma dopo 3 secondi
    setTimeout(() => {
      stream.getTracks().forEach(track => track.stop());
      button.textContent = '🎤 Test Microfono';
      button.style.background = '#10b981';
    }, 3000);
    
  } catch (error) {
    alert('Errore accesso microfono: ' + error.message);
  }
}

// Test casse
async function testSpeaker() {
  const speakerSelect = document.getElementById('speakerSelect');
  const deviceId = speakerSelect.value;
  
  try {
    // Crea audio context con dispositivo specifico
    if (audioContext) audioContext.close();
    audioContext = new AudioContext();
    
    // Crea tono di test
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    
    oscillator.start();
    
    // Mostra feedback
    const button = document.querySelector('.test-speaker');
    button.textContent = '🔊 Suono in corso...';
    button.style.background = '#ef4444';
    
    // Ferma dopo 2 secondi
    setTimeout(() => {
      oscillator.stop();
      button.textContent = '🔊 Test Audio';
      button.style.background = '#3b82f6';
    }, 2000);
    
  } catch (error) {
    alert('Errore test audio: ' + error.message);
  }
}

// Salva preferenze
function saveDevicePreferences() {
  const micSelect = document.getElementById('microphoneSelect');
  const speakerSelect = document.getElementById('speakerSelect');
  
  if (micSelect.value) {
    localStorage.setItem('selectedMicrophone', micSelect.value);
    selectedMicrophone = micSelect.value;
  }
  
  if (speakerSelect.value) {
    localStorage.setItem('selectedSpeaker', speakerSelect.value);
    selectedSpeaker = speakerSelect.value;
  }
}

// Event listeners per salvare preferenze
document.addEventListener('DOMContentLoaded', () => {
  const micSelect = document.getElementById('microphoneSelect');
  const speakerSelect = document.getElementById('speakerSelect');
  
  if (micSelect) {
    micSelect.addEventListener('change', saveDevicePreferences);
  }
  if (speakerSelect) {
    speakerSelect.addEventListener('change', saveDevicePreferences);
  }
});
