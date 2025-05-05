# TalkGhana

TalkGhana is an assistive communication application for speech-impaired individuals using Ghanaian languages. The app utilizes modern web technologies to provide a robust, accessible, and user-friendly platform for communication.

## The Hackathon

TalkGhana was developed by DevForChange (DFC) as part of the Tɛkyerɛma Pa (good tongue) Hackathon. This competition is part of the Centre for Digital Language Inclusion, delivered by the University of Ghana and the Global Disability Innovation Hub, funded by UK aid's AT2030 programme, with support from google.org.

The hackathon challenged teams to design and develop innovative applications using automatic speech recognition (ASR) or text-to-speech (TTS) technologies to facilitate communication in Ghanaian languages for individuals with speech impairment. Participants were provided with training, mentoring, Ghanaian language datasets, and time to develop impactful AI-driven solutions.

## Features

- **Speech Recognition**: Convert speech to text using browser's Web Speech API with Whisper ASR fallback
- **Text-to-Speech**: Convert text to speech in multiple Ghanaian languages
- **Common Phrases**: Quick access to pre-defined common phrases in different categories
- **Language Support**: Support for Twi, Ga, Ewe, Dagbani, Hausa, and English
- **Offline Support**: Use core features even when offline
- **Accessibility**: Designed with accessibility as a priority
- **Custom Web Components**: Localized text elements that work outside React

## WhatsApp Integration

TalkGhana now features WhatsApp integration to allow users to send voice messages via WhatsApp, even in areas with poor network connectivity.

### Features

- **Offline Support**: Messages are queued when offline and sent automatically when connectivity returns
- **Voice Message Support**: Record and send voice messages directly through the app
- **Robust Error Handling**: Automatically retries failed messages with exponential backoff
- **Low Bandwidth Optimization**: Optimized for Ghana's network conditions

## Supported Languages

- Twi (Akan)
- Ga
- Ewe
- Dagbani
- Hausa
- English

Each language includes:

- Native speech recognition
- Text-to-speech synthesis
- Language-specific phonetic processing
- Common phrases and expressions

## Technologies Used

- React.js with TypeScript
- Vite for fast builds and development
- Tailwind CSS for UI styling
- Hugging Face's Whisper for ASR (Automatic Speech Recognition)
- Web Speech API for TTS (Text-to-Speech)
- Service Workers for offline capability
- IndexedDB for local storage
- Progressive Web App (PWA) features
- i18next for internationalization

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/Mintahandrews/TalkGhana.git
   cd TalkGhana
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Start the development server:

   ```
   npm run dev
   ```

4. For production build:

   ```
   npm run build
   ```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
NODE_ENV=development
VITE_API_URL=http://localhost:3000
# Hugging Face API
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key_here
# WhatsApp Integration (Optional)
VITE_WHATSAPP_ENABLED=false
VITE_WHATSAPP_NUMBER=
```

### Testing WhatsApp Connection

Before using the WhatsApp integration, test your connection:

```bash
npm run test:whatsapp
```

### Getting WhatsApp API Credentials

1. Create a Meta Developer Account at [developers.facebook.com](https://developers.facebook.com)
2. Create a new app and add the WhatsApp product
3. Complete business verification
4. Set up a WhatsApp Business Account
5. Get the Phone Number ID and Access Token from the API Setup section

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── ui/         # Base UI components
│   ├── web/        # Web components for use outside React
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── i18n/           # Internationalization
│   ├── locales/    # Translation files
├── pages/          # Application pages
├── services/       # API and utility services
├── types/          # TypeScript type definitions
└── utils/          # Helper functions
```

## Deployment

TalkGhana can be deployed to Vercel with the following settings:

1. Connect your GitHub repository
2. Set the build command to `npm run build`
3. Set the output directory to `dist`
4. Add any environment variables needed

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Hugging Face](https://huggingface.co/) for Whisper ASR integration
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API) for speech recognition and synthesis
- [Tailwind CSS](https://tailwindcss.com/) for UI components
- [i18next](https://www.i18next.com/) for internationalization
- All contributors who have helped with Ghanaian language support and cultural context

## Contact

If you have any questions or suggestions, please contact us at support@talkghana.org.
Or reach out to us on [Dennis Asiedu](asiedudennis30@gmail.com) and [Andrews Mintah](mintahandrews1965@gmail.com)

---

Made with ❤️ for the people of Ghana
