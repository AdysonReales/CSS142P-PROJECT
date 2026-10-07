"""
Web Dashboard Server for Carlo's Bacolod Chicken House Express (CHE) Makati.
Hosts the Three.js 3D Digital Twin, live Discrete-Event Simulation, and scenario analytics.
"""

import http.server
import socketserver
import webbrowser
from pathlib import Path
import os
import sys


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Suppress routine GET request logging to keep console clean
        pass


def launch_dashboard(port: int = 8080, open_browser: bool = True):
    web_dir = Path(__file__).resolve().parent.parent.parent / "web"
    os.chdir(web_dir)

    server_address = ("", port)
    # Use ThreadingHTTPServer for responsive multi-threaded serving
    with http.server.ThreadingHTTPServer(server_address, QuietHandler) as httpd:
        url = f"http://localhost:{port}"
        print("=" * 70)
        print("  CARLO'S BACOLOD CHICKEN HOUSE EXPRESS (CHE) MAKATI - 3D TWIN")
        print(f"  Interactive 3D Digital Twin live at: {url}")
        print("=" * 70)

        if open_browser:
            webbrowser.open(url)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nDashboard server stopped.")
            httpd.shutdown()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    launch_dashboard(port=port)
