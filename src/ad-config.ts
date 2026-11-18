/**
 * Optional advertising integrations are disabled in the public source release.
 * A fork may add its own provider and configuration without inheriting publisher IDs.
 */
export const adConfig = {
  native: {
    enabled: false,
    scriptUrl: '',
    containerId: '',
    frameUrl: '',
    previewFrameUrl: ''
  }
};
