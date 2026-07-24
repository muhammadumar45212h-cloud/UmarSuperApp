let reelsData = [
    {
        id: 101,
        user: "@aqib_official",
        description: "New status video #viral #trending",
        url: "https://www.w3schools.com/html/mov_bbb.mp4",
        likes: 1240,
        comments: [
            { user: "@umar", text: "Zabardast editing!" },
            { user: "@ali", text: "Nice video bhai!" }
        ]
    }
];

window.onload = function() {
    renderReels();
};

function renderReels() {
    const container = document.getElementById('reelsContainer');
    container.innerHTML = "";

    reelsData.forEach((reel, index) => {
        const reelItem = document.createElement('div');
        reelItem.className = 'reel-item';
        reelItem.innerHTML = `
            <video class="reel-video" src="${reel.url}" loop onclick="togglePlay(this)"></video>
            <div class="reel-overlay">
                <h3>${reel.user}</h3>
                <p>${reel.description}</p>
            </div>
            <div class="reel-side-actions">
                <div class="action-btn" onclick="likeReel(${index})">
                    <i class="fa-solid fa-heart"></i>
                    <span>${reel.likes}</span>
                </div>
                <div class="action-btn" onclick="openComments(${index})">
                    <i class="fa-solid fa-comment"></i>
                    <span>${reel.comments.length}</span>
                </div>
                <div class="action-btn" onclick="shareReel(${reel.id}, '${reel.user}', '${reel.description}')">
                    <i class="fa-solid fa-share"></i>
                    <span>Share</span>
                </div>
            </div>
        `;
        container.appendChild(reelItem);
    });
}

function togglePlay(video) {
    if (video.paused) video.play();
    else video.pause();
}

function likeReel(index) {
    reelsData[index].likes++;
    renderReels();
}

// Deep Link Sharing Logic
function shareReel(id, user, desc) {
    const shareUrl = `https://superapp.link/video?id=${id}&creator=${encodeURIComponent(user)}`;
    navigator.clipboard.writeText(shareUrl);
    alert(`Link Copied!\n\n${shareUrl}\n\nClicking this link directly opens video inside Super App.`);
}

// Comments Sheet Logic
let currentActiveReel = 0;
function openComments(index) {
    currentActiveReel = index;
    const list = document.getElementById('commentsList');
    list.innerHTML = "";
    
    reelsData[index].comments.forEach(c => {
        const div = document.createElement('div');
        div.style.padding = "6px 0";
        div.innerHTML = `<strong>${c.user}:</strong> ${c.text}`;
        list.appendChild(div);
    });

    document.getElementById('commentsDrawer').classList.remove('hidden');
}

function addComment() {
    const input = document.getElementById('newCommentInput');
    if (!input.value) return;

    reelsData[currentActiveReel].comments.push({
        user: "@me",
        text: input.value
    });

    openComments(currentActiveReel);
    input.value = "";
}

function closeComments() {
    document.getElementById('commentsDrawer').classList.add('hidden');
}

// Real IDE Execution
function runCode() {
    const code = document.getElementById('codeEditor').value;
    const iframe = document.getElementById('codeOutput').contentWindow.document;
    iframe.open();
    iframe.write(code);
    iframe.close();
}

// Navigation Tabs
function switchTab(tab, el) {
    document.querySelectorAll('.tab-page').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    if (el) el.classList.add('active');
}

// Full-screen Settings
function openFullSettings() { document.getElementById('fullSettingsPage').classList.remove('hidden'); }
function closeFullSettings() { document.getElementById('fullSettingsPage').classList.add('hidden'); }

function changeAppTheme(color) {
    document.documentElement.style.setProperty('--primary-color', color);
}

function triggerGallery() { document.getElementById('chatGalleryInput').click(); }

function sendGalleryPhoto(e) {
    const file = e.target.files[0];
    if (file) {
        const url = URL.createObjectURL(file);
        const area = document.getElementById('chatMessages');
        area.innerHTML += `<div style="text-align:right; margin:8px;"><img src="${url}" style="max-width:180px; border-radius:10px;"></div>`;
    }
}
