#!/bin/bash

# Loop through all *.md files
for file in *.md; do
    # Extract the filename without the extension
    dir_name=$(basename "$file" .md)

    # Create a directory with the filename
    mkdir -p "$dir_name"

    # Move the .md file to the directory and rename it to index.md
    mv "$file" "$dir_name/index.md"
done
