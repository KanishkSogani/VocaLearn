import { generateResponse } from "../src/services/llm";

jest.setTimeout(20000);

describe('LLM Groq response', ()=> {
    it('should return correction and explaination for spanish sentence', async ()=> {
        const result = await generateResponse(
            'como, estas tu?',
            'Spanish',
            'English',
            'echo'
        );

        expect(result).toHaveProperty('correction');
        expect(result).toHaveProperty('explanation');
        expect(result.correction).toMatch(/cómo estás/i);
    });
});