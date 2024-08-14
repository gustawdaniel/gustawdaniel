for file in *.md; do
  # Use sed to remove one ../ level from all links to assets
  sed -i 's|\(\!\[\]\)(\.\./\.\./\.\./\.\./assets/|![](../../../assets/|g' "$file"
done