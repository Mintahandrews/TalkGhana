export const twiConfig = {
  code: "tw-GH", // ISO language code for Twi
  name: "Twi",
  nativeName: "Twi",
  speechRecognition: {
    code: "tw-GH",
    fallback: "en-GH",
  },
  textToSpeech: {
    code: "tw-GH",
    fallback: "en-GH",
    voicePreferences: ["Akua", "Kwame"], // Example Twi voice names
  },
  commands: {
    help: "Boa me",
    yes: "Aane",
    no: "Daabi",
    emergency: "Ɔhaw",
    thankyou: "Medaase",
    water: "Me pɛ nsuo",
    food: "Me pɛ aduane",
    bathroom: "Me pɛ toilet",
    pain: "Me wɔ yaw",
    medicine: "Me pɛ medicine",
    cold: "Awɔw de me",
    hot: "Ahuhuro de me",
  },
  conversations: {
    greeting: "Akwaaba",
    howAreYou: "Wo ho te sɛn?",
    imFine: "Me ho ye",
    goodbye: "Yɛ be hyia bio",
    understand: "Me te aseɛ",
    dontUnderstand: "Me nte aseɛ",
    speakSlowly: "Kasa brɛoo",
    repeat: "Mesrɛ wo, san ka bio",
  },
};
