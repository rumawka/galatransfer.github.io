let lang = 'ru';

// ── LANG ──
function setLang(l) {
  lang = l;
  ['ru','en','bg'].forEach(code => {
    const isActive = code === l;
    document.querySelectorAll('.t-' + code).forEach(el => {
      if (isActive) {
        el.style.display = el.tagName === 'LABEL' ? 'block' : 'inline';
      } else {
        el.style.display = 'none';
      }
    });
    // sync all lang buttons (desktop + mobile)
    ['btn-','mob-btn-'].forEach(prefix => {
      const btn = document.getElementById(prefix + code);
      if (btn) btn.classList.toggle('active', isActive);
    });
  });
  recalc();
}

// ── CALCULATOR ──
// Логика цен:
// Попутчики (shared): цена фиксирована = base * 0.55 за МЕСТО → умножаем на кол-во пасс.
// Индивидуальный:     цена за машину   = base * classM → умножаем на кол-во пасс.
function recalc() {
  const routeSel = document.getElementById('f-route');
  const typeSel  = document.getElementById('f-type');
  const classSel = document.getElementById('f-class');
  const paxSel   = document.getElementById('f-pax');

  const base    = parseFloat(routeSel.value);
  const typeVal = typeSel.value;          // '1' = private, '0.55' = shared
  const classM  = parseFloat(classSel.value);
  const pax     = parseInt(paxSel.value) || 1;

  const routeOpt = routeSel.options[routeSel.selectedIndex];
  const classOpt = classSel.options[classSel.selectedIndex];

  const routeName = routeOpt.dataset[lang] || routeOpt.text;
  const className = classOpt.dataset[lang] || classOpt.text;
  const model     = classOpt.dataset.model || '';

  // Показываем/скрываем класс машины — для попутчиков он не влияет
  const classRow = document.getElementById('class-row');
  if (classRow) {
    classRow.style.opacity = typeVal === '0.55' ? '0.4' : '1';
    classRow.title = typeVal === '0.55'
      ? { ru:'При поездке с попутчиками класс автомобиля не выбирается', en:'Vehicle class is not applicable for shared rides', bg:'Класът не се избира при споделено пътуване' }[lang] || ''
      : '';
  }

  if (base === 0) {
    document.getElementById('p-total').textContent = '?';
    document.getElementById('p-route').textContent = routeName;
    document.getElementById('p-class').textContent = className + ' · ' + model;
    return;
  }

  let total;
  if (typeVal === '0.55') {
    // Попутчики: фиксированная цена за место × кол-во пасс.
    total = Math.round(base * 0.55 * pax);
  } else {
    // Индивидуальный: цена за машину × класс × кол-во пасс.
    total = Math.round(base * classM * pax);
  }

  document.getElementById('p-total').textContent = total;
  document.getElementById('p-route').textContent = routeName;
  document.getElementById('p-class').textContent = className + ' · ' + model;
}

// ── MESSENGER SELECTOR ──
let selectedMessenger = 'phone';
function selectMsg(btn) {
  document.querySelectorAll('.msg-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedMessenger = btn.dataset.messenger;
  const ph = document.getElementById('f-phone');
  const placeholders = {
    phone:    '+7 / +359 / +90 ...',
    telegram: '@username или +номер',
    whatsapp: '+359 885 055 578',
    viber:    '+359 885 055 578',
    imo:      '+номер телефона',
    max:      '+7 9xx xxx xx xx',
    email:    'your@email.com'
  };
  ph.placeholder = placeholders[selectedMessenger] || '+7 / +359 / +90 ...';
  ph.type = selectedMessenger === 'email' ? 'email' : 'text';
}

// ── BOOKING ──
async function sendBooking() {
  const phone   = document.getElementById('f-phone').value.trim();
  const name    = document.getElementById('f-name').value.trim();
  const dt      = document.getElementById('f-datetime').value;
  const pax     = document.getElementById('f-pax').value;
  const comment = document.getElementById('f-comment').value.trim();
  const msgrLabels = {phone:'📞 Телефон',telegram:'✈️ Telegram',whatsapp:'💬 WhatsApp',viber:'📲 Viber',imo:'📱 IMO',max:'🟡 MAX',email:'📧 Email'};
  const msgrLabel = msgrLabels[selectedMessenger] || '📱 Контакт';

  const errMsg = {ru:'Укажите контакт для связи', en:'Please enter your contact', bg:'Въведете контакт'};
  if (phone.length < 3) { showToast(errMsg[lang]); return; }

  const routeSel  = document.getElementById('f-route');
  const typeSel   = document.getElementById('f-type');
  const classSel  = document.getElementById('f-class');
  const total     = document.getElementById('p-total').textContent;

  const routeRu = routeSel.options[routeSel.selectedIndex].dataset.ru;
  const routeEn = routeSel.options[routeSel.selectedIndex].dataset.en;
  const typeRu  = typeSel.options[typeSel.selectedIndex].dataset.ru;
  const classRu = classSel.options[classSel.selectedIndex].dataset.ru;
  const model   = classSel.options[classSel.selectedIndex].dataset.model;

  const msg = `🌟 *НОВЫЙ ЗАКАЗ — Gala Transfer*
━━━━━━━━━━━━━━━━━━━━━━
📍 *Маршрут:* ${routeRu} / ${routeEn}
🚗 *Тип:* ${typeRu}
🚙 *Класс:* ${classRu} (${model})
👥 *Пассажиров:* ${pax}
📅 *Дата/время:* ${dt ? dt.replace('T',' ') : '—'}
💰 *Стоимость:* ${total}€
━━━━━━━━━━━━━━━━━━━━━━
👤 *Имя:* ${name || '—'}
${msgrLabel}: ${phone}
💬 *Доп. инфо:* ${comment || '—'}`;

  const btn = document.getElementById('btn-book');
  btn.disabled = true;

  try {
    const res = await fetch('api/send.php', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({message: msg})
    });
    const ok = {ru:'✓ Заявка отправлена! Ответим за 15 минут',en:'✓ Request sent! We\'ll reply in 15 min',bg:'✓ Запитването е изпратено! Ще отговорим до 15 мин'};
    const fail = {ru:'Ошибка. Попробуйте ещё раз.',en:'Error. Please try again.',bg:'Грешка. Опитайте отново.'};
    showToast(res.ok ? ok[lang] : fail[lang]);
    if (res.ok) {
      ['f-phone','f-name','f-comment'].forEach(id => document.getElementById(id).value = '');
    }
  } catch(e) {
    const net = {ru:'Ошибка сети.',en:'Network error.',bg:'Мрежова грешка.'};
    showToast(net[lang]);
  }
  btn.disabled = false;
}

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 4500);
}

// ── SLIDER ──
let slideIdx = 0;
const track = document.getElementById('sliderTrack');
const slides = track.querySelectorAll('.review-slide');
const dotsContainer = document.getElementById('sliderDots');

slides.forEach((_, i) => {
  const d = document.createElement('button');
  d.className = 'slider-dot' + (i===0?' active':'');
  d.onclick = () => goSlide(i);
  dotsContainer.appendChild(d);
});

function goSlide(n) {
  slideIdx = (n + slides.length) % slides.length;
  track.style.transform = `translateX(-${slideIdx * 100}%)`;
  document.querySelectorAll('.slider-dot').forEach((d,i) => d.classList.toggle('active', i===slideIdx));
}
function slideMove(dir) { goSlide(slideIdx + dir); }
setInterval(() => slideMove(1), 6000);

// ── SCROLL ANIMATIONS ──
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ── MOBILE MENU ──
function toggleMenu() {
  const burger  = document.getElementById('burger');
  const drawer  = document.getElementById('mobileDrawer');
  burger.classList.toggle('open');
  drawer.classList.toggle('open');
}
function closeMenu() {
  document.getElementById('burger').classList.remove('open');
  document.getElementById('mobileDrawer').classList.remove('open');
}

// ── INIT ──
setLang('ru');