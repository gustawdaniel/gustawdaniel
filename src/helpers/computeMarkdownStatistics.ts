export function computeMarkdownStatistics(markdown: string): string {
    const codeBlockPattern = /```(\w*)\n([\s\S]*?)```/g;

    let textCount = 0;
    const codeCounts: { [key: string]: number } = {};

    // Tracks the end of the last code block processed
    let lastIndex = 0;

    // Process each code block
    markdown.replace(codeBlockPattern, (match, language, codeContent, offset) => {
        language = language || "code"; // Default to "code" if no language is specified

        // Add text content between the last code block and the current one
        textCount += markdown.slice(lastIndex, offset).replace(/\s+/g, '').length;

        // Update the last index to the end of the current code block
        lastIndex = offset + match.length;

        // Count code block characters
        codeCounts[language] = (codeCounts[language] || 0) + codeContent.length;

        return ''; // No replacement needed, we're just iterating
    });

    // Add any remaining text after the last code block
    textCount += markdown.slice(lastIndex).replace(/\s+/g, '').length;

    // Calculate total characters
    const totalCharacters = textCount + Object.values(codeCounts).reduce((a, b) => a + b, 0);

    // Calculate percentages
    const results: string[] = [];
    if (totalCharacters > 0) {
        const textPercentage = Math.round((textCount / totalCharacters) * 100);
        results.push(`text: ${textPercentage}%`);

        let currentSum = textPercentage;
        const languages = Object.keys(codeCounts);

        languages.forEach((language, index) => {
            let percentage;
            if (index === languages.length - 1) {
                percentage = 100 - currentSum;
            } else {
                percentage = Math.round((codeCounts[language] / totalCharacters) * 100);
                currentSum += percentage;
            }
            results.push(`${language}: ${percentage}%`);
        });
    }

    return results.join(', ');
}