import requests
from bs4 import BeautifulSoup

# URL to scrape
base_url = "http://localhost:4321/"

# Function to get all links from the page
def get_links(url):
    response = requests.get(url)
    if response.status_code != 200:
        print(f"Failed to retrieve {url}. Status code: {response.status_code}")
        return []

    soup = BeautifulSoup(response.content, 'html.parser')
    # Find all anchor tags with href attributes
    links = [a.get('href') for a in soup.find_all('a', href=True)]
    # Filter out only internal links (relative paths)
    internal_links = [link for link in links if link.startswith('/')]
    # Convert relative paths to absolute URLs
    full_links = [requests.compat.urljoin(base_url, link) for link in internal_links]

    return full_links

# Function to check the status of each link
def check_links(links):
    for link in links:
        try:
            response = requests.get(link)
            if response.status_code == 500:
                print(f"500 Internal Server Error at {link}")
            elif response.status_code != 200:
                print(f"Unexpected status code {response.status_code} at {link}")
            else:
                print(f"200 at {link}")
        except requests.exceptions.RequestException as e:
            print(f"Error accessing {link}: {e}")

# Get all links from the base URL
all_links = get_links(base_url)

# Check the status of all links
check_links(all_links)
