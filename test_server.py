#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 8080
os.chdir('frontend')

Handler = http.server.SimpleHTTPServer
httpd = socketserver.TCPServer(("", PORT), Handler)

print(f"Server running at http://localhost:{PORT}")
httpd.serve_forever()