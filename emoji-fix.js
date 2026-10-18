(function() {
  // CSS se video ke upar wale emojis ko forcefully hide karein
  const style = document.createElement('style');
  style.innerHTML = `
    /* Video feed ke upar koi emoji nahi dikhega */
    .reel-item .premium-emoji, 
    .reel-item p, 
    .video-action-btn .premium-emoji {
      display: none !important;
      animation: none !important;
    }
    
    /* Sirf comments aur chat mein emoji dikhega */
    #dm-thread-view .premium-emoji,
    #drawer-content-area .premium-emoji {
      display: inline-block !important;
      animation: pulse 1.5s infinite !important;
      filter: drop-shadow(0 0 5px gold) !important;
    }
  `;
  document.head.appendChild(style);

  // Post caption se emojis ko clean karein (sirf text rakhein)
  setInterval(() => {
    document.querySelectorAll('.reel-item p, #posts-container p').forEach(p => {
      if (p.innerHTML.includes('premium-emoji')) {
        p.innerHTML = p.innerText; // HTML hata kar sirf text rakho
      }
    });
  }, 1000);
})();
