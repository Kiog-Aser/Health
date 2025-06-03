# HealthTracker Pro Setup Guide

## Environment Configuration

To enable AI-powered food scanning, you need to configure your Google Gemini API key:

1. **Get a Gemini API key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Create a new API key
   - Copy the generated key

2. **Create environment file**:
   Create a file named `.env.local` in the project root with:

   ```bash
   # Google Gemini AI API Key
   NEXT_PUBLIC_GEMINI_API_KEY=your_actual_api_key_here
   ```

   Replace `your_actual_api_key_here` with your actual API key.

3. **Restart the development server**:
   ```bash
   npm run dev
   ```

## Testing AI Food Scanning

1. Navigate to the Food Tracking page
2. Click the "Scan Food" button
3. Grant camera permissions when prompted
4. Point your camera at some food
5. Click the capture button
6. The AI will analyze the image and add nutritional data

## Troubleshooting

### Camera Not Working
- Ensure you're using HTTPS or localhost
- Check browser permissions for camera access
- Try refreshing the page

### AI Analysis Fails
- Check that your API key is correctly set in `.env.local`
- Ensure you have an internet connection
- Verify the API key is valid in Google AI Studio

### Build Errors
- Make sure all dependencies are installed: `npm install`
- Check that TypeScript types are correct
- Restart the development server

## Browser Compatibility

The AI food scanning feature requires:
- Modern browser with camera support
- JavaScript enabled
- WebRTC support for camera access
- Canvas API support for image processing

Tested browsers:
- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+ 