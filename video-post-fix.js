(function() {
  window.publishPost = async function() {
    if (!currentUser) { showToast("Login required!"); return; }
    
    const caption = document.getElementById('post-caption').value.trim();
    const publishBtn = document.getElementById('publish-btn');
    
    // Check if file is selected
    const file = window.__videoFile;
    if (!file && !caption) { showToast("Video ya text likhein!"); return; }

    try {
      publishBtn.disabled = true;
      publishBtn.innerHTML = 'Uploading...';
      
      let videoUrl = null;
      if (file) {
        showToast("⏳ Video upload ho rahi hai...");
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', file);
        
        const res = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: formData });
        videoUrl = await res.text();
        if (!videoUrl.startsWith('https://')) throw new Error("Upload failed");
      }

      const newPost = {
        id: 'post_' + Date.now(),
        type: videoUrl ? 'video' : 'text',
        url: videoUrl,
        user: formatHandle(currentUser),
        caption: caption,
        likes: [], comments: [], views: 0
      };

      await db.collection("posts").doc(newPost.id).set({
        ...newPost,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      showToast('✅ Post Upload Ho Gayi!');
      closeModal('createModal');
      document.getElementById('post-caption').value = '';
      window.__videoFile = null;
      document.getElementById('video-preview-box').classList.add('hidden');
      initAppContent(); // Refresh feed

    } catch(e) {
      showToast('❌ Error: ' + e.message);
    } finally {
      publishBtn.disabled = false;
      publishBtn.innerText = "Publish";
    }
  };
})();
