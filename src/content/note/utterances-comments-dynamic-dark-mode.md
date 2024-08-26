---
title: Utterances, Alpine.js and dynamic dark mode
publishDate: 2021-10-10
---


```html
        <script define:vars={{locale}}>
            document.addEventListener('alpine:init', () => {
                Alpine.store('comments', {
                    load(darkMode) {
                        const comments = document.getElementById('comments');
                        const script = document.createElement('script');
                        script.src = 'https://utteranc.es/client.js';
                        script.setAttribute('repo', 'gustawdaniel/gustawdaniel');
                        script.setAttribute('label', locale);
                        script.setAttribute('issue-term', 'pathname');
                        script.setAttribute('theme', darkMode === 'dark' || (darkMode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
                            ? 'dark-blue'
                            : 'github-light');
                        script.crossOrigin = 'anonymous';
                        script.async = true;

                        // Remove old script if it exists
                        comments.innerHTML = '';

                        console.log(script.outerHTML)

                        comments.appendChild(script);
                    },
                })
            })

        </script>


        <div x-init="
         $store.comments.load(document.querySelector('html').classList.contains('dark') ? 'dark' : 'light');
          $watch('darkMode', (val) => $store.comments.load(val))">
            <div id="comments"></div>
        </div>
```