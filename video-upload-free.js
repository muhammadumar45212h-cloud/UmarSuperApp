// ==========================================
// ⚡ SUPER APP - FREE VIDEO UPLOAD
// File: video-upload-free.js
// Catbox.moe (No signup, 200MB, permanent)
// ==========================================

(function() {
  'use strict';

  window.FreeUpload = {

    uploadVideo: async function(file, onProgress) {
      if (!file) throw new Error("File nahi hai");

      if (file.size > 200 * 1024 * 1024) {
        throw new Error("Video 200MB se choti honi chahiye");
      }

      return await this.uploadToCatbox(file, onProgress);
    },

    uploadToCatbox: function(file, onProgress) {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('reqtype', 'fileupload');
        formData.append('userhash', '');
        formData.append('fileToUpload', file);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const url = xhr.responseText.trim();
            if (url.startsWith('https://')) {
              resolve(url);
            } else {
              reject(new Error("Invalid response"));
            }
          } else {
            reject(new Error("Catbox HTTP " + xhr.status));
          }
        });

        xhr.addEventListener('error', () => reject(new Error("Network error")));
        xhr.timeout = 300000;
        xhr.open('POST', 'https://catbox.moe/user/api.php');
        xhr.send(formData);
      });
    }
  };

  window.previewGalleryVideo = function(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('video/')) {
        showToast("❌ Sirf video file select karein");
        input.value = '';
        return;
      }
      if (file.size > 200 * 1024 * 1024) {
        showToast("⚠️ Video 200MB se choti honi chahiye");
        input.value = '';
        return;
      }
      window.__videoFile = file;
      const url = URL.createObjectURL(file);
      const el = document.getElementById('video-preview-elem');
      if (el) {
        el.src = url;
        document.getElementById('video-preview-box').classList.remove('hidden');
      }
      showToast(`✅ Video ready (${(file.size/1024/1024).toFixed(1)} MB)`);
    }
  };

  window.publishPost = async function() {
    if (!currentUser) { showToast("Pehle login karein!"); return; }
    const cleanCurr = formatHandle(currentUser);
    const caption = document.getElementById('post-caption').value.trim();
    const link = document.getElementById('post-link').value.trim();
    const directUrl = document.getElementById('post-video-url').value.trim();
    const publishBtn = document.getElementById('publish-btn');

    let videoUrl = directUrl || null;

    if (currentCreateType === 'video' && window.__videoFile) {
      const file = window.__videoFile;
      try {
        publishBtn.disabled = true;
        publishBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Uploading...';
        showUploadProgress('Video upload ho rahi hai...', 0);

        videoUrl = await FreeUpload.uploadVideo(file, (percent) => {
          showUploadProgress(`Uploading... ${percent}%`, percent);
        });

        hideUploadProgress();
        showToast('✅ Video upload ho gayi!');
      } catch (e) {
        hideUploadProgress();
        showToast('❌ Upload fail: ' + e.message);
        publishBtn.disabled = false;
        publishBtn.innerText = "Publish";
        return;
      }
    }

    if (currentCreateType === 'video' && !videoUrl) {
      showToast('Video select karein');
      publishBtn.disabled = false;
      publishBtn.innerText = "Publish";
      return;
    }

    if (!caption && !videoUrl) {
      showToast('Caption ya media zaroori');
      publishBtn.disabled = false;
      publishBtn.innerText = "Publish";
      return;
    }

    const newPost = {
      id: 'post_' + Date.now(),
      type: currentCreateType,
      url: videoUrl,
      user: cleanCurr,
      caption: caption,
      link: link || null,
      likes: [],
      comments: [],
      views: 0,
      uploadedAt: Date.now()
    };

    saveVideoToStorage(newPost);

    try {
      await db.collection("posts").doc(newPost.id).set({
        ...newPost,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      showToast('✅ Post publish ho gayi!');
    } catch(e) {
      showToast('⚠️ Post local save hui, cloud sync fail');
    }

    closeModal('createModal');
    document.getElementById('post-caption').value = '';
    document.getElementById('post-link').value = '';
    document.getElementById('post-video-url').value = '';
    window.__videoFile = null;
    document.getElementById('video-preview-box').classList.add('hidden');
    publishBtn.disabled = false;
    publishBtn.innerText = "Publish";
    initAppContent();
  };

  console.log("✅ FreeUpload ready - Catbox.moe enabled");
})();
