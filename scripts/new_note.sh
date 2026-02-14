#!/bin/bash

if [ -z "$1" ]; then
  echo "Error: Title is required."
  echo "Usage: $0 \"Title of the note\""
  exit 1
fi

TITLE="$1"
DATE=$(date +%Y-%m-%d)
SLUG=$(echo "$TITLE" | iconv -t ascii//TRANSLIT | sed -r s/[^a-zA-Z0-9]+/-/g | sed -r s/^-+\|-+$//g | tr A-Z a-z)
FILENAME="src/content/note/${DATE}-${SLUG}.md"

# Ensure the directory exists
mkdir -p src/content/note

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
