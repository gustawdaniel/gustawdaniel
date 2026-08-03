#!/bin/bash

if [ -z "$1" ]; then
  echo "Error: Language is required."
  echo "Usage: $0 \"pl/en/es\" \"Title of the note\""
  exit 1
fi

if [ "$1" != "pl" ] && [ "$1" != "en" ] && [ "$1" != "es" ]; then
  echo "Error: Language must be 'pl', 'en' or 'es'."
  exit 1
fi

if [ -z "$2" ]; then
  echo "Error: Title is required."
  echo "Usage: $0 "pl/en/es" "Title of the note""
  exit 1
fi

LANG="$1"
DATE=$(date +%Y-%m-%d)
TITLE="$2"
SLUG=$(echo "$TITLE" | iconv -t ascii//TRANSLIT | sed -r s/[^a-zA-Z0-9]+/-/g | sed -r s/^-+\|-+$//g | tr A-Z a-z)

# Ensure the directory exists
mkdir -p src/content/note/${LANG}

FILENAME="src/content/note/${LANG}/${DATE}-${SLUG}.md"

if [ -f "$FILENAME" ]; then
  echo "Error: File $FILENAME already exists."
  exit 1
fi

cat <<EOF > "$FILENAME"
---
title: $TITLE
publishDate: $DATE
---

EOF

echo "Created new note: $FILENAME"
