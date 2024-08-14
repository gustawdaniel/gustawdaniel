import os
import yaml
from slugify import slugify

# Function to update frontmatter
def update_frontmatter(frontmatter):
    # 1. Add description = excerpt if description does not exist
    if 'description' not in frontmatter:
        frontmatter['description'] = frontmatter.get('excerpt', '')

    # 2. Add canonicalName = slugified title
    if 'canonicalName' not in frontmatter:
        frontmatter['canonicalName'] = slugify(frontmatter.get('title', ''))

    # 3. Add pl/ to the beginning of slug if it does not start with pl/
    if 'slug' in frontmatter and not frontmatter['slug'].startswith('en/'):
        frontmatter['slug'] = f"en/{frontmatter['slug']}"

    # 4. Add author = Daniel Gustaw
    if 'author' not in frontmatter:
        frontmatter['author'] = "Daniel Gustaw"

    return frontmatter

# Function to process each .md file
def process_md_file(filepath):
    with open(filepath, 'r') as file:
        content = file.read()

    # Split frontmatter and content
    if content.startswith('---'):
        parts = content.split('---', 2)
        frontmatter = yaml.safe_load(parts[1])
        updated_frontmatter = update_frontmatter(frontmatter)
        new_content = f"---\n{yaml.dump(updated_frontmatter, default_flow_style=False)}---\n{parts[2]}"

        with open(filepath, 'w') as file:
            file.write(new_content)

# Process all .md files in the current directory
for filename in os.listdir():
    if filename.endswith('.md'):
        process_md_file(filename)