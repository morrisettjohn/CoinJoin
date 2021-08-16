import traceback

try:
    print(1/0)
except Exception:
    traceback.print_exc()

print("hi")