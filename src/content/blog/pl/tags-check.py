import os
import yaml

def check_tags_and_uniqueness():
    first_tags = {}
    has_tag = True

    # Iterate through all .md files
    for filename in os.listdir():
        if filename.endswith('.md'):
            with open(filename, 'r') as file:
                content = file.read()

            # Split frontmatter and content
            if content.startswith('---'):
                parts = content.split('---', 2)
                frontmatter = yaml.safe_load(parts[1])

                # Check if tags exist
                tags = frontmatter.get('tags')
                if not tags or not isinstance(tags, list) or len(tags) == 0:
                    print(f"{filename} does not have tags in the frontmatter.")
                    has_tag = False
                else:
                    # Check uniqueness of the first tag
                    first_tag = tags[0]
                    if first_tag in first_tags:
                        print(f"Duplicate first tag '{first_tag}' found in {filename} and {first_tags[first_tag]}")
                        has_tag = False
                    else:
                        first_tags[first_tag] = filename

    if has_tag:
        print("All files have at least one tag and the first tags are unique.")
    else:
        print("Some files are missing tags or have duplicate first tags.")

# Run the check
check_tags_and_uniqueness()
