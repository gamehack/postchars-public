(function () {
  'use strict';
  var CONSENT_KEY='postchars-consent-v1', MAX_AGE_MS=180*24*60*60*1000;
  var GA4_ID=window.POSTCHARS_GA4_ID||(document.querySelector('meta[name="postchars-ga4-id"]')||{}).content||'';
  var gaConfigured=false, analyticsAllowed=false;
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
  if(!window.__postcharsConsentInitialized){
    window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.__postcharsConsentInitialized=true;
  }
  function readConsent(){
    try{var p=JSON.parse(window.localStorage.getItem(CONSENT_KEY)||'null');if(!p||typeof p.analytics!=='boolean'||typeof p.advertising!=='boolean'||typeof p.updatedAt!=='number'||!Number.isFinite(p.updatedAt)||p.updatedAt>Date.now()||Date.now()-p.updatedAt>MAX_AGE_MS)return null;return{analytics:p.analytics,advertising:p.advertising};}catch(_){return null;}
  }
  function track(name,params){if(analyticsAllowed&&typeof window.gtag==='function')window.gtag('event',name,params||{});}
  function loadAnalytics(){
    if(!/^G-[A-Z0-9]+$/.test(GA4_ID))return;
    if(!gaConfigured){window.gtag('js',new Date());window.gtag('config',GA4_ID,{send_page_view:true});gaConfigured=true;}
    if(!document.getElementById('postchars-ga4-script')){var s=document.createElement('script');s.id='postchars-ga4-script';s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(GA4_ID);document.head.appendChild(s);}
  }
  function applyConsent(settings){
    // Optional analytics is disabled unless the deployment owner configures a GA4 ID.
    window.gtag('consent','update',{analytics_storage:settings.analytics?'granted':'denied'});
    analyticsAllowed=settings.analytics;if(settings.analytics)loadAnalytics();
  }
  function saveConsent(settings){try{window.localStorage.setItem(CONSENT_KEY,JSON.stringify({analytics:settings.analytics,advertising:settings.advertising,updatedAt:Date.now()}));}catch(_){}}
  function closeBanner(){var b=document.getElementById('postchars-guide-consent');if(b)b.remove();}
  function showBanner(){
    closeBanner();var b=document.createElement('section');b.id='postchars-guide-consent';b.className='guide-consent-banner';b.setAttribute('role','dialog');b.setAttribute('aria-label','Privacy preferences');
    b.innerHTML='<div class="guide-consent-copy"><strong>Privacy preferences</strong><p>Choose whether this deployment may load optional Google Analytics. Analytics is disabled until the site operator configures their own GA4 measurement ID. Advertising integrations are not included in this release. Your text is never sent to analytics.</p><a href="/privacy/">Read the Privacy Policy</a></div><div class="guide-consent-actions"><button type="button" class="guide-consent-primary" data-choice="analytics">Allow analytics</button><button type="button" data-choice="none">Reject optional</button></div>';
    b.addEventListener('click',function(e){var btn=e.target.closest('button[data-choice]');if(!btn)return;var c=btn.getAttribute('data-choice');var v={analytics:c==='analytics',advertising:false};saveConsent(v);applyConsent(v);closeBanner();});
    document.body.appendChild(b);
  }
  var saved=readConsent();if(saved)applyConsent(saved);else showBanner();
  document.querySelectorAll('[data-privacy-open]').forEach(function(el){el.addEventListener('click',function(e){e.preventDefault();showBanner();});});
  if(new URLSearchParams(window.location.search).get('privacy')==='1'){window.history.replaceState({},'',window.location.pathname+window.location.hash);showBanner();}
  // Static tool pages share this consent controller. Measure interactions only
  // after explicit analytics consent; never include user text, URLs, queries,
  // filenames, clipboard contents, or user-selected field values in events.
  // React tool pages use src/analytics.ts and intentionally bypass this path.
  var toolKind=document.body.dataset.growthTool||document.body.dataset.editorTool||
    document.body.dataset.completionTool||document.body.dataset.specialTool||'';
  var toolMatch=/^\/([a-z0-9-]+)\/$/.exec(window.location.pathname);
  if(toolKind&&toolMatch){
    var toolId=toolMatch[1],engagementSent=false;
    document.addEventListener('input',function(event){
      if(engagementSent||!analyticsAllowed)return;
      var target=event.target;
      if(!(target instanceof HTMLTextAreaElement)&&!(target instanceof HTMLInputElement))return;
      if(target instanceof HTMLInputElement&&!['text','search','url'].includes(target.type))return;
      if(!target.value.trim())return;
      engagementSent=true;
      track('tool_engaged',{tool_id:toolId,tool_kind:toolKind});
    },true);
    // These labels explicitly mean "clicked", not clipboard success or
    // a downloaded file being saved by the user.
    var actions={
      'sample-button':'example_clicked',
      'copy-button':'copy_clicked',
      'export-button':'download_clicked',
      'use-output':'apply_clicked',
      'use-output-button':'apply_clicked',
      'compare-button':'compare_clicked',
      'replace-first':'replace_clicked',
      'replace-all':'replace_clicked'
    };
    document.addEventListener('click',function(event){
      if(!analyticsAllowed||!event.target||!event.target.closest)return;
      var button=event.target.closest('button[id]');
      if(!button)return;
      var action=actions[button.id];
      if(action)track('tool_action_click',{tool_id:toolId,action:action});
    },true);
    document.addEventListener('change',function(event){
      if(!analyticsAllowed)return;
      var target=event.target;
      if(target instanceof HTMLInputElement&&target.type==='file'&&target.files&&target.files.length){
        track('tool_action_click',{tool_id:toolId,action:'import_selected'});
      }
    },true);
  }

  var article=document.querySelector('article'), guidePath=window.location.pathname, guideType=guidePath.includes('google-ads')?'google_ads_limits':guidePath.includes('linkedin')?'linkedin_post_limit':guidePath.includes('instagram')?'instagram_caption_limit':guidePath.includes('social-media-character-limits')?'social_media_limits':'x_url_emoji_counting';
  if(article&&/^\/guides\//.test(guidePath)){
    document.querySelectorAll('article a[href^="/"]').forEach(function(link){if(!/character-counter|cross-platform-post-checker/.test(link.getAttribute('href')||''))return;link.addEventListener('click',function(){track('guide_tool_click',{guide_type:guideType,destination:link.pathname});});});
    var sent=false;window.addEventListener('scroll',function(){if(sent||!analyticsAllowed)return;var top=article.getBoundingClientRect().top+window.scrollY;if(window.scrollY+window.innerHeight>=top+article.offsetHeight*.5){sent=true;track('guide_engaged',{guide_type:guideType,scroll_depth:50});}},{passive:true});
  }
})();
