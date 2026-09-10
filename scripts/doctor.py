"""Read-only prerequisites check; --pdf also compiles a synthetic document in a temp dir."""
import argparse
import importlib
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--pdf', action='store_true', help='Require a successful Chinese PDF compile')
    args = parser.parse_args()
    if sys.platform == 'darwin':
        os.environ['PATH'] = '/Library/TeX/texbin:' + os.environ.get('PATH', '')
    failed = False
    print(f'Python: {sys.version.split()[0]} / {sys.platform}')
    for module in ('fastapi', 'uvicorn', 'jinja2', 'httpx'):
        try:
            importlib.import_module(module)
            print(f'OK {module}')
        except ImportError:
            print(f'MISSING {module}: run npm run demo:setup')
            failed = True
    compiler = shutil.which('xelatex')
    print('XeLaTeX: ' + (compiler or 'MISSING (PDF unavailable; install MacTeX / TeX Live and restart terminal)'))
    if args.pdf:
        if not compiler:
            failed = True
        else:
            with tempfile.TemporaryDirectory(prefix='career-pdf-check-') as directory:
                Path(directory, 'check.tex').write_text(
                    r'\documentclass[UTF8,fontset=fandol]{ctexart}\usepackage{geometry,enumitem,hyperref}\begin{document}Career OS 中文导出测试\end{document}', encoding='utf-8')
                try:
                    result = subprocess.run([compiler, '-no-shell-escape', '-interaction=nonstopmode', '-halt-on-error', 'check.tex'],
                                            cwd=directory, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=90)
                    ok = result.returncode == 0 and Path(directory, 'check.pdf').is_file()
                except subprocess.TimeoutExpired:
                    ok = False
                print('Chinese PDF: ' + ('OK' if ok else 'FAILED (check ctex / Fandol packages)'))
                failed |= not ok
    return int(failed)


if __name__ == '__main__':
    raise SystemExit(main())
