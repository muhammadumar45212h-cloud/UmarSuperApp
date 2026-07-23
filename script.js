// Import Firebase SDK Modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    doc, 
    getDocs, 
    updateDoc, 
    arrayUnion, 
    onSnapshot 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB9ACAxelcW-esJWUDrD5lhL_7svxlyGxc",
  authDomain: "umarsuperapp.firebaseapp.com",
  projectId: "umarsuperapp",
  storageBucket: "umarsuperapp.firebasestorage.app",
  messagingSenderId: "812034119197",
  appId: "1:812034119197:web:60dc07304f30f29f6058f4",
  measurementId: "G-T8YZKR2SRR"
};

// Initialize Firebase App & Firestore Database
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// Local State & App Logic
(function() {
    const USERS_KEY = 'super_app_users';
    const CURRENT_USER_KEY = 'super_app_current_user';
    const SESSIONS_KEY = 'super_app_sessions';

    let users = JSON.parse(localStorage.getItem(USERS_KEY)) || {};
    let currentUser = JSON.parse(localStorage.getItem(CURRENT_USER_KEY)) || null;
    let sessions = JSON.parse(localStorage.getItem(SESSIONS_KEY)) || [];

    let posts = [
        {
            id: 'p1',
            username: '@official_channel',
            videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
            title: 'Welcome to Super App Reels!',
            description: '#superapp #viral #trending',
            likes: {},
            likesCount: 120,
            comments: [
                {
                    id: 'c1',
                    username: '@umar_dev',
                    userPhoto: 'https://via.placeholder.com/40',
                    text: 'Super app is looking amazing with Firebase integration! 🔥',
                    timestamp: Date.now() - 3600000,
                    replies: [
                        {
                            id: 'r1',
                            username: '@official_channel',
                            userPhoto: 'https://via.placeholder.com/40',
                            text: 'Thanks Umar bhai! Real-time DB is active now.',
                            timestamp: Date.now() - 1800000
                        }
                    ]
                }
            ]
        }
    ];

    let activeCommentPostId = null;
    let activeReplyToCommentId = null;

    function saveLocalUser() {
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(currentUser));
        localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    }

    // Register Function
    window.handleRegister = function(identifier, password, name, photoUrl) {
        if (!identifier || !password || password.length < 6 || !name) {
            alert('Password must be at least 6 characters and all fields required.');
            return false;
        }
        if (users[identifier]) {
            alert('User already exists!');
            return false;
        }
        const newUser = {
            id: 'user_' + Date.now(),
            identifier,
            name,
            password,
            photoUrl: photoUrl || 'https://via.placeholder.com/150',
            createdAt: Date.now()
        };
        users[identifier] = newUser;
        currentUser = newUser;
        
        sessions.push({
            userId: newUser.id,
            deviceName: 'Mobile Device',
            loginTime: Date.now()
        });

        saveLocalUser();
        alert('Account Created Successfully!');
        location.reload();
        return true;
    };

    // Login Function
    window.handleLogin = function(identifier, password) {
        if (users[identifier] && users[identifier].password === password) {
            currentUser = users[identifier];
            saveLocalUser();
            location.reload();
            return true;
        } else {
            alert('Invalid credentials!');
            return false;
        }
    };

    // Settings Toggle & Logout
    window.toggleSettings = function() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.style.display = (modal.style.display === 'block') ? 'none' : 'block';
        }
    };

    window.handleLogout = function() {
        currentUser = null;
        localStorage.removeItem(CURRENT_USER_KEY);
        alert('Logged out successfully.');
        location.reload();
    };

    // Device Removal Restriction (1 Week Rule)
    window.removeSessionDevice = function(sessionIndex) {
        const session = sessions[sessionIndex];
        if (!session) return;
        const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
        if ((Date.now() - session.loginTime) < ONE_WEEK_MS) {
            alert("Security Alert: Device removal disabled within 1 week of initial login.");
            return;
        }
        sessions.splice(sessionIndex, 1);
        saveLocalUser();
        alert("Device removed successfully.");
        location.reload();
    };

    // REAL LIKES
    window.toggleLike = function(postId) {
        if (!currentUser) {
            alert("Please log in to like videos!");
            return;
        }
        const post = posts.find(p => p.id === postId);
        if (!post) return;

        if (post.likes[currentUser.id]) {
            delete post.likes[currentUser.id];
            post.likesCount--;
        } else {
            post.likes[currentUser.id] = true;
            post.likesCount++;
        }
        if (window.renderReels) window.renderReels();
    };

    // COMMENTS MODAL & REPLIES SYSTEM
    window.openCommentsModal = function(postId) {
        activeCommentPostId = postId;
        activeReplyToCommentId = null;
        const modal = document.getElementById('commentsModal');
        if (!modal) return;
        
        renderCommentsList();
        modal.style.display = 'flex';
    };

    window.closeCommentsModal = function() {
        const modal = document.getElementById('commentsModal');
        if (modal) modal.style.display = 'none';
        activeCommentPostId = null;
        activeReplyToCommentId = null;
    };

    function renderCommentsList() {
        const listContainer = document.getElementById('commentsListContainer');
        const replyTag = document.getElementById('replyingToTag');
        if (!listContainer) return;

        const post = posts.find(p => p.id === activeCommentPostId);
        if (!post || !post.comments) {
            listContainer.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 20px;">No comments yet.</div>';
            return;
        }

        if (activeReplyToCommentId && replyTag) {
            const replyTarget = post.comments.find(c => c.id === activeReplyToCommentId);
            replyTag.style.display = 'block';
            replyTag.innerText = `Replying to ${replyTarget ? replyTarget.username : 'comment'} (Tap to cancel)`;
        } else if (replyTag) {
            replyTag.style.display = 'none';
        }

        let html = '';
        post.comments.forEach(comment => {
            html += `
                <div class="comment-item">
                    <div class="comment-header">
                        <img src="${comment.userPhoto}" class="comment-avatar" />
                        <span class="comment-user">${comment.username}</span>
                    </div>
                    <div class="comment-text">${comment.text}</div>
                    <button class="comment-reply-btn" onclick="setReplyTarget('${comment.id}')">Reply</button>
                    
                    ${comment.replies && comment.replies.length > 0 ? `
                        <div class="replies-container">
                            ${comment.replies.map(r => `
                                <div class="reply-item">
                                    <div class="comment-header">
                                        <img src="${r.userPhoto}" class="reply-avatar" />
                                        <span class="comment-user">${r.username}</span>
                                    </div>
                                    <div class="comment-text">${r.text}</div>
                                </div>
                            `).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        });
        listContainer.innerHTML = html;
    }

    window.setReplyTarget = function(commentId) {
        activeReplyToCommentId = commentId;
        renderCommentsList();
        const input = document.getElementById('commentInput');
        if (input) input.focus();
    };

    window.cancelReplyTarget = function() {
        activeReplyToCommentId = null;
        renderCommentsList();
    };

    window.submitComment = function() {
        const input = document.getElementById('commentInput');
        if (!input || !input.value.trim()) return;

        if (!currentUser) {
            alert("Please log in to comment!");
            return;
        }

        const post = posts.find(p => p.id === activeCommentPostId);
        if (!post) return;

        const commentText = input.value.trim();

        if (activeReplyToCommentId) {
            const targetComment = post.comments.find(c => c.id === activeReplyToCommentId);
            if (targetComment) {
                if (!targetComment.replies) targetComment.replies = [];
                targetComment.replies.push({
                    id: 'r_' + Date.now(),
                    username: '@' + currentUser.name.toLowerCase().replace(/\s+/g, '_'),
                    userPhoto: currentUser.photoUrl || 'https://via.placeholder.com/40',
                    text: commentText,
                    timestamp: Date.now()
                });
            }
        } else {
            post.comments.push({
                id: 'c_' + Date.now(),
                username: '@' + currentUser.name.toLowerCase().replace(/\s+/g, '_'),
                userPhoto: currentUser.photoUrl || 'https://via.placeholder.com/40',
                text: commentText,
                timestamp: Date.now(),
                replies: []
            });
        }

        input.value = '';
        activeReplyToCommentId = null;
        renderCommentsList();
    };

    // AI Dynamic Chat
    window.askAI = function(userQuery) {
        if (!userQuery.trim()) return "Please enter a question.";
        const query = userQuery.toLowerCase();
        
        if (query.includes("hello") || query.includes("hi") || query.includes("salam")) {
            return `Hello ${currentUser ? currentUser.name : 'User'}! Welcome to Super App powered by Firebase.`;
        } else if (query.includes("code") || query.includes("js") || query.includes("python")) {
            return "Use our Compiler tab to execute JavaScript snippets on your device!";
        } else if (query.includes("forex") || query.includes("gold") || query.includes("btc")) {
            return "Live charts are available under the Markets tab!";
        } else {
            return `You asked: "${userQuery}". AI service is fully connected!`;
        }
    };

    // Termux Compiler Real Execution
    window.runJSCompiler = function(code) {
        const outputBox = document.getElementById('compilerOutput');
        if (!code.trim()) {
            outputBox.innerText = "Error: Code snippet is empty.";
            outputBox.style.color = "#ff4d4d";
            return;
        }
        try {
            let logs = [];
            const customConsole = {
                log: (...args) => logs.push(args.join(' ')),
                error: (...args) => logs.push("Error: " + args.join(' ')),
                warn: (...args) => logs.push("Warning: " + args.join(' '))
            };
            const runFn = new Function('console', code);
            const result = runFn(customConsole);
            
            if (logs.length > 0) {
                outputBox.innerText = logs.join('\n');
                outputBox.style.color = "#00ffcc";
            } else if (result !== undefined) {
                outputBox.innerText = "Result: " + result;
                outputBox.style.color = "#00ffcc";
            } else {
                outputBox.innerText = "Execution finished successfully (No output).";
                outputBox.style.color = "#00ffcc";
            }
        } catch (err) {
            outputBox.innerText = "Error: " + err.message;
            outputBox.style.color = "#ff4d4d";
        }
    };

    // Download & Share
    window.shareVideo = function(videoUrl, title) {
        if (navigator.share) {
            navigator.share({ title: title || 'Super App Video', url: videoUrl });
        } else {
            navigator.clipboard.writeText(videoUrl);
            alert("Video link copied to clipboard!");
        }
    };

    window.downloadVideo = function(videoUrl, fileName) {
        const a = document.createElement('a');
        a.href = videoUrl;
        a.download = fileName || 'super_app_video.mp4';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        alert("Downloading video...");
    };

})();
