# Multimodal Chatbot – Versione 2

Benvenuto nella **Versione 2** del progetto *Multimodal Chatbot*.  

---

## Homepage del progetto
https://fedelongoni-phd.github.io/multimodal-chatbot-v2/

---

## Interfacce testuali

- Chatbot Testuale Formale  
  https://fedelongoni-phd.github.io/multimodal-chatbot-v2/textual_formal/

- Chatbot Testuale Empatica  
  https://fedelongoni-phd.github.io/multimodal-chatbot-v2/textual_empathic/

---

## Interfacce vocali

- Chatbot Vocale Formale  
  https://fedelongoni-phd.github.io/multimodal-chatbot-v2/vocal_formal/

- Chatbot Vocale Empatica  
  https://fedelongoni-phd.github.io/multimodal-chatbot-v2/vocal_empathic/

---

## Architettura generale

Il progetto è strutturato su due livelli principali:

### Frontend
- Sviluppato in HTML5, CSS3 e JavaScript.  
- Gestisce l’interfaccia e l’invio dei messaggi all’API n8n (via `fetch()` REST).  
- Responsivo e accessibile, ottimizzato per mobile.  
- Pubblicato su GitHub Pages.

### Backend (n8n)
- Tutta la logica di conversazione e la gestione multimodale è implementata tramite workflow n8n.
- n8n coordina:
  - chiamate al modello Gemini Flash 2.5 (LLM di Google, per generazione del linguaggio),
  - e alla piattaforma ElevenLabs (per sintesi vocale **TTS** e riconoscimento vocale **STT**).
- I workflow espongono endpoint pubblici (`webhook`) a cui il frontend invia richieste.  
- Ogni versione del chatbot (formale / empatica, testuale / vocale) ha un workflow dedicato.

---

## Pipeline del sistema

Utente → Interfaccia (Frontend) → Webhook n8n → ElevenLabs (STT) → Gemini Flash 2.5 → ElevenLabs (TTS) → Risposta al Frontend

---

## Modelli e tecnologie principali

| Componente | Tecnologia / Modello | Funzione |
|-------------|----------------------|-----------|
| LLM | Gemini Flash 2.5 (Google) | Generazione del testo in linguaggio naturale |
| TTS/STT | ElevenLabs | Sintesi e riconoscimento vocale avanzato |
| Workflow Engine | n8n | Orchestrazione delle API e automazione della logica conversazionale |
| Frontend | HTML, CSS, JavaScript | Interfaccia utente (testuale e vocale) |
| Hosting | GitHub Pages | Pubblicazione statica dell’interfaccia |

---

## Descrizione del progetto

Il Multimodal Chatbot è pensato per esplorare l'interazione uomo–macchina attraverso la combinazione di modalità (testuale / vocale) e stile (empatico / formale).  

---

## Requisiti per la replica (opzionale)
- Account n8n (self-hosted o cloud)
- API key Gemini (Google AI Studio)
- API key ElevenLabs (Text-to-Speech e Speech-to-Text)
- GitHub Pages attivo per il frontend

---

Autore: [Fedelongoni-phd](https://github.com/Fedelongoni-phd)  
Ultimo aggiornamento: ottobre 2025
V
