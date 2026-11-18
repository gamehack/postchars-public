import { useMemo, useState } from 'react';
import { createGoogleAdsExport, getGoogleAdsFieldStatus, GOOGLE_ADS_LIMITS, googleAdsLength, validateResponsiveSearchAd } from './google-ads-utils';
import { trackEvent } from './analytics';

const initialHeadlines = ['', '', ''];
const initialDescriptions = ['', ''];

type FieldKind = 'headline' | 'description' | 'path';

function AssetRow({ kind, index, value, limit, onChange, onRemove }: {
  kind: FieldKind; index: number; value: string; limit: number;
  onChange: (value: string) => void; onRemove?: () => void;
}) {
  const length = googleAdsLength(value);
  const status = getGoogleAdsFieldStatus(value, limit);
  return (
    <div className={'rsa-asset-row' + (status === 'over' ? ' rsa-over' : '')}>
      <label htmlFor={kind + '-' + index}>{kind === 'headline' ? 'Headline' : kind === 'description' ? 'Description' : 'Path'} {index + 1}</label>
      <div className="rsa-asset-control">
        {kind === 'description'
          ? <textarea id={kind + '-' + index} rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Write a benefit-focused description" />
          : <input id={kind + '-' + index} type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={kind === 'headline' ? 'Enter a search ad headline' : 'Optional display path'} />}
        <span className="rsa-asset-count" aria-label={'Weighted characters ' + length + ' of ' + limit}>{length}/{limit}</span>
        {onRemove && <button type="button" className="rsa-remove" onClick={onRemove} aria-label={'Remove ' + kind + ' ' + (index + 1)}>×</button>}
      </div>
      {status === 'over' && <span className="rsa-warning" role="status">{length - limit} weighted characters over the reference limit</span>}
    </div>
  );
}

export default function GoogleAdsComposer() {
  const [headlines, setHeadlines] = useState<string[]>(initialHeadlines);
  const [descriptions, setDescriptions] = useState<string[]>(initialDescriptions);
  const [paths, setPaths] = useState<string[]>(['', '']);
  const [copied, setCopied] = useState(false);

  const filledHeadlines = headlines.filter((text) => text.trim()).length;
  const filledDescriptions = descriptions.filter((text) => text.trim()).length;
  const validation=useMemo(()=>validateResponsiveSearchAd(headlines,descriptions,paths),[headlines,descriptions,paths]);
  const problems=validation.overLimit;

  function change(setter: (value: string[]) => void, current: string[], index: number, value: string, kind: string) {
    setter(current.map((item, i) => i === index ? value : item));
    if (value.length === 1) trackEvent('google_ads_field_engaged', { field_type: kind });
  }

  async function copyAssets() {
    const exportText = createGoogleAdsExport(headlines, descriptions, paths);
    try {
      await navigator.clipboard.writeText(exportText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
      trackEvent('google_ads_assets_copied', { headline_count: filledHeadlines, description_count: filledDescriptions, over_limit: problems > 0 });
    } catch {
      // Clipboard may be blocked by browser permission settings.
      setCopied(false);
    }
  }

  return (
    <div className="rsa-composer">
      <div className="rsa-heading">
        <div>
          <span className="section-kicker">RESPONSIVE SEARCH AD BUILDER</span>
          <h2>Write and validate Google Ads copy</h2>
          <p>Build up to 15 headlines and 4 descriptions. All checks run in your browser; copy only when you're ready.</p>
        </div>
        <div className={'rsa-status' + (!validation.ready ? ' rsa-over' : '')}>
          <strong>{validation.ready?'Ready for final Google Ads review':problems?problems+' over-limit fields':`Incomplete: ${validation.missingHeadlines} more headlines, ${validation.missingDescriptions} more descriptions`}</strong>
          <span>{filledHeadlines}/3 minimum headlines · {filledDescriptions}/2 minimum descriptions</span>
        </div>
      </div>
      <div className="rsa-columns">
        <div className="rsa-fields">
          <section className="rsa-field-group">
            <div className="rsa-group-heading"><h3>Headlines</h3><span>30 weighted characters each · 3–15</span></div>
            {headlines.map((text, index) => (
              <AssetRow key={'headline-' + index} kind="headline" index={index} value={text}
                limit={GOOGLE_ADS_LIMITS.headline.max}
                onChange={(value) => change(setHeadlines, headlines, index, value, 'headline')}
                onRemove={index >= 3 ? () => setHeadlines(headlines.filter((_, i) => i !== index)) : undefined} />
            ))}
            {headlines.length < 15 && <button type="button" className="rsa-add" onClick={() => setHeadlines([...headlines, ''])}>+ Add headline ({headlines.length}/15)</button>}
          </section>
          <section className="rsa-field-group">
            <div className="rsa-group-heading"><h3>Descriptions</h3><span>90 weighted characters each · 2–4</span></div>
            {descriptions.map((text, index) => (
              <AssetRow key={'description-' + index} kind="description" index={index} value={text}
                limit={GOOGLE_ADS_LIMITS.description.max}
                onChange={(value) => change(setDescriptions, descriptions, index, value, 'description')}
                onRemove={index >= 2 ? () => setDescriptions(descriptions.filter((_, i) => i !== index)) : undefined} />
            ))}
            {descriptions.length < 4 && <button type="button" className="rsa-add" onClick={() => setDescriptions([...descriptions, ''])}>+ Add description ({descriptions.length}/4)</button>}
          </section>
          <section className="rsa-field-group">
            <div className="rsa-group-heading"><h3>Display paths</h3><span>15 weighted characters each · optional</span></div>
            {paths.map((text, index) => (
              <AssetRow key={'path-' + index} kind="path" index={index} value={text}
                limit={GOOGLE_ADS_LIMITS.path.max}
                onChange={(value) => change(setPaths, paths, index, value, 'path')} />
            ))}
          </section>
          <div className="rsa-buttons">
            <button type="button" className="rsa-copy" onClick={copyAssets} disabled={!filledHeadlines && !filledDescriptions}>{copied ? 'Copied assets' : 'Copy all assets'}</button>
            <button type="button" className="rsa-reset" onClick={() => { setHeadlines([...initialHeadlines]); setDescriptions([...initialDescriptions]); setPaths(['', '']); }}>Clear fields</button>
          </div>
        </div>
        <aside className="rsa-preview">
          <span className="section-kicker">LIVE REFERENCE PREVIEW</span>
          <p className="rsa-preview-url">example.com/{paths.filter(Boolean).join('/') || 'your-page'}</p>
          <h3>{headlines.filter(Boolean).slice(0, 3).join(' | ') || 'Your ad headline preview'}</h3>
          <p>{descriptions.filter(Boolean).slice(0, 2).join(' ') || 'Your Google Search ad description preview appears here.'}</p>
          <div className="rsa-notice">Preview is illustrative: Google may reorder or omit assets. Character counts estimate Google Ads double-width rules; check all fields again in your Google Ads account.</div>
          <div className="rsa-guide-link">Official specifications: <a href="https://support.google.com/google-ads/answer/7684791" target="_blank" rel="noopener noreferrer">Google Ads Help</a></div>
        </aside>
      </div>
    </div>
  );
}
