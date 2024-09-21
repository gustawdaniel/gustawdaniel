---
title: How I created 24 videos in single day to promote my GPT-CLI
slug: how-i-created-24-videos-in-single-day-to-promote-my-gpt-cli
publishDate: 1970-01-01T00:00:00.000Z
date_updated: 2023-03-18T03:44:21.000Z
draft: true
---

I created awesome tool that allow you to ask gpt3.5 for linux commands. It is so awesome, that I decided to put more effort in advertising it. In this article I am showing how I did it.

## Recording video in OBS

I decided to record only terminal. So I installed `obs` and created scene with source as `Windows Capture (PipeWire)`. I received `mp4` but there was some mistakes that i decided to cut.

## Removing bad fragments in LightWorks

I had a lot of problems with `DavinciResolve` so decided to install `LightWorks` that at least works. To use it you have to know shortcuts:

* `c` for dividing clip
* `a` and `s` for moving to next part
* `space` for stop/play
* `j` and `l` for fast go right or left on timeline

I added effect by `VFX` and `DVE` to change position and size of terminal, and decided to add colour correction to have more fancy look.

## Voice

I created file `pl.txt` with my text. Converted it to voice by command

```
gtts-cli "$(cat pl.txt)" -l pl --output pl.mp3
```

Then speedup it by

```
yes | ffmpeg -i pl.mp3 -filter:a "atempo=2.0" pl2.mp3
```

I could play it by

```
mpg123 pl2.mp3
```

and measure length of `mp3` by

```
ffprobe -i pl2.mp3 -show_entries format=duration -v quiet -of csv="p=0"
```

Of course I did not know all these command and did not found them on stackoverflow. I was using my own tool, that I want to promote. For example to find last one I typed to terminal this:

```
p get length of pl2.mp3 file in seconds
```

In my opinion it is revolution... But let's check what happened next.

I created 15 files called `pl-n.txt` where `n` was numbers from `1` to `15` and asked.

```
p write bash script that iterate over all text files starting from pl and ending on txt and execute on them command cat
```

I received this:

```
for file in pl*.txt; do
    cat $file
done
```

Great. I edited it to this form. Next question:

```
p get number that is after "pl-" and before ".txt" extension form file name saved in env $file
```

and answer:

```
echo $env | grep -oP '(?<=pl\-)\d+(?=\.txt)'
```

few minutes later I had

```
#!/bin/bash

for file in pl*.txt; do
    num=`echo $file | grep -oP '(?<=pl\-)\d+(?=\.txt)';`
    echo $num;
    gtts-cli "$(cat $file)" -l pl --output pl-${num}.mp3
    yes | ffmpeg -i pl-${num}.mp3 -filter:a "atempo=2.0" pl-${num}i.mp3
done
```

## Translations

Now I have to translate them to different languages. Chat gpt is great in translations, but is there any cli that simplify this process? Hmm... Yea

Again I decided to use `gpt-cli` written 2 days ago in this using script `translate.sh`

```bash
#!/bin/bash

export GPT_SYSTEM_PROMPT="I am translator from polish to english. I need to translate this text.";
export GPT_POST=out;

for file in pl*.txt; do
    num=`echo $file | grep -oP '(?<=pl\-)\d+(?=\.txt)';`
    echo "Num: ${num}"
    p "$(cat ${file})" > en-${num}.txt
    cat en-${num}.txt
done

unset GPT_SYSTEM_PROMPT;
unset GPT_POST;
```

Let's modify our `read.sh` script to generalize it for any `LANG`

```bash
#!/bin/bash

for file in ${LANG}*.txt; do
    num=`echo "$file" | grep -oP "(?<=${LANG}-)\d+(?=\.txt)";`
    echo $num;
    gtts-cli "$(cat $file)" -l ${LANG} --output ${LANG}-${num}.mp3
    yes | ffmpeg -i ${LANG}-${num}.mp3 -filter:a "atempo=2.0" ${LANG}-${num}i.mp3
done
```

and use

```
LANG=en ./read.sh
```

With these two scripts we generated already audio files for two languages.

Now it is time to select languages to translate. We can do it in two steps.

1. Ask about possible languages:

```
gtts-cli --all
  af: Afrikaans
  ar: Arabic
  bn: Bengali
  ...
  zh: Chinese (Mandarin)
```

and copy these languages to chat asking about first 24 in ordered by popularity. It is our list:

```
en: English
es: Spanish
zh: Chinese (Mandarin)
hi: Hindi
ar: Arabic
bn: Bengali
pt: Portuguese
ru: Russian
ja: Japanese
pa: Punjabi
de: German
jv: Javanese
ms: Malay
te: Telugu
vi: Vietnamese
ko: Korean
fr: French
mr: Marathi
ta: Tamil
tr: Turkish
it: Italian
th: Thai
nl: Dutch
pl: Polish
```

Now we can modify our translation script using syntax

```
#!/bin/bash

# Set default value for LANG_SHORT
: ${LANG_SHORT:=pl}

# Use the value of LANG_SHORT in your script
echo "LANG_SHORT is set to $LANG_SHORT"
```

The `:=` operator assigns the default value "pl" to `LANG_SHORT` if it is unset or null. The : before the operator is a null command that does nothing, but is necessary to avoid a syntax error if `LANG_SHORT` is unset.

```
#!/bin/bash

: ${FROM_SHORT:=pl}
: ${TO_SHORT:=en}

: ${FROM_LONG:=Polish}
: ${TO_LONG:=English}


export GPT_SYSTEM_PROMPT="I am translator from ${FROM_LONG} to ${TO_LONG}. I need to translate this text.";
export GPT_POST=out;

for file in ${FROM_SHORT}*.txt; do
    num=`echo "$file" | grep -oP "(?<=${FROM_SHORT}-)\d+(?=\.txt)";`
    echo "Num: ${num}"
    p "$(cat ${file})" > ${TO_SHORT}-${num}.txt
    cat ${TO_SHORT}-${num}.txt
    if [ ! -s ${TO_SHORT}-${num}.txt ]; then
      echo "File is empty or doesn't exist. Exiting script."
      exit 1
    fi
done

unset GPT_SYSTEM_PROMPT;
unset GPT_POST;
```

Now we need to set `from` as english and use rest languages in loop that

This simple script automate our work

```
#!/usr/bin/env bash

export FROM_SHORT=en
export FROM_LONG=English

TO_SHORT=es TO_LONG=Spanish ./translate.sh
TO_SHORT=zh TO_LONG=Chinese ./translate.sh
TO_SHORT=hi TO_LONG=Hindi ./translate.sh
TO_SHORT=ar TO_LONG=Arabic ./translate.sh
TO_SHORT=bn TO_LONG=Bengali ./translate.sh
TO_SHORT=pt TO_LONG=Portuguese ./translate.sh
TO_SHORT=ru TO_LONG=Russian ./translate.sh
TO_SHORT=ja TO_LONG=Japanese ./translate.sh
TO_SHORT=pa TO_LONG=Punjabi ./translate.sh
TO_SHORT=de TO_LONG=German ./translate.sh
TO_SHORT=jv TO_LONG=Javanese ./translate.sh
TO_SHORT=ms TO_LONG=Malay ./translate.sh
TO_SHORT=te TO_LONG=Telugu ./translate.sh
TO_SHORT=vi TO_LONG=Vietnamese ./translate.sh
TO_SHORT=ko TO_LONG=Korean ./translate.sh
TO_SHORT=fr TO_LONG=French ./translate.sh
TO_SHORT=mr TO_LONG=Marathi ./translate.sh
TO_SHORT=ta TO_LONG=Tamil ./translate.sh
TO_SHORT=tr TO_LONG=Turkish ./translate.sh
TO_SHORT=it TO_LONG=Italian ./translate.sh
TO_SHORT=th TO_LONG=Thai ./translate.sh
TO_SHORT=nl TO_LONG=Dutch ./translate.sh
```

After this command we have 360 files, 15 files for any of 24 languages. So let's read them all using `gtts-cli`.

We can improve our `read.sh` again to move all final files to directories.

```
#!/bin/bash

for file in ${LANG}*.txt; do
    num=`echo "$file" | grep -oP "(?<=${LANG}-)\d+(?=\.txt)";`
    echo $num;
    gtts-cli "$(cat $file)" -l ${LANG} --output ${LANG}-${num}.mp3
    yes | ffmpeg -i ${LANG}-${num}.mp3 -filter:a "atempo=2.0" ${LANG}-${num}i.mp3
    mkdir -p "${LANG}i"
    mv ${LANG}-*i.mp3 "${LANG}i"
done
```

and to read all we can use `read_all.sh` script

```
#!/usr/bin/env bash

LANG="en" ./read.sh
LANG="pl" ./read.sh
LANG="es" ./read.sh
LANG="zh" ./read.sh
LANG="hi" ./read.sh
LANG="ar" ./read.sh
LANG="bn" ./read.sh
LANG="pt" ./read.sh
LANG="ru" ./read.sh
LANG="ja" ./read.sh
LANG="pa" ./read.sh
LANG="de" ./read.sh
LANG="jv" ./read.sh
LANG="ms" ./read.sh
LANG="te" ./read.sh
LANG="vi" ./read.sh
LANG="ko" ./read.sh
LANG="fr" ./read.sh
LANG="mr" ./read.sh
LANG="ta" ./read.sh
LANG="tr" ./read.sh
LANG="it" ./read.sh
LANG="th" ./read.sh
LANG="nl" ./read.sh
```

There was problem with reading `pa`, `jv` and `ms` languages.

* pa: Punjabi
* jv: Javanese
* ms: Malay

in agreement with Pareto rule I decided to skip it, but after preparing Arabic video I understand that I can't verify it so if there are text like "I apologize, but I can't translate this sentence", then I do not have any method of check it.

## Verification

I decided to invert this process to verify it. So what we did:

* prepared text in english
* translated to other languages
* converted text to speech

And now we are going to

* convert speech to text
* translate it again to english
* compare original with result of processing

If machine is able to understand it then we can assume that our movies are correct.

![](https://preciselab.io/content/images/2023/03/Zrzut-ekranu-z-2023-03-17-13-43-03.png)

Unfortunately voice2json do not support all our languages

[voice2json](http://voice2json.org/#getting-started)

There are supported

* Catalan (`ca`)
* Czech (`cs`)
* German (`de`)
* Greek (`el`)
* English (`en`)
* Spanish (`es`)
* French (`fr`)
* Hindi (`hi`)
* Italian (`it`)
* Korean (`ko`)
* Kazakh (`kz`)
* Dutch (`nl`)
* Polish (`pl`)
* Portuguese (`pt`)
* Russian (`ru`)
* Swedish (`sv`)
* Vietnamese (`vi`)
* Mandarin (`zh`)

Using `voice2json` we can use only 12 languages.

![](https://preciselab.io/content/images/2023/03/Zrzut-ekranu-z-2023-03-17-14-06-02.png)

Other tool is whisper also from openai

[GitHub - openai/whisper: Robust Speech Recognition via Large-Scale Weak Supervision](https://github.com/openai/whisper)

![](https://preciselab.io/content/images/2023/03/language-breakdown.svg)

we can't install it today because open issue

[Python 3.11 · Issue #8304 · numba/numba](https://github.com/numba/numba/issues/8304#issuecomment-1456646575)

but there is `api`

```
curl --request POST \
  --url https://api.openai.com/v1/audio/transcriptions \
  --header "Authorization: Bearer ${GPT3_API_KEY}" \
  --header 'Content-Type: multipart/form-data' \
  --form file=@en-3i.mp3 \
  --form model=whisper-1 | jq ".text"
```

So to convert `mp4` to `mp3` you can simply type

```
p ffmpeg convert ar.mp4 to ar.mp3
```

or

```
ffmpeg -i ar.mp4 ar.mp3
```

and then after

```
curl --request POST \
  --url https://api.openai.com/v1/audio/transcriptions \
  --header 'Authorization: Bearer ${GPT3_API_KEY}' \
  --header 'Content-Type: multipart/form-data' \
  --form file=@ar.mp3 \
  --form model=whisper-1 | jq ".text"
```

I saw:

لا تعرف أو لا تتذكر أوامر الانكس ما عليك سوى كتابة النص باللغة العادية وسيقوم روبوت الدردشة جي كي تي بكتابة الأوامر لك بفضل عدة دقائق من البحث في هندسة النص المحفزة فقد وضعت لك نص محفزا سيغير حياتك بتوفيرك الليالي الساهرة التي تنفقها في التبديل بين الوحدة أطرفية وستاك أوفرو فلو في هذا الفيديو يمكنك مشاهدة كيف يمكنك بدلا من كتابة الأعلامات المخصصة لأمر جي كيو وصف العملية التي تريد تحقيقها ببساطة، الآن لقد قمنا بحفظ ملف طبع جي اس أو إن باستخدام ترميز بيس 64 كان الأمر سهلا جدا للأسف كنا نريد شكل بيس 64 لتخلصي من الأسطور الجديدة ولكن من يتذكر هذا العلم لأمر بيس 64 الهاكرز نعم ولكن أنا مبتدئ الآن نعرض ساعة على الطرفية والآن تسلسل من 100 إلى 60 بخطوة 6 بصراحة لن أعرف ترتيب هذه الحجج وتحقق منها سيستغرق حوالي 10 ثوان من الحياة أو 10 ثوان من فوات الأجل إذا كانت اختباراتنا في لغة الروس تعمل بشكل متزامن أثناء التعامل مع المورد نفسه فمن الجدير بتشغيل بطريقة تتبعية الآن تعرف الفا إذا كنت مبتدئا ولا تعرف أوامر لينيكس فلن تحتاج إلى ذلك مع اكس دي إذا نسيت نسخة نظام التشغيل الخاص بك ولا تعرف كيفية تتحقق منه لا تقلق يمكنك أيضا الاستفسار عن عدد الحزم المثبتة أو ببساطة سرد قائمتها أتحقق من إصدارات دوكر هل فكرت أنه يجب أن يكون هناك خط أفقي قبل الإصدار يمكن أن يكون هناك ولكنه ليس ضروريا إذا كنت متطرن لتعامل مع لغة بيتش بي في ايتش بي ولكن لا تعرفها يمكنك ببساطة تغليف بها في طبقة انعكاسية توفرها شات جي بي تي جي بي تي وإذا لم تتذكر كيفية إعداد خادم محلي وتحتاج إليه في الأمس فها هو لقد كتبت طلب ايتش تي بي من الصفر لاختباره في النهاية نفتح خادم ان سي ونتصل به لنقل البيانات في الوقت الحقيقي بين المحطات تحقق إذا كانت تعمل لك وإذا كانت تعمل عرضها على أصدقائك آسف أنت في اي جي تي وربما مثلي لا يوجد لديك أصدقاء اكس دي

Hmm. Looks great, but what it means? Fortunately changing `transcriptions` to `translations` we can see:

```
curl --request POST \
  --url https://api.openai.com/v1/audio/translations \
  --header "Authorization: Bearer ${GPT3_API_KEY}" \
  --header 'Content-Type: multipart/form-data' \
  --form file=@ar.mp3 \
  --form model=whisper-1 --form response_format=text
```

It is hard to say if result is readable. But I am rather considering it as low quality.

![](https://preciselab.io/content/images/2023/03/Zrzut-ekranu-z-2023-03-17-17-36-46.png)

To make it better I should add subtitles. I tried this service

[Free online subtitle translator.](https://subtitlestranslator.com/en/)

But it does not provide api, and process part of files on fronted, but part on backend. I was also considering this one

[Automatyczna transkrypcja nagrań](https://stenograf.io/)

but it is also gui tool without API. I rejected also this one with price $0.0005 per word.

[Translation Software API](https://www.pairaphrase.com/how-it-works/api-for-developers/)

In the English language, people speak about 140 words per minute. A fast speaker will get to 170. So with super fast speaker it will cost $6 per hour. Not bad, but this price require package that costs 400 USD.

I decided again to use GPT-3 command line that I wrote.

```
GPT_SYSTEM_PROMPT="I am sbv files translator to polish. I need to translate this text not changing numbers with time." GPT_POST=out p "$(cat captions.sbv)"
```

Results was weak again so I decided to change workflow. Research showed that there are more tools, like this one:

[Checksub: Create impactful videos | Add Captions and Subtitles easily](https://www.checksub.com/)

But finally I stopped with the following flow:

* english text -> translated text -> speech -> recognized text -> english text

and was unsatisfied with result. So tried to fix it by providing subtitles that will improve quality. Problem was that subtitles are organised in texts that showing between given time period, when original text is organised to sentences that covers selected topics.

---

I did not found solution for it now because I have to create multilingual context anyway, so I hope I will improve this process in future. Now as proof of concept I decided to write one more script to:

* translate transcriptions
* translate title
* generate description
