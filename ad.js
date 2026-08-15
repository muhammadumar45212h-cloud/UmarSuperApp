// ads.js
document.addEventListener("DOMContentLoaded", function() {
  
  // 1. AdMob ka script load karo
  const admobScript = document.createElement('script');
  admobScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9780067506108310";
  admobScript.async = true;
  admobScript.crossOrigin = "anonymous";
  document.head.appendChild(admobScript);

  // 2. Banner ad ka container banao aur body ke end me chipka do
  const adContainer = document.createElement('div');
  adContainer.innerHTML = `
    <ins class="adsbygoogle"
         style="display:block; position:fixed; bottom:0; left:0; width:100%; height:50px; z-index:9999;"
         data-ad-client="ca-pub-9780067506108310"
         data-ad-slot="REPLACE_WITH_YOUR_BANNER_AD_UNIT_ID"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
  `;
  document.body.appendChild(adContainer);

  // 3. Ad load karo
  (adsbygoogle = window.adsbygoogle || []).push({});
});
