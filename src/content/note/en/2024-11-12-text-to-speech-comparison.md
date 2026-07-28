---
title: Text to speech comparison
publishDate: 2024-11-12
---

I am going to generate all numbers from -1000 to 1000 in languages

```
{ text: 'Polish', value: 'pl' },
{ text: 'English', value: 'en' },
{ text: 'German', value: 'de' },
{ text: 'French', value: 'fr' },
{ text: 'Italian', value: 'it' },
{ text: 'Spanish', value: 'es' },
{ text: 'Russian', value: 'ru' },
{ text: 'Japanese', value: 'ja' },
{ text: 'Chinese', value: 'zh' },
{ text: 'Norwegian', value: 'nb' },
{ text: 'Arabic', value: 'ar' },
{ text: 'Dutch', value: 'nl' },
```

and build server that will generate audio file for given text phrase.

Aware of existence `tts` in web browsers I can't relay on them because sometimes 

```js
speechSynthesis.getVoices()
```

gives empty array, and it depends on form browser, operating system and software installed by user.

I will use `gtts` and check if i can relay on it.

```bash
pip install gTTS
```

