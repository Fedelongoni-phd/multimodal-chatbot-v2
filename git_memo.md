# 🧠 Git & GitHub – Promemoria Operativo

## 📍 Posizione del progetto
```
C:\Users\feder\multimodal-chatbot-v2
```

---

## 🚀 Primo collegamento (già fatto)
Hai già collegato il tuo progetto locale a GitHub:
👉 https://github.com/Fedelongoni-phd/multimodal-chatbot-v2  
Quindi **non serve rifarlo** ogni volta.

---

## 🔄 Aggiornare il repository dopo una modifica

Ogni volta che cambi o aggiungi file nel progetto:

```bash
git add .
git commit -m "Descrivi brevemente cosa hai modificato"
git push
```

### ✨ Esempio:
```bash
git add .
git commit -m "Aggiunto nuovo modulo per il riconoscimento vocale"
git push
```

---

## 🔍 Significato dei comandi

| Comando | Significato |
|----------|--------------|
| `git add .` | Prepara tutti i file modificati per l’aggiornamento |
| `git commit -m "messaggio"` | Crea una nuova versione del progetto (snapshot) |
| `git push` | Invia la versione aggiornata su GitHub |

---

## 💾 Vedere lo stato attuale
Per controllare cosa è cambiato:
```bash
git status
```

---

## 🧭 Clonare il progetto su un altro PC
Se vuoi scaricare di nuovo il tuo progetto da GitHub:
```bash
git clone https://github.com/Fedelongoni-phd/multimodal-chatbot-v2.git
```

---

## 🧹 In caso di errore remoto
Se Git dice:
```
fatal: remote origin already exists
```
Usa:
```bash
git remote set-url origin https://github.com/Fedelongoni-phd/multimodal-chatbot-v2.git
```

---

## ✅ Flusso completo in breve

```
Modifico i file  ➜  git add .  ➜  git commit -m "..."  ➜  git push
```

---

✍️ **Consiglio:**  
Scrivi sempre un messaggio chiaro nel commit, così puoi ricordare facilmente le modifiche fatte.

---

👤 Autore: **Feder Longoni**  
📦 Repo: `multimodal-chatbot-v2`  
🕓 Ultimo aggiornamento: ottobre 2025
