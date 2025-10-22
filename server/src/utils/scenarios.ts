

export interface DialogueScenario {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  icon: string;
  context: string;
  startingPrompts: {
    [language: string]: string;
  };
}

export const dialogueScenarios: DialogueScenario[] = [
  {
    id: 'cafe',
    title: 'Café Conversation',
    description: 'Order coffee and chat with locals',
    difficulty: 'Beginner',
    icon: '☕',
    context: 'You are in a cozy local café. The AI will play the role of a friendly barista or local customer.',
    startingPrompts: {
      'es-ES': '¡Hola! Bienvenido a nuestro café. ¿Qué te gustaría tomar hoy?',
      'fr-FR': 'Bonjour ! Bienvenue dans notre café. Que souhaiteriez-vous boire aujourd\'hui ?',
      'en-US': 'Hello! Welcome to our café. What would you like to drink today?',
      'hi-IN': 'नमस्ते! हमारे कैफे में आपका स्वागत है। आज आप क्या पीना चाहेंगे?',
      'ja-JP': 'こんにちは！カフェへようこそ。今日は何を飲みますか？',
      'it-IT': 'Ciao! Benvenuto nel nostro caffè. Cosa vorresti bere oggi?',
      'de-DE': 'Hallo! Willkommen in unserem Café. Was möchten Sie heute trinken?',
      'nl-NL': 'Hallo! Welkom in ons café. Wat wilt u vandaag drinken?',
      'pt-BR': 'Olá! Bem-vindo ao nosso café. O que gostaria de beber hoje?'
    }
  },
  {
    id: 'business',
    title: 'Business Meeting',
    description: 'Professional discussions and presentations',
    difficulty: 'Advanced',
    icon: '💼',
    context: 'You are in a professional business setting. The AI will act as a colleague or business partner.',
    startingPrompts: {
      'es-ES': 'Buenos días. Me alegra verte en la reunión de hoy. ¿Cómo va tu proyecto?',
      'fr-FR': 'Bonjour. Je suis ravi de vous voir à la réunion d\'aujourd\'hui. Comment va votre projet ?',
      'en-US': 'Good morning. I\'m glad to see you at today\'s meeting. How is your project going?',
      'hi-IN': 'सुप्रभात। आज की मीटिंग में आपको देखकर खुशी हुई। आपका प्रोजेक्ट कैसा चल रहा है?',
      'ja-JP': 'おはようございます。今日の会議でお会いできて嬉しいです。プロジェクトはいかがですか？',
      'it-IT': 'Buongiorno. Sono felice di vederti alla riunione di oggi. Come va il tuo progetto?',
      'de-DE': 'Guten Morgen. Ich freue mich, Sie bei der heutigen Besprechung zu sehen. Wie läuft Ihr Projekt?',
      'nl-NL': 'Goedemorgen. Ik ben blij je te zien op de vergadering van vandaag. Hoe gaat je project?',
      'pt-BR': 'Bom dia. Fico feliz em vê-lo na reunião de hoje. Como está seu projeto?'
    }
  },
  {
    id: 'travel',
    title: 'Travel & Tourism',
    description: 'Navigate airports, hotels, and attractions',
    difficulty: 'Intermediate',
    icon: '✈️',
    context: 'You are traveling and need assistance. The AI will play various roles like hotel staff, tour guides, or locals.',
    startingPrompts: {
      'es-ES': '¡Hola! Bienvenido a nuestro hotel. ¿En qué puedo ayudarle hoy?',
      'fr-FR': 'Bonjour ! Bienvenue dans notre hôtel. Comment puis-je vous aider aujourd\'hui ?',
      'en-US': 'Hello! Welcome to our hotel. How can I help you today?',
      'hi-IN': 'नमस्ते! हमारे होटल में आपका स्वागत है। आज मैं आपकी कैसे सहायता कर सकता हूं?',
      'ja-JP': 'こんにちは！ホテルへようこそ。今日はどのようにお手伝いできますか？',
      'it-IT': 'Ciao! Benvenuto nel nostro hotel. Come posso aiutarti oggi?',
      'de-DE': 'Hallo! Willkommen in unserem Hotel. Wie kann ich Ihnen heute helfen?',
      'nl-NL': 'Hallo! Welkom in ons hotel. Hoe kan ik u vandaag helpen?',
      'pt-BR': 'Olá! Bem-vindo ao nosso hotel. Como posso ajudá-lo hoje?'
    }
  },
  {
    id: 'shopping',
    title: 'Shopping Experience',
    description: 'Browse stores and make purchases',
    difficulty: 'Beginner',
    icon: '🛒',
    context: 'You are shopping in a local store. The AI will act as a helpful shop assistant.',
    startingPrompts: {
      'es-ES': '¡Buenas tardes! ¿Está buscando algo en particular hoy?',
      'fr-FR': 'Bonsoir ! Cherchez-vous quelque chose en particulier aujourd\'hui ?',
      'en-US': 'Good afternoon! Are you looking for something specific today?',
      'hi-IN': 'नमस्ते! क्या आप आज कुछ खास ढूंढ रहे हैं?',
      'ja-JP': 'こんにちは！今日は何か特別なものをお探しですか？',
      'it-IT': 'Buon pomeriggio! Stai cercando qualcosa di particolare oggi?',
      'de-DE': 'Guten Tag! Suchen Sie heute etwas Bestimmtes?',
      'nl-NL': 'Goedemiddag! Zoekt u vandaag iets specifieks?',
      'pt-BR': 'Boa tarde! Está procurando algo específico hoje?'
    }
  },
  {
    id: 'social',
    title: 'Social Gathering',
    description: 'Meet new people and make friends',
    difficulty: 'Intermediate',
    icon: '❤️',
    context: 'You are at a social event or party. The AI will act as a friendly person you just met.',
    startingPrompts: {
      'es-ES': '¡Hola! No creo que nos hayamos conocido antes. Soy Ana, ¿y tú?',
      'fr-FR': 'Salut ! Je ne pense pas qu\'on se soit rencontrés avant. Je suis Marie, et vous ?',
      'en-US': 'Hi! I don\'t think we\'ve met before. I\'m Paul, and you?',
      'hi-IN': 'हैलो! मुझे नहीं लगता कि हम पहले मिले हैं। मैं प्रिया हूं, और आप?',
      'ja-JP': 'こんにちは！以前にお会いしたことはないと思います。私は花子です。あなたは？',
      'it-IT': 'Ciao! Non credo che ci siamo mai incontrati prima. Sono Giulia, e tu?',
      'de-DE': 'Hallo! Ich glaube, wir sind uns noch nicht begegnet. Ich bin Anna, und Sie?',
      'nl-NL': 'Hoi! Ik denk niet dat we elkaar eerder hebben ontmoet. Ik ben Emma, en jij?',
      'pt-BR': 'Oi! Acho que não nos conhecemos antes. Eu sou Maria, e você?'
    }
  }
];

export const getScenarioById = (id: string): DialogueScenario | undefined => {
  return dialogueScenarios.find(scenario => scenario.id === id);
};

export const getStartingPrompt = (scenarioId: string, language: string): string => {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) {
    return 'Hello! How are you today?'; 
  }
  
  return scenario.startingPrompts[language] || scenario.startingPrompts['en-US'] || 'Hello! How are you today?';
};
