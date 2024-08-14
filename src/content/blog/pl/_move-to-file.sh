#!/bin/bash

# List directories only
for dir in */; do
  # Check if index.md exists in the directory
  if [ -f "${dir}index.md" ]; then
    # Create a new file with the directory name (without the trailing slash) + .md
    new_file="${dir%/}.md"
    # Copy the content of index.md to the new file
    cp "${dir}index.md" "$new_file"
  fi
done
