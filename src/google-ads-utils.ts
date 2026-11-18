/** Estimates Google Ads Responsive Search Ad field length. */
const doubleWidth = /[\u1100-\u115f\u2329-\u232a\u2e80-\u303e\u3040-\ua4cf\uac00-\ud7a3\uf900-\ufaff\ufe10-\ufe19\ufe30-\ufe6f\uff01-\uff60\uffe0-\uffe6]/u;

/** Counts CJK and full-width characters as two, ordinary characters as one. */
export function googleAdsLength(input: string): number {
  let count = 0;
  for (const char of input) {
    const codePoint = char.codePointAt(0) ?? 0;
    count += codePoint > 0xffff || doubleWidth.test(char) ? 2 : 1;
  }
  return count;
}

export const GOOGLE_ADS_LIMITS = {
  headline: { max: 30, minFields: 3, maxFields: 15 },
  description: { max: 90, minFields: 2, maxFields: 4 },
  path: { max: 15, maxFields: 2 }
} as const;

export function getGoogleAdsFieldStatus(value: string, limit: number): 'empty' | 'ok' | 'over' {
  if (!value.trim()) return 'empty';
  return googleAdsLength(value) > limit ? 'over' : 'ok';
}

export function createGoogleAdsExport(headlines: string[], descriptions: string[], paths: string[]): string {
  return [
    'GOOGLE ADS RESPONSIVE SEARCH AD ASSETS',
    'Headlines:',
    ...headlines.filter((value) => value.trim()).map((value, i) => (i + 1) + '. ' + value.trim()),
    '',
    'Descriptions:',
    ...descriptions.filter((value) => value.trim()).map((value, i) => (i + 1) + '. ' + value.trim()),
    '',
    'Display paths:',
    ...paths.map((value) => value.trim()).filter(Boolean),
    '',
    'Reference limits: headline 30, description 90, display path 15.',
    'Validate all assets in Google Ads before publishing.'
  ].join('\n');
}

/** Complete RSA validation; over-limit-only is not the same as a publish-ready ad. */
export function validateResponsiveSearchAd(headlines:string[],descriptions:string[],paths:string[]){
 const filledHeadlines=headlines.filter(v=>!!v.trim()).length;
 const filledDescriptions=descriptions.filter(v=>!!v.trim()).length;
 const overLimit=[...headlines.map(v=>getGoogleAdsFieldStatus(v,30)),...descriptions.map(v=>getGoogleAdsFieldStatus(v,90)),...paths.map(v=>getGoogleAdsFieldStatus(v,15))].filter(x=>x==='over').length;
 const missingHeadlines=Math.max(0,3-filledHeadlines);
 const missingDescriptions=Math.max(0,2-filledDescriptions);
 const tooManyHeadlines=headlines.length>15;
 const tooManyDescriptions=descriptions.length>4;
 return {filledHeadlines,filledDescriptions,overLimit,missingHeadlines,missingDescriptions,tooManyHeadlines,tooManyDescriptions,ready:!overLimit&&!missingHeadlines&&!missingDescriptions&&!tooManyHeadlines&&!tooManyDescriptions};
}
