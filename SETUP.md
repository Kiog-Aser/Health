# HealthTracker Pro Setup Guide

## Environment Configuration

To enable AI-powered food scanning, you need to configure your Google Gemini API key:

1. **Get a Gemini API key**:
   - Visit [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key)
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

1. Navigate to the Dashboard page (http://localhost:3000)
2. Use the "Test Gemini API Connection" button to verify your setup
3. Once verified, go to the Food Tracking page
4. Click the "Scan Food" button
5. Grant camera permissions when prompted
6. Point your camera at some food
7. Click the capture button
8. The AI will analyze the image and add nutritional data

## Troubleshooting

### Camera Not Working

**Issue**: Camera doesn't initialize or shows permission errors
- **Solution**: Ensure you're using HTTPS or localhost
- **Solution**: Check browser permissions for camera access
- **Solution**: Try refreshing the page
- **Solution**: Try a different browser (Chrome/Firefox recommended)

**Issue**: Camera switching doesn't work
- **Solution**: Some devices only have one camera - this is normal
- **Solution**: Check if your device has multiple cameras available

### AI Analysis Fails

**Issue**: "AI service not configured" error
- **Solution**: Check that your API key is correctly set in `.env.local`
- **Solution**: Verify the API key is valid in Google AI Studio
- **Solution**: Restart the development server after adding the key

**Issue**: "Unable to connect to AI service" error
- **Solution**: Ensure you have an internet connection
- **Solution**: Check that your API key has proper permissions
- **Solution**: Verify your API quota hasn't been exceeded

**Issue**: "Unable to analyze the food" error
- **Solution**: Try taking a clearer photo with better lighting
- **Solution**: Ensure the food is clearly visible in the frame
- **Solution**: Try with a different food item that's more recognizable

### Build Errors

**Issue**: TypeScript or build errors
- **Solution**: Make sure all dependencies are installed: `npm install`
- **Solution**: Check that TypeScript types are correct
- **Solution**: Restart the development server: `npm run dev`
- **Solution**: Clear Next.js cache: `rm -rf .next` then `npm run dev`

**Issue**: Environment variable not found
- **Solution**: Ensure `.env.local` file is in the project root (same level as `package.json`)
- **Solution**: Check that the variable name is exactly `NEXT_PUBLIC_GEMINI_API_KEY`
- **Solution**: Restart the development server after making changes

## Browser Compatibility

The AI food scanning feature requires:
- Modern browser with camera support
- JavaScript enabled
- WebRTC support for camera access
- Canvas API support for image processing

### Tested browsers:
- ✅ Chrome/Chromium 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+

### Mobile browsers:
- ✅ Chrome Mobile
- ✅ Safari Mobile (iOS)
- ✅ Firefox Mobile
- ⚠️ Some older mobile browsers may have limited camera support

## API Usage and Limits

### Free Tier Limits (Google AI Studio):
- 15 requests per minute
- 1,500 requests per day
- Rate limits may apply

### Best Practices:
- Use good lighting for better recognition accuracy
- Frame food clearly in the camera viewfinder
- Avoid blurry or dark images
- Try different angles if first attempt fails

## Development Tips

### Testing API Connection:
- Use the dashboard test component to verify setup
- Check browser console for detailed error messages
- Monitor network tab for API request/response details

### Common Issues:
1. **CORS errors**: Should not occur with localhost, but ensure you're using the correct domain
2. **API key exposure**: Never commit `.env.local` to version control
3. **Rate limiting**: Implement retry logic for production use

### Performance Tips:
- The AI analysis typically takes 2-5 seconds
- Image processing is done client-side for privacy
- Only the processed image data is sent to Google's API

## Security Considerations

### API Key Security:
- ✅ Environment variables are secure for development
- ⚠️ For production, use server-side API calls
- ❌ Never expose API keys in client-side code in production

### Privacy:
- Images are processed locally before sending to AI
- Only base64 image data is sent to Google's servers
- No images are stored permanently by the application
- Google's data usage policies apply to API requests

## Need Help?

If you continue to experience issues:

1. Check the browser console for error messages
2. Verify your API key at [Google AI Studio](https://ai.google.dev)
3. Test with a simple food item like an apple or banana
4. Ensure you have a stable internet connection
5. Try the setup on a different device/browser

For additional support, refer to:
- [Google Gemini API Documentation](https://ai.google.dev/gemini-api/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [WebRTC Camera API Guide](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia) 