const AppState = {
  currentUser: "@umar_developer",
  bio: "Building the Super App Platform 🚀",
  likesCount: 0,
  subscribersCount: 1200,
  postsCount: 0,
  reels: [],
  textPosts: [],
  comments: {}
};

document.addEventListener('DOMContentLoaded', () => {
  initTabNavigation();
  initProfileEdit();
  initAudioRecorder();
  fetchMockWeather();
  initUploadHandlers();
});

function initTabNavigation() {
  const navBtns = document.querySelectorAll('.bottom-nav .nav-item');
  const views = document.querySelectorAll('.tab-view');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      navBtns.forEach(b => b.classList.remove('active'));
      views.forEach(v => v.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

// Profile Editing Logic
function initProfileEdit() {
  const editBtn = document.getElementById('editProfileBtn');
  const usernameEl = document.getElementById('profileUsername');
  const bioEl = document.getElementById('profileBio');
  const avatarInput = document.getElementById('avatarUploadInput');

  editBtn.addEventListener('click', () => {
    const newName = prompt("Enter new username:", AppState.currentUser);
    const newBio = prompt("Enter new bio:", AppState.bio);

    if (newName) {
      AppState.currentUser = newName;
      usernameEl.innerText = newName;
    }
    if (newBio) {
      AppState.bio = newBio;
      bioEl.innerText = newBio;
    }
  });

  avatarInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const imgUrl = URL.createObjectURL(file);
      document.getElementById('profileAvatarImg').src = imgUrl;
    }
  });
}

// Audio Recording Setup
let mediaRecorder;
let audioChunks = [];

function initAudioRecorder() {
  const voiceBtn = document.getElementById('voiceRecordBtn');
  const chatBody = document.getElementById('chatMessages');

  voiceBtn.addEventListener('click', async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);
        audioChunks = [];

        mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' });
          const audioUrl = URL.createObjectURL(audioBlob);
          
          const audioElem = document.createElement('audio');
          audioElem.controls = true;
          audioElem.src = audioUrl;

          const msgDiv = document.createElement('div');
          msgDiv.className = 'msg-bubble msg-sent';
          msgDiv.appendChild(audioElem);
          chatBody.appendChild(msgDiv);
        };

        mediaRecorder.start();
        voiceBtn.style.color = '#ef4444';
      } catch (err) {
        alert("Microphone permission required for voice notes.");
      }
    } else {
      mediaRecorder.stop();
      voiceBtn.style.color = '#fff';
    }
  });
}

// Weather Placeholder Fetcher
function fetchMockWeather() {
  const weatherText = document.getElementById('weatherText');
  weatherText.innerText = "Karachi: 32°C Sunny";
}

// Global Media Upload
function initUploadHandlers() {
  const plusBtn = document.getElementById('plusMediaUploadBtn');
  const videoInput = document.getElementById('globalVideoInput');

  plusBtn.addEventListener('click', () => videoInput.click());

  videoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const videoURL = URL.createObjectURL(file);
      AppState.reels.unshift({
        id: 'reel-' + Date.now(),
        url: videoURL,
        likes: 0,
        user: AppState.currentUser
      });
      renderReels();
    }
  });
}

function renderReels() {
  const container = document.getElementById('reelsContainer');
  container.innerHTML = '';

  AppState.reels.forEach(reel => {
    const reelEl = document.createElement('div');
    reelEl.className = 'reel-card';
    reelEl.innerHTML = `
      <video src="${reel.url}" loop autoplay controls playsinline></video>
    `;
    container.appendChild(reelEl);
  });
}
