#!/usr/bin/env python3
import os
import glob
import re
import shutil
import subprocess
import sys

BLOG_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
PUBLIC_IMG_DIR = os.path.join(BLOG_ROOT, "public/img")
ASSETS_IMG_DIR = os.path.join(BLOG_ROOT, "src/assets/images")
CDN_BASE_URL = "https://preciselab.fra1.digitaloceanspaces.com/blog/img"
S3_BUCKET = "s3://preciselab/blog/img/"

def convert_png_to_avif(png_path, avif_path):
    """Converts a PNG image to AVIF format using magick / convert or ffmpeg."""
    print(f"Converting PNG to AVIF: {os.path.basename(png_path)} -> {os.path.basename(avif_path)}")
    res = subprocess.run(["magick", png_path, "-quality", "80", avif_path], capture_output=True, text=True)
    if res.returncode != 0:
        # Fallback to convert or ffmpeg
        res = subprocess.run(["convert", png_path, "-quality", "80", avif_path], capture_output=True, text=True)
    if res.returncode != 0:
        res = subprocess.run(["ffmpeg", "-y", "-i", png_path, "-c:v", "libsvtavif", avif_path], capture_output=True, text=True)
    if res.returncode != 0 or not os.path.exists(avif_path):
        raise RuntimeError(f"Failed to convert {png_path} to AVIF: {res.stderr}")

def main():
    os.makedirs(ASSETS_IMG_DIR, exist_ok=True)

    # 1. Clean up unwanted files
    concurrency_avif = os.path.join(PUBLIC_IMG_DIR, "insert_perf_concurrency.avif")
    if os.path.exists(concurrency_avif):
        print(f"Removing redundant AVIF: {concurrency_avif}")
        os.remove(concurrency_avif)

    # Map of original /img/... relative path -> new filename in src/assets/images
    path_map = {}

    all_pub_files = glob.glob(os.path.join(PUBLIC_IMG_DIR, "**/*"), recursive=True)
    all_pub_files = [f for f in all_pub_files if os.path.isfile(f)]

    print(f"\nProcessing {len(all_pub_files)} files in public/img/...")

    for pub_file in all_pub_files:
        rel_path = os.path.relpath(pub_file, PUBLIC_IMG_DIR)
        base_name, ext = os.path.splitext(os.path.basename(pub_file))
        ext = ext.lower()

        # Handle PNG conversion to AVIF
        if ext in [".png", ".jpg", ".jpeg", ".webp"]:
            dest_filename = f"{base_name}.avif"
            dest_path = os.path.join(ASSETS_IMG_DIR, dest_filename)
            convert_png_to_avif(pub_file, dest_path)
            path_map[f"/img/{rel_path}"] = f"{CDN_BASE_URL}/{dest_filename}"
        elif ext in [".svg", ".avif"]:
            dest_filename = f"{base_name}{ext}"
            dest_path = os.path.join(ASSETS_IMG_DIR, dest_filename)
            shutil.copy2(pub_file, dest_path)
            print(f"Copied to assets: {dest_filename}")
            path_map[f"/img/{rel_path}"] = f"{CDN_BASE_URL}/{dest_filename}"

    # 2. Run generate_thumbnails.js
    print("\nGenerating thumbnails for assets...")
    res = subprocess.run(["node", "scripts/generate_thumbnails.js"], cwd=BLOG_ROOT, capture_output=True, text=True)
    print(res.stdout.strip())

    # 3. Upload src/assets/images to S3
    print(f"\nUploading images to S3 bucket ({S3_BUCKET})...")
    res = subprocess.run(["s3cmd", "sync", "--acl-public", f"{ASSETS_IMG_DIR}/", S3_BUCKET], capture_output=True, text=True)
    if res.returncode != 0:
        print(f"Error uploading to S3: {res.stderr}")
        sys.exit(1)
    else:
        print("S3 Sync completed successfully.")

    # 4. Update Markdown blog posts to use CDN URLs
    print("\nUpdating image URLs in blog markdown posts...")
    md_files = glob.glob(os.path.join(BLOG_ROOT, "src/content/blog/**/*.md"), recursive=True)
    updated_count = 0

    # Fix any duplicated CDN domains first
    double_domain = f"{CDN_BASE_URL.rsplit('/', 1)[0]}{CDN_BASE_URL.rsplit('/', 1)[0]}"

    for md_file in md_files:
        with open(md_file, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()

        new_content = content
        for local_url, cdn_url in path_map.items():
            # Only replace if not already full CDN URL
            local_png_url = re.sub(r'\.(avif|svg)$', '.png', local_url)
            
            # replace local /img/... paths
            new_content = new_content.replace(local_url, cdn_url)
            new_content = new_content.replace(local_png_url, cdn_url)

        # Clean double domain prefixes if any were created
        while double_domain in new_content:
            new_content = new_content.replace(double_domain, CDN_BASE_URL.rsplit('/', 1)[0])

        if new_content != content:
            with open(md_file, "w", encoding="utf-8") as f:
                f.write(new_content)
            updated_count += 1
            rel_md = os.path.relpath(md_file, BLOG_ROOT)
            print(f"  - Updated references in: {rel_md}")

    print(f"Updated {updated_count} markdown blog posts.")

    # 5. Clean up local public/img/ files that were processed
    print("\nCleaning up local public/img directory...")
    for pub_file in all_pub_files:
        if os.path.exists(pub_file):
            os.remove(pub_file)
    
    # Remove empty subdirectories in public/img
    for root, dirs, files in os.walk(PUBLIC_IMG_DIR, topdown=False):
        for d in dirs:
            dir_path = os.path.join(root, d)
            if not os.listdir(dir_path):
                os.rmdir(dir_path)

    print("\nMigration, conversion, S3 upload, and relinking completed successfully!")

if __name__ == "__main__":
    main()
