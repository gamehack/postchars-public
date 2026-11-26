import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        home: resolve(root, 'index.html'),
        crossPlatformPostChecker: resolve(root, 'cross-platform-post-checker/index.html'),
        characterCounter: resolve(root, 'character-counter/index.html'),
        wordCounter: resolve(root, 'word-counter/index.html'),
        twitterCharacterCounter: resolve(root, 'twitter-character-counter/index.html'),
        googleAdsCounter: resolve(root, 'google-ads-character-counter/index.html'),
        guideGoogleAds: resolve(root, 'guides/google-ads-character-limits/index.html'),
        guideXCounting: resolve(root, 'guides/twitter-urls-emoji-counting/index.html'),
        guideLinkedIn: resolve(root, 'guides/linkedin-post-character-limit/index.html'),
        guideInstagram: resolve(root, 'guides/instagram-caption-character-limit/index.html'),
        guideSocialMediaLimits: resolve(root, 'guides/social-media-character-limits/index.html'),
        guidesIndex: resolve(root, 'guides/index.html'),
        guideLinkedInHook: resolve(root, 'guides/linkedin-hook-see-more/index.html'),
        guideSmsEncoding: resolve(root, 'guides/sms-gsm-7-vs-unicode/index.html'),
        guideYouTube: resolve(root, 'guides/youtube-title-description-best-practices/index.html'),
        guideRsaHeadlines: resolve(root, 'guides/google-ads-rsa-headlines/index.html'),
        guideReadability: resolve(root, 'guides/readability-scores-explained/index.html'),
        guideXThreads: resolve(root, 'guides/how-to-write-an-x-thread/index.html'),
        instagramCaptionCounter: resolve(root, 'instagram-caption-counter/index.html'),
        linkedinCharacterCounter: resolve(root, 'linkedin-character-counter/index.html'),
        textCaseConverter: resolve(root, 'text-case-converter/index.html'),
        removeLineBreaks: resolve(root, 'remove-line-breaks/index.html'),
        smsCharacterCounter: resolve(root, 'sms-character-counter/index.html'),
        serpSnippetPreview: resolve(root, 'serp-snippet-preview/index.html'),
        keywordDensityChecker: resolve(root, 'keyword-density-checker/index.html'),
        textDiffChecker: resolve(root, 'text-diff-checker/index.html'),
        findAndReplace: resolve(root, 'find-and-replace-text/index.html'),
        readabilityChecker: resolve(root, 'readability-checker/index.html'),
        completion1: resolve(root, 'sort-lines-alphabetically/index.html'),
        completion2: resolve(root, 'text-cleaner-online/index.html'),
        completion3: resolve(root, 'unicode-character-inspector/index.html'),
        completion4: resolve(root, 'detailed-word-counter/index.html'),
        completion5: resolve(root, 'instagram-bio-character-counter/index.html'),
        completion6: resolve(root, 'youtube-description-counter/index.html'),
        completion7: resolve(root, 'linkedin-headline-counter/index.html'),
        expansion1: resolve(root, 'tiktok-caption-counter/index.html'),
        expansion2: resolve(root, 'bluesky-character-counter/index.html'),
        expansion3: resolve(root, 'reddit-title-character-counter/index.html'),
        expansion4: resolve(root, 'discord-message-counter/index.html'),
        expansion5: resolve(root, 'telegram-bot-message-counter/index.html'),
        expansion6: resolve(root, 'facebook-post-character-counter/index.html'),
        expansion7: resolve(root, 'pinterest-description-counter/index.html'),
        expansion8: resolve(root, 'x-thread-splitter/index.html'),
        expansion9: resolve(root, 'identifier-case-converter/index.html'),
        expansion10: resolve(root, 'email-url-extractor/index.html'),
        expansion11: resolve(root, 'syllable-counter/index.html'),
        about: resolve(root, 'about/index.html'),
        privacy: resolve(root, 'privacy/index.html'),
        contact: resolve(root, 'contact/index.html')
      }
    }
  }
});