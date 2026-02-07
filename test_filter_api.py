import requests
import json

def test_filter_api():
    url = "http://localhost:8001/api/filter"
    params = {
        "codes": "600000,600036,300059",
        "include_kcb_cyb": "true",
        "prefer_tail_inflow": "true",
        "strict_risk_control": "true"
    }
    
    try:
        print(f"Testing GET {url} with params: {params}")
        response = requests.get(url, params=params)
        
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Response JSON structure keys:", data.keys())
            print(f"Count: {data.get('count')}")
            print(f"Data length: {len(data.get('data', []))}")
            if data.get('data'):
                print("First item sample:", json.dumps(data['data'][0], ensure_ascii=False, indent=2)[:200] + "...")
            else:
                print("Data is empty.")
        else:
            print("Error response:", response.text)
            
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_filter_api()
