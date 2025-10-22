import csv
import re
import os

def clean_verse_text(text: str) -> str:
    """
    Removes a leading heading from a Bible verse string.

    The pattern looks for a sequence of capitalized words that might be a heading,
    ending just before the actual verse text which also starts with a capital letter.
    It's designed to be conservative to avoid removing actual verse content.
    """
    # This regex looks for a pattern that is likely a heading.
    # It finds a sequence of words starting with a capital letter,
    # which is then followed by another word starting with a capital letter.
    # It assumes the heading ends before the last capitalized word which starts the verse.
    # Example: "Title One Title Two Verse starts here." -> "Verse starts here."
    match = re.match(r'^((?:[A-Z][a-z`\']*\s)+)([A-Z].*)$', text)
    if match:
        # If a match is found, we return the second group, which is the verse text.
        return match.group(2)

    # A special case for the very first verse which has "test 123"
    if text.startswith('test 123 '):
        return text.replace('test 123 ', '', 1)

    return text

def process_csv(input_path: str, output_path: str):
    """
    Reads a CSV file, cleans the 'Text' column, and writes to a new CSV file.
    """
    try:
        with open(input_path, 'r', newline='', encoding='utf-8') as infile, \
             open(output_path, 'w', newline='', encoding='utf-8') as outfile:

            reader = csv.reader(infile)
            writer = csv.writer(outfile)

            # Read and write the header
            header = next(reader)
            writer.writerow(header)

            # Find the index of the 'Text' column
            try:
                text_column_index = header.index('Text')
            except ValueError:
                print("Error: 'Text' column not found in the CSV header.")
                return

            # Process each row
            for row in reader:
                if len(row) > text_column_index:
                    original_text = row[text_column_index]
                    cleaned_text = clean_verse_text(original_text)
                    row[text_column_index] = cleaned_text
                writer.writerow(row)

        print(f"Successfully processed the file. Cleaned data written to '{output_path}'")

    except FileNotFoundError:
        print(f"Error: The file '{input_path}' was not found.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    # Get the absolute path to the script's directory
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Construct the full path for the input and output files
    # Assuming the script is run from a location that can relatively access the path.
    # You might need to adjust this path depending on your project structure.
    input_csv_path = '/Users/school/Documents/GitHub/angularbibleguesser/src/assets/net.csv'
    output_csv_path = '/Users/school/Documents/GitHub/angularbibleguesser/src/assets/net_cleaned.csv'

    process_csv(input_csv_path, output_csv_path)

