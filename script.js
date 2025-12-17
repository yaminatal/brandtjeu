// === 7 ÉTAPES – ORDRE ALÉATOIRE À CHAQUE PARTIE ===
let indicesText = [
  "Cherche là où les légumes croquants dorment dans le froid…                     ابحث حيث ترتاح الخضروات الطازجة في البرودة",
  "Cherche là où les vêtements attendent calmement… juste avant de sortir sans plis.                     حيث تنتظر الملابس بهدوء… قبل أن تخرج بدون طيّات",
  "Compte ce que tu peux ranger… l’indice t’attend là où les assiettes s’alignent                     عدّ ما يمكنك ترتيبه… ستجد التلميح حيث تصطف الأطباق",
  "Cherche là où on réchauffe les plats…                     أبحث عنه أين تُسخَّن الأطباق",
  "Le monde défile en images… Le prochain indice se cache là où tout commence en Haute Définition                     العالم يمرّ أمامك في صور… أمّا الدليل التالي فيختبئ هناك، حيث تبدأ الحكاية بدقّة عالية",
  "Cherche là où l’air froid s’échappe pour combattre la chaleur d’été                     ابحث حيث يخرج الهواء البارد لمقاومة حرارة الصيف",
  "Cherche là où Vedette brille en bleu                     ابحث حيث تلمع Vedette باللون الأزرق"
];

let qrKeys = [
  'refrigerateur', 'lavage_linge', 'lavage_vaisselle', 'cuisson', 'ctv', 'climatiseur', 'vedette'
];

// Mélange aléatoire
function melangerEtapes() {
  const ordre = Array.from({length: 7}, (_, i) => i);
  for (let i = ordre.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ordre[i], ordre[j]] = [ordre[j], ordre[i]];
  }
  localStorage.setItem('ordreEtapes', JSON.stringify(ordre));
}

let ordreEtapes = localStorage.getItem('ordreEtapes');
if (!ordreEtapes) {
  melangerEtapes();
  ordreEtapes = localStorage.getItem('ordreEtapes');
}
ordreEtapes = JSON.parse(ordreEtapes);

const indicesTextMelange = ordreEtapes.map(i => indicesText[i]);
const qrKeysMelange = ordreEtapes.map(i => qrKeys[i]);

let indicesTextFinal = indicesTextMelange;
let qrKeysFinal = qrKeysMelange;

// Chargement questions
let questions = null;
fetch('questions.json')
  .then(res => res.ok ? res.json() : Promise.reject())
  .then(data => {
    questions = data;
    console.log('Questions chargées !');
    if (Object.keys(userInfo).length > 0) updateEtapesUI();
  });

// Variables
let userInfo = localStorage.getItem('userInfo') ? JSON.parse(localStorage.getItem('userInfo')) : {};
let progress = localStorage.getItem('progress') ? JSON.parse(localStorage.getItem('progress')) : { current: 0, completed: [] };

// === LANCEMENT DIRECT DEPUIS LE QR CODE PRINCIPAL (?start=1) ===
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('start') === '1') {
  // Si déjà inscrit → direct aux étapes
  if (localStorage.getItem('userInfo')) {
    document.getElementById('bienvenue').classList.add('d-none');
    document.getElementById('accueil').classList.add('d-none');
    document.getElementById('etapes').classList.remove('d-none');
    updateEtapesUI();
  } 
  // Sinon → direct au formulaire
  else {
    document.getElementById('bienvenue').classList.add('d-none');
    document.getElementById('accueil').classList.remove('d-none');
  }
}

// Inscription
document.getElementById('form-inscription').addEventListener('submit', (e) => {
  e.preventDefault();
  userInfo = {
    nom: document.getElementById('nom').value.trim(),
    prenom: document.getElementById('prenom').value.trim(),
    tel: document.getElementById('tel').value.trim()
  };
  localStorage.setItem('userInfo', JSON.stringify(userInfo));
  localStorage.setItem('progress', JSON.stringify(progress));

  document.getElementById('accueil').classList.add('d-none');
  document.getElementById('etapes').classList.remove('d-none');
  updateEtapesUI();
});

// Mise à jour UI étapes
function updateEtapesUI() {
  if (!questions) return;

  for (let i = 0; i < 7; i++) {
    const el = document.getElementById(`step-${i}`);
    const texte = indicesTextFinal[i];

    el.classList.remove('disabled', 'step-current');

    if (progress.completed.includes(i)) {
      el.innerHTML = texte + ' <span class="text-success fw-bold">Validé</span>';
      el.onclick = null;
    } else if (i === progress.completed.length) {
      el.innerHTML = texte + ' <span class="text-danger fw-bold">Cadenas</span>';
      el.classList.add('step-current');
      el.onclick = () => startStep(i);
    } else {
      el.innerHTML = texte + ' <span class="text-muted">Cadenas</span>';
      el.classList.add('disabled');
      el.onclick = null;
    }
  }

  if (progress.completed.length === 7) showSucces();
}

// Démarrer étape
function startStep(index) {
  if (!questions) return;

  document.getElementById('etapes').classList.add('d-none');
  document.getElementById('scanner-section').classList.remove('d-none');
  document.getElementById('instruction').innerHTML = '<strong>Indice :</strong><br>' + indicesTextFinal[index];

  document.getElementById('qr-reader').innerHTML = '';

  const scanner = new Html5Qrcode("qr-reader");
  scanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 300, height: 300 } },
    (text) => {
      if (text.toLowerCase().trim().includes(qrKeysFinal[index].toLowerCase())) {
        scanner.stop().then(() => {
          document.getElementById('qr-reader').innerHTML = '';
          showQuestion(index);
        });
      }
    },
    () => {}
  ).catch(() => {});
}

// Afficher question
function showQuestion(index) {
  const fam = qrKeysFinal[index];

  document.getElementById('scanner-section').classList.add('d-none');

  const section = document.getElementById('question-section');
  section.classList.remove('d-none', 'border-success', 'border-danger');

  const feedback = document.getElementById('feedback');
  feedback.textContent = '';
  feedback.className = 'mt-3 fw-bold text-center mb-4';

  if (!questions || !questions[fam]) {
    feedback.textContent = 'Erreur : questions non chargées. Rechargement...';
    feedback.className = 'text-danger fw-bold';
    setTimeout(() => location.reload(), 3000);
    return;
  }

  const q = questions[fam][Math.floor(Math.random() * questions[fam].length)];
  document.getElementById('question-text').innerText = q.question;

  const form = document.getElementById('form-question');
  form.innerHTML = '';

  q.options.forEach((opt, idx) => {
    const div = document.createElement('div');
    div.className = 'form-check mb-3';
    div.innerHTML = `
      <input class="form-check-input" type="radio" name="reponse" value="${opt}" id="opt${idx}">
      <label class="form-check-label" for="opt${idx}">${opt}</label>
    `;
    form.appendChild(div);
  });

  const btn = document.createElement('button');
  btn.type = 'submit';
  btn.className = 'btn btn-brandt mt-4 px-5';
  btn.textContent = 'Valider ma réponse';
  form.appendChild(btn);

  form.onsubmit = (e) => {
    e.preventDefault();
    const selected = document.querySelector('input[name="reponse"]:checked');

    if (selected && selected.value === q.correct) {
      section.classList.add('border-success');
      feedback.textContent = 'Bonne réponse ! Cool !';
      feedback.className = 'text-success fw-bold';

      progress.completed.push(index);
      progress.current = progress.completed.length;
      localStorage.setItem('progress', JSON.stringify(progress));

      setTimeout(() => {
        section.classList.add('d-none');
        document.getElementById('etapes').classList.remove('d-none');
        updateEtapesUI();
        if (progress.completed.length === 7) showSucces();
      }, 3000);

    } else {
      section.classList.add('border-danger');
      feedback.textContent = 'Mauvaise réponse, réessayez !';
      feedback.className = 'text-danger fw-bold';
    }
  };
}

// Succès
function showSucces() {
  document.getElementById('etapes').classList.add('d-none');
  document.getElementById('succes').classList.remove('d-none');
}

// Reset
document.getElementById('reset-game')?.addEventListener('click', () => {
  if (confirm('Recommencer depuis le début ?')) {
    localStorage.clear();
    location.reload();
  }
});