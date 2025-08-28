import requests
import json

def test_api():
    api_url = "https://db.ygoprodeck.com/api/v7/cardinfo.php"
    
    print("Testing YuGiOh API...")
    
    try:
        # Test basic request
        response = requests.get(api_url, timeout=30)
        print(f"Status code: {response.status_code}")
        print(f"Headers: {response.headers}")
        print(f"Content length: {len(response.content)}")
        print(f"Content type: {response.headers.get('content-type', 'unknown')}")
        
        # Check first 200 characters
        content_preview = response.text[:200] if response.text else "No content"
        print(f"Content preview: {content_preview}")
        
        # Try to parse as JSON
        if response.headers.get('content-type', '').startswith('application/json'):
            data = response.json()
            if isinstance(data, dict) and 'data' in data:
                cards = data['data']
                print(f"Number of cards in API: {len(cards)}")
                if cards:
                    first_card = cards[0]
                    print(f"First card name: {first_card.get('name', 'No name')}")
                    print(f"First card keys: {list(first_card.keys())}")
            else:
                print("Unexpected API structure")
        else:
            print("Response is not JSON")
            
    except requests.exceptions.RequestException as e:
        print(f"Request error: {e}")
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
    except Exception as e:
        print(f"Other error: {e}")

if __name__ == "__main__":
    test_api()