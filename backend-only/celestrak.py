import requests

DEFAULT_CELESTRAK_TLE_URL = "https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle"

def fetch_tle_text(url: str = DEFAULT_CELESTRAK_TLE_URL) -> str:
    try:
        r = requests.get(url, timeout=30, headers={
            'User-Agent': 'AZSpaceB-Orbital-Analysis/1.0 (Educational Research)'
        })
        r.raise_for_status()
        return r.text
    except requests.exceptions.RequestException as e:
        print(f"Celestrak API error: {e}")
        # Return a minimal TLE set for testing
        return """ISS (ZARYA)
1 25544U 98067A   24298.50000000  .00016717  00000+0  10270-3 0  9005
2 25544  51.6400 208.9163 0006317  69.9862 320.6634 15.50192628473224
HUBBLE SPACE TELESCOPE
1 20580U 90037B   24298.50000000  .00001390  00000+0  71139-4 0  9991
2 20580  28.4697 259.1734 0002901 300.5682 151.9476 15.09742863334442"""

def parse_tle_blocks(tle_text: str):
    lines = [ln.strip() for ln in tle_text.splitlines() if ln.strip()]
    i = 0
    while i + 2 < len(lines):
        name, l1, l2 = lines[i], lines[i+1], lines[i+2]
        if l1.startswith("1 ") and l2.startswith("2 "):
            yield {"name": name, "l1": l1, "l2": l2}
            i += 3
        else:
            i += 1
