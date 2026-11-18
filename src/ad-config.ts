/**
 * Operator-specific ad units are never stored in public source.
 * Production-only data comes from a generated runtime config in dist/.
 */
export interface NativeAdConfig {
  enabled: boolean;
  scriptUrl: string;
  containerId: string;
  frameUrl: string;
  previewFrameUrl: string;
}
export interface OperatorConfig {
  native?: NativeAdConfig;
  guide?: { enabled: boolean; key: string; scriptUrl: string; frameUrl: string };
}
declare global {
  interface Window { POSTCHARS_OPERATOR_CONFIG?: OperatorConfig }
}
const disabled: NativeAdConfig = {
  enabled: false, scriptUrl: '', containerId: '', frameUrl: '', previewFrameUrl: ''
};
export const adConfig = {
  get native(): NativeAdConfig {
    if (typeof window === 'undefined') return disabled;
    const config = window.POSTCHARS_OPERATOR_CONFIG?.native;
    if (!config || config.enabled !== true || !config.frameUrl || !config.previewFrameUrl) return disabled;
    return config;
  }
};
