import requests
import json

# URL to fetch data from
url = 'https://cerebro-beta-bot.herokuapp.com/cards?type=hero&origin=official'

# Make a GET request to the URL
response = requests.get(url)

# Check if the request was successful
if response.status_code == 200:
    data = response.json()
    
    # Set for keeping track of unique set IDs
    unique_setids = set()

    # List for storing the final extracted data
    extracted_data = []

    for card in data:
        # Get the setid for each card
        setid = card['Printings'][0]['SetId']

        # Add to the extracted_data list only if it's a new unique set ID
        if setid not in unique_setids:
            unique_setids.add(setid)
            extracted_data.append({'name': card['Name'], 'setid': setid})

    # Sorting the extracted data by name
    sorted_data = sorted(extracted_data, key=lambda x: x['name'])

    # Writing the sorted data to a JSON file
    with open('heroes.json', 'w') as file:
        json.dump(sorted_data, file, indent=4)
else:
    print(f"Failed to fetch data: {response.status_code}")
