# Supabase Configuration for Moment AI

This document explains how to set up Supabase credentials for the Moment AI application.

## Issue

The app requires Supabase credentials (URL and anonymous key) to function properly, especially in the Expo Go environment.

## Solution

The app now supports multiple ways to configure Supabase:

### Option 1: Environment Variables (recommended for development)

Create a `.env` file in the root of your project with the following contents:

```
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url_here
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Option 2: In-App Configuration (recommended for testing)

When you launch the app and no Supabase credentials are found, a configuration screen will appear where you can enter your Supabase URL and anonymous key. These credentials will be saved securely for future use.

### Option 3: App Configuration

You can also add your Supabase credentials to the `app.config.js` file:

```js
module.exports = {
  // ... other configuration
  extra: {
    supabaseUrl: "your_supabase_url_here",
    supabaseAnonKey: "your_supabase_anon_key_here",
  },
};
```

## Finding Your Supabase Credentials

1. Go to your Supabase dashboard and open your project
2. Navigate to Project Settings > API
3. Under "Project URL", copy your project URL (e.g., `https://abcdefghijklm.supabase.co`)
4. Under "Project API keys", copy the "anon public" key

## Troubleshooting

If you're experiencing issues with Supabase connectivity:

1. Check that your credentials are correctly entered
2. Ensure that your device or emulator has internet connectivity
3. Verify that your Supabase project is active and online
4. Check if you've enabled the necessary tables and functions in your Supabase project
5. For development, try clearing the app storage or reinstalling the app

## Security Note

Never commit your `.env` file to version control. It's already added to `.gitignore` to prevent accidental commits.
