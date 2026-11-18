declare module 'twitter-text' {
  interface TweetParseResult {
    weightedLength: number;
    permillage: number;
    valid: boolean;
    displayRangeStart: number;
    displayRangeEnd: number;
    validRangeStart: number;
    validRangeEnd: number;
  }

  interface TwitterText {
    parseTweet(text: string): TweetParseResult;
    extractUrlsWithIndices(text: string): Array<{ url: string; indices: [number, number] }>;
  }

  const twitterText: TwitterText;
  export default twitterText;
}
