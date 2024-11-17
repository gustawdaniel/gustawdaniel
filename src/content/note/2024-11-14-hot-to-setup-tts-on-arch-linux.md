---
title: How to setup TTS on Arch Linux
publishDate: 2024-11-14
---

By default, Arch Linux doesn't come with a Text-to-Speech (TTS) engine. Furthermore, there is no speech dispatcher, so in browsers you will see empty list of voices:

```javascript
speechSynthesis.getVoices() // []
```

The most known TTS engine is `espeak-ng`. But it also quite old and sound like a robot. 

You can try `flite`, `festival` or `piper`, and the last one is the best choice.

| Feature            | **eSpeak**               | **Flite**              | **Festival**              | **Piper**                |
|--------------------|--------------------------|-------------------------|---------------------------|---------------------------|
| **Voice Quality**  | Robotic, synthetic       | Basic, robotic         | Moderate, semi-natural    | Natural, near-human       |
| **Languages**      | Over 50                  | Primarily English      | Limited but extendable    | Growing, high-quality     |
| **Resource Usage** | Very low                 | Extremely low          | Moderate                  | Higher, needs decent hardware |
| **Customization**  | Moderate (pitch, speed)  | Limited                | High                      | Limited, neural training needed |
| **Best For**       | Accessibility, low-resource devices | IoT, small embedded devices | Research, customizable apps | Quality-critical apps, voice assistants |

Summary:

- For low-resource environments, eSpeak or Flite are ideal.
- For flexibility and experimentation, Festival offers a good balance.
- For high-quality, near-natural TTS, Piper is the best option, assuming resource availability isn't a constraint.

I assume that you need high sound quality and you have enough resources, so I will show you how to set up `piper`.

Let's start from `speech-dispatcher` that is middleware between TTS engine and applications. It allows to connect browser to tts engine.

```bash
yay -S speech-dispatcher
```

Now we install piper engine

```bash
yay -S piper-tts-bin
```

and languages

```bash
yay -S piper-voices-en-us
```

To create configuration in interactive mode run

```bash
spd-conf
```

Now you can use `spd-say` command to test the setup

```bash
spd-say "Arch Linux is the best"
```

## Other languages

Sometimes you need to tell something in other language. Piper offer many voices that you can test on [official website](https://piper.ttstool.com/), or on [samples website](https://rhasspy.github.io/piper-samples/).

Unfortunately in [aur](https://aur.archlinux.org/packages?O=0&SeB=nd&K=piper-voices&outdated=&SB=p&SO=d&PP=50&submit=Go) you will see only 6 packages:

- piper-voices-common
- piper-voices-en-us
- piper-voices-minimal
- piper-voices-it-it
- piper-voices-hu-hu
- piper-voices-en-gb

I couldn't find any script for this but figured out that if you will go to `/usr/share/piper-voices` you will see:

```text
├── en
│   └── en_US
│       ├── amy
│       │   ├── low
│       │   │   ├── ALIASES
│       │   │   ├── MODEL_CARD
│       │   │   ├── en_US-amy-low.onnx
│       │   │   └── en_US-amy-low.onnx.json
│       │   └── medium
│       │       ├── MODEL_CARD
│       │       ├── en_US-amy-medium.onnx
│       │       └── en_US-amy-medium.onnx.json
```

that is quite similar structure to [document](https://github.com/rhasspy/piper/blob/master/VOICES.md)

so I installed Polish language copying logic from aur packages PKGBUILD and published as:

https://aur.archlinux.org/packages/piper-voices-pl-pl

Now we can test:

```bash
echo "Cześć, to jest test języka polskiego." | piper-tts --model /usr/share/piper-voices/pl/pl_PL/darkman/medium/pl_PL-darkman-medium.onnx --output_file welcome.wav
```

and

```bash
mpv welcome.wav
```

It works perfectly.

Then I edited `/etc/speech-dispatcher/speechd.conf` and added

```bash
sudo nano /etc/speech-dispatcher/modules/piper-generic.conf
```

and added

```text
AddVoice "pl" "MALE1"    "pl/pl_PL/darkman/medium/pl_PL-darkman-medium"
```

now 

```bash
spd-say -L
```

display 2 languages but 

```bash
spd-say -l pl "Powściągliwość"
```

sound like `Powcilgliwo` (skips `ś, ą, ść`) while

```bash
echo "Powściągliwość" | piper-tts --model /usr/share/piper-voices/pl/pl_PL/darkman/medium/pl_PL-darkman-medium.onnx --output_file /tmp/welcome.wav && aplay /tmp/welcome.wav 
```

is correct. It means that we're loosing polish characters when dispatcher passing sentence to tts engine.

To fix it you have to add line

```text
GenericLanguage		   "pl" "pl" "utf-8"
```

to `/etc/speech-dispatcher/modules/piper-generic.conf`.

For russian language I installed

```bash
echo "1111" | piper-tts --model /usr/share/piper-voices/ru/ru_RU/denis/medium/ru_RU-denis-medium.onnx --output_file /tmp/welcome.wav && aplay /tmp/welcome.wav
```

add 

```text
GenericLanguage   "ru" "ru_RU" "utf-8"
AddVoice "ru" "MALE1"    "ru/ru_RU/denis/medium/ru_RU-denis-medium"
```

to `/etc/speech-dispatcher/modules/piper-generic.conf` and your computer speak in russian

```bash
spd-say -l ru "111" 
```

---

I described how to install languages manually, but after it decided to release packages for languages:

- piper-voices-pl-pl
- piper-voices-de-fr
- piper-voices-ru-ru
- piper-voices-fr-fr
- piper-voices-es-es

You can check them on [aur](https://aur.archlinux.org/packages?O=0&SeB=nd&K=piper-voices&outdated=&SB=p&SO=d&PP=50&submit=Go)

And test by commands like:

```bash
spd-say -l es "Un arcoíri o arco iris es un fenómeno óptico"
```

```bash
echo "Un arcoíri o arco iris es un fenómeno óptico" | piper-tts --model /usr/share/piper-voices/es/es_ES/sharvard/medium/es_ES-sharvard-medium.onnx --output_file /tmp/welcome.wav && aplay /tmp/welcome.wav
```

Sources: 
- [Mozilla](https://support.mozilla.org/en-US/kb/speechd-setup?as=u&utm_source=inproduct)
- [Arch. Wiki](https://wiki.archlinux.org/title/Speech_dispatcher)
- [HTML Docs](https://htmlpreview.github.io/?https://github.com/brailcom/speechd/blob/master/doc/speech-dispatcher.html)
- [Reddit](https://www.reddit.com/r/archlinux/comments/10jahc4/what_is_the_most_humansouding_tts_option_in/)