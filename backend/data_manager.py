import akshare as ak
import pandas as pd
import json
import os
import io
import requests
import warnings
import datetime
from typing import List, Set

def get_recent_trading_date() -> str:
    """Get a recent trading date (e.g., today or yesterday) as 'YYYYMMDD'"""
    # Simple logic: try today, if weekend, go back. 
    # For robustness, we can just try a few recent dates in the fetch loop.
    return datetime.datetime.now().strftime("%Y%m%d")

def fetch_sh_margin_stocks() -> Set[str]:
    """Fetch Shanghai (SH) margin trading stocks"""
    print("Fetching SH Margin Stocks...")
    # Try a few recent dates
    dates = []
    today = datetime.datetime.now()
    for i in range(10): # Look back 10 days
        d = today - datetime.timedelta(days=i)
        dates.append(d.strftime("%Y%m%d"))
        
    for date_str in dates:
        try:
            print(f"Trying SH date: {date_str}")
            df = ak.stock_margin_detail_sse(date=date_str)
            if df is not None and not df.empty:
                if '标的证券代码' in df.columns:
                    codes = set(df['标的证券代码'].astype(str).str.zfill(6).tolist())
                    print(f"Success SH! Found {len(codes)} stocks.")
                    return codes
        except Exception as e:
            print(f"SH fetch failed for {date_str}: {e}")
            continue
    
    print("Failed to fetch SH margin stocks after multiple attempts.")
    return set()

def get_sz_margin_stocks_fixed(date: str) -> pd.DataFrame:
    """
    Fixed version of ak.stock_margin_underlying_info_szse that uses io.BytesIO
    to be compatible with pandas 3.0+
    """
    url = "https://www.szse.cn/api/report/ShowReport"
    params = {
        "SHOWTYPE": "xlsx",
        "CATALOGID": "1834_xxpl",
        "txtDate": "-".join([date[:4], date[4:6], date[6:]]),
        "tab1PAGENO": "1",
        "random": "0.7425245522795993",
        "TABKEY": "tab1",
    }
    headers = {
        "Referer": "https://www.szse.cn/disclosure/margin/object/index.html",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/88.0.4324.150 Safari/537.36",
    }
    
    try:
        r = requests.get(url, params=params, headers=headers, timeout=10)
        r.raise_for_status()
        
        if not r.content.startswith(b'PK'):
            return None
            
        with warnings.catch_warnings(record=True):
            warnings.simplefilter("always")
            temp_df = pd.read_excel(io.BytesIO(r.content), engine="openpyxl", dtype={"证券代码": str})
        return temp_df
    except Exception as e:
        # print(f"Error requesting SZ data: {e}")
        return None

def fetch_sz_margin_stocks() -> Set[str]:
    """Fetch Shenzhen (SZ) margin trading stocks"""
    print("Fetching SZ Margin Stocks...")
    dates = []
    today = datetime.datetime.now()
    for i in range(10):
        d = today - datetime.timedelta(days=i)
        dates.append(d.strftime("%Y%m%d"))
        
    for date_str in dates:
        try:
            print(f"Trying SZ date: {date_str}")
            df = get_sz_margin_stocks_fixed(date=date_str)
            if df is not None and not df.empty:
                codes = set()
                if '证券代码' in df.columns:
                    codes = set(df['证券代码'].astype(str).str.zfill(6).tolist())
                elif '标的证券代码' in df.columns:
                    codes = set(df['标的证券代码'].astype(str).str.zfill(6).tolist())
                
                if codes:
                    print(f"Success SZ! Found {len(codes)} stocks.")
                    return codes
        except Exception as e:
            print(f"SZ fetch failed for {date_str}: {e}")
            continue
            
    print("Failed to fetch SZ margin stocks after multiple attempts.")
    return set()

def update_margin_stocks_file(filepath: str = "margin_stocks.json") -> int:
    """Fetch both SH and SZ margin stocks and update the JSON file"""
    sh_codes = fetch_sh_margin_stocks()
    sz_codes = fetch_sz_margin_stocks()
    
    all_codes = list(sh_codes.union(sz_codes))
    all_codes.sort()
    
    if not all_codes:
        print("No margin stocks found. Keeping existing file if any.")
        return 0
        
    try:
        with open(filepath, "w") as f:
            json.dump(all_codes, f)
        print(f"Successfully saved {len(all_codes)} margin stocks to {filepath}")
        return len(all_codes)
    except Exception as e:
        print(f"Failed to save margin stocks: {e}")
        return 0

if __name__ == "__main__":
    # Test run
    update_margin_stocks_file()
