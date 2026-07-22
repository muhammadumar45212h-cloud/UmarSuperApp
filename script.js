// Local Persistence Setup
let currentProfile = JSON.parse(localStorage.getItem('user_profile')) || {
  username: '@user_official',
  displayName: 'Super User',
  isVerified: false,
  avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=user'
};

let activeDMTarget = null;

document.addEventListener('DOMContentLoaded', () => {
  // Modal Trigger Event Handlers
  document.getElementById('openCodeBtn').addEventListener('click', () => {
    document.getElementById('codeModal').classList.add('active');
  });

  document.getElementById('openWalletBtn').addEventListener('click', () => {
    document.getElementById('walletModal').classList.add('active');
  });
});

// Modal Closer Helper
function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

// Feed Tab Switcher
function switchTab(type) {
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.feed-view').forEach(view => view.classList.remove('active'));

  if (type === 'videos') {
    document.querySelector('.feed-tabs .tab-btn:nth-child(1)').classList.add('active');
    document.getElementById('videosFeed').classList.add('active');
  } else {
    document.querySelector('.feed-tabs .tab-btn:nth-child(2)').classList.add('active');
    document.getElementById('postsFeed').classList.add('active');
  }
}

// Fixed Internal Code Execution (Prevents PDF / Document trigger)
function executeCodeInternal() {
  const code = document.getElementById('codeEditor').value;
  const consoleBox = document.getElementById('codeConsole');
  
  consoleBox.innerHTML = ''; // Clear history
  
  try {
    let output = [];
    const customConsole = {
      log: (...args) => output.push(args.join(' ')),
      error: (...args) => output.push('Error: ' + args.join(' ')),
      warn: (...args) => output.push('Warning: ' + args.join(' '))
    };

    // Execute isolated JavaScript safely
    const runFunction = new Function('console', code);
    runFunction(customConsole);

    consoleBox.innerText = output.join('\n') || 'Executed successfully (No output returned)';
  } catch (err) {
    consoleBox.innerText = 'Runtime Error: ' + err.message;
  }
}

// Interactive Feed Actions
function toggleLike(btn) {
  btn.classList.toggle('liked');
  let countSpan = btn.querySelector('.count') || btn.querySelector('span');
  if (countSpan) {
    let current = parseInt(countSpan.innerText.replace('k', '000')) || 0;
    if (btn.classList.contains('liked')) {
      countSpan.innerText = current + 1;
    } else {
      countSpan.innerText = Math.max(0, current - 1);
    }
  }
}

function toggleSubscribe(btn) {
  btn.classList.toggle('active');
  alert(btn.classList.contains('active') ? 'Subscribed to creator!' : 'Unsubscribed');
}

function sharePost(id) {
  navigator.clipboard.writeText(window.location.href);
  alert('Link copied to clipboard!');
}

function repostContent(id) {
  alert('Post reposted to your followers!');
}

// User Profile Dynamic Handling
function openUserProfile(handle) {
  activeDMTarget = handle;
  const modal = document.getElementById('profileModal');
  
  if (handle === '@me' || handle === currentProfile.username) {
    document.getElementById('profileDisplayName').childNodes[0].nodeValue = currentProfile.displayName + ' ';
    document.getElementById('profileHandle').innerText = currentProfile.username;
    document.getElementById('profileImage').src = currentProfile.avatar;
    document.getElementById('profileVerifyTick').style.display = currentProfile.isVerified ? 'inline-block' : 'none';
  } else {
    document.getElementById('profileDisplayName').childNodes[0].nodeValue = handle.replace('@', '') + ' ';
    document.getElementById('profileHandle').innerText = handle;
    document.getElementById('profileImage').src = `https://api.dicebear.com/7.x/bottts/svg?seed=${handle}`;
    document.getElementById('profileVerifyTick').style.display = 'inline-block';
  }
  
  modal.classList.add('active');
}

// Profile Picture File Upload
function updateProfileAvatar(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const newAvatarUrl = e.target.result;
      document.getElementById('profileImage').src = newAvatarUrl;
      currentProfile.avatar = newAvatarUrl;
      localStorage.setItem('user_profile', JSON.stringify(currentProfile));
    };
    reader.readAsDataURL(file);
  }
}

// Verification Badge Flow
function openVerificationModal() {
  document.getElementById('verifyModal').classList.add('active');
}

function submitVerification(event) {
  event.preventDefault();
  currentProfile.isVerified = true;
  localStorage.setItem('user_profile', JSON.stringify(currentProfile));
  
  document.getElementById('profileVerifyTick').style.display = 'inline-block';
  closeModal('verifyModal');
  alert('Congratulations! Your account has been officially verified with green tick.');
}

// Direct Message / Chat Handling
function startDirectMessage() {
  document.getElementById('dmTargetName').innerText = 'Chat with ' + (activeDMTarget || 'User');
  document.getElementById('dmModal').classList.add('active');
}

function sendDirectMessage() {
  const input = document.getElementById('dmInput');
  const chatBox = document.getElementById('dmChatBox');
  if (input.value.trim() !== '') {
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg sent';
    msgDiv.innerText = input.value;
    chatBox.appendChild(msgDiv);
    input.value = '';
    chatBox.scrollTop = chatBox.scrollHeight;
  }
}

// Wallet Operations
function processWithdrawal(event) {
  event.preventDefault();
  alert('Withdrawal Request Submitted Successfully!');
  closeModal('walletModal');
}
