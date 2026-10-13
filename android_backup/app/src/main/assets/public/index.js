(function() {
    'use strict';

    // ==========================================
    // WAIT FOR FIRESTORE
    // ==========================================
    function waitForDB(cb) {
        if (typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length) {
            cb();
        } else {
            setTimeout(() => waitForDB(cb), 500);
        }
    }

    // ==========================================
    // HELPER FUNCTIONS
    // ==========================================
    function showToast(msg) {
        if (typeof window.showToast === 'function') { window.showToast(msg); return; }
        if (!msg) return;
        let toast = document.getElementById('toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-[9999] transition-opacity duration-300 opacity-0';
            document.body.appendChild(toast);
        }
        toast.innerText = msg;
        toast.classList.remove('opacity-0');
        setTimeout(() => toast.classList.add('opacity-0'), 3000);
    }

    function formatHandle(str) {
        if (!str) return 'user';
        return str.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase();
    }

    function openModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    }

    function closeModal(id) {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    }

    // ==========================================
    // 1. NOTIFICATIONS SYSTEM
    // ==========================================
    let notifListener = null;
    let unreadNotifCount = 0;

    function initNotifications() {
        waitForDB(() => {
            db = firebase.firestore();
            const cleaner = formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER'));
            if (!cleaner) return;

            if (notifListener) { try { notifListener(); } catch(e){} }
            notifListener = db.collection('notifications')
                .where('userId', '==', cleaner)
                .limit(50)
                .onSnapshot(snap => {
                    const notifs = [];
                    snap.forEach(doc => notifs.push({ id: doc.id, ...doc.data() }));
                    notifs.sort((a, b) => {
                        const ta = a.timestamp ? a.timestamp.toMillis() : 0;
                        const tb = b.timestamp ? b.timestamp.toMillis() : 0;
                        return tb - ta;
                    });
                    unreadNotifCount = notifs.filter(n => !n.read).length;
                    updateNotifBadgeCount(unreadNotifCount);
                    renderNotifications(notifs);
                }, err => console.log('Notif listener error:', err.message));
        });
    }

    function updateNotifBadgeCount(count) {
        const badge = document.getElementById('notif-badge');
        if (badge) {
            if (count > 0) { badge.innerText = count > 99 ? '99+' : count; badge.classList.remove('hidden'); }
            else { badge.classList.add('hidden'); }
        }
    }

    function renderNotifications(notifs) {
        const container = document.getElementById('notif-list');
        if (!container) return;
        container.innerHTML = '';
        if (notifs.length === 0) {
            container.innerHTML = '<p class="text-xs text-gray-500 text-center py-8">No notifications yet</p>';
            return;
        }
        notifs.forEach(n => {
            const div = document.createElement('div');
            div.className = `p-3 rounded-lg ${!n.read ? 'bg-gray-900 border-gray-800' : 'bg-cyan-900/20 border-cyan-500/40'} cursor-pointer mb-2`;
            div.onclick = () => markNotifRead(n.id);
            let icon = '🔔'; if (n.type === 'report') icon = '⚠️'; if (n.type === 'add') icon = '➕'; if (n.type === 'follow') icon = '👤';
            div.innerHTML = `
                <div class="flex gap-2">
                    <span class="text-xl">${icon}</span>
                    <div class="flex-1">
                        <p class="text-xs font-bold text-white">${n.title || 'Notification'}</p>
                        <p class="text-xs text-gray-400 mt-1">${n.body || ''}</p>
                        <p class="text-[9px] text-gray-500 mt-1">${n.timestamp ? new Date(n.timestamp.toMillis()).toLocaleString() : ''}</p>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    async function markNotifRead(id) {
        try { await firebase.firestore().collection('notifications').doc(id).update({ read: true }); } catch(e){}
    }

    function openNotificationsModal() {
        initNotifications();
        openModal('notifModal');
    }

    async function markAllNotifsRead() {
        const cleaner = formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER'));
        if (!cleaner) return;
        try {
            const snap = await firebase.firestore().collection('notifications')
                .where('userId', '==', cleaner).where('read', '==', false).get();
            const batch = firebase.firestore().batch();
            snap.forEach(doc => batch.update(doc.ref, { read: true }));
            await batch.commit();
            showToast('✅ All marked as read');
        } catch(e) { showToast('Error'); }
    }

    window.sendPushNotification = async function(userId, title, body, type) {
        try {
            await firebase.firestore().collection('notifications').add({
                userId: formatHandle(userId), title, body,
                type: type || 'general', read: false,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch(e) { console.log('Notif send err:', e); }
    };

    // ==========================================
    // 2. REFERRAL SYSTEM
    // ==========================================
    function initReferralSystem() {
        const cleaner = formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER'));
        if (!cleaner) return;
        const refLink = `${window.location.origin}${window.location.pathname}?ref=${cleaner}`;
        const refEl = document.getElementById('referral-link');
        if (refEl) refEl.innerText = refLink;

        const params = new URLSearchParams(window.location.search);
        const refBy = params.get('ref');
        if (refBy && refBy !== cleaner) {
            if (!localStorage.getItem('referred_by')) {
                localStorage.setItem('referred_by', refBy);
                applyReferralBonus(cleaner, refBy);
            }
        }
    }

    async function applyReferralBonus(newUser, referrer) {
        try {
            db = firebase.firestore();
            const referrerRef = db.collection('users').doc(formatHandle(referrer));
            const referrerDoc = await referrerRef.get();
            if (referrerDoc.exists) {
                await db.collection('users').doc(formatHandle(referrer)).set({
                    diamonds: (referrerDoc.data().diamonds || 0) + 50
                }, { merge: true });
                await db.collection('referrals').add({
                    referrer: formatHandle(referrer),
                    newUser: formatHandle(newUser),
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                window.sendPushNotification(referrer, '🎁 Referral Bonus!', `${newUser} ne aapke link se join kiya. 50 💎 mile!`, 'reward');
            }
        } catch(e) { console.log(e); }
    }

    function copyReferralLink() {
        const cleaner = formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER'));
        const link = `${window.location.origin}${window.location.pathname}?ref=${cleaner}`;
        navigator.clipboard.writeText(link).then(() => showToast('✅ Referral link copied!'));
    }

    // ==========================================
    // 3. DIAMONDS PURCHASE
    // ==========================================
    const DIAMOND_PACKAGES = [
        { diamonds: 100, pkr: 250, bonus: 0 },
        { diamonds: 500, pkr: 1000, bonus: 50 },
        { diamonds: 1000, pkr: 1800, bonus: 150 },
        { diamonds: 2000, pkr: 3400, bonus: 400 },
        { diamonds: 5000, pkr: 7500, bonus: 1200 },
        { diamonds: 10000, pkr: 14000, bonus: 3000 }
    ];

    function openBuyDiamondsModal() {
        openModal('buyDiamondsModal');
        renderDiamondPackages();
    }

    function renderDiamondPackages() {
        const grid = document.getElementById('diamond-packages');
        if (!grid) return;
        grid.innerHTML = '';
        DIAMOND_PACKAGES.forEach((p, i) => {
            const btn = document.createElement('button');
            btn.className = 'border-amber-500/40 rounded-xl flex flex-col items-center justify-center p-4 hover:border-amber-400';
            btn.onclick = () => purchaseDiamonds(i);
            btn.innerHTML = `
                <span class="text-xl">💎</span>
                <span class="text-sm font-bold text-amber-400 mt-1">${p.diamonds.toLocaleString()}</span>
                ${p.bonus > 0 ? `<span class="text-[9px] text-green-400">+${p.bonus} Bonus</span>` : ''}
                <span class="text-[11px] font-bold text-white mt-1">Rs ${p.pkr}</span>
            `;
            grid.appendChild(btn);
        });
    }

    async function purchaseDiamonds(index) {
        const p = DIAMOND_PACKAGES[index];
        const cleaner = formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER'));
        if (!cleaner) { showToast('Please login first'); return; }
        const method = prompt('Payment method (Easypaisa/JazzCash/SadaPay/NayaPay):', 'Easypaisa');
        if (!method) return;
        try {
            db = firebase.firestore();
            await db.collection('diamond_orders').add({
                user: cleaner,
                diamonds: p.diamonds + p.bonus,
                pkr: p.pkr,
                method: method,
                status: 'pending',
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast(`✅ Order placed! Admin approve karega.`);
            window.sendPushNotification(cleaner, '💎 Order Placed!', `Rs ${p.pkr} ka order place hua. Admin review karega.`, 'order');
        } catch(e) { showToast('Error: ' + e.message); }
    }

    // ==========================================
    // 4. KYC SYSTEM
    // ==========================================
    let kycFrontImage = null, kycBackImage = null, kycSelfieImage = null;

    function openKYCModal() {
        const cleaner = formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER'));
        if (!cleaner) { showToast('Login first'); return; }
        firebase.firestore().collection('kyc').doc(cleaner).get().then(doc => {
            if (doc.exists) {
                const d = doc.data();
                const el = document.getElementById('kyc-status-display');
                if (el) {
                    if (d.status === 'approved') el.innerHTML = '<span class="text-green-400">✅ Verified</span>';
                    else if (d.status === 'pending') el.innerHTML = '<span class="text-amber-400">⏳ Under Review</span>';
                    else el.innerHTML = '<span class="text-red-400">❌ Rejected</span>';
                }
            }
        }).catch(e => {});
        openModal('kycModal');
    }

    function kycPreview(type, input) {
        if (!input.files || !input.files[0]) return;
        const reader = new FileReader();
        reader.onload = e => {
            if (type === 'front') kycFrontImage = e.target.result;
            if (type === 'back') kycBackImage = e.target.result;
            if (type === 'selfie') kycSelfieImage = e.target.result;
            
            const previewId = `kyc-${type}-preview`;
            const p = document.getElementById(previewId);
            if (p) { p.src = e.target.result; p.classList.remove('hidden'); }
            const ic = document.getElementById(`kyc-${type}-icon`);
            if (ic) ic.classList.add('hidden');
        };
        reader.readAsDataURL(input.files[0]);
    }

    async function submitKYC() {
        const cleaner = formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER'));
        if (!cleaner) { showToast('Login first'); return; }
        const fullName = document.getElementById('kyc-fullname')?.value || '';
        const cnic = document.getElementById('kyc-cnic')?.value || '';
        const dob = document.getElementById('kyc-dob')?.value || '';
        if (!fullName || !cnic || !kycFrontImage || !kycBackImage || !kycSelfieImage) {
            showToast('All fields aur 3 images zaroori hain!'); return;
        }
        try {
            await firebase.firestore().collection('kyc').doc(cleaner).set({
                user: cleaner, fullName, cnic, dob,
                front: kycFrontImage, back: kycBackImage, selfie: kycSelfieImage,
                status: 'pending', submittedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast('✅ KYC submitted! Review mein 24 ghante lagega.');
            closeModal('kycModal');
        } catch(e) { showToast('Error: ' + e.message); }
    }

    // ==========================================
    // 5. LIVE / WEBRTC
    // ==========================================
    let liveQueues = [];

    async function joinAsGuest(roomId) {
        try {
            const guestStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
            const pkRightVid = document.getElementById('pk-video-right');
            if (pkRightVid) { pkRightVid.srcObject = guestStream; pkRightVid.play(); }
            await firebase.firestore().collection('live_rooms').doc(roomId).update({
                guests: firebase.firestore.FieldValue.arrayUnion(formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER')))
            });
            showToast('📺 Live mein shamil ho gaye');
        } catch(e) { showToast('❌ Camera error: ' + e.message); }
    }

    // ==========================================
    // 6. AD INTEGRATION
    // ==========================================
    window.setAdConfig = function(config) { window._AD_CONFIG = config; };

    let videoScrollCount = 0;
    function trackVideoScroll() {
        const container = document.getElementById('video-feed-container');
        if (!container) return;
        container.addEventListener('scroll', () => {
            if (container.scrollTop % container.clientHeight === 0) {
                videoScrollCount++;
                if (videoScrollCount >= 5) {
                    videoScrollCount = 0;
                    if (typeof window.triggerPostWithdrawAds === 'function') window.triggerPostWithdrawAds();
                }
            }
        });
    }

    // ==========================================
    // 7. UI INJECTION (MODALS)
    // ==========================================
    function injectUI() {
        const headerDiv = document.querySelectorAll('header > div');
        if (headerDiv.length > 0 && !document.getElementById('notif-bell-btn')) {
            const bellBtn = document.createElement('button');
            bellBtn.id = 'notif-bell-btn';
            bellBtn.onclick = openNotificationsModal;
            bellBtn.className = 'relative w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center border border-cyan-500/30';
            bellBtn.innerHTML = `<i class="fas fa-bell text-cyan-400"></i><span id="notif-badge" class="hidden absolute -top-1 -right-1 bg-red-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center">0</span>`;
            headerDiv[0].insertBefore(bellBtn, headerDiv[0].firstChild);
        }

        if (!document.getElementById('notifModal')) {
            document.body.insertAdjacentHTML('beforeend', `
                <!-- NOTIFICATIONS MODAL -->
                <div id="notifModal" class="fixed inset-0 bg-black/80 z-[70] hidden p-4 flex-col justify-center items-center">
                    <div class="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-4 max-h-[70vh] flex flex-col">
                        <div class="flex justify-between items-center mb-3">
                            <h2 class="text-base font-bold text-white">🔔 Notifications</h2>
                            <div class="flex gap-2">
                                <button onclick="markAllNotifsRead()" class="text-[10px] text-cyan-400">Mark all read</button>
                                <button onclick="closeModal('notifModal')" class="text-gray-400 text-xl">&times;</button>
                            </div>
                        </div>
                        <div id="notif-list" class="flex-1 overflow-y-auto space-y-2"></div>
                    </div>
                </div>

                <!-- BUY DIAMONDS MODAL -->
                <div id="buyDiamondsModal" class="fixed inset-0 bg-black/80 z-[70] hidden p-4 flex-col justify-center items-center">
                    <div class="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-5">
                        <h2 class="text-base font-bold text-white mb-3 text-center">💎 Buy Diamonds</h2>
                        <p class="text-xs text-gray-400 mb-4 text-center">Diamonds se ap gifts bhej sakte hain. Payment Easypaisa/JazzCash/SadaPay se karein.</p>
                        <div id="diamond-packages" class="grid grid-cols-2 gap-3 mb-4"></div>
                        <button onclick="closeModal('buyDiamondsModal')" class="w-full py-2 bg-gray-800 text-gray-300 rounded-xl text-sm font-bold">Close</button>
                    </div>
                </div>

                <!-- KYC MODAL -->
                <div id="kycModal" class="fixed inset-0 bg-black/80 z-[70] hidden p-4 overflow-y-auto flex-col justify-center items-center">
                    <div class="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
                        <div class="flex justify-between items-center">
                            <h2 class="text-base font-bold text-white">KYC Verification</h2>
                            <button onclick="closeModal('kycModal')" class="text-gray-400 text-xl">&times;</button>
                        </div>
                        <p id="kyc-status-display" class="text-xs font-bold"></p>
                        <input type="text" id="kyc-fullname" placeholder="Full Name" class="w-full bg-gray-800 border-gray-700 p-2.5 rounded-xl text-xs text-white">
                        <input type="text" id="kyc-cnic" placeholder="CNIC" class="w-full bg-gray-800 border-gray-700 p-2.5 rounded-xl text-xs text-white">
                        <input type="date" id="kyc-dob" class="w-full bg-gray-800 border-gray-700 p-2.5 rounded-xl text-xs text-white">
                        <div class="space-y-2">
                            <input type="file" id="kyc-front-input" accept="image/*" class="hidden" onchange="kycPreview('front', this)">
                            <div class="border-2 border-dashed border-gray-700 p-4 rounded-xl text-center" onclick="document.getElementById('kyc-front-input').click()">
                                <i class="fas fa-id-card text-2xl text-cyan-400"></i>
                                <p class="text-[9px] text-gray-400 mt-1">CNIC Front</p>
                            </div>
                            <div class="flex gap-2">
                                <input type="file" id="kyc-back-input" accept="image/*" class="hidden" onchange="kycPreview('back', this)">
                                <div class="flex-1 border-2 border-dashed border-gray-700 p-4 rounded-xl text-center" onclick="document.getElementById('kyc-back-input').click()">
                                    <i class="fas fa-id-card text-2xl text-cyan-400"></i>
                                    <p class="text-[9px] text-gray-400 mt-1">CNIC Back</p>
                                </div>
                                <input type="file" id="kyc-selfie-input" accept="image/*" class="hidden" onchange="kycPreview('selfie', this)">
                                <div class="flex-1 border-2 border-dashed border-gray-700 p-4 rounded-xl text-center" onclick="document.getElementById('kyc-selfie-input').click()">
                                    <i class="fas fa-user text-2xl text-cyan-400"></i>
                                    <p class="text-[9px] text-gray-400 mt-1">Selfie</p>
                                </div>
                            </div>
                        </div>
                        <button onclick="submitKYC()" class="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold rounded-xl">Submit KYC</button>
                    </div>
                </div>

                <!-- REFERRAL MODAL -->
                <div id="referralModal" class="fixed inset-0 bg-black/80 z-[70] hidden p-4 flex-col justify-center items-center">
                    <div class="w-full max-w-sm bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
                        <div class="flex justify-between items-center">
                            <h2 class="text-base font-bold text-white">Refer & Earn (50 💎)</h2>
                            <button onclick="closeModal('referralModal')" class="text-gray-400 text-xl">&times;</button>
                        </div>
                        <div class="text-center space-y-3">
                            <p class="text-xs text-gray-300">Dost ko invite karein!</p>
                            <p class="text-xs text-gray-400">Jab aapka dost aapke link se join karega, aapko <span class="text-amber-400">50 💎 Diamonds</span> milenge.</p>
                            <input type="text" id="referral-link" readonly class="w-full bg-gray-800 border-gray-700 p-2.5 rounded-xl text-xs text-white text-center" value="Loading...">
                            <button onclick="copyReferralLink()" class="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl">📋 Copy Referral Link</button>
                        </div>
                    </div>
                </div>
            `);
        }
    }

    // ==========================================
    // 8. INJECT SETTINGS BUTTONS
    // ==========================================
    function injectSettingsButtons() {
        const settingsModal = document.getElementById('settingsModal');
        if (!settingsModal || document.getElementById('settings-extras')) return;
        const walletSection = settingsModal.querySelector('.bg-gray-900');
        if (!walletSection) return;

        const extras = document.createElement('div');
        extras.id = 'settings-extras';
        extras.className = 'bg-gray-900 border border-gray-800 rounded-xl p-4 space-y-2';
        extras.innerHTML = `
            <h3 class="text-xs font-bold text-cyan-400 uppercase flex items-center gap-1.5 mb-2"><i class="fas fa-star"></i> Extras</h3>
            <button onclick="openBuyDiamondsModal()" class="w-full py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white font-bold text-xs rounded-lg">💎 Diamonds</button>
            <button onclick="openKYCModal()" class="w-full py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs rounded-lg">🛡️ KYC Verification</button>
            <button onclick="openReferralModal()" class="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-xs rounded-lg">🎁 Refer & Earn (50 💎)</button>
        `;
        walletSection.parentNode.insertBefore(extras, walletSection.nextSibling);
    }

    // ==========================================
    // 9. LINK SHARING & DEEP LINKING SYSTEM (PART 1)
    // ==========================================
    function generateVideoLink(username, videoId) {
        const baseUrl = 'https://super-app-omega.vercel.app'; 
        return `${baseUrl}/v/${username}/${videoId}`;
    }

    async function shareVideo(username, videoId) {
        const link = generateVideoLink(username, videoId);
        const shareData = { title: 'Super App Video', text: `Check out this video by ${username}!`, url: link };
        try {
            if (navigator.share) { await navigator.share(shareData); }
            else { await navigator.clipboard.writeText(link); alert('Link copied to clipboard!'); }
        } catch (err) { console.error('Error sharing:', err); }
    }

    function loadVideoById(username, videoId) {
        console.log(`Loading video ${videoId} by ${username}`);
        alert(`Video ${videoId} by ${username} is loading...`);
    }

    // Capacitor Deep Link Listener
    try {
        const CapacitorApp = window.Capacitor?.Plugins?.App;
        if (CapacitorApp) {
            CapacitorApp.addListener('appUrlOpen', (event) => {
                const url = new URL(event.url);
                if (url.pathname.startsWith('/v/')) {
                    const pathParts = url.pathname.split('/');
                    loadVideoById(pathParts[2], pathParts[3]);
                }
            });
        }
    } catch(e) { console.log("Capacitor App plugin load nahi hua."); }

    // ==========================================
    // 10. AUTO INIT & EXPORTS
    // ==========================================
    function autoInit() {
        setTimeout(() => {
            injectSettingsButtons();
            injectUI();
            initReferralSystem();
            const cleaner = formatHandle(localStorage.getItem('SUPER_APP_CURRENT_USER'));
            if (cleaner) initNotifications();
            trackVideoScroll();
        }, 2000);

        setInterval(() => {
            const curr = localStorage.getItem('SUPER_APP_CURRENT_USER');
            const lastUser = localStorage.getItem('LAST_LOGGED_USER');
            if (curr && lastUser !== curr) {
                localStorage.setItem('LAST_LOGGED_USER', curr);
                setTimeout(() => {
                    injectSettingsButtons();
                    injectUI();
                    initReferralSystem();
                    initNotifications();
                }, 1500);
            }
        }, 2000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', autoInit);
    } else {
        autoInit();
    }

    // Export to Window (so HTML buttons can call these)
    window.openNotificationModal = openNotificationsModal;
    window.markAllNotifsRead = markAllNotifsRead;
    window.openBuyDiamondsModal = openBuyDiamondsModal;
    window.openKYCModal = openKYCModal;
    window.openReferralModal = () => openModal('referralModal');
    window.copyReferralLink = copyReferralLink;
    window.purchaseDiamonds = purchaseDiamonds;
    window.generateVideoLink = generateVideoLink;
    window.shareVideo = shareVideo;
    window.loadVideoById = loadVideoById;

    console.log('✅ index.js loaded - All features active!');

})();
