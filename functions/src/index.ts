import * as functions from 'firebase-functions';

export const chatWithBot = functions.https.onCall(async (data, context) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || functions.config().gemini?.api_key;

    if (!apiKey) {
      console.error("Missing API Key. Set GEMINI_API_KEY in .env or via functions:config:set for firebase functions, ta!");
      throw new functions.https.HttpsError('internal', 'Chat configuration error! Rip, try adding the .env file with GEMINI_API_KEY, thx :D.');
    }

    console.log('Calling Gemini API with message:', data.message);
    const { GoogleGenerativeAI } = await import('@google/generative-ai'); 
    const genAI = new GoogleGenerativeAI(apiKey);
    const userMessage = data.message;
    const userContext = data.context || {};

    const systemPrompt = `
    You are the AI assistant for "Better Bible Guesser", a web game where users guess bible verses.
 
    User Context:
    - Current Page: ${userContext.currentPage}
    - Display Name: ${userContext.displayName || 'Guest'}
    - Stats: ${JSON.stringify(userContext.stats || 'No stats available')}

    Game Knowledge:
    - Normal Mode: Guess the book, chapter, and verse. The default 5 round game mode.
    - Custom Mode: User defines settings (time limit, number of rounds, which books and context size to use) and can share with friends after they have played it.
    - Create Mode: User can create a custom game with their own settings (pick specific verse, time limits, number of rounds, context size) and copy a link for friends to play (either a short 6 character code that expires in 30 minutes, or a longer permanent url).
    - Multiplayer: Play with friends using a code, or create their own game lobby, with a short 6 character/digit code to share easily with friends and others. Users can also view a live leaderboard page for a mulitplayer game by copying the spetator link on the lobby screen.
    - Profile: Users can customize their name color, effect and even a custom name backboard.
    - Quest Mode: Users can play through a set of "Quests" or different mini-game modes within Quest Mode, such as "Race Track", "Academy" and "Castle of Champions" where they can gain a currency called "Scrolls" by completing tasks, which they can spend in the "Marketplace". (These locations are icons on the quest map)
    Your goal is to be helpful, friendly, and concise. Keep answers under 3 sentences if possible.
    You can only answer questions about the game and how to play. Do not provide any information about the Bible verses themselves, as that would ruin the game. If the user asks for help, provide general tips on how to guess verses without giving specific hints.
  `;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(systemPrompt + "\n\nUser Question: " + userMessage);
    const response = result.response;
    console.log('Gemini response received successfully');
    return { text: response.text() };
  } catch (error: any) {
    console.error("Gemini Error details:", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      toString: error?.toString()
    });
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    throw new functions.https.HttpsError('internal', `Failed to generate response: ${error.message || error}`);
  }
});
