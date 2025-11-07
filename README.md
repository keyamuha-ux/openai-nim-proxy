# AI Chatbot Interface

A web-based AI chatbot interface that allows users to create custom bots with profile pictures and chat with them using the Mistral AI API.

## Features

- 🤖 Create multiple custom AI bots
- 🖼️ Add profile pictures for bots
- 💬 Real-time chat interface
- 🧠 Powered by Mistral AI (mistral-small-3.2-24b-instruct)
- 💾 Local storage for bots and chat history
- 🎨 Responsive and modern UI

## Setup Instructions

1. **Download all files** into a single folder:
   - `start.bat`
   - `index.html`
   - `styles.css`
   - `script.js`
   - `README.md`

2. **Run the application**:
   - Double-click `start.bat` to start the local server
   - The application will open in your browser at `http://localhost:8000`

3. **Start chatting**:
   - Create your first bot using the "New Bot" button
   - Add a name, description, personality, and profile picture
   - Select the bot from the sidebar to start chatting

## File Structure

- `start.bat` - Windows batch file to launch the local server
- `index.html` - Main HTML structure
- `styles.css` - All styling and responsive design
- `script.js` - JavaScript functionality and API integration
- `README.md` - This documentation file

## API Integration

The app uses the Mistral AI API with the following configuration:
- Endpoint: `https://api.llm7.io/v1/chat/completions`
- Model: `mistral-small-3.2-24b-instruct`
- API Key: Included in the code

## Browser Compatibility

Works on all modern browsers:
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Data Storage

All data is stored locally in your browser:
- Bots information
- Chat history
- Profile pictures (as base64 data URLs)

## Customization

You can customize:
- Bot personalities via the creation form
- UI colors by modifying CSS variables
- API settings in the `API_CONFIG` object in `script.js`
