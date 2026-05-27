import os
import sys

print("Checking API Keys in environment:")
for key in os.environ:
    if any(x in key.upper() for x in ["GEMINI", "GOOGLE", "API", "KEY", "TOKEN"]):
        val = os.environ[key]
        print(f"Key name: {key}, exists: {bool(val)}, length: {len(val) if val else 0}")
