#!/usr/bin/env python3
"""
Simple HTTP server for BiblioDigital static website
Serves on port 5000 for Replit compatibility
"""

import http.server
import socketserver
import os
from functools import partial

PORT = 5000
DIRECTORY = "."

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Disable caching for development
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Custom logging format
        print(f"[BiblioDigital] {self.address_string()} - {format % args}")

Handler = MyHTTPRequestHandler

print(f"""
╔════════════════════════════════════════════════════════════╗
║                    BiblioDigital                           ║
║              Biblioteca Digital Personal                   ║
╠════════════════════════════════════════════════════════════╣
║  🌐 Servidor iniciado en http://0.0.0.0:{PORT}            ║
║  📁 Sirviendo archivos desde: {os.getcwd()}
║  ✅ Sistema de almacenamiento local activo                 ║
╚════════════════════════════════════════════════════════════╝
""")

socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n🛑 Servidor detenido")
        httpd.shutdown()
