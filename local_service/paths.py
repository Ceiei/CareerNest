import os
import sys
from pathlib import Path


def data_directory():
    if os.environ.get('CAREER_OS_DATA'):
        return Path(os.environ['CAREER_OS_DATA']).expanduser().resolve()
    if sys.platform == 'darwin':
        return Path.home() / 'Library' / 'Application Support' / 'Career OS'
    if sys.platform == 'win32':
        return Path(os.environ.get('LOCALAPPDATA', Path.home() / 'AppData' / 'Local')) / 'Career OS'
    return Path.home() / '.local' / 'share' / 'career-os'
