#!/usr/bin/env bash
set -e

BUCKET="s3://preciselab/blog/img/"
LOCAL_DIR="src/assets/images/"

generate_thumbs() {
    echo "Generowanie brakujących miniatur (thumb_<uuid>.avif)..."
    node scripts/generate_thumbnails.js
}

case "$1" in
  pull)
    echo "Pobieranie obrazków z DigitalOcean Spaces ($BUCKET -> $LOCAL_DIR)..."
    s3cmd sync "$BUCKET" "$LOCAL_DIR"
    ;;
  push)
    generate_thumbs
    echo "Wysyłanie nowych/zmienionych obrazków do DigitalOcean Spaces ($LOCAL_DIR -> $BUCKET)..."
    s3cmd sync --acl-public "$LOCAL_DIR" "$BUCKET"
    ;;
  sync)
    echo "Dwustronna synchronizacja obrazków..."
    s3cmd sync "$BUCKET" "$LOCAL_DIR"
    generate_thumbs
    s3cmd sync --acl-public "$LOCAL_DIR" "$BUCKET"
    ;;
  *)
    echo "Użycie: $0 {pull|push|sync}"
    exit 1
    ;;
esac
