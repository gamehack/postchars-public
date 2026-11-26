// Long-form, server-rendered editorial content for the React tool pages.
// Every page in scripts/prerender.mjs renders this markup into static HTML, so
// the explanations are readable without JavaScript. Keep facts consistent with
// the guides in /guides/ and label platform numbers as references where the
// platform itself does not publish a precise rule.
import type { ReactNode } from 'react';

function Article({ id, kicker, title, children }: { id: string; kicker: string; title: string; children: ReactNode }) {
  return (
    <section className="x-guide page-article" aria-labelledby={id}>
      <div className="section-kicker">{kicker}</div>
      <h2 id={id}>{title}</h2>
      {children}
    </section>
  );
}

function GuideLinks({ links }: { links: [string, string][] }) {
  return (
    <nav className="page-article-links" aria-label="Related guides and tools">
      <strong>Keep reading</strong>
      <ul>{links.map(([href, label]) => <li key={href}><a href={href}>{label}</a></li>)}</ul>
    </nav>
  );
}

const home = (
  <Article id="home-article-heading" kicker="HOW POSTCHARS WORKS" title="Why character counts differ between tools and platforms">
    <p>Most people expect a character count to be a single, objective number. In practice, the answer depends on what is being counted. A person sees the family emoji 👨‍👩‍👧 as one symbol, yet it is built from five Unicode code points (three people joined by two invisible zero-width joiners) and eight UTF-16 code units. A word processor, a database column, an SMS gateway and a social network can each report a different length for that same text, and none of them is wrong. They are simply measuring different things.</p>
    <p>PostChars is built around that observation. The general counters on this site count <strong>visible characters</strong> (Unicode grapheme clusters, the units a reader perceives), while each platform tool uses the counting method that platform documents: weighted units for X, UTF-16 units for TikTok's Direct Post API and Discord, code points for the Telegram Bot API, graphemes plus UTF-8 bytes for Bluesky, and GSM-7 septets or UCS-2 units for SMS. Where a platform does not publish a firm number, the tool says so instead of inventing one.</p>
    <h3>The four ways text length is measured</h3>
    <div className="x-guide-table-wrap"><table className="x-guide-table">
      <thead><tr><th scope="col">Unit</th><th scope="col">What it counts</th><th scope="col">Where you meet it</th></tr></thead>
      <tbody>
        <tr><td>Grapheme clusters</td><td>What a reader sees as one character</td><td>General character counters, LinkedIn and Instagram planning, Bluesky</td></tr>
        <tr><td>Unicode code points</td><td>Individual Unicode values, including invisible joiners</td><td>Telegram Bot API, Pinterest descriptions, many programming languages</td></tr>
        <tr><td>UTF-16 code units</td><td>JavaScript string length; most emoji use two</td><td>TikTok API captions, Discord, browser form fields with <code>maxlength</code></td></tr>
        <tr><td>UTF-8 bytes</td><td>Storage size; accented letters use 2 bytes, most CJK 3, emoji 4</td><td>Bluesky's 3,000-byte limit, databases, the YouTube Data API description field</td></tr>
      </tbody>
    </table></div>
    <h3>How to use the toolkit</h3>
    <ol>
      <li><strong>Start with the destination.</strong> If you are writing for one channel, open its dedicated counter so the right counting rule is applied from the first keystroke.</li>
      <li><strong>Draft in the workspace.</strong> Type or paste into the editor above. Counts update as you type; nothing is sent to a server.</li>
      <li><strong>Check every destination at once.</strong> If the same message will appear in several places, paste it into the <a href="/cross-platform-post-checker/">cross-platform post checker</a> to see which fields it fits.</li>
      <li><strong>Polish and copy.</strong> Use the quick text tools to fix case, remove stray line breaks or collapse spaces, then copy the result into the publishing app, which remains the final validator.</li>
    </ol>
    <h3>Who uses PostChars</h3>
    <p>Social media managers check one announcement against X, LinkedIn, Instagram and Threads before scheduling it. Students use the <a href="/word-counter/">word counter</a> to stay within essay limits. Marketers draft responsive search ads in the <a href="/google-ads-character-counter/">Google Ads counter</a> and test page titles in the <a href="/serp-snippet-preview/">SERP snippet preview</a>. Developers paste strings into the <a href="/unicode-character-inspector/">Unicode inspector</a> to find zero-width spaces that break validation. Support teams estimate <a href="/sms-character-counter/">SMS segments</a> before sending a notification to thousands of customers.</p>
    <p>Each tool page explains its own rules, edge cases and sources, and the <a href="/guides/">writing guides</a> go further into topics such as structuring an X thread, writing a LinkedIn opening that survives the “see more” cut, and what readability scores can and cannot tell you.</p>
  </Article>
);

const characterCounter = (
  <Article id="character-article-heading" kicker="IN-DEPTH GUIDE" title="How this character counter works, step by step">
    <p>The counter measures text the way a reader sees it. Each time you type, paste or edit, the browser splits your text into grapheme clusters using the standard <code>Intl.Segmenter</code> API and counts them. A grapheme cluster is one user-perceived character: the letter <code>é</code> is one, whether it is stored as a single precomposed code point or as <code>e</code> followed by a combining accent; a flag such as 🇯🇵 is one, even though it is made of two regional-indicator code points.</p>
    <h3>Using the counter</h3>
    <ol>
      <li>Type or paste your text into the workspace. You can also import a plain-text file (TXT, MD, CSV, JSON or LOG up to 2 MB); the file is read locally by your browser.</li>
      <li>Read the six live metrics: characters with spaces, characters without spaces, words, sentences, paragraphs and estimated reading time.</li>
      <li>Optionally choose a platform reference (X, Instagram, LinkedIn, Threads or a YouTube title) to see how much space remains for that field.</li>
      <li>Apply a quick fix if needed, such as removing line breaks or collapsing double spaces, then copy or download the result.</li>
    </ol>
    <h3>What each number means</h3>
    <p><strong>Characters</strong> includes letters, digits, punctuation, spaces, tabs and line breaks. <strong>No spaces</strong> removes every whitespace character first, which is the figure some academic and translation briefs ask for. <strong>Words</strong> are runs of letters or digits, with internal apostrophes kept together, so <em>don’t</em> is one word and <em>2026</em> is one word; a hyphenated term such as <em>well-known</em> counts as two. <strong>Sentences</strong> are split at full stops, question marks and exclamation marks (including the Chinese and Japanese forms 。！？), so abbreviations like “e.g.” can add an extra sentence. <strong>Paragraphs</strong> are blocks separated by a blank line. <strong>Reading time</strong> divides words by 225 words per minute by default; you can change the speed between 100 and 500.</p>
    <h3>Edge cases worth knowing</h3>
    <div className="x-guide-table-wrap"><table className="x-guide-table">
      <thead><tr><th scope="col">Input</th><th scope="col">PostChars count</th><th scope="col">Why another tool may differ</th></tr></thead>
      <tbody>
        <tr><td><code>👍🏽</code> (thumbs up, medium skin tone)</td><td>1</td><td>Two code points and four UTF-16 units; <code>text.length</code> in JavaScript returns 4</td></tr>
        <tr><td><code>👨‍👩‍👧</code> (family)</td><td>1</td><td>Five code points joined by zero-width joiners; eight UTF-16 units</td></tr>
        <tr><td>A line break</td><td>1</td><td>Windows text may store it as two characters (CR + LF); this counter treats CR LF as one break</td></tr>
        <tr><td><code>https://example.com/page</code></td><td>24</td><td>X counts any recognized URL as 23 weighted characters</td></tr>
        <tr><td><code>中文</code></td><td>2</td><td>X and Google Ads count many CJK characters as two each</td></tr>
      </tbody>
    </table></div>
    <p>Invisible characters also count. Text copied from web pages or chat apps can contain zero-width spaces, non-breaking spaces or soft hyphens that you cannot see but that still occupy a position. If a count looks one or two higher than expected, paste the text into the <a href="/unicode-character-inspector/">Unicode character inspector</a> to reveal them.</p>
    <h3>Practical examples</h3>
    <p><strong>A meta description.</strong> Google does not publish a hard character limit for meta descriptions; it truncates by pixel width. Count here for a rough check, then use the <a href="/serp-snippet-preview/">SERP snippet preview</a> to see the approximate width. <strong>A form field.</strong> A web form with <code>maxlength="100"</code> counts UTF-16 units, so ten emoji may use twenty of those hundred units even though they look like ten characters. <strong>A translated string.</strong> German and Finnish copy often runs 20–35% longer than English for the same message, so leave headroom in buttons and headlines that must be localized.</p>
    <p>For platform posts, prefer the dedicated tools: the <a href="/twitter-character-counter/">X counter</a> applies weighted counting, the <a href="/sms-character-counter/">SMS counter</a> applies GSM-7 and Unicode segment rules, and the <a href="/cross-platform-post-checker/">cross-platform checker</a> compares one draft against twelve fields.</p>
    <GuideLinks links={[
      ['/guides/social-media-character-limits/', 'Social media character limits: 12 platforms compared'],
      ['/guides/twitter-urls-emoji-counting/', 'How X counts URLs, emoji and Chinese characters'],
      ['/guides/sms-gsm-7-vs-unicode/', 'SMS encoding explained: GSM-7 vs Unicode']
    ]} />
  </Article>
);

const wordCounter = (
  <Article id="word-article-heading" kicker="IN-DEPTH GUIDE" title="How words, sentences and reading time are counted">
    <p>Word counts look simple until two programs disagree about the same essay. The difference almost always comes from how each program defines a word boundary. This page explains the rules PostChars uses so you can predict the result and reconcile it with Microsoft Word, Google Docs or a submission portal.</p>
    <h3>Using the word counter</h3>
    <ol>
      <li>Paste your text or import a local text file. Formatting such as bold or headings is not carried over; only the plain text is counted.</li>
      <li>Set an optional <strong>word goal</strong> to see progress as a percentage, which is useful for essays with a minimum or maximum length.</li>
      <li>Adjust the <strong>reading speed</strong> if you know your audience. The default of 225 words per minute suits general adult reading of familiar material.</li>
      <li>Turn on browser-only draft saving if you want to come back later. It is off by default and can be deleted with one button.</li>
    </ol>
    <h3>The rules behind each metric</h3>
    <div className="x-guide-table-wrap"><table className="x-guide-table">
      <thead><tr><th scope="col">Text</th><th scope="col">Words here</th><th scope="col">Reason</th></tr></thead>
      <tbody>
        <tr><td><code>don’t stop</code></td><td>2</td><td>An apostrophe inside a word keeps it together</td></tr>
        <tr><td><code>state-of-the-art</code></td><td>4</td><td>Hyphens separate words; Microsoft Word counts this as 1</td></tr>
        <tr><td><code>3.5 million</code></td><td>3</td><td>The full stop splits the number into “3” and “5”</td></tr>
        <tr><td><code>#writing @postchars</code></td><td>2</td><td>Symbols are ignored; the letters still form words</td></tr>
        <tr><td><code>— – …</code></td><td>0</td><td>Punctuation on its own is not a word</td></tr>
      </tbody>
    </table></div>
    <p>Because hyphenated compounds and decimal numbers are split, PostChars can report slightly more words than a word processor for technical or academic text. If your institution names a specific tool for the official count, check the final number there; use this counter for fast drafting and editing.</p>
    <p><strong>Languages without spaces.</strong> Chinese, Japanese and Thai do not separate words with spaces. Here, a continuous run of those characters counts as one “word”, so the word count is not meaningful for them. For those languages, use the character count, which is the length measure most publishers and translators use anyway.</p>
    <h3>Reading time and speaking time</h3>
    <p>Reading time is the word count divided by the reading speed, rounded up to the next whole minute. Research on silent reading in English commonly places adult averages roughly between 200 and 300 words per minute for non-technical prose, so 225 is a middle estimate rather than a promise. Dense technical material reads more slowly. For a speech or a video script, a speaking rate around 130 words per minute is a more realistic planning figure; the <a href="/detailed-word-counter/">detailed word counter</a> shows that estimate directly.</p>
    <h3>Common word-count targets</h3>
    <p>Many limits are set by whoever asks for the text, not by a universal standard: a college application essay prompt, a journal abstract (often 150–300 words), a press release, or a newsletter section. Always follow the specific instructions you were given. As rough orientation, a single-spaced page of 12-point text holds about 500 words, and a double-spaced page about 250.</p>
    <h3>When to check more than the word count</h3>
    <p>Hitting a target is not the same as being readable. After the length is right, run the draft through the <a href="/readability-checker/">readability checker</a> to find long sentences, and the <a href="/keyword-density-checker/">keyword density checker</a> to spot words you repeat too often. If you are cutting a draft down, the <a href="/text-diff-checker/">text diff checker</a> shows exactly what changed between versions.</p>
    <GuideLinks links={[
      ['/guides/readability-scores-explained/', 'Readability scores explained: Flesch, grade level and their limits'],
      ['/guides/linkedin-hook-see-more/', 'How to write a LinkedIn opening that survives “see more”']
    ]} />
  </Article>
);

const twitterCharacterCounter = (
  <Article id="x-article-heading" kicker="WRITING FOR X" title="Practical X post examples and editing tips">
    <p>The weighted count explains why the remaining-character indicator sometimes jumps by two or by 23 at once. Once you understand the weights, you can plan a post rather than trimming at random. The examples below were checked with the same twitter-text 3.1.0 parser this page uses.</p>
    <h3>Worked examples</h3>
    <div className="x-guide-table-wrap"><table className="x-guide-table">
      <thead><tr><th scope="col">Draft</th><th scope="col">Weighted length</th><th scope="col">What happened</th></tr></thead>
      <tbody>
        <tr><td><code>New guide: https://postchars.com/guides/</code></td><td>34</td><td>11 for “New guide: ” plus 23 for the link, regardless of its 32 visible characters</td></tr>
        <tr><td><code>Launch day 🚀🚀🚀</code></td><td>17</td><td>11 for the text and space, plus 2 for each rocket</td></tr>
        <tr><td><code>你好，世界</code></td><td>10</td><td>Five CJK characters and full-width punctuation, each weighted 2</td></tr>
        <tr><td><code>café</code></td><td>4</td><td>Accented Latin letters are in the weight-1 ranges</td></tr>
      </tbody>
    </table></div>
    <h3>A step-by-step routine for a post that fits</h3>
    <ol>
      <li><strong>Write the message without the link.</strong> Get the wording right first, then add the URL; it will always cost 23, so you can budget for it.</li>
      <li><strong>Watch the weighted number, not the visible one.</strong> The X weighted metric is shown in the first stat card when X is selected.</li>
      <li><strong>Trim filler first.</strong> Phrases like “I just wanted to share that” rarely add meaning. Replace “in order to” with “to”.</li>
      <li><strong>Check emoji and non-Latin text.</strong> If you are close to 280, each emoji or CJK character you remove frees two units.</li>
      <li><strong>Leave a small margin.</strong> Mentions and links added by a scheduling tool can push a post over the limit after you copy it.</li>
    </ol>
    <h3>Things this counter cannot know</h3>
    <p>X Premium subscribers can publish posts far longer than 280 characters, and replies that start with @mentions, quoted posts and media attachments are handled by X's own interface. This page measures the standard post format only. Mentions at the start of a reply can be treated differently in X's apps, so if you write a reply near the limit, confirm the count in X.</p>
    <p>If your idea needs more than one post, plan a thread instead of cramming. The <a href="/x-thread-splitter/">X thread splitter</a> numbers each part and includes that numbering in the weighted count, and our guide to <a href="/guides/how-to-write-an-x-thread/">structuring an X thread</a> covers openings, pacing and where to put links. Publishing the same message on Bluesky, Threads or LinkedIn too? The <a href="/cross-platform-post-checker/">cross-platform checker</a> applies each network's own counting rule.</p>
    <GuideLinks links={[
      ['/guides/twitter-urls-emoji-counting/', 'How X counts URLs, emoji and Chinese characters'],
      ['/guides/how-to-write-an-x-thread/', 'How to structure an X thread that people finish reading']
    ]} />
  </Article>
);

const googleAdsCounter = (
  <Article id="ads-article-heading" kicker="WRITING BETTER RSA COPY" title="From character limits to headlines that work together">
    <p>Fitting a headline into 30 characters is the easy part. The harder part is writing 10 to 15 headlines that each make sense on their own and in any combination, because Google Ads assembles responsive search ads from your assets automatically. Google states that an ad may show up to three headlines and two descriptions, chosen and ordered by its system, and that part of your text can be bolded when it matches a search.</p>
    <h3>Worked example: one service, many angles</h3>
    <p>Imagine a fictional bike repair shop in Leeds. Instead of fifteen variations of “Bike Repair Leeds”, give each headline a different job:</p>
    <div className="x-guide-table-wrap"><table className="x-guide-table">
      <thead><tr><th scope="col">Job</th><th scope="col">Example headline</th><th scope="col">Characters</th></tr></thead>
      <tbody>
        <tr><td>Keyword match</td><td>Bike Repair in Leeds</td><td>20</td></tr>
        <tr><td>Speed benefit</td><td>Same-Day Puncture Fixes</td><td>23</td></tr>
        <tr><td>Proof</td><td>Certified Cycle Mechanics</td><td>25</td></tr>
        <tr><td>Price transparency</td><td>Fixed Prices, No Surprises</td><td>26</td></tr>
        <tr><td>Call to action</td><td>Book a Service Online</td><td>21</td></tr>
      </tbody>
    </table></div>
    <p>Each line passes the 30-character check and reads sensibly next to any other. A pair of descriptions could then explain the offer (“Full services, brake tuning and wheel truing for road, gravel and e-bikes.”, 74 characters) and remove friction (“Drop off before 10am and collect the same evening. Free safety check included.”, 78 characters). These are drafting illustrations, not performance claims.</p>
    <h3>Counting rules that catch people out</h3>
    <ul>
      <li><strong>Spaces and punctuation count.</strong> “Fixed Prices, No Surprises” uses 26 characters including the comma and three spaces.</li>
      <li><strong>Double-width characters count as two.</strong> Google says every character in a double-width language such as Chinese, Japanese or Korean counts as two, so a Japanese headline has roughly 15 characters of room.</li>
      <li><strong>Keyword insertion defaults must fit.</strong> In <code>{'{KeyWord:Bike Repair}'}</code>, the default text must fit the field, and the inserted keyword is only used when it fits too.</li>
      <li><strong>Each field is separate.</strong> The limits apply to each headline and description, not to a combined total.</li>
    </ul>
    <h3>Pinning: use it sparingly</h3>
    <p>Pinning fixes an asset to a position, such as Headline 1. Google notes that only content pinned to Headline 1, Headline 2 or Description 1 is guaranteed to show, and that pinning reduces the combinations it can test, which can lower Ad Strength. Pin a legally required disclaimer or a brand name when you must; otherwise let assets rotate.</p>
    <h3>A pre-launch checklist</h3>
    <ol>
      <li>At least one headline contains the main keyword theme of the ad group.</li>
      <li>No two headlines say the same thing in slightly different words.</li>
      <li>Every claim (prices, “free”, delivery times) is true on the landing page.</li>
      <li>Display paths describe the destination, for example <code>repairs</code> and <code>same-day</code>, within 15 characters per path field.</li>
      <li>The copy has been validated in Google Ads itself, which is the final authority.</li>
    </ol>
    <p>For a longer walkthrough of headline angles, ad strength and testing, read our guide to <a href="/guides/google-ads-rsa-headlines/">writing Google Ads RSA headlines</a>.</p>
    <GuideLinks links={[
      ['/guides/google-ads-rsa-headlines/', 'How to write Google Ads RSA headlines that combine well'],
      ['/guides/google-ads-character-limits/', 'Google Ads character limits: headlines, descriptions and paths']
    ]} />
  </Article>
);

const instagramCaptionCounter = (
  <Article id="ig-article-heading" kicker="IN-DEPTH GUIDE" title="How to plan an Instagram caption that fits and gets read">
    <p>The documented 2,200-character ceiling is generous; most captions never come close. The practical constraint is the collapsed preview: in the feed, only the first line or two appear before “more”, and the exact cutoff varies with screen width, font size and whether the text includes line breaks. A caption that works is therefore written front to back: the opening earns the tap, and the rest rewards it.</p>
    <h3>Using this counter for captions</h3>
    <ol>
      <li>Write or paste the full caption, including hashtags, mentions and any disclosure such as “#ad” or “Paid partnership”.</li>
      <li>Check the remaining-character figure against the 2,200 reference shown when Instagram is selected.</li>
      <li>Read the first 125 or so characters on their own. If they do not make sense without the rest, rewrite the opening. That figure is a common rule of thumb, not an official cutoff.</li>
      <li>Copy the caption and paste it into Instagram, then check line breaks in the app's preview before posting.</li>
    </ol>
    <h3>How Instagram-style text is counted here</h3>
    <p>This page counts visible characters (grapheme clusters), which is the closest match to what you see. Every hashtag symbol, every space between hashtags and every line break uses part of the allowance. An emoji counts as one visible character here, but some emoji are stored as several code points; the platform panel shows visible, code point and UTF-16 totals side by side so you can see the difference for your own text.</p>
    <div className="x-guide-table-wrap"><table className="x-guide-table">
      <thead><tr><th scope="col">Caption element</th><th scope="col">Example</th><th scope="col">Visible characters</th></tr></thead>
      <tbody>
        <tr><td>Hashtag</td><td><code>#streetphotography</code></td><td>18</td></tr>
        <tr><td>Mention</td><td><code>@postchars</code></td><td>10</td></tr>
        <tr><td>Emoji with skin tone</td><td><code>👋🏾</code></td><td>1 (2 code points)</td></tr>
        <tr><td>Blank line between paragraphs</td><td>two line breaks</td><td>2</td></tr>
      </tbody>
    </table></div>
    <h3>A caption structure that works for most posts</h3>
    <p><strong>Line one: the reason to keep reading.</strong> State what the photo or reel shows, or why it matters, in plain words. <strong>Middle: the substance.</strong> Add the story, the recipe steps, the location details or the lesson. Short paragraphs are easier to scan on a phone. <strong>End: one clear next step.</strong> Ask a specific question, point to the link in your bio, or invite people to save the post. <strong>Last: tags.</strong> Put relevant hashtags at the end so they do not interrupt the reading.</p>
    <p>Instagram's guidance on hashtag numbers has changed over time, and its API documentation and in-app guidance have not always matched. Rather than chasing a number, choose a few specific tags that describe the post accurately. Our <a href="/guides/instagram-caption-character-limit/">Instagram caption guide</a> explains the documented limits in detail.</p>
    <h3>Line breaks and formatting</h3>
    <p>Instagram removes some formatting when you paste, and blank lines can behave differently between app versions. Write paragraphs in a plain-text editor such as this one, paste once, and check the preview. Avoid relying on special Unicode “bold” or “italic” letters: screen readers often read them out letter by letter, and they count as separate characters.</p>
    <p>Posting the same caption to TikTok, Threads or Facebook? The <a href="/cross-platform-post-checker/">cross-platform checker</a> shows how it measures on each. For your profile text, use the <a href="/instagram-bio-character-counter/">Instagram bio counter</a> instead, which checks the much shorter 150-character bio field.</p>
    <GuideLinks links={[
      ['/guides/instagram-caption-character-limit/', 'Instagram caption character limit: what counts toward 2,200?'],
      ['/guides/social-media-character-limits/', 'Social media character limits: 12 platforms compared']
    ]} />
  </Article>
);

const linkedinCharacterCounter = (
  <Article id="li-article-heading" kicker="IN-DEPTH GUIDE" title="Writing a LinkedIn post that fits and is worth expanding">
    <p>LinkedIn's Help Center states a 3,000-character limit for a post. That limit rarely decides whether a post succeeds. What decides it is the first two or three lines, because the feed collapses longer posts behind a “…see more” link. LinkedIn does not publish an exact cutoff; it varies by device, by window width and by where you place line breaks. Treat the opening as the part everyone sees and the rest as the part people choose to read.</p>
    <h3>Using the LinkedIn counter</h3>
    <ol>
      <li>Paste your draft with its final line breaks. LinkedIn keeps single line breaks, and each one counts as a character here.</li>
      <li>Watch the remaining figure against the 3,000-character reference. Keep a margin if you will add a link or tag people after pasting.</li>
      <li>Read only the first two lines. Ask whether they tell a reader what they will get by expanding.</li>
      <li>Copy the result into LinkedIn and check the preview on both desktop and phone if you can.</li>
    </ol>
    <h3>What counts toward the 3,000 characters</h3>
    <div className="x-guide-table-wrap"><table className="x-guide-table">
      <thead><tr><th scope="col">Element</th><th scope="col">Counts?</th><th scope="col">Note</th></tr></thead>
      <tbody>
        <tr><td>Line breaks and blank lines</td><td>Yes</td><td>Each break is one character in this counter</td></tr>
        <tr><td>Hashtags</td><td>Yes</td><td>The # and every letter count</td></tr>
        <tr><td>Links</td><td>Yes</td><td>LinkedIn does not use a fixed link weight like X</td></tr>
        <tr><td>@mentions</td><td>Yes, as text</td><td>Once selected, a mention displays the person's name, which can change the visible length</td></tr>
        <tr><td>Emoji</td><td>Yes</td><td>One visible character here; complex emoji may count differently in LinkedIn's own validation</td></tr>
      </tbody>
    </table></div>
    <h3>An example opening, before and after</h3>
    <p><strong>Before:</strong> “I'm excited to share that after a lot of hard work over the past few months, our team has finally…” The first two lines are spent on throat-clearing. <strong>After:</strong> “We cut our onboarding time from 14 days to 3. Here is the checklist we used, and the step we almost skipped.” The reader learns the result and has a reason to expand. Both fit easily; only one earns the click.</p>
    <h3>Structure for the rest of the post</h3>
    <p>Keep paragraphs to one idea each, one to three sentences long. Use a short list when you are giving steps. End with a specific question or a clear takeaway rather than a generic “Thoughts?”. If the explanation needs more than about 1,300 characters to do it justice, consider whether a LinkedIn article or a linked page would serve readers better; the post can then summarise it.</p>
    <p>Our new guide to <a href="/guides/linkedin-hook-see-more/">writing a LinkedIn hook before “see more”</a> covers opening patterns with examples, and the <a href="/guides/linkedin-post-character-limit/">LinkedIn post limit guide</a> covers the documented rules. For your profile, the <a href="/linkedin-headline-counter/">LinkedIn headline counter</a> checks the much shorter headline field.</p>
    <GuideLinks links={[
      ['/guides/linkedin-hook-see-more/', 'How to write a LinkedIn hook before “see more”'],
      ['/guides/linkedin-post-character-limit/', 'LinkedIn post character limit: 3,000 characters explained']
    ]} />
  </Article>
);

const textCaseConverter = (
  <Article id="case-article-heading" kicker="IN-DEPTH GUIDE" title="Choosing the right text case, with examples">
    <p>Case conversion looks trivial, but each style follows different conventions, and automatic conversion cannot know every rule a style guide applies. This section explains what each button does, where it is the right choice, and what to check by hand afterwards.</p>
    <h3>How to convert text case</h3>
    <ol>
      <li>Paste the text into the workspace. Line breaks, numbers and punctuation are preserved.</li>
      <li>Choose UPPERCASE, lowercase, Title Case or Sentence case under <strong>Quick text tools</strong>.</li>
      <li>Review the result. Use Undo (Ctrl+Z or ⌘Z) in the editor if the conversion is not what you wanted.</li>
      <li>Copy the converted text, or download it as a plain-text file.</li>
    </ol>
    <h3>What each style does here</h3>
    <div className="x-guide-table-wrap"><table className="x-guide-table">
      <thead><tr><th scope="col">Style</th><th scope="col">Input</th><th scope="col">Output</th></tr></thead>
      <tbody>
        <tr><td>UPPERCASE</td><td><code>Read the PostChars guide</code></td><td><code>READ THE POSTCHARS GUIDE</code></td></tr>
        <tr><td>lowercase</td><td><code>Read the PostChars guide</code></td><td><code>read the postchars guide</code></td></tr>
        <tr><td>Title Case</td><td><code>a guide to the GSM-7 alphabet</code></td><td><code>A Guide To The Gsm-7 Alphabet</code></td></tr>
        <tr><td>Sentence case</td><td><code>SHIPPING IS FREE. ORDER TODAY!</code></td><td><code>Shipping is free. Order today!</code></td></tr>
      </tbody>
    </table></div>
    <p>The Title Case button capitalizes the first letter of every word and lowercases the rest. That is predictable, but it differs from editorial title case in two ways you should fix by hand: style guides such as AP and Chicago keep short articles, conjunctions and prepositions lowercase (“A Guide to the GSM-7 Alphabet”), and acronyms or brand names such as GSM, iPhone or PostChars need their own capitalization restored. Sentence case lowercases everything and capitalizes the first letter after a full stop, question mark or exclamation mark, so proper nouns also need a quick review.</p>
    <h3>Language and locale details</h3>
    <p>Conversion uses your browser's locale-aware functions, so accented letters convert correctly: <code>élan</code> becomes <code>ÉLAN</code>. A few languages have special rules. German <code>ß</code> becomes <code>SS</code> in uppercase, which adds a character; Turkish distinguishes dotted and dotless i, which depends on the language setting. Scripts without case, such as Chinese, Japanese, Arabic or Hebrew, are left unchanged.</p>
    <h3>When to use which case</h3>
    <ul>
      <li><strong>Sentence case</strong> for most interface text, buttons, email subject lines and headings in modern style guides. It reads naturally and is easier to scan.</li>
      <li><strong>Title case</strong> for book, article and course titles, and wherever a house style requires it.</li>
      <li><strong>UPPERCASE</strong> sparingly, for short labels or acronyms. Long passages in capitals are harder to read, and some screen readers spell out all-caps words.</li>
      <li><strong>lowercase</strong> to normalize data before comparing or deduplicating it, for example email addresses in a list.</li>
    </ul>
    <p>Writing code rather than prose? The <a href="/identifier-case-converter/">identifier case converter</a> produces camelCase, PascalCase, snake_case, kebab-case and CONSTANT_CASE. To normalize a list before removing duplicates, convert to lowercase here and then use <a href="/sort-lines-alphabetically/">sort and deduplicate lines</a>.</p>
    <GuideLinks links={[
      ['/guides/youtube-title-description-best-practices/', 'YouTube titles and descriptions: limits and best practices'],
      ['/guides/google-ads-rsa-headlines/', 'How to write Google Ads RSA headlines']
    ]} />
  </Article>
);

const removeLineBreaks = (
  <Article id="lb-article-heading" kicker="IN-DEPTH GUIDE" title="Why copied text breaks, and how to fix it cleanly">
    <p>PDFs do not store paragraphs the way a word processor does. They store lines of text positioned on a page, so when you copy from a PDF, each visual line usually arrives with a hard line break at its end. Email clients that wrap plain text at a fixed width, terminal output and OCR results do the same. The result is text that looks fine in its source but breaks mid-sentence when pasted anywhere else.</p>
    <h3>Two cleanup modes, two different results</h3>
    <div className="x-guide-table-wrap"><table className="x-guide-table">
      <thead><tr><th scope="col">Action</th><th scope="col">What it does</th><th scope="col">Use it when</th></tr></thead>
      <tbody>
        <tr><td>Remove line breaks</td><td>Replaces every line break with a space, then collapses repeated whitespace into one space</td><td>You want one continuous paragraph, such as a quote, a form field or a single-line caption</td></tr>
        <tr><td>Clean extra spaces</td><td>Collapses runs of spaces and tabs, trims spaces at the start and end of each line, and reduces three or more line breaks to one blank line</td><td>You want to keep paragraphs but remove clutter</td></tr>
      </tbody>
    </table></div>
    <h3>Step by step: fixing text copied from a PDF</h3>
    <ol>
      <li>Paste the copied text into the workspace above.</li>
      <li>If the text is one paragraph, choose <strong>Remove line breaks</strong>. Each broken line is joined with a single space.</li>
      <li>If the text has several paragraphs, first make sure each real paragraph is separated by a blank line, then use <strong>Clean extra spaces</strong> so the structure survives.</li>
      <li>Review hyphenated words. A word split across lines in the PDF, such as “docu-” and “ment”, becomes “docu- ment”; search for “- ” and fix those by hand, or use <a href="/find-and-replace-text/">find and replace</a>.</li>
      <li>Copy the result. The character count updates as you go, which helps if the destination has a limit.</li>
    </ol>
    <h3>Example</h3>
    <p>Input copied from a two-column PDF:</p>
    <p><code>The committee reviewed the proposal and</code><br /><code>agreed to extend the deadline by two</code><br /><code>weeks.</code></p>
    <p>After <strong>Remove line breaks</strong>: <code>The committee reviewed the proposal and agreed to extend the deadline by two weeks.</code> The three lines become one sentence with single spaces between the words.</p>
    <h3>Edge cases</h3>
    <ul>
      <li><strong>Windows line endings.</strong> Text from Windows applications often uses CR LF pairs. Both characters are removed together, so you will not end up with double spaces.</li>
      <li><strong>Bullet lists.</strong> Removing line breaks merges list items into one line. If you need to keep a list, use Clean extra spaces instead, or sort it with the <a href="/sort-lines-alphabetically/">line sorter</a>.</li>
      <li><strong>Non-breaking and zero-width spaces.</strong> These look like ordinary spaces or nothing at all. If spacing still looks wrong after cleanup, check the text in the <a href="/unicode-character-inspector/">Unicode inspector</a>.</li>
      <li><strong>HTML or Markdown.</strong> Stripping tags is a separate job; the <a href="/text-cleaner-online/">text cleaner</a> removes basic HTML markup and blank lines.</li>
    </ul>
    <p>All cleanup happens in your browser. That matters when the copied text comes from a contract, a medical letter or an internal report: nothing is uploaded to PostChars to be processed.</p>
    <GuideLinks links={[
      ['/guides/social-media-character-limits/', 'Social media character limits: 12 platforms compared'],
      ['/guides/readability-scores-explained/', 'Readability scores explained']
    ]} />
  </Article>
);

export const pageArticles: Record<string, ReactNode> = {
  home,
  characterCounter,
  wordCounter,
  twitterCharacterCounter,
  googleAdsCounter,
  instagramCaptionCounter,
  linkedinCharacterCounter,
  textCaseConverter,
  removeLineBreaks
};
