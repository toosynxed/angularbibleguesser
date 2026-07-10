import re
import os
import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
from tqdm import tqdm

def clean_subheading(text):
    """
    Removes subheadings from the beginning of a verse.
    This regex finds text that starts with a capital letter and ends with a punctuation mark,
    but is not a full sentence itself (heuristic: it's short and followed by more text).
    """
    # This regex finds the first full sentence. It looks for any characters from the start,
    # non-greedily, until it finds a period, question mark, or exclamation mark followed by a space.
    match = re.search(r"^.*?[.!?]\s", str(text), re.DOTALL)

    if match:
        first_sentence = match.group(0)
        # A rough heuristic: if the "first sentence" is short and the whole text is much longer,
        # it's likely a subheading.
        if len(first_sentence) < 100 and len(text) > len(first_sentence) + 10:
            # Find the start of the actual verse text after the subheading
            verse_start_index = match.end()
            return text[verse_start_index:].strip()

    # If no subheading is detected, or if the logic fails, return the original text.
    return text

def upload_to_firestore():
    """
    Reads the bible CSV, cleans it, and uploads the data to a Firestore collection.
    """
    # --- 1. Initialize Firebase Admin SDK ---
    # Ensure the serviceAccountKey.json is in the same directory as this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    key_path = os.path.join(script_dir, 'serviceAccountKey.json')

    try:
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        print("Firebase initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        print("Please ensure 'serviceAccountKey.json' is in the 'src/assets' directory.")
        return

    # --- 2. Read and Clean CSV ---
    input_csv_path = os.path.join(script_dir, 'net.csv')
    try:
        df = pd.read_csv(input_csv_path, encoding='latin-1')
        print(f"Read {len(df)} rows from {input_csv_path}.")
        # Clean the 'Text' column
        df['Text'] = df['Text'].apply(clean_subheading)
        print("Verse text cleaned.")
    except Exception as e:
        print(f"Error reading or cleaning CSV: {e}")
        return

    # --- 3. Upload to Firestore using Batches ---
    print("Uploading data to Firestore collection 'verses'...")
    collection_ref = db.collection('verses')
    batch = db.batch()
    commit_count = 0

    for index, row in tqdm(df.iterrows(), total=df.shape[0], desc="Uploading"):
        doc_ref = collection_ref.document(str(row['Verse ID']))
        verse_data = {
            'verseId': int(row['Verse ID']),
            'bookName': row['Book Name'],
            'bookNumber': int(row['Book Number']),
            'chapter': int(row['Chapter']),
            'verse': int(row['Verse']),
            'text': row['Text']
        }
        batch.set(doc_ref, verse_data)
        commit_count += 1

        # Firestore batches have a limit of 500 operations.
        # We commit every 499 to be safe.
        if commit_count == 499:
            batch.commit()
            batch = db.batch() # Start a new batch
            commit_count = 0

    batch.commit() # Commit the final batch
    print(f"\nSuccessfully uploaded {len(df)} verses to Firestore.")

if __name__ == '__main__':
    upload_to_firestore()
