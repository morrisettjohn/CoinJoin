
from params import *
from struct import *


def x():
    return z()

def z():
    return g()

def g():
    return 1/0

try:
    x()
except ZeroDivisionError:
    print("that sucks")