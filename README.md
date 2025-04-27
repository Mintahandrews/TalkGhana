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
- Tailwind CSS for UI styling
- Hugging Face's Whisper for ASR (Automatic Speech Recognition)
- Web Speech API for TTS (Text-to-Speech)
- Service Workers for offline capability
- IndexedDB for local storage
- Progressive Web App (PWA) features

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/talkghana.git
   cd talkghana
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Create a .env file with your WhatsApp API credentials:

   ```
   WHATSAPP_API_VERSION=v17.0
   WHATSAPP_ACCESS_TOKEN=your_access_token_here
   WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
   WHATSAPP_VERIFY_TOKEN=talkghana-verify-token
   PORT=5000
   ```

4. Start the development server:

   ```
   npm run dev
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
├── contexts/       # React context providers
├── hooks/          # Custom React hooks
├── pages/          # Application pages
├── services/       # API and utility services
├── types/          # TypeScript type definitions
└── utils/          # Helper functions
```

## Documentation

For more detailed information, please refer to:

- [Installation Guide](./README-INSTALLATION.md)
- [ESPnet Integration](./README-ESPNET.md)
- [Ghanaian Language Training](./README-GHANAIAN-TRAINING.md)

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
- All contributors who have helped with Ghanaian language support and cultural context

## Contact

If you have any questions or suggestions, please contact us at support@talkghana.org.

---

Made with ❤️ for the people of Ghana
