import { useMemo } from 'react';
import { getXBreakdown } from './x-utils';

export default function XDetails({ text }: { text: string }) {
  const details = useMemo(() => getXBreakdown(text), [text]);

  return (
    <section className="x-details" aria-label="X post detailed counter">
      <div className="section-kicker">X POST INSPECTOR</div>
      <h3>Links, emoji and a live X post preview</h3>
      <p>Check what makes up your draft before posting. X weights many emoji and CJK characters differently from visible characters; recognised links use a fixed 23-character weight.</p>
      <div className="x-details-metrics">
        <div><span>X weighted</span><strong>{details.weighted}</strong></div>
        <div><span>Visible characters</span><strong>{details.visibleCharacters}</strong></div>
        <div><span>Recognized URLs</span><strong>{details.links}</strong></div>
        <div><span>Emoji clusters</span><strong>{details.emoji}</strong></div>
      </div>
      <div className="x-details-limit">
        <span className={details.remaining < 0 ? 'rsa-warning' : ''}>{details.remaining < 0 ? Math.abs(details.remaining) + ' weighted characters over 280' : details.remaining + ' weighted characters remaining'}</span>
        <div className="progress-track"><div className={'progress-fill' + (details.remaining < 0 ? ' is-over' : '')} style={{ width: Math.min(100, details.weighted / 280 * 100) + '%' }} /></div>
      </div>
      <div className="x-preview-card">
        <strong>Post preview <small>Illustrative — not an official X renderer</small></strong>
        <div className="x-preview-profile"><span className="x-preview-avatar">P</span><span><b>PostChars</b> <small>@preview · now</small></span></div>
        <p>{text || 'Type a post in the editor above to see a preview here.'}</p>
      </div>
      <p className="x-details-note">Counts use twitter-text v3.1.0. Actual X features and long-post allowances can differ; check your published post inside X.</p>
    </section>
  );
}
