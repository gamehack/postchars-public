import type { TextAction } from './text-utils';
import { MAIN_PLATFORMS } from './cross-platform-rules';

export type PlatformId = 'x' | 'instagram' | 'linkedin' | 'threads' | 'youtube';

export interface PageConfig {
  eyebrow: string;
  heading: string;
  intro: string;
  sectionTitle: string;
  sectionBody: string;
  defaultPlatform?: PlatformId;
  faqs: { question: string; answer: string }[];
}

export const pageData: Record<string, PageConfig> = {
  home: {
    eyebrow: 'FREE ONLINE TEXT TOOLS',
    heading: 'Free Character Counter & Text Tools',
    intro: 'Make every character count. Check one draft against 12 social and messaging platform rules, count words and characters, and format text privately in your browser.',
    sectionTitle: 'A smarter way to work with text',
    sectionBody: 'PostChars brings the everyday text tools creators need into one clean workspace. Count characters and words, check post lengths, and format text in seconds — without creating an account.',
    faqs: [
      { question: 'Is PostChars free to use?', answer: 'Yes. The text tools on PostChars are free to use. You can paste, edit, count and format text without creating an account.' },
      { question: 'Is my text uploaded or stored?', answer: 'Text is never uploaded for processing. Saving is off by default; you can explicitly enable browser-local draft and version storage, and delete it at any time.' },
      { question: 'How are characters counted?', answer: 'PostChars counts visible Unicode grapheme clusters, so emoji and combined characters are counted more naturally than raw programming string length. Platform counters may apply their own rules.' },
      { question: 'Can I use PostChars on a phone?', answer: 'Yes. The workspace and tools are responsive and work on modern desktop and mobile browsers.' }
    ]
  },
  characterCounter: {
    eyebrow: 'CHARACTER COUNTER',
    heading: 'Free Online Character Counter',
    intro: 'Count every character, instantly. Type or paste to see characters with spaces, characters without spaces, words, sentences and reading time update live.',
    sectionTitle: 'What does a character counter do?',
    sectionBody: 'A character counter measures the length of a piece of text. It is useful for social media captions, headlines, descriptions, forms, ads and any field with a character limit. PostChars also shows characters without spaces, word count, sentence count and estimated reading time.',
    faqs: [
      { question: 'Does the count include spaces?', answer: 'Yes. The main character count includes spaces, punctuation and line breaks. A separate metric shows characters excluding whitespace.' },
      { question: 'Are emoji counted as one character?', answer: 'PostChars counts Unicode grapheme clusters where the browser supports them. This generally treats a visible emoji or combined symbol as one character.' },
      { question: 'Can I check a social media limit?', answer: 'Yes. Select X, Instagram, LinkedIn, Threads or a YouTube title in the platform checker to compare your text with a commonly used reference limit.' }
    ]
  },
  wordCounter: {
    eyebrow: 'WORD COUNTER',
    heading: 'Free Online Word Counter',
    intro: 'Get an instant word count, character count, sentence count and reading-time estimate as you write or edit.',
    sectionTitle: 'More than a simple word count',
    sectionBody: 'A reliable word counter helps with articles, essays, newsletters, social posts and professional writing. PostChars combines word count with character count, paragraph count and a quick reading-time estimate so you can check the shape of your text in one place.',
    faqs: [
      { question: 'How does the word counter define a word?', answer: 'The counter recognizes sequences of letters and numbers, including common apostrophe forms such as don’t and writers’.' },
      { question: 'How is reading time estimated?', answer: 'Reading time is estimated at 225 words per minute. It is a general guide, not a measurement of an individual reader.' },
      { question: 'Does it count text in real time?', answer: 'Yes. The metrics update in your browser every time you type, paste or edit the text.' }
    ]
  },
  twitterCharacterCounter: {
    eyebrow: 'X / TWITTER CHARACTER COUNTER',
    heading: 'X (Twitter) Character Counter',
    intro: 'Count X post characters as you type. See the 280-character standard-post limit, with weighted URL, CJK and emoji counting based on twitter-text rules.',
    sectionTitle: 'How X (Twitter) characters are counted',
    sectionBody: 'X post length differs from a plain JavaScript string length. Common Latin characters usually count as one unit, many CJK characters as two, recognized URLs as 23 units, and many emoji as two units. PostChars uses the published twitter-text v3 weighting rules to estimate standard post length. Account types, long posts and future X rules may differ.',
    defaultPlatform: 'x',
    faqs: [
      { question: 'What is the standard X post character limit?', answer: 'The standard reference limit is 280 characters. Some paid plans and product features may allow longer posts, so check the current limit shown in your own account.' },
      { question: 'How does X count links?', answer: 'Recognized links use the twitter-text configured fixed URL weight of 23 characters, regardless of most actual URL lengths.' },
      { question: 'Do Chinese characters count as two?', answer: 'Under the twitter-text v3 rules, many Chinese, Japanese and Korean characters are assigned a weight of two, so their weighted count can exceed the visible-character count.' },
      { question: 'How are emoji counted?', answer: 'Many emoji count as two weighted characters, even when they appear as a single visible symbol. Complex emoji behavior depends on the parser rules.' },
      { question: 'Is this an official X tool?', answer: 'No. PostChars is an independent text utility and is not affiliated with X or Twitter.' }
    ]
  },
  instagramCaptionCounter: {
    eyebrow: 'INSTAGRAM CAPTION COUNTER',
    heading: 'Instagram Caption Character Counter',
    intro: 'Write your Instagram caption and watch the character count update live. Keep an eye on the commonly used 2,200-character limit.',
    sectionTitle: 'Write Instagram captions that fit',
    sectionBody: 'A caption can add context, personality and a call to action to a post. Use the counter to shape a draft before publishing, check how much room remains, and clean up the text without switching tools. Instagram limits and product behavior can change, so treat the displayed limit as a reference.',
    defaultPlatform: 'instagram',
    faqs: [
      { question: 'What is the Instagram caption character limit?', answer: 'The commonly referenced Instagram caption limit is 2,200 characters. Instagram may change product rules, so verify the current limit in the app before publishing.' },
      { question: 'Do hashtags count toward the limit?', answer: 'Yes. Hashtags, spaces, mentions and punctuation are part of the caption text and count toward the total.' },
      { question: 'Can I write and edit the caption here?', answer: 'Yes. Type or paste your caption, use the text cleanup actions, and copy the result when you are ready.' }
    ]
  },
  linkedinCharacterCounter: {
    eyebrow: 'LINKEDIN CHARACTER COUNTER',
    heading: 'LinkedIn Post Character Counter',
    intro: 'Draft a professional update and track its length against the commonly used 3,000-character post limit.',
    sectionTitle: 'Shape a clearer LinkedIn update',
    sectionBody: 'LinkedIn posts work best when the opening is clear and the message is easy to follow. Use this live counter to check the length of an update, refine wording and remove formatting clutter before you publish. The 3,000-character figure is a reference and may change with LinkedIn product updates.',
    defaultPlatform: 'linkedin',
    faqs: [
      { question: 'What is the LinkedIn post character limit?', answer: 'The commonly referenced limit for a standard LinkedIn post is 3,000 characters. Check LinkedIn directly for current product rules.' },
      { question: 'Are line breaks included in the count?', answer: 'Yes. Line breaks are included in the total character count.' },
      { question: 'Can I use this for LinkedIn comments?', answer: 'Yes. The counter works with any text. Select a suitable reference only when you want to compare against a post limit.' }
    ]
  },
  googleAdsCounter: {
    eyebrow: 'GOOGLE ADS CHARACTER COUNTER',
    heading: 'Google Ads Character Counter & Copy Checker',
    intro: 'Check responsive search ad headlines, descriptions and display paths against Google Ads character limits. Write multiple assets, review warnings and copy your finished ad copy.',
    sectionTitle: 'Google Ads responsive search ad character limits',
    sectionBody: 'Google Ads responsive search ads have separate headline (30), description (90), and display path (15) limits. You may enter 3 to 15 headlines and 2 to 4 descriptions. Chinese, Japanese and Korean double-width characters count as two according to Google Ads specifications. PostChars estimates these limits in your browser. Google Ads is the final authority on valid ad assets.',
    faqs: [
      { question: 'How many Google Ads headlines can I write?', answer: 'A responsive search ad normally includes between 3 and 15 headlines. Each headline has a 30-character reference limit.' },
      { question: 'What is the Google Ads description limit?', answer: 'Each description supports a reference limit of 90 characters. Responsive search ads normally use 2 to 4 descriptions.' },
      { question: 'How do Chinese or Japanese characters count?', answer: 'Google Ads counts double-width characters, including many Chinese, Japanese and Korean characters, as two. Our estimate flags fields near and above the limit; always validate in Google Ads.' },
      { question: 'Does PostChars generate or publish Google Ads?', answer: 'No. It validates and previews copy locally and can copy the draft. No Google Ads account is required. It does not submit ads.' },
      { question: 'What are the display path limits?', answer: 'Each optional display path supports up to 15 weighted characters. They are preview-only; you should confirm your final URL and paths in Google Ads.' }
    ]
  },
  textCaseConverter: {
    eyebrow: 'TEXT CASE CONVERTER',
    heading: 'Change text case in one click.',
    intro: 'Convert text to uppercase, lowercase, title case or sentence case. Keep your wording and change only the presentation.',
    sectionTitle: 'Format text without retyping',
    sectionBody: 'A text case converter is useful when copied text arrives in the wrong format or a heading needs consistent capitalization. Paste your text once, choose a case style, and copy the result. All transformations run locally in your browser.',
    faqs: [
      { question: 'What case styles are available?', answer: 'PostChars supports UPPERCASE, lowercase, Title Case and Sentence case.' },
      { question: 'Will converting case change punctuation?', answer: 'No. The converter changes letter casing and preserves punctuation, numbers and line breaks.' },
      { question: 'Is the original text overwritten?', answer: 'The selected transformation updates the workspace. You can undo it with your browser keyboard shortcut while the editor is focused, or paste your original text again.' }
    ]
  },
  removeLineBreaks: {
    eyebrow: 'REMOVE LINE BREAKS',
    heading: 'Clean copied text in seconds.',
    intro: 'Turn broken lines into clean text. Remove unwanted line breaks, tidy extra spaces and copy a polished result.',
    sectionTitle: 'Fix awkward line breaks from copied text',
    sectionBody: 'Text copied from PDFs, email threads and web pages can contain hard line breaks in the middle of sentences. Use the line-break remover to join those lines into readable text. The cleanup happens in your browser, so the text stays on your device.',
    faqs: [
      { question: 'What does remove line breaks do?', answer: 'It replaces line breaks with spaces, then collapses repeated whitespace so sentences read as a continuous line.' },
      { question: 'Will it remove paragraph spacing?', answer: 'The remove-line-breaks action creates one continuous line. Use the clean extra spaces action if you want to preserve paragraph breaks.' },
      { question: 'Can I clean text copied from a PDF?', answer: 'Yes. Paste the copied text, remove unwanted line breaks, review the result and copy it into your document.' }
    ]
  }
};

export const platforms: { id: PlatformId; name: string; limit: number; detail: string }[] = MAIN_PLATFORMS;

export const toolCards = [
  { title: 'Cross-Platform Post Checker', description: 'Compare one draft against 12 social and messaging fields, with platform-specific counting rules and caveats.', href: '/cross-platform-post-checker/', tag: 'SOCIAL' },
  { title: 'Character Counter', description: 'Count every character, including spaces and punctuation.', href: '/character-counter/', tag: 'COUNT' },
  { title: 'Word Counter', description: 'Track words, sentences, paragraphs and reading time.', href: '/word-counter/', tag: 'COUNT' },
  { title: 'X Post Counter', description: 'Check a draft against the standard X post limit.', href: '/twitter-character-counter/', tag: 'SOCIAL' },
  { title: 'Instagram Caption Counter', description: 'Keep captions within a commonly used character limit.', href: '/instagram-caption-counter/', tag: 'SOCIAL' },
  { title: 'LinkedIn Post Counter', description: 'Check the length of a professional update.', href: '/linkedin-character-counter/', tag: 'SOCIAL' },
  { title: 'Text Case Converter', description: 'Switch between uppercase, lowercase and title case.', href: '/text-case-converter/', tag: 'FORMAT' },
  { title: 'Google Ads Counter', description: 'Validate 30-character headlines, 90-character descriptions and display paths.', href: '/google-ads-character-counter/', tag: 'ADS' },
  { title: 'Remove Line Breaks', description: 'Turn broken copied text into clean, readable lines.', href: '/remove-line-breaks/', tag: 'CLEAN' },
  { title: 'SMS Segment Counter', description: 'Calculate GSM-7 versus Unicode message length and SMS segments.', href: '/sms-character-counter/', tag: 'MESSAGING' },
  { title: 'SEO Snippet Preview', description: 'Review page titles and meta descriptions before publishing.', href: '/serp-snippet-preview/', tag: 'SEO' },
  { title: 'Keyword Density Checker', description: 'Find repeated words and phrases without uploading your draft.', href: '/keyword-density-checker/', tag: 'SEO' },
  { title: 'Text Diff Checker', description: 'Compare two text versions and highlight added or removed lines.', href: '/text-diff-checker/', tag: 'COMPARE' },
  { title: 'Find and Replace', description: 'Find words or phrases, replace the first or all matches.', href: '/find-and-replace-text/', tag: 'EDIT' },
  { title: 'Readability Checker', description: 'Estimate English reading ease, grade level and sentence length.', href: '/readability-checker/', tag: 'WRITE' },
  { title: 'Detailed Word Counter', description: 'Inspect line counts, unique vocabulary, bytes and speaking time.', href: '/detailed-word-counter/', tag: 'COUNT' },
  { title: 'Sort & Deduplicate Lines', description: 'Alphabetize lists, remove repeats and delete blank lines.', href: '/sort-lines-alphabetically/', tag: 'EDIT' },
  { title: 'Text Cleaner', description: 'Remove blank lines, extra spaces, tabs and simple HTML.', href: '/text-cleaner-online/', tag: 'CLEAN' },
  { title: 'Unicode Inspector', description: 'Count UTF-8 bytes, code points and invisible characters.', href: '/unicode-character-inspector/', tag: 'COUNT' },
  { title: 'Instagram Bio Counter', description: 'Write a profile bio against the 150-character reference.', href: '/instagram-bio-character-counter/', tag: 'SOCIAL' },
  { title: 'YouTube Description Counter', description: 'Check YouTube video descriptions against the 5,000-character limit.', href: '/youtube-description-counter/', tag: 'SOCIAL' },
  { title: 'LinkedIn Headline Counter', description: 'Draft a profile headline with a clearly labelled length reference.', href: '/linkedin-headline-counter/', tag: 'SOCIAL' },
  { title: 'TikTok Caption Counter', description: 'Direct Post UTF-16 caption reference', href: '/tiktok-caption-counter/', tag: 'SOCIAL' },
  { title: 'Bluesky Post Counter', description: 'Check Bluesky’s 300-grapheme post limit', href: '/bluesky-character-counter/', tag: 'SOCIAL' },
  { title: 'Reddit Title Counter', description: 'Draft subreddit titles with labelled reference limits', href: '/reddit-title-character-counter/', tag: 'SOCIAL' },
  { title: 'Discord Message Counter', description: 'Count standard Discord messages and Nitro caveats', href: '/discord-message-counter/', tag: 'SOCIAL' },
  { title: 'Telegram Bot Counter', description: 'Check Telegram Bot API message length', href: '/telegram-bot-message-counter/', tag: 'MESSAGING' },
  { title: 'Facebook Post Counter', description: 'Measure text without inventing an unverified limit', href: '/facebook-post-character-counter/', tag: 'SOCIAL' },
  { title: 'Pinterest Description Counter', description: 'Plan Pinterest Save-button description fields', href: '/pinterest-description-counter/', tag: 'SOCIAL' },
  { title: 'X Thread Splitter', description: 'Split longer writing into numbered weighted X posts', href: '/x-thread-splitter/', tag: 'SOCIAL' },
  { title: 'Identifier Case Converter', description: 'Create camelCase PascalCase snake_case and kebab-case', href: '/identifier-case-converter/', tag: 'FORMAT' },
  { title: 'Email & URL Extractor', description: 'Extract unique links and addresses from text', href: '/email-url-extractor/', tag: 'WRITE' },
  { title: 'Syllable Counter', description: 'Estimate syllables sentences and English repetition', href: '/syllable-counter/', tag: 'WRITE' }
];

export const toolGroups: Record<string, string> = {
  COUNT: 'Counting', SOCIAL: 'Social', FORMAT: 'Editing', CLEAN: 'Editing',
  EDIT: 'Editing', COMPARE: 'Editing', ADS: 'SEO & Ads',
  SEO: 'SEO & Ads', MESSAGING: 'Messaging', WRITE: 'Writing'
};
export const toolCategories = ['All', 'Counting', 'Social', 'Editing', 'SEO & Ads', 'Messaging', 'Writing'];

export const textActions: { label: string; action: TextAction }[] = [
  { label: 'UPPERCASE', action: 'uppercase' },
  { label: 'lowercase', action: 'lowercase' },
  { label: 'Title Case', action: 'titlecase' },
  { label: 'Sentence case', action: 'sentencecase' },
  { label: 'Remove line breaks', action: 'remove-line-breaks' },
  { label: 'Clean extra spaces', action: 'clean-spaces' }
];

