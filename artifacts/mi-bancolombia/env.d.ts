declare global {
  namespace NodeJS {
    interface ProcessEnv {
      /** Base URL of the deployed API server. Used by native APK builds.
       *  Value: https://bancolombia--bankbancolombia.replit.app
       */
      EXPO_PUBLIC_API_URL: string;

      /** Expo project ID from expo.dev, required for push notification tokens.
       *  Value: 1123da6a-aea4-411f-a792-ea76835c7f00
       */
      EXPO_PUBLIC_PROJECT_ID: string;
    }
  }
}

export {};
