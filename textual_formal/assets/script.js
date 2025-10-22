const chat = document.getElementById("chat");
const input = document.getElementById("userInput");
const form = document.getElementById("chatForm");
const sendBtn = document.getElementById("send");

let isWaiting = false;
let isAnimating = false;

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
  
  // Salva nel browser
  localStorage.setItem('chatHistory_formal', JSON.stringify(messages));
}

function loadConversation() {
  const saved = localStorage.getItem('chatHistory_formal');
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

function addMessage(text, sender) {
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
    bubble.innerHTML = window.marked ? marked.parse(text) : text;

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
  });
}

function showTypingIndicator() {
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

async function sendMessage(e) {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || isWaiting) return;

  addMessage(text, "user");
  input.value = "";

  isWaiting = true;
  sendBtn.classList.add("up");
  sendBtn.setAttribute("aria-busy", "true");
  sendBtn.disabled = true;
  input.setAttribute("aria-disabled", "true");
  input.disabled = true;
  chat.setAttribute("aria-busy", "true");

  const typing = showTypingIndicator();

  try {
    const res = await fetch(
      "https://n8n.srv1060901.hstgr.cloud/webhook/e69d6e9f-2c8b-4dbf-b93b-99f39923ce6f/chat",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      }
    );

    if (!res.ok) throw new Error(`Errore HTTP ${res.status}`);
    const data = await res.json();

    typing.remove();
    addMessage(
      data.output || data.text || data.reply || "💬 Nessuna risposta ricevuta.",
      "bot"
    );
  } catch (err) {
    typing.remove();
    addMessage("⚠️ Errore di connessione al server.", "bot");
  }

  isWaiting = false;
  isAnimating = true;
  sendBtn.classList.add("return");

  sendBtn.addEventListener(
    "animationend",
    () => {
      sendBtn.classList.remove("return");
      sendBtn.classList.remove("up");
      isAnimating = false;
      sendBtn.removeAttribute("aria-busy");
      sendBtn.disabled = false;
      input.removeAttribute("aria-disabled");
      input.disabled = false;
      chat.removeAttribute("aria-busy");
    },
    { once: true }
  );
}

input.addEventListener("input", () => {
  if (isWaiting || isAnimating) return;
  if (input.value.trim() !== "") sendBtn.classList.add("up");
  else sendBtn.classList.remove("up");
});

form.addEventListener("submit", sendMessage);

// Carica conversazione salvata all'avvio
window.addEventListener("load", loadConversation);
