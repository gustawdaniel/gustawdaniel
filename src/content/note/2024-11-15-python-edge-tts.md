---
title: Python edge TTS
publishDate: 2024-11-15
---

I continue to explore the world of Text-to-Speech (TTS) engines. This time I found a new one called `edge-tts`. It's a Python module that allows you to use Microsoft Edge's online text-to-speech service from within your Python code or using the provided edge-tts or edge-playback command.

Installation

```bash
pip install edge-tts --break-system-packages
```

Usage with saving to file

```bash
edge-tts --voice pl-PL-MarekNeural --text "11" --write-media hello.mp3 --write-subtitles hello.vtt
mpv hello.mp3
```

Usage in real time

```bash
edge-playback --text "Hello world"
```

Voices list

```bash
edge-tts --list-voices
```

Package is super light, fast and quality of sound is awesome. Bur you have to be aware that it relay on Microsoft Edge service, so it can be blocked if you using it too often.

It is written [here](https://github.com/rany2/edge-tts/blob/7c83923a5bf47abf01fcf0614c6d8970c5d8d3f9/src/edge_tts/constants.py#L5).

```python
"""
Constants for the Edge TTS project.
"""

BASE_URL = "speech.platform.bing.com/consumer/speech/synthesize/readaloud"
TRUSTED_CLIENT_TOKEN = "6A5AA1D4EAFF4E9FB37E23D68491D6F4"

WSS_URL = f"wss://{BASE_URL}/edge/v1?TrustedClientToken={TRUSTED_CLIENT_TOKEN}"
VOICE_LIST = f"https://{BASE_URL}/voices/list?trustedclienttoken={TRUSTED_CLIENT_TOKEN}"

CHROMIUM_FULL_VERSION = "130.0.2849.68"
CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split(".", maxsplit=1)[0]
SEC_MS_GEC_VERSION = f"1-{CHROMIUM_FULL_VERSION}"
BASE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    f" (KHTML, like Gecko) Chrome/{CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36"
    f" Edg/{CHROMIUM_MAJOR_VERSION}.0.0.0",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
}
WSS_HEADERS = {
    "Pragma": "no-cache",
    "Cache-Control": "no-cache",
    "Origin": "chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold",
}
WSS_HEADERS.update(BASE_HEADERS)
VOICE_HEADERS = {
    "Authority": "speech.platform.bing.com",
    "Sec-CH-UA": f'" Not;A Brand";v="99", "Microsoft Edge";v="{CHROMIUM_MAJOR_VERSION}",'
    f' "Chromium";v="{CHROMIUM_MAJOR_VERSION}"',
    "Sec-CH-UA-Mobile": "?0",
    "Accept": "*/*",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
}
VOICE_HEADERS.update(BASE_HEADERS)
```

and rate limit is not clear https://github.com/rany2/edge-tts/issues/201

Sources:
- [Project page](https://pypi.org/project/edge-tts/)
- [GitHub](https://github.com/rany2/edge-tts)
- [Reddit comment](https://www.reddit.com/r/archlinux/comments/10jahc4/comment/j5kdm6o/?utm_source=share&utm_medium=web3x&utm_name=web3xcss&utm_term=1&utm_content=share_button)