#!/bin/bash

# Directory containing index.md files
SEARCH_DIR="."

# Base domain for fetching images
BASE_DOMAIN="https://preciselab.io"

# Recursively find all index.md files and parse them
find "$SEARCH_DIR" -type f -name "index.md" | while read -r file; do
    # Get the directory of the current index.md file
    dir_of_file=$(dirname "$file")

    # Look for patterns like ![](__GHOST_URL__/content/images/.../image.png)
    grep -oE '\!\[\]\(__GHOST_URL__[^)]+\)' "$file" | while read -r line; do
      echo "$line"

        # Extract the image URL
        img_url=$(echo "$line" | sed -e 's|!\[\](__GHOST_URL__||' -e 's|)||')

echo $img_url;

        # Combine the base domain and the image URL
        full_url="$BASE_DOMAIN$img_url"

        # Change directory to the directory of the current index.md file
        cd "$dir_of_file"

        # Use wget to download the image to the directory of the current index.md file
        wget "$full_url"
#        echo "$full_url"

        # Change back to the original search directory
        cd - > /dev/null
    done
done
