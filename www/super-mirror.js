(function () {
  'use strict';

  const WELCOME_KEY = 'SUPER_APP_MIRROR_WELCOME_V1';
  const birthdayRunUsers = new Set();
  let lastCheckedUser = '';

  function getCurrentUser() {
    try {
      return (localStorage.getItem('SUPER_APP_CURRENT_USER') || '')
        .trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    } catch (_) { return ''; }
  }

  function toast(message) {
    try {
      if (typeof window.showToast === 'function') window.showToast(message);
      else console.log('[Super Mirror]', message);
    } catch (_) { console.log('[Super Mirror]', message); }
  }

  function addWelcome() {
    try {
      if (localStorage.getItem(WELCOME_KEY)) return;
      const overlay = document.createElement('div');
      overlay.id = 'super-mirror-welcome';
      overlay.innerHTML =
        '<div class="super-mirror-glow">' +
          '<div class="super-mirror-logo">SUPER APP</div>' +
          '<div class="super-mirror-subtitle">A new world of connection</div>' +
        '</div>';
      document.body.appendChild(overlay);
      localStorage.setItem(WELCOME_KEY, '1');
      window.setTimeout(function () {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity .35s ease';
        window.setTimeout(function () { overlay.remove(); }, 380);
      }, 3000);
    } catch (e) { console.warn('Welcome screen:', e); }
  }

  function addPetals() {
    if (document.getElementById('super-mirror-petals')) return;
    const layer = document.createElement('div');
    layer.id = 'super-mirror-petals';
    layer.setAttribute('aria-hidden', 'true');

    for (let i = 0; i < 7; i++) {
      const petal = document.createElement('span');
      petal.className = 'super-mirror-petal';
      petal.style.setProperty('--left', (5 + i * 14) + '%');
      petal.style.setProperty('--size', (10 + (i % 3) * 4) + 'px');
      petal.style.setProperty('--duration', (12 + (i % 4) * 3) + 's');
      petal.style.setProperty('--delay', (-i * 2.1) + 's');
      petal.style.setProperty('--drift', ((i % 2 ? 1 : -1) * (25 + i * 4)) + 'px');
      layer.appendChild(petal);
    }
    document.body.appendChild(layer);
  }

  function addBirthdayFields() {
    const phone = document.getElementById('edit-phone');
    if (!phone || document.getElementById('super-birthday-date')) return;

    const wrapper = document.createElement('div');
    wrapper.id = 'super-birthday-settings';
    wrapper.innerHTML =
      '<div class="mt-3">' +
        '<label for="super-birthday-date" class="text-[10px] text-gray-400 uppercase block mb-1">Birthday (optional)</label>' +
        '<input id="super-birthday-date" type="date" max="2100-12-31" ' +
        'class="w-full bg-gray-800 border border-gray-700 p-2.5 rounded-xl text-xs text-white">' +
        '<p class="text-[9px] text-gray-500 mt-1">Ye KYC date se alag profile setting hai.</p>' +
      '</div>' +
      '<label class="flex items-start gap-2 mt-3 text-[10px] text-gray-300">' +
        '<input id="super-birthday-public" type="checkbox" class="mt-0.5 accent-pink-500">' +
        '<span>Public birthday celebration allow karein. Birthday par feed mein automatic post banega.</span>' +
      '</label>';
    phone.parentElement.insertAdjacentElement('afterend', wrapper);
  }

  function readCachedUser(username) {
    try {
      const all = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      return all[username] || {};
    } catch (_) { return {}; }
  }

  function updateCachedUser(username, fields) {
    try {
      const all = JSON.parse(localStorage.getItem('SUPER_APP_USERS') || '{}');
      all[username] = Object.assign({}, all[username] || {}, fields);
      localStorage.setItem('SUPER_APP_USERS', JSON.stringify(all));
    } catch (e) { console.warn('Profile cache update:', e); }
  }

  function connectProfileEditor() {
    addBirthdayFields();

    const originalOpen = window.openEditProfileModal;
    if (typeof originalOpen === 'function' && !originalOpen.__superMirrorWrapped) {
      const wrappedOpen = function () {
        const result = originalOpen.apply(this, arguments);
        addBirthdayFields();
        const username = getCurrentUser();
        const user = readCachedUser(username);
        const date = document.getElementById('super-birthday-date');
        const consent = document.getElementById('super-birthday-public');
        if (date) date.value = user.birthday || '';
        if (consent) consent.checked = user.birthdayPublic === true;
        return result;
      };
      wrappedOpen.__superMirrorWrapped = true;
      window.openEditProfileModal = wrappedOpen;
    }

    const originalSave = window.saveEditProfile;
    if (typeof originalSave === 'function' && !originalSave.__superMirrorWrapped) {
      const wrappedSave = async function () {
        const username = getCurrentUser();
        const date = document.getElementById('super-birthday-date');
        const consent = document.getElementById('super-birthday-public');
        const birthday = date ? date.value : '';
        const birthdayPublic = !!(consent && consent.checked);

        if (birthday && !/^\d{4}-\d{2}-\d{2}$/.test(birthday)) {
          toast('Birthday date sahi select karein.');
          return;
        }

        const result = await originalSave.apply(this, arguments);
        if (!username) return result;

        const fields = { birthday: birthday, birthdayPublic: birthdayPublic };
        updateCachedUser(username, fields);

        try {
          if (typeof db !== 'undefined' && db && db.collection) {
            await db.collection('users').doc(username).set(fields, { merge: true });
            toast('Birthday settings saved.');
          } else {
            toast('Birthday local profile mein save hui; server connection available nahi.');
          }
        } catch (e) {
          console.error('Birthday profile save failed:', e);
          toast('Birthday server par save nahi hui. Internet/Firestore check karein.');
        }
        return result;
      };
      wrappedSave.__superMirrorWrapped = true;
      window.saveEditProfile = wrappedSave;
    }
  }

  function birthdayMatchesToday(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const parts = value.split('-');
    const now = new Date();
    return Number(parts[1]) === now.getMonth() + 1 &&
      Number(parts[2]) === now.getDate();
  }

  function showBirthday(username, displayName) {
    const old = document.getElementById('super-mirror-birthday');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id = 'super-mirror-birthday';

    const confettiColors = ['#ffdb70', '#ff65b5', '#70e8ff', '#a58bff', '#7cffb2'];
    for (let i = 0; i < 30; i++) {
      const piece = document.createElement('span');
      piece.className = 'super-birthday-confetti';
      piece.style.setProperty('--x', (Math.random() * 100) + '%');
      piece.style.setProperty('--wait', (-Math.random() * 4) + 's');
      piece.style.setProperty('--sway', ((Math.random() - .5) * 150) + 'px');
      piece.style.setProperty('--color', confettiColors[i % confettiColors.length]);
      overlay.appendChild(piece);
    }

    const card = document.createElement('div');
    card.className = 'super-birthday-card';

    const cake = document.createElement('div');
    cake.className = 'super-birthday-cake';
    cake.textContent = '🎂';

    const title = document.createElement('div');
    title.className = 'super-birthday-title';
    title.textContent = 'Happy Birthday!';

    const name = document.createElement('div');
    name.className = 'super-birthday-name';
    name.textContent = displayName || ('@' + username);

    const message = document.createElement('p');
    message.className = 'super-birthday-message';
    message.textContent = 'Aapka naya saal khushiyon, sehat, kamyabi aur khoobsurat lamhon se bhara ho! 🎉';

    const close = document.createElement('button');
    close.className = 'super-birthday-close';
    close.type = 'button';
    close.textContent = 'Thank You ❤️';
    close.addEventListener('click', function () { overlay.remove(); });

    card.append(cake, title, name, message, close);
    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  async function publishBirthdayPost(username, displayName, birthdayYear) {
    if (typeof db === 'undefined' || !db || !db.collection) return;

    const postId = 'birthday_' + username + '_' + birthdayYear;
    const postRef = db.collection('posts').doc(postId);

    try {
      const existing = await postRef.get();
      if (existing.exists) return;

      const post = {
        id: postId,
        type: 'text',
        url: null,
        user: username,
        caption: '🎂 It is my birthday today! Thank you for being part of my Super App journey. 🎉❤️',
        link: null,
        likes: [],
        comments: [],
        views: 0,
        birthdayPost: true,
        birthdayYear: birthdayYear,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      await postRef.set(post);
      toast('🎉 Aapka birthday post feed mein publish ho gaya!');
    } catch (e) {
      console.error('Birthday post failed:', e);
      toast('Birthday celebration hui, lekin post publish nahi ho saka.');
    }
  }

  async function checkBirthday(username) {
    if (!username || birthdayRunUsers.has(username)) return;
    birthdayRunUsers.add(username);

    try {
      if (typeof db === 'undefined' || !db || !db.collection) return;
      const snapshot = await db.collection('users').doc(username).get();
      if (!snapshot.exists) return;

      const user = snapshot.data() || {};
      if (!birthdayMatchesToday(user.birthday)) return;

      const year = new Date().getFullYear();
      const shownKey = 'SUPER_APP_BIRTHDAY_SHOWN_' + username + '_' + year;

      if (!localStorage.getItem(shownKey)) {
        localStorage.setItem(shownKey, '1');
        showBirthday(username, user.name || username);
      }

      if (user.birthdayPublic === true) {
        await publishBirthdayPost(username, user.name || username, year);
      }
    } catch (e) {
      birthdayRunUsers.delete(username);
      console.warn('Birthday check:', e);
    }
  }

  function init() {
    addWelcome();
    addPetals();
    connectProfileEditor();

    const firstUser = getCurrentUser();
    if (firstUser) checkBirthday(firstUser);

    window.setInterval(function () {
      const username = getCurrentUser();
      if (username && username !== lastCheckedUser) {
        lastCheckedUser = username;
        checkBirthday(username);
      }
      if (username && !document.getElementById('super-birthday-date')) {
        connectProfileEditor();
      }
    }, 2500);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  console.log('✨ Super Mirror Experience loaded');
})();
