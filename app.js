// ===== JARVIS AI - Version 1 (mode local, sans IA externe) =====

// 1) Récupération des éléments de la page
const chat = document.getElementById('chat');
const form = document.getElementById('form');
const input = document.getElementById('input');
const micBtn = document.getElementById('micBtn');
const core = document.getElementById('core');
const voiceToggle = document.getElementById('voiceToggle');

// 2) Afficher un message dans la conversation
function addMessage(text, who) {
  const div = document.createElement('div');
  div.className = 'msg ' + who;
  div.textContent = text; // textContent = sécurisé (pas de code injecté)
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

// 3) Changer l'état visuel du cercle
function setState(state) {
  core.className = 'core' + (state ? ' ' + state : '');
}

// 4) La voix (synthèse vocale du navigateur, gratuite)
function speak(text) {
  if (!voiceToggle.checked || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'fr-FR';
  const fr = speechSynthesis.getVoices().find(v => v.lang && v.lang.startsWith('fr'));
  if (fr) u.voice = fr;
  u.onstart = () => setState('speaking');
  u.onend = () => setState('');
  speechSynthesis.speak(u);
}

// 5) Commandes autorisées (on pourra en ajouter facilement)
const commands = [
  { words: ['bonjour', 'salut', 'hello'], run: () => 'Bonjour. Je suis JARVIS, à votre service.' },
  { words: ['heure'], run: () => 'Il est ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) + '.' },
  { words: ['date', 'jour sommes'], run: () => 'Nous sommes le ' + new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + '.' },
  { words: ['qui es-tu', 'qui es tu', 'ton nom'], run: () => 'Je suis JARVIS, votre assistant personnel. Version 1, mode local.' },
  { words: ['blague'], run: () => 'Pourquoi les plongeurs plongent-ils en arrière ? Parce que sinon ils tombent dans le bateau.' },
  { words: ['efface', 'effacer'], run: () => { chat.innerHTML = ''; return 'Conversation effacée.'; } },
  { words: ['aide', 'que sais-tu faire'], run: () => "Commandes disponibles : bonjour, quelle heure, quelle date, qui es-tu, une blague, efface, aide." },
];

// 6) Le "cerveau" : pour l'instant local. Plus tard, on branchera une vraie IA ici.
async function think(text) {
  const t = text.toLowerCase();
  const cmd = commands.find(c => c.words.some(w => t.includes(w)));
  if (cmd) return cmd.run();
  // PLUS TARD : return await askAI(text);  (via un serveur qui garde la clé API secrète)
  return "Je ne connais pas encore cette commande. Dites « aide » pour voir ce que je sais faire. L'intelligence artificielle sera connectée dans une prochaine version.";
}

// 7) Traiter un message (écrit ou vocal)
async function handle(text) {
  text = text.trim();
  if (!text) return;
  addMessage(text, 'user');
  setState('thinking');
  const reply = await think(text);
  setState('');
  addMessage(reply, 'jarvis');
  speak(reply);
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  handle(input.value);
  input.value = '';
});

// 8) Le micro (reconnaissance vocale - marche surtout sur Chrome Android)
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
if (!SR) {
  micBtn.disabled = true;
  micBtn.style.opacity = 0.3;
} else {
  const rec = new SR();
  rec.lang = 'fr-FR';
  rec.interimResults = false;
  let listening = false;

  micBtn.addEventListener('click', () => {
    if (listening) { rec.stop(); return; }
    speechSynthesis && speechSynthesis.cancel();
    try { rec.start(); } catch (e) { /* déjà démarré */ }
  });
  rec.onstart = () => { listening = true; micBtn.classList.add('active'); setState('listening'); };
  rec.onend = () => { listening = false; micBtn.classList.remove('active'); if (core.classList.contains('listening')) setState(''); };
  rec.onresult = (e) => handle(e.results[0][0].transcript);
  rec.onerror = (e) => {
    const msg = e.error === 'not-allowed'
      ? "Accès au micro refusé. Autorisez le micro dans Chrome (et utilisez une adresse https)."
      : 'Erreur micro : ' + e.error;
    addMessage(msg, 'jarvis');
  };
}

// 9) Message d'accueil (sans voix : Chrome bloque la voix avant un premier clic)
addMessage('Système en ligne. Bonjour, je suis JARVIS. Écrivez ou touchez le micro. Dites « aide » pour commencer.', 'jarvis');
