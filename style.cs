:root {
  --bg-dark: #0b0e14;
  --card-bg: #151a23;
  --accent-red: #ff2a5f;
  --text-main: #ffffff;
  --text-dim: #9aa0a6;
  --border-color: #232a36;
}

* { box-sizing: border-box; margin: 0; padding: 0; font-family: sans-serif; }
body { background: var(--bg-dark); color: var(--text-main); overflow-x: hidden; }

.app-header {
  height: 55px; background: #0f131a; display: flex; align-items: center;
  justify-content: space-between; padding: 0 12px; border-bottom: 1px solid var(--border-color);
}
.brand-title { font-size: 1.1rem; color: var(--accent-red); font-weight: bold; }
.weather-chip { background: #1c222d; border: none; color: #f1c40f; padding: 4px 8px; border-radius: 12px; font-size: 0.75rem; cursor: pointer; }
.top-tab { background: transparent; border: none; color: var(--text-dim); padding: 6px 10px; font-size: 0.8rem; cursor: pointer; }
.top-tab.active { color: #fff; background: var(--accent-red); border-radius: 14px; }

.app-content { height: calc(100vh - 115px); overflow-y: auto; padding: 10px; }
.app-page { display: none; }
.app-page.active { display: block; }

.sub-nav { display: flex; justify-content: center; gap: 15px; padding: 8px; background: #11151c; margin-bottom: 10px; border-radius: 8px; }
.sub-tab { background: none; border: none; color: var(--text-dim); font-weight: bold; cursor: pointer; }
.sub-tab.active { color: var(--accent-red); border-bottom: 2px solid var(--accent-red); }

/* Video Feed */
.video-stack { height: calc(100vh - 200px); overflow-y: snap; snap-type: y mandatory; }
.video-card-box {
  position: relative; height: 100%; width: 100%; snap-align: start; background: #000;
  display: flex; align-items: center; justify-content: center; border-radius: 12px; overflow: hidden; margin-bottom: 10px;
}
.video-card-box video { max-height: 100%; max-width: 100%; object-fit: contain; }

.video-overlay-actions {
  position: absolute; right: 12px; bottom: 60px; display: flex; flex-direction: column; gap: 16px; align-items: center;
}
.action-btn { background: rgba(0,0,0,0.6); border: none; color: #fff; font-size: 1.3rem; width: 45px; height: 45px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; }
.action-btn.active { color: var(--accent-red); }
.action-btn span { font-size: 0.65rem; }

.video-bottom-info { position: absolute; left: 12px; bottom: 20px; text-shadow: 1px 1px 3px #000; }

/* Posts & Chats */
.posts-list, .chat-channel-list { display: flex; flex-direction: column; gap: 10px; }
.post-card, .chat-row-item { background: var(--card-bg); padding: 12px; border-radius: 10px; border: 1px solid var(--border-color); }
.chat-row-item { display: flex; align-items: center; gap: 12px; cursor: pointer; }
.chat-row-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--accent-red); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: bold; }
.chat-row-details { flex: 1; }
.top-r { display: flex; justify-content: space-between; font-size: 0.8rem; }

/* Bottom Nav */
.bottom-nav {
  height: 60px; background: #0f131a; display: flex; align-items: center;
  justify-content: space-around; border-top: 1px solid var(--border-color);
  position: fixed; bottom: 0; left:0; width: 100%; z-index: 100;
}
.nav-btn { background: none; border: none; color: var(--text-dim); display: flex; flex-direction: column; align-items: center; font-size: 0.75rem; cursor: pointer; }
.nav-btn.active { color: var(--accent-red); }
.nav-btn-plus { width: 45px; height: 45px; background: var(--accent-red); border: none; border-radius: 50%; color: #fff; font-size: 1.2rem; cursor: pointer; }

/* Modals */
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.85); display: none; align-items: center; justify-content: center; z-index: 999; }
.modal-overlay.active { display: flex; }
.modal-box { background: var(--card-bg); width: 90%; max-width: 400px; padding: 18px; border-radius: 16px; border: 1px solid var(--border-color); }
.bottom-drawer { position: fixed; bottom: 0; width: 100%; border-radius: 16px 16px 0 0; }
.drawer-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
.close-modal { background: none; border: none; color: #fff; font-size: 1.2rem; cursor: pointer; }

.hidden { display: none !important; }
.primary-btn { background: var(--accent-red); color: #fff; border: none; padding: 10px 16px; border-radius: 8px; font-weight: bold; width: 100%; margin-top: 8px; cursor: pointer; }
.secondary-btn { background: #232a36; color: #fff; border: none; padding: 10px 16px; border-radius: 8px; width: 100%; margin-top: 8px; cursor: pointer; }

input, textarea, select { width: 100%; padding: 10px; background: #080a0f; border: 1px solid var(--border-color); color: #fff; border-radius: 8px; margin-top: 6px; }
.terminal-container textarea { height: 160px; font-family: monospace; color: #00ff66; }
.console-box { background: #000; padding: 10px; border-radius: 8px; margin-top: 10px; color: #00ff66; font-family: monospace; }
