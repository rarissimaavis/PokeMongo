import pandas as pd
import json

def clean_data(value):
    """Convert null values to None"""
    if pd.isna(value):
        return None
    return value

def convert_csv_to_json(csv_file, json_file):
    """Convert CSV to JSON for MongoDB compatibility"""
    # Read and clean data
    df = pd.read_csv(csv_file)
    df = df.applymap(clean_data)
    
    # Convert to list of dictionaries (MongoDB documents)
    data = df.to_dict('records')
    
    # Save as JSON file
    with open(json_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Successfully converted {csv_file} to {json_file}")

if __name__ == "__main__":
    convert_csv_to_json('Trainers.csv', 'trainers.json')
    convert_csv_to_json('Pokemon.csv', 'pokemon.json')