import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import {
  AlignLeft, ArrowRight, ArrowUpRight, Check, Clock3, Copy, Download,
  FileText, Hash, LockKeyhole, ShieldCheck, Sparkles, Trash2, Type,
  WandSparkles, Zap
} from 'lucide-react';
import { getTextStats, transformText } from './text-utils';
import { checkPostText } from './cross-platform-rules';
import { updateAnalyticsConsent, trackEvent } from './analytics';
import { readConsent, saveConsent, type ConsentSettings } from './consent';
import { adConfig } from './ad-config';
import { pageData, platforms, toolCards, toolGroups, toolCategories, textActions, type PlatformId } from './catalog';
import { boundedHistory, DRAFT_SAVE_DELAY_MS, HISTORY_GROUP_DELAY_MS } from './editor-history';
import XDetails from './XDetails';
import GoogleAdsComposer from './GoogleAdsComposer';
import './styles.css';

function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function NativeAdSlot({ allowed, pageType }: { allowed: boolean; pageType: string }) {
  const native = adConfig.native;
  const preview = typeof window !== 'undefined' && (window.location.hostname.endsWith('.pages.dev') || window.location.hostname==='localhost' || window.location.hostname==='127.0.0.1');
  const frameUrl = preview ? native.previewFrameUrl : native.frameUrl;
  const sameOrigin = Boolean(frameUrl) && typeof window !== 'undefined' && window.location.origin === new URL(frameUrl).origin;
  const enabled = native.enabled && allowed && !sameOrigin;
  // Opt-in troubleshooting only. This observes tag fetch, never ad fill, ad clicks or user text.
  const debug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('ad_debug') === '1';
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [tagState, setTagState] = useState<'waiting' | 'script_loaded' | 'script_failed'>('waiting');

  useEffect(() => {
    if (!enabled || !debug) return;
    const frameOrigin = new URL(frameUrl).origin;
    const receive = (event: MessageEvent) => {
      if (event.origin !== frameOrigin || event.source !== frameRef.current?.contentWindow) return;
      const data = event.data;
      if (data?.source !== 'postchars-ad-diagnostic' || data?.placement !== 'native') return;
      if (data.state === 'script_loaded' || data.state === 'script_failed') setTagState(data.state);
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [enabled, debug, frameUrl]);

  useEffect(() => {
    if (enabled) trackEvent('ad_tag_requested', { page_type: pageType, ad_format: 'native_banner', placement: 'tool_primary' });
  }, [enabled, pageType]);

  // Optional third-party advertising, if configured by a fork, executes on a distinct origin, never alongside
  // the editor DOM or optional local draft storage. Removing this iframe on
  // consent withdrawal destroys its JavaScript browsing context.
  if (!enabled || !frameUrl) return null;
  return (
    <section className="ad-slot" aria-label="Advertisement">
      <div className="ad-slot-label">ADVERTISEMENT</div>
      <iframe ref={frameRef} className="native-ad-frame" title="Sponsored content" src={frameUrl}
        loading="lazy" referrerPolicy="strict-origin-when-cross-origin" />
      {debug && <p className="ad-diagnostic" role="status">Ad tag: {tagState === 'script_loaded' ? 'script loaded (creative fill NOT verified)' : tagState === 'script_failed' ? 'third-party script failed to load' : 'waiting for lazy iframe and third-party script'}. Network tab is required to inspect any downstream 403 errors.</p>}
    </section>
  );
}

function PrivacyConsentBanner({
  visible,
  onChoice
}: {
  visible: boolean;
  onChoice: (settings: ConsentSettings) => void;
}) {
  if (!visible) return null;

  return (
    <section className="privacy-consent" role="dialog" aria-label="Privacy preferences">
      <div className="privacy-consent-copy">
        <strong>Privacy preferences</strong>
        <p>Choose whether this deployment may load optional Google Analytics. Analytics is disabled until the site operator configures their own GA4 measurement ID. Advertising integrations are not included in this release. Your text is never sent to analytics.</p>
        <a href="/privacy/">Read the Privacy Policy</a>
      </div>
      <div className="privacy-consent-actions">
        <button type="button" className="consent-primary" onClick={() => onChoice({ analytics: true, advertising: false })}>Allow analytics</button>
        <button type="button" className="consent-secondary" onClick={() => onChoice({ analytics: false, advertising: false })}>Reject optional</button>
      </div>
    </section>
  );
}

export function App({ page }: { page: string }) {
  const pageKey = page in pageData ? page : 'home';
  const config = pageData[pageKey];
  const [text, setText] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformId | ''>(config.defaultPlatform ?? '');
  const [copied, setCopied] = useState(false);
  const [toolSearch, setToolSearch] = useState('');
  const [toolCategory, setToolCategory] = useState('All');
  const [wordGoal, setWordGoal] = useState(0);
  const [readingWpm, setReadingWpm] = useState(225);
  const [savedVersions, setSavedVersions] = useState<{at:number;text:string}[]>([]);
  const historyPast = useRef<string[]>([]);
  const historyFuture = useRef<string[]>([]);
  const lastEditAt = useRef(0);
  const [, setHistoryChange] = useState(0);
  const [draftEnabled, setDraftEnabled] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [consent, setConsent] = useState<ConsentSettings | null>(null);
  const [consentLoaded, setConsentLoaded] = useState(false);
  const [consentVisible, setConsentVisible] = useState(false);
  const hasTrackedEngagement = useRef(false);

  useEffect(() => {
    const savedConsent = readConsent();
    const requestedPreferences = new URLSearchParams(window.location.search).get('privacy') === '1';
    if (requestedPreferences) window.history.replaceState({}, '', window.location.pathname + window.location.hash);
    setConsent(savedConsent);
    setConsentVisible(!savedConsent || requestedPreferences);
    setConsentLoaded(true);
  }, []);

  // Draft persistence is opt-in and strictly local; text never enters analytics.
  useEffect(() => {
    try {
      if (localStorage.getItem('postchars-draft-enabled-v1') === 'true') {
        setText(localStorage.getItem('postchars-draft-' + pageKey) || '');
        const savedGoal = Number(localStorage.getItem('postchars-word-goal-' + pageKey) || 0);
        setWordGoal(Number.isFinite(savedGoal) ? Math.max(0, Math.min(100000, savedGoal)) : 0);
        const speed=Number(localStorage.getItem('postchars-reading-speed-'+pageKey)||225);
        if(Number.isFinite(speed))setReadingWpm(Math.max(100,Math.min(500,speed)));
        try{
          const versions=JSON.parse(localStorage.getItem('postchars-versions-'+pageKey)||'[]');
          if(Array.isArray(versions))setSavedVersions(versions.filter(v=>v&&typeof v.at==='number'&&typeof v.text==='string').slice(0,10));
        }catch{ /* Malformed local history is ignored. */ }
        setDraftEnabled(true);
      }
    } catch { /* Local storage can be blocked; the editor still works. */ }
    setDraftReady(true);
  }, [pageKey]);

  useEffect(() => {
    if (!draftReady || !draftEnabled) return;
    const persist = () => {
      try {
        localStorage.setItem('postchars-draft-' + pageKey, text);
        localStorage.setItem('postchars-word-goal-' + pageKey, String(wordGoal));
        localStorage.setItem('postchars-reading-speed-' + pageKey, String(readingWpm));
      } catch { /* Editing remains available when storage is denied or full. */ }
    };
    const timer = window.setTimeout(persist, DRAFT_SAVE_DELAY_MS);
    window.addEventListener('pagehide', persist);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('pagehide', persist);
    };
  }, [text, wordGoal, readingWpm, pageKey, draftReady, draftEnabled]);

  function toggleLocalDraft(checked: boolean) {
    setDraftEnabled(checked);
    try {
      if (checked) {
        localStorage.setItem('postchars-draft-enabled-v1', 'true');
        localStorage.setItem('postchars-draft-' + pageKey, text);
        localStorage.setItem('postchars-word-goal-' + pageKey, String(wordGoal));
        localStorage.setItem('postchars-reading-speed-' + pageKey, String(readingWpm));
      } else {
        localStorage.removeItem('postchars-draft-enabled-v1');
        localStorage.removeItem('postchars-draft-' + pageKey);
        localStorage.removeItem('postchars-word-goal-' + pageKey);
        localStorage.removeItem('postchars-reading-speed-' + pageKey);
        localStorage.removeItem('postchars-versions-' + pageKey);
        setSavedVersions([]);
      }
    } catch { /* Local storage is optional, never a requirement. */ }
  }

  useEffect(() => {
    if (consentLoaded) updateAnalyticsConsent(consent);
  }, [consent, consentLoaded]);

  function chooseConsent(settings: ConsentSettings) {
    saveConsent(settings);
    setConsent(settings);
    setConsentVisible(false);
  }

  function deleteSavedDrafts() {
    if (!window.confirm('Delete all PostChars drafts and writing goals saved in this browser? Current unsaved text will remain open.')) return;
    try {
      const names = Object.keys(localStorage);
      for (const name of names) {
        if (name.startsWith('postchars-draft-') || name.startsWith('postchars-word-goal-') ||
            name.startsWith('postchars-versions-') || name.startsWith('postchars-reading-speed-')) localStorage.removeItem(name);
      }
    } catch { /* Browser storage is optional. */ }
    setDraftEnabled(false);
    setWordGoal(0);
    setSavedVersions([]);
  }

  function applyText(value: string, forceCheckpoint = false) {
    if(value===text)return;
    const now=Date.now();
    if(forceCheckpoint || now-lastEditAt.current>HISTORY_GROUP_DELAY_MS){
      historyPast.current=boundedHistory(historyPast.current,text);
    }
    lastEditAt.current=now;
    historyFuture.current=[];
    setHistoryChange(v=>v+1);setText(value);
  }
  function undoText() {
    const previous=historyPast.current.pop();if(previous===undefined)return;
    historyFuture.current=boundedHistory(historyFuture.current,text);
    lastEditAt.current=0;setText(previous);setHistoryChange(v=>v+1);
  }
  function redoText() {
    const next=historyFuture.current.pop();if(next===undefined)return;
    historyPast.current=boundedHistory(historyPast.current,text);
    lastEditAt.current=0;setText(next);setHistoryChange(v=>v+1);
  }
  function saveLocalVersion() {
    if(!draftEnabled||!text||text.length>60000)return;
    const next=[{at:Date.now(),text},...savedVersions].slice(0,10);
    try{localStorage.setItem('postchars-versions-'+pageKey,JSON.stringify(next));setSavedVersions(next);}
    catch{window.alert('Browser storage is full or unavailable.');}
  }
  function handleTextChange(value: string) {
    applyText(value);
    // Do not consume the one-time engagement marker before analytics consent.
    // If someone starts typing while declined, count their first new edit
    // only after they explicitly opt in. No text ever enters the event.
    if (value.length > 0 && consent?.analytics === true && !hasTrackedEngagement.current) {
      hasTrackedEngagement.current = true;
      trackEvent('tool_engaged', { page_type: pageKey });
    }
  }
  const stats = useMemo(() => getTextStats(text), [text]);
  const filteredTools = useMemo(() => {
    const term = toolSearch.trim().toLowerCase();
    return toolCards.filter(tool =>
      (toolCategory === 'All' || toolGroups[tool.tag] === toolCategory) &&
      (tool.title + ' ' + tool.description + ' ' + tool.tag).toLowerCase().includes(term)
    );
  }, [toolSearch, toolCategory]);
  // Use the same scoped platform rules as the unified checker. Compute only
  // the selected platform, so X's weighted parser is never run unnecessarily.
  const platform = platforms.find((item) => item.id === selectedPlatform);
  const platformCharacters = useMemo(
    () => platform ? checkPostText(text, platform.id).count : stats.characters,
    [text, selectedPlatform, stats.characters]
  );
  const xWeightedCharacters = selectedPlatform === 'x' ? platformCharacters : 0;
  const progress = platform ? Math.min(100, (platformCharacters / platform.limit) * 100) : 0;
  const remaining = platform ? platform.limit - platformCharacters : 0;

  async function copyText() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const field = document.querySelector<HTMLTextAreaElement>('.text-editor');
      field?.select();
      document.execCommand('copy');
    }
    trackEvent('text_copy', { page_type: pageKey, text_length: text.length });
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function importTextFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    const ext=file.name.split('.').pop()?.toLowerCase();
    if (file.size > 2_000_000 || !ext || !['txt','md','csv','json','log'].includes(ext)) {
      window.alert('Select a TXT, MD, CSV, JSON or LOG file no larger than 2 MB. PDF and DOCX are not supported in this browser-only reader.');
      input.value = '';
      return;
    }
    try {
      applyText(await file.text(), true);
    } catch {
      window.alert('Unable to read this text file.');
    }
    input.value = '';
  }

  function downloadText() {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'postchars-text.txt';
    anchor.click();
    trackEvent('text_download', { page_type: pageKey, text_length: text.length });
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const statItems = [
    { key: 'characters', label: selectedPlatform === 'x' ? 'X weighted' : 'Characters', icon: Hash, value: formatNumber(selectedPlatform === 'x' ? xWeightedCharacters : stats.characters) },
    { key: 'charactersNoSpaces', label: 'No spaces', icon: Type, value: formatNumber(stats.charactersNoSpaces) },
    { key: 'words', label: 'Words', icon: FileText, value: formatNumber(stats.words) },
    { key: 'sentences', label: 'Sentences', icon: AlignLeft, value: formatNumber(stats.sentences) },
    { key: 'paragraphs', label: 'Paragraphs', icon: FileText, value: formatNumber(stats.paragraphs) },
    { key: 'readingMinutes', label: 'Read time', icon: Clock3, value: (stats.words ? Math.ceil(stats.words/readingWpm) : 0) + ' min' }
  ];

  return (
    <div className="site-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="PostChars home">
          <span className="brand-mark"><Hash size={19} strokeWidth={2.8} /></span>
          <span className="brand-name">postchars<span>.</span></span>
        </a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="/cross-platform-post-checker/">All platform limits</a>
          <a href="/character-counter/">Character Counter</a>
          <a href="/word-counter/">Word Counter</a>
          <a href="#all-tools">All tools</a>
          <a href="/google-ads-character-counter/">Google Ads Counter</a>
        </nav>
        <a className="topbar-cta" href="#workspace">Open workspace <ArrowUpRight size={15} /></a>
      </header>

      <main>
        <section className={'hero' + (pageKey === 'twitterCharacterCounter' ? ' hero-compact' : '')}>
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" />{config.eyebrow}</div>
            <h1>{config.heading}</h1>
            <p className="hero-intro">{config.intro}</p>
            {pageKey === 'home' && <>
              <a className="hero-feature-link" href="/cross-platform-post-checker/" onClick={() => trackEvent('hero_cross_platform_click')}>Check one draft across 12 platforms <ArrowRight size={15} /></a>
              <nav className="hero-shortcuts" aria-label="Popular purpose-built text tools">
                <a href="/twitter-character-counter/" onClick={() => trackEvent('hero_x_counter_click')}>X/Twitter Counter</a>
                <a href="/google-ads-character-counter/" onClick={() => trackEvent('hero_google_ads_click')}>Google Ads Counter</a>
              </nav>
            </>}
            <div className="hero-proof">
              <span><ShieldCheck size={16} /> Private by design</span>
              <span><Zap size={16} /> Instant results</span>
              <span><Sparkles size={16} /> Always free</span>
            </div>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="hero-orbit orbit-one" />
            <div className="hero-orbit orbit-two" />
            <div className="hero-art-card">
              <div className="hero-art-top"><span /><span /><span /></div>
              <div className="hero-art-line line-long" />
              <div className="hero-art-line line-mid" />
              <div className="hero-art-line line-short" />
              <div className="hero-art-count"><strong>280</strong><span>characters</span></div>
              <div className="hero-art-check"><Check size={18} /></div>
            </div>
            <div className="floating-chip chip-top"><Hash size={15} /> Count</div>
            <div className="floating-chip chip-bottom"><WandSparkles size={15} /> Refine</div>
          </div>
        </section>

        <section className="workspace-section" id="workspace">
          <div className="section-heading">
            <div><div className="section-kicker">{pageKey === 'googleAdsCounter' ? 'YOUR AD COPY WORKSPACE' : 'YOUR TEXT WORKSPACE'}</div><h2>{pageKey === 'googleAdsCounter' ? 'Draft, check, copy.' : 'Write, count, refine.'}</h2></div>
            <div className="privacy-note"><LockKeyhole size={15} /> Your text stays in this browser</div>
          </div>
          {pageKey === 'googleAdsCounter' ? <GoogleAdsComposer /> : (
          <div className="workspace-card">
            <div className="editor-heading">
              <div className="editor-label"><span className="editor-indicator" /> YOUR TEXT</div>
              <button className="text-button clear-button" type="button" onClick={() => applyText('',true)} disabled={!text}><Trash2 size={14} /> Clear</button>
            </div>
            <label className="sr-only" htmlFor="text-input">Enter or paste your text</label>
            <textarea id="text-input" className="text-editor" value={text} onChange={(event) => handleTextChange(event.target.value)} onKeyDown={event=>{
              if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='z'){event.preventDefault();if(event.shiftKey)redoText();else undoText();}
              if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='y'){event.preventDefault();redoText();}
            }} placeholder="Start typing or paste your text here…" spellCheck="true" />
            <div className="editor-bottom">
              <span>{text ? 'Live count is on' : 'Your text is processed locally — nothing is uploaded.'}</span>
              <div className="editor-buttons">
                <button className="secondary-button" type="button" onClick={copyText} disabled={!text}>{copied ? <Check size={15} /> : <Copy size={15} />}{copied ? 'Copied' : 'Copy text'}</button>
                <label className="secondary-button completion-import"><FileText size={15} /> Import text <input type="file" accept=".txt,.md,.csv,.json,.log,text/plain" onChange={importTextFile} aria-label="Import a local plain text file" /></label>
                <button className="secondary-button" type="button" onClick={downloadText} disabled={!text}><Download size={15} /> Download</button>
              </div>
            </div>
            <div className="completion-draft-bar">
              <label className="completion-local-save"><input type="checkbox" checked={draftEnabled} onChange={event => toggleLocalDraft(event.target.checked)} /> Save drafts in this browser (opt-in)</label>
              <label htmlFor="writing-word-goal">Word goal <input id="writing-word-goal" type="number" min="0" max="100000" value={wordGoal || ''} onChange={event => setWordGoal(Math.max(0, Math.min(100000, Number(event.target.value) || 0)))} placeholder="e.g. 500" /></label>
              <label htmlFor="reading-wpm">Reading speed <input id="reading-wpm" type="number" min="100" max="500" value={readingWpm} onChange={event=>setReadingWpm(Math.max(100,Math.min(500,Number(event.target.value)||225)))} /> WPM</label>
              <button className="completion-delete-saved" type="button" onClick={undoText} disabled={!historyPast.current.length}>Undo</button>
              <button className="completion-delete-saved" type="button" onClick={redoText} disabled={!historyFuture.current.length}>Redo</button>
              <button className="completion-delete-saved" type="button" onClick={saveLocalVersion} disabled={!draftEnabled||!text||text.length>60000}>Save version</button>
              {draftEnabled && savedVersions.length>0 && <label htmlFor="saved-versions">Saved versions <select id="saved-versions" defaultValue="" onChange={event=>{
                const version=savedVersions[Number(event.target.value)];if(version)applyText(version.text,true);event.target.value='';
              }}><option value="">Choose…</option>{savedVersions.map((version,i)=><option value={i} key={version.at}>{new Date(version.at).toLocaleString()} ({version.text.length} chars)</option>)}</select></label>}
              {wordGoal > 0 && <span className="completion-goal-status" role="status">{stats.words} / {wordGoal} words ({Math.min(100, Math.round(stats.words / wordGoal * 100))}%)</span>}
              <button className="completion-delete-saved" type="button" onClick={deleteSavedDrafts}>Delete saved drafts</button>
              <p>Draft saving remains opt-in. Up to 10 snapshots per page (60,000 characters each); Undo/Redo groups nearby keystrokes and bounds history memory in this tab. Delete saved drafts clears all local history.</p>
            </div>
            <div className="stats-grid" aria-live="polite">
              {statItems.map((item) => {
                const Icon = item.icon;
                return <div className="stat-card" key={item.key}><div className="stat-top"><span>{item.label}</span><Icon size={15} /></div><strong>{item.value}</strong></div>;
              })}
            </div>
            <div className="platform-panel">
              <div className="platform-heading">
                <div><h3>Check a platform limit</h3><p>Choose a channel to see how your text fits.</p></div>
                <span className="reference-label">REFERENCE LIMITS</span>
              </div>
              <div className="platform-list">
                {platforms.map((item) => (
                  <button type="button" key={item.id} className={'platform-option' + (selectedPlatform === item.id ? ' selected' : '')} onClick={() => { setSelectedPlatform(item.id); trackEvent('platform_limit_selected', { page_type: pageKey, platform: item.id }); }} aria-pressed={selectedPlatform === item.id}>
                    <span className="platform-name">{item.name}</span><span className="platform-detail">{item.detail}</span>
                  </button>
                ))}
              </div>
              {platform ? (
                <div className="limit-result">
                  <div className="limit-copy">
                    <span><strong>{formatNumber(platformCharacters)}</strong> / {formatNumber(platform.limit)} {selectedPlatform === 'x' ? 'weighted characters' : 'characters'}</span>
                    <span className={remaining < 0 ? 'over-limit' : 'within-limit'}>{remaining < 0 ? formatNumber(Math.abs(remaining)) + ' over the reference limit' : formatNumber(remaining) + ' remaining'}</span>
                  </div>
                  <div className="progress-track"><div className={'progress-fill' + (remaining < 0 ? ' is-over' : '')} style={{ width: progress + '%' }} /></div>
                  <p className="limit-footnote">Compare counting methods: {stats.characters} visible graphemes · {Array.from(text).length} Unicode code points · {text.length} UTF-16 units. X uses twitter-text v3 weighted rules; other reference limits are not guaranteed publisher validation results. Confirm in the publishing app.</p>
                </div>
              ) : <div className="limit-empty">Select a platform to compare your character count with its reference limit.</div>}
            </div>
            {pageKey === 'twitterCharacterCounter' && <XDetails text={text} />}
            <div className="format-panel">
              <div className="format-heading">
                <div><h3>Quick text tools</h3><p>Apply a change to the text above.</p></div>
                <span className="format-icon"><WandSparkles size={17} /></span>
              </div>
              <div className="action-grid">
                {textActions.map((item) => <button className="action-button" key={item.action} type="button" onClick={() => { applyText(transformText(text,item.action),true); trackEvent('text_transform', { page_type: pageKey, action: item.action }); }} disabled={!text}>{item.label}<ArrowRight size={14} /></button>)}
              </div>
            </div>
          </div>
          )}
        </section>

        <NativeAdSlot allowed={consent?.advertising === true} pageType={pageKey} />

        {pageKey === 'twitterCharacterCounter' && (
          <section className="related-guide-section" aria-label="Related X character counting guide">
            <div className="related-guide-card"><div><span className="section-kicker">GO DEEPER</span><h2>Why URLs and emoji count differently on X</h2><p>Understand weighted characters, recognized links, CJK text and emoji before publishing.</p></div><a href="/guides/twitter-urls-emoji-counting/" onClick={() => trackEvent('related_guide_click', { page_type: pageKey, guide: 'x_url_emoji_counting' })}>Read the guide <ArrowUpRight size={15} /></a></div>
          </section>
        )}
        {pageKey === 'googleAdsCounter' && (
          <section className="related-guide-section" aria-label="Related Google Ads character limits guide">
            <div className="related-guide-card"><div><span className="section-kicker">GO DEEPER</span><h2>Google Ads headline and description limits</h2><p>Review responsive search ad field limits, weighted characters and practical copy checks.</p></div><a href="/guides/google-ads-character-limits/" onClick={() => trackEvent('related_guide_click', { page_type: pageKey, guide: 'google_ads_limits' })}>Read the guide <ArrowUpRight size={15} /></a></div>
          </section>
        )}
        {pageKey === 'linkedinCharacterCounter' && (
          <section className="related-guide-section" aria-label="LinkedIn post limit guide">
            <div className="related-guide-card"><div><span className="section-kicker">GO DEEPER</span><h2>LinkedIn's 3,000-character post limit</h2><p>Learn what counts, how line breaks and emoji affect text length, and how to edit a clear update.</p></div><a href="/guides/linkedin-post-character-limit/" onClick={() => trackEvent('related_guide_click', { page_type: pageKey, guide: 'linkedin_post_limit' })}>Read the guide <ArrowUpRight size={15} /></a></div>
          </section>
        )}
        {pageKey === 'instagramCaptionCounter' && (
          <section className="related-guide-section" aria-label="Instagram caption length guide">
            <div className="related-guide-card"><div><span className="section-kicker">GO DEEPER</span><h2>What counts toward an Instagram caption?</h2><p>Review the 2,200-character reference, hashtags, emoji, and practical caption drafting checks.</p></div><a href="/guides/instagram-caption-character-limit/" onClick={() => trackEvent('related_guide_click', { page_type: pageKey, guide: 'instagram_caption_limit' })}>Read the guide <ArrowUpRight size={15} /></a></div>
          </section>
        )}
        <section className="tools-section" id="all-tools">
          <div className="section-heading tools-heading">
            <div><div className="section-kicker">THE TOOLKIT</div><h2>One place for everyday text tasks.</h2></div>
            <p>Simple utilities for writing, publishing and polishing.</p>
          </div>
          <div className="completion-tool-filters">
            <label htmlFor="tool-search">Find a tool <input id="tool-search" type="search" value={toolSearch} onChange={event => setToolSearch(event.target.value)} placeholder="Search tools..." /></label>
            <label htmlFor="tool-group">Category <select id="tool-group" value={toolCategory} onChange={event => setToolCategory(event.target.value)}>{toolCategories.map(category => <option value={category} key={category}>{category}</option>)}</select></label>
            <span>{filteredTools.length} tools</span>
          </div>
          <div className="tool-grid">
            {filteredTools.map((tool, index) => (
              <a className="tool-card" href={tool.href} key={tool.href}>
                <div className="tool-card-top"><span className="tool-index">{String(index + 1).padStart(2, '0')}</span><span className="tool-tag">{tool.tag}</span></div>
                <h3>{tool.title}</h3><p>{tool.description}</p>
                <span className="tool-link">Open tool <ArrowUpRight size={15} /></span>
              </a>
            ))}
          </div>
          {filteredTools.length === 0 && <p role="status">No tools match your search. Try another keyword or category.</p>}
        </section>

        {pageKey === 'home' && (
          <section className="related-guide-section" aria-label="Publishing limits and character counting guides">
            <div className="section-kicker">PUBLISHING GUIDES</div>
            <h2>Know the limit before you post.</h2>
            <p><a href="/guides/linkedin-post-character-limit/">LinkedIn: 3,000-character post limit</a> · <a href="/guides/instagram-caption-character-limit/">Instagram: 2,200-character caption reference</a></p>
            <p><a href="/guides/twitter-urls-emoji-counting/">X: URL and emoji weighting explained</a> · <a href="/guides/google-ads-character-limits/">Google Ads: headline and description limits</a></p>
            <p><a href="/guides/social-media-character-limits/">Social media character limits: 12 platforms compared</a> · <a href="/cross-platform-post-checker/">Check one draft on 12 platforms</a></p>
          </section>
        )}

        {pageKey === 'characterCounter' && (
          <section className="x-guide" aria-labelledby="character-guide-heading">
            <div className="section-kicker">CHARACTER COUNTING EXPLAINED</div>
            <h2 id="character-guide-heading">How do characters, spaces and emoji count?</h2>
            <p>This free online character counter updates as you type. The main count uses visible Unicode grapheme clusters where supported, while the separate no-spaces metric excludes whitespace. A space, punctuation mark or line break contributes to the main count.</p>
            <div className="x-guide-table-wrap"><table className="x-guide-table">
              <thead><tr><th scope="col">Example</th><th scope="col">Visible characters</th><th scope="col">Without spaces</th></tr></thead>
              <tbody>
                <tr><td><code>Hello world</code></td><td>11</td><td>10</td></tr>
                <tr><td><code>Hello!</code></td><td>6</td><td>6</td></tr>
                <tr><td><code>😀</code></td><td>1</td><td>1</td></tr>
              </tbody>
            </table></div>
            <p>Need a publishing-specific limit rather than a general character count? Use the <a href="/twitter-character-counter/">X character counter</a> for weighted URL and emoji rules or the <a href="/cross-platform-post-checker/">12-platform post checker</a> to compare one draft across social networks. For longer writing, try the <a href="/word-counter/">word counter</a> and <a href="/readability-checker/">English readability checker</a>.</p>
          </section>
        )}

        {pageKey === 'twitterCharacterCounter' && (
          <section className="x-guide" aria-labelledby="x-guide-heading">
            <div className="section-kicker">UNDERSTAND THE LIMIT</div>
            <h2 id="x-guide-heading">What counts toward the 280-character X limit?</h2>
            <p>Unlike a basic character counter, an X (formerly Twitter) post counter needs to account for platform-specific text weighting. The table below shows common examples under the published <a href="https://github.com/twitter/twitter-text" target="_blank" rel="noopener noreferrer">twitter-text v3 rules</a>.</p>
            <div className="x-guide-table-wrap">
              <table className="x-guide-table">
                <thead><tr><th scope="col">Example</th><th scope="col">X weighted count</th><th scope="col">Why</th></tr></thead>
                <tbody>
                  <tr><td><code>Hello world</code></td><td>11</td><td>Basic Latin text and a space each count as one</td></tr>
                  <tr><td><code>中文</code></td><td>4</td><td>Many CJK characters have weight two</td></tr>
                  <tr><td><code>😀</code></td><td>2</td><td>Many emoji have weight two</td></tr>
                  <tr><td><code>https://example.com</code></td><td>23</td><td>Recognized links use a fixed URL weight</td></tr>
                </tbody>
              </table>
            </div>
            <h3>How to use this X character counter</h3>
            <p>Type or paste your draft in the workspace above. X is selected by default on this page. Watch the <strong>X weighted</strong> value and the remaining characters indicator update instantly. When your draft fits the reference limit, copy the text and publish it in X.</p>
            <p><a href="/guides/twitter-urls-emoji-counting/">Read our guide to X URLs, emoji and weighted characters</a>.</p>
            <p className="x-guide-note">This is an independent reference tool, not an official X posting validator. The parser version is twitter-text 3.1.0; longer post options, special content and subsequent X changes may use different rules. Always confirm the final result in X before publishing.</p>
          </section>
        )}

        {pageKey === 'googleAdsCounter' && (
          <section className="x-guide" aria-labelledby="google-ads-guide-heading">
            <div className="section-kicker">GOOGLE ADS COPY REFERENCE</div>
            <h2 id="google-ads-guide-heading">Responsive search ad asset requirements</h2>
            <p>Each headline can have up to 30 characters, each description up to 90, and each display path up to 15. Google allows 3–15 headlines and 2–4 descriptions per responsive search ad. Many CJK double-width characters count as two.</p>
            <div className="x-guide-table-wrap"><table className="x-guide-table">
              <thead><tr><th>Asset</th><th>Maximum per asset</th><th>Quantity</th></tr></thead>
              <tbody><tr><td>Headlines</td><td>30</td><td>3–15</td></tr><tr><td>Descriptions</td><td>90</td><td>2–4</td></tr><tr><td>Display paths</td><td>15</td><td>Up to 2 optional fields</td></tr></tbody>
            </table></div>
            <h3>How to use this counter</h3>
            <p>Enter at least three different headlines and two descriptions. Each field shows its estimated weighted length and a clear warning if the reference limit is exceeded. The preview demonstrates one possible combination, not the final ad. Copy your assets and validate them inside Google Ads before publishing.</p>
            <h3>Common mistakes to check before publishing</h3>
            <p>Check every headline and description separately rather than adding their lengths together. Keep each headline understandable when Google combines assets in different orders; avoid repeating the same wording in all descriptions. Character limits do not guarantee ad approval or performance.</p>
            <p>For worked examples, see our <a href="/guides/google-ads-character-limits/">responsive search ad headline, description and display path limits guide</a>. The <a href="/serp-snippet-preview/">SEO title and meta description preview</a> serves a different purpose: it is for organic search snippets, not Google Ads copy validation. See <a href="https://support.google.com/google-ads/answer/7684791" target="_blank" rel="noopener noreferrer">the official Google Ads specifications</a> for final validation.</p>
          </section>
        )}

        <section className="info-section">
          <div className="info-copy">
            <div className="section-kicker">BUILT FOR THE WAY YOU WRITE</div>
            <h2>{config.sectionTitle}</h2>
            <p>{config.sectionBody}</p>
            <div className="info-points">
              <div><span className="point-icon"><LockKeyhole size={16} /></span><span><strong>Private by default</strong><small>Your text is processed in your browser.</small></span></div>
              <div><span className="point-icon"><Zap size={16} /></span><span><strong>No waiting</strong><small>Counts and transformations update instantly.</small></span></div>
              <div><span className="point-icon"><Check size={16} /></span><span><strong>No account needed</strong><small>Open a tool and get straight to work.</small></span></div>
            </div>
          </div>
          <div className="info-side">
            <div className="info-side-icon"><FileText size={24} /></div>
            <span className="info-side-label">POSTCHARS PRINCIPLE</span>
            <h3>Useful tools.<br />No unnecessary steps.</h3>
            <p>Fast, focused utilities that respect your time and your text.</p>
            <a href="#workspace">Try the workspace <ArrowRight size={15} /></a>
          </div>
        </section>

        <section className="faq-section">
          <div className="faq-heading">
            <div className="section-kicker">GOOD TO KNOW</div>
            <h2>Frequently asked questions</h2>
            <p>Clear answers about counting, formatting and privacy.</p>
          </div>
          <div className="faq-list">
            {config.faqs.map((faq) => <details className="faq-item" key={faq.question}><summary>{faq.question}<span className="faq-plus">+</span></summary><p>{faq.answer}</p></details>)}
          </div>
        </section>
      </main>

      <footer className="footer">
        {pageKey === 'home' && (
          <aside className="ph-launch-embed" aria-label="PostChars Product Hunt launch">
            <a
              href="https://www.producthunt.com/posts/postchars?utm_source=postchars&utm_medium=site_footer&utm_campaign=launch"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visit the PostChars launch on Product Hunt"
            >
              <img
                src="https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=1299363&theme=light"
                width="250"
                height="54"
                loading="lazy"
                referrerPolicy="no-referrer"
                alt="PostChars on Product Hunt"
              />
            </a>
            <p>PostChars is on Product Hunt. Explore the launch and tell us what to improve.</p>
          </aside>
        )}
        <a className="brand footer-brand" href="/"><span className="brand-mark"><Hash size={17} strokeWidth={2.8} /></span><span className="brand-name">postchars<span>.</span></span></a>
        <p>Free text tools for clearer writing.</p>
        <div className="footer-links">
          <a href="/character-counter/">Character Counter</a><a href="/word-counter/">Word Counter</a>
          <a href="/text-case-converter/">Text Case Converter</a><a href="/remove-line-breaks/">Remove Line Breaks</a>
          <a href="/guides/twitter-urls-emoji-counting/">X Counting Guide</a><a href="/guides/google-ads-character-limits/">Google Ads Guide</a>
          <a href="/about/">About</a><a href="/privacy/">Privacy</a><a href="/contact/">Contact</a>
          <a href="mailto:hello@postchars.com?subject=PostChars%20bug%20report">Report an issue</a>
          <button className="footer-privacy-choices" type="button" onClick={() => setConsentVisible(true)}>Privacy choices</button>
        </div>
        <small>© {new Date().getFullYear()} PostChars. All rights reserved.</small>
      </footer>
      <PrivacyConsentBanner visible={consentLoaded && consentVisible} onChoice={chooseConsent} />
    </div>
  );
}

// The production build pre-renders initial HTML for crawlers and faster first paint.
// Local development still supports client-only mounting against the source HTML.
if (typeof document !== 'undefined') {
  const root = document.getElementById('root');
  if (root) {
    const app = <App page={document.body.dataset.page ?? 'home'} />;
    if (root.dataset.prerendered === 'true') {
      hydrateRoot(root, app);
    } else {
      createRoot(root).render(app);
    }
  }
}