export const eweConfig = {
  code: "ee-GH", // ISO language code for Ewe
  name: "Ewe",
  nativeName: "Eʋegbe",
  speechRecognition: {
    code: "ee-GH",
    fallback: "en-GH",
  },
  textToSpeech: {
    code: "ee-GH",
    fallback: "en-GH",
    voicePreferences: ["Edem", "Efua"], // Example Ewe voice names
  },
  commands: {
    help: "Kpe ɖe ŋunye",
    yes: "Ɛ",
    no: "Ao",
    emergency: "Dzodzo Xaxa",
    thankyou: "Akpe",
    water: "Medi tsi",
    food: "Medi nuɖuɖu",
    bathroom: "Medi toilet",
    pain: "Mele veve sem",
    medicine: "Medi atike",
    cold: "Vuvɔ le fu ɖem",
    hot: "Dzodzo le fu ɖem",
  },
  conversations: {
    greeting: "Woezor",
    howAreYou: "Aleke nèle?",
    imFine: "Mele nyuie",
    goodbye: "Heyi nyuie",
    understand: "Mese egɔme",
    dontUnderstand: "Nyemese egɔme o",
    speakSlowly: "Ƒo nu blewu",
    repeat: "Meɖe kuku, gblɔe ake",
  },
};
