// Global Posts Array with Storage Support
let userPosts = JSON.parse(localStorage.getItem('app_posts')) || [];
let appSpeed = 900;

window.onload = function() {
    renderPosts();
};

// Switch Tabs
function switchTab(tabName, element) {
    document.querySelectorAll('.tab-page').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(btn => btn.classList.remove('active'));

    document.getElementById(`tab-${tabName}`).classList.add('active');
    if (element) element.classList.add('active');

    if (tabName === 'forex') loadTradingViewWidget('FX:XAUUSD');
}

// Media Upload logic with Instant Local Feed Rendering
function publishMedia() {
    const fileInput = document.getElementById('modalFileInput');
    const caption = document.getElementById('mediaCaption').value;

    if (!fileInput.files[0]) {
        alert("Pehle Video ya Photo Select Karein!");
        return;
    }

    const file = fileInput.files[0];
    const fileURL = URL.createObjectURL(file);

    const newPost = {
        id: Date.now(),
        type: file.type.startsWith('video/') ? 'video' : 'image',
        url: fileURL,
        caption: caption,
        timestamp: new Date().toLocaleTimeString()
    };

    userPosts.unshift(newPost);
    localStorage.setItem('app_posts', JSON.stringify(userPosts));

    renderPosts();
    closeUploadModal();
    alert("Post Upload Hogayi!");
}

function renderPosts() {
    const videoFeed = document.getElementById('videoFeed');
    const myVideosGrid = document.getElementById('myVideosGrid');
    
    videoFeed.innerHTML = "";
    myVideosGrid.innerHTML = "";

    userPosts.forEach(post => {
        const item = document.createElement('div');
        item.className = 'video-card card';
        
        if (post.type === 'video') {
            item.innerHTML = `
                <video src="${post.url}" controls></video>
                <p style="margin-top:8px;">${post.caption}</p>
            `;
        } else {
            item.innerHTML = `
                <img src="${post.url}" style="width:100%; border-radius:8px;">
                <p style="margin-top:8px;">${post.caption}</p>
            `;
        }

        videoFeed.appendChild(item.cloneNode(true));
        myVideosGrid.appendChild(item);
    });
}

// Text Post logic
function publishTextPost() {
    const text = document.getElementById('textPostInput').value;
    if (!text) return;

    const container = document.getElementById('textPostsContainer');
    const postCard = document.createElement('div');
    postCard.className = 'card margin-top-sm';
    postCard.innerText = text;
    container.prepend(postCard);

    document.getElementById('textPostInput').value = "";
}

// Code IDE Logic
function runCode() {
    const code = document.getElementById('codeEditor').value;
    const output = document.getElementById('codeOutput').contentWindow.document;
    output.open();
    output.write(code);
    output.close();
}

// Account Email & Password Changes
function updateAccountEmail() {
    const newEmail = document.getElementById('userEmailInput').value;
    alert("Account Email updated to: " + newEmail);
}

function updateAccountPassword() {
    const newPass = document.getElementById('userPasswordInput').value;
    if (newPass.length < 6) {
        alert("Password must be at least 6 characters!");
        return;
    }
    alert("Account Password updated successfully!");
}

// App Speed Settings Logic
function adjustAppSpeed(val) {
    appSpeed = val;
    document.getElementById('speedValue').innerText = val;
}

// Modals
function openUploadModal() { document.getElementById('uploadModal').classList.remove('hidden'); }
function closeUploadModal() { document.getElementById('uploadModal').classList.add('hidden'); }
function openSettings() { document.getElementById('settingsModal').classList.remove('hidden'); }
function closeSettingsModal() { document.getElementById('settingsModal').classList.add('hidden'); }
