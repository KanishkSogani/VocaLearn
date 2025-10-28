import { WebSocket } from "ws";
import { generateResponse } from "../services/llm";
import { ClientSession, QuestionType, QuizQuestion } from "./types";

// Validate English grammar questions for common LLM mistakes
const validateEnglishGrammar = (parsedQuestion: any): any | null => {
  const questionText = parsedQuestion.question.toLowerCase();
  const correctAnswer = parsedQuestion.correctAnswer;
  
  // Rule 1: "every day/always/usually/often" → Simple Present, NOT Present Continuous
  if (questionText.includes("every day") || questionText.includes("always") || 
      questionText.includes("usually") || questionText.includes("often")) {
    
    // Check if LLM wrongly picked present continuous
    if (correctAnswer.includes("am ") || correctAnswer.includes("is ") || 
        correctAnswer.includes("are ") || correctAnswer.includes("'m ") ||
        correctAnswer.includes("'re ") || correctAnswer.includes("'s ")) {
      
      // Find the simple present form in options
      const simplePresent = parsedQuestion.options.find((opt: string) => {
        const lower = opt.toLowerCase();
        return !lower.includes("am ") && !lower.includes("is ") && 
               !lower.includes("are ") && !lower.includes("'m ") &&
               !lower.includes("'re ") && !lower.includes("'s ") &&
               !lower.includes("will") && !lower.includes("have ") &&
               !lower.includes("had ") && !lower.includes("been") &&
               lower.length > 1; // Not empty
      });
      
      if (simplePresent) {
        console.log(`⚠️ Grammar fix: Changing from "${correctAnswer}" to "${simplePresent}" for habitual action`);
        return {
          ...parsedQuestion,
          correctAnswer: simplePresent
        };
      }
    }
  }
  
  // Rule 2: "now/right now/at the moment" → Present Continuous, NOT Simple Present
  if (questionText.includes("now") || questionText.includes("right now") || 
      questionText.includes("at the moment") || questionText.includes("currently")) {
    
    // Check if answer is present continuous
    const isPresentContinuous = correctAnswer.includes("am ") || 
                                correctAnswer.includes("is ") || 
                                correctAnswer.includes("are ");
    
    if (!isPresentContinuous) {
      const presentContinuous = parsedQuestion.options.find((opt: string) => 
        opt.includes("am ") || opt.includes("is ") || opt.includes("are ")
      );
      
      if (presentContinuous) {
        console.log(`⚠️ Grammar fix: Changing from "${correctAnswer}" to "${presentContinuous}" for continuous action`);
        return {
          ...parsedQuestion,
          correctAnswer: presentContinuous
        };
      }
    }
  }
  
  return null; // No fix needed
};

// Question generation logic for multiple-choice questions
export const generateAndSendQuizQuestion = async (
  ws: WebSocket,
  sessions: Map<WebSocket, ClientSession>
) => {
  const session = sessions.get(ws);
  if (!session || !session.quiz) return;

  // Reset retry count for new question
  session.retryCount = 0;

  try {
    console.log(` Generating quiz question ${session.quiz.currentQuestion + 1}/${session.quiz.totalQuestions}`);
    
    // Randomly select question type
    const questionTypes: QuestionType[] = [
      "grammar_pattern",
      "synonym_antonym",
      "definition_matching",
      "pronunciation_minimal_pair"
    ];
    
    const selectedType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
    
    // Generate question based on type
    const question = await generateQuestionByType(
      selectedType,
      session.learningLanguage,
      session.nativeLanguage,
      session.quiz.topic,
      session.quiz.questionHistory
    );
    
    // Add question to history to avoid repeats
    session.quiz.questionHistory.push(question.question);

    // Store question in session
    session.quiz.questions.push(question);

    // Send question to client (NO AUDIO)
    console.log(" Sending question to client:", question.question);
    ws.send(JSON.stringify({
      type: "quiz_question",
      question: question.question,
      questionType: question.type,
      options: question.options,
      questionNumber: session.quiz.currentQuestion + 1,
      totalQuestions: session.quiz.totalQuestions,
    }));

    session.quiz.isWaitingForAnswer = true;
    
    // Clear last transcription when starting a new question
    session.lastTranscription = undefined;
    session.lastTranscriptionTime = undefined;
    
  } catch (error) {
    console.error("Error generating quiz question:", error);
    ws.send(JSON.stringify({ error: "Failed to generate quiz question" }));
  }
};

// Generate question based on type
const generateQuestionByType = async (
  type: QuestionType,
  learningLanguage: string,
  nativeLanguage: string,
  topic: string,
  questionHistory: string[]
): Promise<QuizQuestion> => {
  const previousQuestions = questionHistory.length > 0 ? 
    `\n\nPrevious questions asked (DO NOT repeat these):\n${questionHistory.join('\n')}` : '';
  
  let prompt = "";
  
  switch (type) {
    case "grammar_pattern":
      prompt = `You are creating a language learning quiz question.

LEARNER INFO:
- Learning: ${learningLanguage} ← THIS IS THE LANGUAGE THE STUDENT IS TRYING TO LEARN!
- Native language: ${nativeLanguage}
- Topic: ${topic}

🚨 CRITICAL: Test ${learningLanguage} grammar (NOT ${nativeLanguage})! The student is learning ${learningLanguage}!

⚠️ GRAMMAR ACCURACY: YOU MUST PROVIDE THE GRAMMATICALLY CORRECT ANSWER! Double-check your answer before responding.

STRICT REQUIREMENTS:
1. Write the ENTIRE QUESTION in ${nativeLanguage} ONLY
2. Create a sentence with a blank in ${learningLanguage} (the language they're LEARNING!)
3. Test an important ${learningLanguage} grammar pattern or structure
4. All 4 options must be ${learningLanguage} words/phrases that are:
   - Grammatically related (same tense family, same verb form category, etc.)
   - Commonly confused by learners
   - Similar enough to require real understanding
5. **VERIFY YOUR CORRECT ANSWER** - It MUST be grammatically perfect in context
6. Include clear time markers or context clues that indicate which tense/form to use
7. Focus on practical, commonly used patterns

KEY GRAMMAR RULES TO FOLLOW (for English):
- "every day/always/usually" → Simple Present (I go, he goes)
- "now/right now/at the moment" → Present Continuous (I am going)
- "already/just/yet" → Present Perfect (I have gone)
- "yesterday/last week/ago" → Simple Past (I went)
- "will/tomorrow/next" → Simple Future (I will go)
- "by the time/by then" → Future Perfect (I will have gone)
- "if I were you" → Subjunctive (were, not was)
- "wish/if only" → Past Subjunctive

FORMAT (JSON only, no markdown):
{
  "question": "${nativeLanguage} instruction + ${learningLanguage} sentence with blank ___",
  "options": ["${learningLanguage} form 1", "${learningLanguage} form 2", "${learningLanguage} form 3", "${learningLanguage} form 4"],
  "correctAnswer": "exact ${learningLanguage} form"
}

EXAMPLE (Learning Spanish, Native English):
{
  "question": "Complete the sentence: 'Si yo ___ más dinero, compraría una casa' (If I had more money, I would buy a house). Which form is correct for a hypothetical situation?",
  "options": ["tengo", "tuve", "tuviera", "tendría"],
  "correctAnswer": "tuviera"
}

EXAMPLE (Learning English, Native Hindi):
{
  "question": "पूरा करें: 'By the time you arrive, I ___ dinner' (जब तक आप पहुंचेंगे, मैं रात का खाना खत्म कर चुका हूंगा)। भविष्य में पूर्ण किए गए कार्य के लिए कौन सा रूप सही है?",
  "options": ["finish", "will finish", "will have finished", "am finishing"],
  "correctAnswer": "will have finished"
}

EXAMPLE (Learning English, Native Hindi):
{
  "question": "वाक्य पूरा करें: 'She ___ to school every day by bus' (वह हर दिन बस से स्कूल जाती है)। नियमित आदत के लिए कौन सा सही है?",
  "options": ["go", "goes", "is going", "went"],
  "correctAnswer": "goes"
}

ANOTHER EXAMPLE (Learning English, Native Hindi):
{
  "question": "वाक्य पूरा करें: 'If I ___ you, I would apologize immediately' (अगर मैं तुम्हारी जगह होता, तो मैं तुरंत माफी मांग लेता)। काल्पनिक स्थिति के लिए कौन सा सही है?",
  "options": ["am", "was", "were", "will be"],
  "correctAnswer": "were"
}${previousQuestions}`;
      break;
      
    case "synonym_antonym":
      prompt = `You are creating a language learning quiz question.

LEARNER INFO:
- Learning: ${learningLanguage} ← THIS IS THE LANGUAGE THE STUDENT IS TRYING TO LEARN!
- Native language: ${nativeLanguage}
- Topic: ${topic}

🚨 CRITICAL: Test ${learningLanguage} vocabulary (NOT ${nativeLanguage})! The student is learning ${learningLanguage}!

STRICT REQUIREMENTS:
1. Write the ENTIRE QUESTION in ${nativeLanguage} ONLY
2. Choose a meaningful ${learningLanguage} word (the language they're LEARNING!)
3. Show the ${learningLanguage} word with its basic ${nativeLanguage} translation
4. All 4 options must be ${learningLanguage} words that are:
   - Related in meaning (synonyms/antonyms/related concepts)
   - Similar enough to be confusing
   - At intermediate level
   - Commonly used in real contexts
5. Test nuanced understanding of meaning differences
6. Make it challenging by using words from the same semantic field

FORMAT (JSON only, no markdown):
{
  "question": "${nativeLanguage} question about ${learningLanguage} word 'XXXXX' (${nativeLanguage} translation)",
  "options": ["${learningLanguage} word 1", "${learningLanguage} word 2", "${learningLanguage} word 3", "${learningLanguage} word 4"],
  "correctAnswer": "exact ${learningLanguage} word"
}

EXAMPLE (Learning Spanish, Native English):
{
  "question": "What is the best synonym for 'enojado' (angry) when describing someone who is intensely furious?",
  "options": ["molesto", "furioso", "irritado", "disgustado"],
  "correctAnswer": "furioso"
}

EXAMPLE (Learning English, Native Hindi):
{
  "question": "'intelligent' (बुद्धिमान) का सबसे करीबी समानार्थी शब्द कौन सा है जब आप किसी की असाधारण तेज़ सोच और उत्कृष्ट समझ को दर्शाना चाहते हैं?",
  "options": ["smart", "clever", "brilliant", "wise"],
  "correctAnswer": "brilliant"
}

ANOTHER EXAMPLE (Learning English, Native Hindi):
{
  "question": "'happy' (खुश) का विलोम शब्द कौन सा है जो गहरी उदासी और निराशा को दर्शाता है?",
  "options": ["sad", "depressed", "angry", "worried"],
  "correctAnswer": "depressed"
}${previousQuestions}`;
      break;
      
    case "definition_matching":
      prompt = `You are creating a language learning quiz question.

LEARNER INFO:
- Learning: ${learningLanguage} ← THIS IS THE LANGUAGE THE STUDENT IS TRYING TO LEARN!
- Native language: ${nativeLanguage}
- Topic: ${topic}

🚨 CRITICAL: Test a ${learningLanguage} word (NOT ${nativeLanguage})! The student is learning ${learningLanguage}!

STRICT REQUIREMENTS:
1. Write the ENTIRE QUESTION in ${nativeLanguage} ONLY
2. Choose a useful ${learningLanguage} word (the language they're LEARNING!)
3. Ask what the ${learningLanguage} word means
4. Show the ${learningLanguage} word CLEARLY in the question
5. All 4 options must be DETAILED DEFINITIONS in ${nativeLanguage}
6. Make definitions nuanced, detailed, and challenging - test deep understanding
7. Options should be plausible alternatives that make students think

TEMPLATE:
"${nativeLanguage} question asking: What does the ${learningLanguage} word '[WORD]' mean?"

FORMAT (JSON only, no markdown):
{
  "question": "${nativeLanguage} text asking about ${learningLanguage} word 'XXXXX'",
  "options": ["${nativeLanguage} detailed definition 1", "${nativeLanguage} detailed definition 2", "${nativeLanguage} detailed definition 3", "${nativeLanguage} detailed definition 4"],
  "correctAnswer": "exact text of correct definition"
}

EXAMPLE (Learning Spanish, Native English):
{
  "question": "What does the Spanish word 'biblioteca' mean?",
  "options": ["A store where you can purchase new and used books", "A public or private institution where books and media are lent to readers", "A reading room in a university or school where students study quietly", "An archive where historical documents and manuscripts are preserved"],
  "correctAnswer": "A public or private institution where books and media are lent to readers"
}

EXAMPLE (Learning English, Native Hindi):
{
  "question": "अंग्रेजी शब्द 'gregarious' का सही अर्थ क्या है?",
  "options": ["जो लोग अकेले रहना पसंद करते हैं और सामाजिक गतिविधियों से बचते हैं", "जो सामाजिक हैं और समूह में रहना पसंद करते हैं, दूसरों की संगति में खुश रहते हैं", "जो बहुत बातूनी हैं और लगातार शोर मचाते हैं", "जो उदार हैं और दूसरों की मदद करना पसंद करते हैं"],
  "correctAnswer": "जो सामाजिक हैं और समूह में रहना पसंद करते हैं, दूसरों की संगति में खुश रहते हैं"
}

ANOTHER EXAMPLE (Learning English, Native Hindi):
{
  "question": "अंग्रेजी में 'meticulous' शब्द का क्या मतलब है?",
  "options": ["जो बहुत तेज़ और कुशल तरीके से काम करता है", "जो हर छोटे विवरण पर ध्यान देता है और पूर्णतावादी है", "जो रचनात्मक और कल्पनाशील सोच रखता है", "जो अनुशासित है और समय की पाबंदी करता है"],
  "correctAnswer": "जो हर छोटे विवरण पर ध्यान देता है और पूर्णतावादी है"
}${previousQuestions}`;
      break;
      
    case "pronunciation_minimal_pair":
      prompt = `You are creating a language learning quiz question.

LEARNER INFO:
- Learning: ${learningLanguage} ← THIS IS THE LANGUAGE THE STUDENT IS TRYING TO LEARN!
- Native language: ${nativeLanguage}
- Topic: ${topic}

🚨 CRITICAL: Test ${learningLanguage} words (NOT ${nativeLanguage})! The student is learning ${learningLanguage}!

STRICT REQUIREMENTS:
1. Write the ENTIRE QUESTION in ${nativeLanguage} ONLY
2. Present a clear, detailed context or meaning in ${nativeLanguage}
3. All 4 options must be ${learningLanguage} words (the language they're LEARNING!) that are:
   - Similar in sound, spelling, or commonly confused
   - Different in meaning
   - All plausible in the context
4. Make the context specific enough that only ONE answer fits
5. Test practical vocabulary that learners encounter often
6. Focus on words that cause real confusion for learners

FORMAT (JSON only, no markdown):
{
  "question": "${nativeLanguage} context describing when/where/how the word is used",
  "options": ["${learningLanguage} word 1", "${learningLanguage} word 2", "${learningLanguage} word 3", "${learningLanguage} word 4"],
  "correctAnswer": "exact ${learningLanguage} word"
}

EXAMPLE (Learning Spanish, Native English):
{
  "question": "Which word means 'I was' when talking about a temporary state or location in the past (not a permanent characteristic)?",
  "options": ["era", "estaba", "fue", "está"],
  "correctAnswer": "estaba"
}

EXAMPLE (Learning English, Native Hindi):
{
  "question": "किस शब्द का मतलब है 'किसी चीज़ को प्रभावित करना/असर डालना' (नहीं कि 'परिणाम/नतीजा')?",
  "options": ["affect", "effect", "infect", "reflect"],
  "correctAnswer": "affect"
}

ANOTHER EXAMPLE (Learning English, Native Hindi):
{
  "question": "जब आप किसी को सलाह देना चाहते हैं (नहीं कि किसी चीज़ के बारे में सूचना देना), तो आप कौन सा शब्द उपयोग करेंगे?",
  "options": ["advice", "advise", "device", "devise"],
  "correctAnswer": "advise"
}${previousQuestions}`;
      break;
  }
  
  const questionResponse = await generateResponse(
    prompt,
    learningLanguage,
    nativeLanguage,
    "quiz"
  );

  // Parse LLM response
  let parsedQuestion;
  try {
    // Try to extract JSON from the response
    const jsonMatch = questionResponse.correction.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedQuestion = JSON.parse(jsonMatch[0]);
    } else {
      parsedQuestion = JSON.parse(questionResponse.correction);
    }
    
    console.log(" Parsed question JSON successfully:", parsedQuestion);
    
    // Validate grammar questions for common mistakes
    if (type === "grammar_pattern" && learningLanguage === "en-US") {
      const validated = validateEnglishGrammar(parsedQuestion);
      if (validated) {
        parsedQuestion = validated;
        console.log(" ✓ Grammar validation applied");
      }
    }
    
  } catch (parseError) {
    console.error("⚠️ Could not parse question JSON:", parseError);
    console.log("Raw response:", questionResponse.correction);
    
    // Fallback question
    parsedQuestion = {
      question: "Sample question",
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctAnswer: "Option 1"
    };
  }

  return {
    question: parsedQuestion.question,
    type: type,
    options: parsedQuestion.options || [],
    correctAnswer: parsedQuestion.correctAnswer,
  };
};
