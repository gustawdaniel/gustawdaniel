export function readingTime(text: string): string {
    const averageWPM = 265;

    const adjustedText = text.replace(/(.)\1+/g, '$1');

    const adjustedSentences = adjustedText.replace(/([.!?])\s*\1+/g, '$1');

    const adjustedCharCount = adjustedSentences.length;

    const adjustedWords = adjustedSentences.trim().split(/\s+/);

    const adjustedWordCount = adjustedWords.length;
    const averageWordLength = adjustedCharCount / adjustedWordCount;

    const adjustedTime = (adjustedWordCount / averageWPM) * (averageWordLength / 5);

    const formattedAdjustedTime = adjustedTime > 1 ? Math.round(adjustedTime) + " min" : "Less than 1 min";

    return formattedAdjustedTime;
}