import re
import csv
import os

def clean_subheading(text):
    """
    Identifies and removes subheadings from the beginning of a verse text.
    A subheading is assumed to be any text preceding the first full sentence
    that starts with a capital letter and ends with a punctuation mark like '.', '!', or '?'.
    This is a more robust way to handle various subheading formats.
    """
    # This regex finds the first full sentence. It looks for any characters from the start,
    # non-greedily, until it finds a period, question mark, or exclamation mark followed by a space.
    # The re.DOTALL flag allows '.' to match newlines, though less likely in a single CSV field.
    match = re.search(r"^.*?[.!?]\s", text, re.DOTALL)

    if match:
        first_sentence = match.group(0)
        # Heuristic: If the first sentence is short and doesn't contain many lowercase letters,
        # it's likely a subheading. A real sentence will have a mix of cases.
        # We check if there are more than a few lowercase letters.
        if sum(1 for char in first_sentence if 'a' <= char <= 'z') < 5:
             # This looks like a subheading. The actual verse starts after it.
             return text[match.end():].strip()

    # If no subheading is detected, or if the logic fails, return the original text.
    return text

def clean_bible_csv(input_file='net.csv', output_file='net_cleaned.csv'):
    """
    Reads the input bible CSV, cleans subheadings from the 'Text' column,
    and writes the result to the output CSV.
    """
    try:
        with open(input_file, mode='r', encoding='utf-8') as infile, \
             open(output_file, mode='w', encoding='utf-8', newline='') as outfile:

            reader = csv.reader(infile)
            writer = csv.writer(outfile)

            # Read header and write to output
            header = next(reader)
            writer.writerow(header)

            # Find the index for the 'Text' column
            try:
                text_index = header.index('Text')
            except ValueError:
                print("Error: 'Text' column not found in the CSV header.")
                return

            # Process each row
            for row in reader:
                if len(row) > text_index:
                    original_text = row[text_index]
                    row[text_index] = clean_subheading(original_text)
                writer.writerow(row)

        print(f"Successfully cleaned '{input_file}' and saved to '{output_file}'.")
        print(f"You should now update 'bible.service.ts' to use '{output_file}'.")

    except FileNotFoundError:
        print(f"Error: The file '{input_file}' was not found.")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == '__main__':
    # Get the absolute path of the directory where the script is located
    script_dir = os.path.dirname(os.path.abspath(__file__))

    # Construct full paths for the input and output files
    input_csv_path = os.path.join(script_dir, 'net.csv')
    output_csv_path = os.path.join(script_dir, 'net_cleaned.csv')

    clean_bible_csv(input_csv_path, output_csv_path)
