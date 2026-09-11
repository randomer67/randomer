export const translateText = async (text: string, targetLang: string): Promise<string> => {
  if (!text.trim() || targetLang === 'en') return text;
  try {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${targetLang}`);
    const data = await response.json();
    return data.responseData.translatedText;
  } catch (error) {
    console.error('Translation failed:', error);
    return `[Translation Failed] ${text}`;
  }
};
