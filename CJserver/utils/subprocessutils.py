from subprocess import *
import subprocess
import json

def run_jsfile(filename: str, input_data):
    str.encode(json.dumps(input_data))
    result = subprocess.run(['node', filename], input=input_data, capture_output=True)
    
    