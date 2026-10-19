(function() {
  'use strict';

  window.addEventListener('load', () => {
    setTimeout(() => {
      // 1. CSS se ganda orange banner aur clutter hatayein
      const style = document.createElement('style');
      style.innerHTML = `
        /* Chat ka ganda orange banner hatao */
        #dm-inbox-view > button, 
        #dm-inbox-view + button, 
        .bg-orange-600 { display: none !important; }

        /* Header ke faltu icons hatao (sirf zaroori rakho) */
        header button[onclick*="codeModal"] { display: none !important; }
        
        /* Video Editor ko filhaal hide karo taaki app hang na ho */
        button[onclick*="openVideoEditor"] { display: none !important; }
        #videoEditorModal { display: none !important; }
      `;
      document.head.appendChild(style);

      // 2. Video Editor ko disable karein taaki 0% wala error na aaye
      window.openVideoEditor = function() {
        showToast("🎬 Video Editor jald aa raha hai (Maintenance)");
      };

      // 3. Mini Apps Store wale bade banner ko remove karein
      const dmHeader = document.getElementById('dm-inbox-header');
      if(dmHeader) {
          const banner = dmHeader.nextElementSibling;
          if(banner && banner.innerText.includes('Open Mini Apps Store')) {
              banner.style.display = 'none';
          }
      }

      console.log("✨ App Polish Done: Banners removed, Editor disabled.");
    }, 2000);
  });
})();
