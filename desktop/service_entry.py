import os
import sys
import threading
import time
import signal
from pathlib import Path
import uvicorn
from local_service.app import create_app

if __name__ == '__main__':
    os.environ['PATH']='/Library/TeX/texbin:/opt/homebrew/bin:/usr/local/bin:'+os.environ.get('PATH','/usr/bin:/bin')
    parent=int(os.environ.get('CAREER_OS_PARENT_PID','0'))
    if parent:
        def watch_parent():
            while True:
                time.sleep(1)
                try:os.kill(parent,0)
                except ProcessLookupError:
                    os.kill(os.getpid(),signal.SIGTERM);return
        threading.Thread(target=watch_parent,daemon=True).start()
    uvicorn.run(create_app(),host='127.0.0.1',port=43119,access_log=False)
