import requests
from bs4 import BeautifulSoup
import os

url = r"https://www.toronto.ca/services-payments/property-taxes-utilities/vacant-home-tax/"


def plain_text_scrape(url):
    """
    Scrape the URL and return the plain text content.
    """
    # Send HTTP request to the URL
    response = requests.get(url)

    # Check if request was successful
    if response.status_code == 200:
        # Parse the HTML content
        soup = BeautifulSoup(response.text, 'html.parser')

        # Extract all text content while removing extra whitespace
        text_content = ' '.join(soup.get_text().split())

        print("Scraping successful")

        return text_content
    else:
        print(
            f"Failed to retrieve the webpage. Status code: {response.status_code}")
        return None


def scrape_with_markdown_headers(url):
    """
    Scrape the URL and return the content with markdown headers.
    """
    response = requests.get(url)

    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')

        # Initialize content string
        content = []
        current_header = None
        current_content = []

        for element in soup.descendants:
            if element.name and element.name.lower() in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                # If there's an existing section, save it
                if current_header and current_content:
                    markdown_header = f"{'#' * current_header[0]} {current_header[1]}\n"
                    markdown_body = ' '.join(current_content) + '\n\n'
                    content.append(markdown_header)
                    content.append(markdown_body)
                    current_content = []

                # Start a new section
                level = int(element.name[1])
                header_text = element.get_text(strip=True)
                current_header = (level, header_text)
            elif current_header:
                # Collect text content
                if isinstance(element, str):
                    text = element.strip()
                    if text:
                        current_content.append(text)
                elif element.name in ['p', 'div', 'span', 'li']:
                    text = element.get_text(separator=' ', strip=True)
                    if text:
                        current_content.append(text)

        # Add the last section if exists
        if current_header and current_content:
            markdown_header = f"{'#' * current_header[0]} {current_header[1]}\n"
            markdown_body = ' '.join(current_content) + '\n\n'
            content.append(markdown_header)
            content.append(markdown_body)

        print("Scraping successful")
        return ''.join(content)
    else:
        print(
            f"Failed to retrieve the webpage. Status code: {response.status_code}")
        return None


def save_scraped_content(scraped_content, output_file):
    """
    Save the scraped content to a file.
    """
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(scraped_content)

    print(f"\nContent saved to {output_file}")


if __name__ == "__main__":

    markdown_text = scrape_with_markdown_headers(url)

    # Save the scraped content to a markdown file
    docs_folder = "DOCS"
    output_file = os.path.join(docs_folder, "scraped_headers.md")

    # Create DOCS folder if it doesn't exist
    if not os.path.exists(docs_folder):
        os.makedirs(docs_folder)

    save_scraped_content(markdown_text, output_file)
