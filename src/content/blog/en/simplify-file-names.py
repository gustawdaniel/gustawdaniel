import os
import re
import yaml
from collections import defaultdict

# Function to update image paths in Markdown files
def update_image_paths():
    tag_indices = defaultdict(int)  # Dictionary to keep track of indices for each tag

    for filename in os.listdir():
        if filename.endswith('.md'):
            with open(filename, 'r') as file:
                content = file.read()

            # Split frontmatter and content
            if content.startswith('---'):
                parts = content.split('---', 2)
                frontmatter = yaml.safe_load(parts[1])
                first_tag = frontmatter.get('tags', [''])[0]

                if not first_tag:
                    print(f"No tags found in {filename}, skipping file.")
                    continue

                # Non-greedy regex pattern to find image paths
                pattern = re.compile(r'!\[\]\((\.\.\/\.\.\/\.\.\/assets\/[^\/]+\/)([^\/]+?)\)')
                matches = pattern.findall(content)

                for match in matches:
                    original_dir = match[0]
                    original_filename = match[1]

                    # Increment the index for the tag
                    tag_indices[first_tag] += 1

                    # Generate the new filename
                    new_filename = f"{first_tag}-{tag_indices[first_tag]}.png"

                    # Replace the content in the markdown file
                    new_path = f"![]({original_dir}{new_filename})"
                    content = content.replace(f"![]({original_dir}{original_filename})", new_path)

                    # Rename the actual file
                    old_file_path = os.path.join(original_dir.replace('../../../../', ''), original_filename)
                    new_file_path = os.path.join(original_dir.replace('../../../../', ''), new_filename)
                    if os.path.exists(old_file_path):
                        os.rename(old_file_path, new_file_path)
                    else:
                        print(f"File {old_file_path} does not exist. Skipping renaming for this file.")

            # Write the updated content back to the markdown file
            with open(filename, 'w') as file:
                file.write(content)

# Run the update
update_image_paths()
