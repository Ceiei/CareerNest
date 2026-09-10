"""Desktop-owned service. Closing the parent's stdin pipe stops it on both OSes."""
import json
import os
import sys
import threading

import uvicorn

from .app import create_app


class DesktopServer(uvicorn.Server):
    async def startup(self, sockets=None):
        await super().startup(sockets)
        if self.started:
            print(json.dumps({'career_service': 'ready', 'pid': os.getpid()}), flush=True)


def main():
    server = DesktopServer(uvicorn.Config(create_app(), host='127.0.0.1', port=int(os.environ.get('CAREER_OS_PORT', '43119')), access_log=False))

    def watch_pipe():
        for _ in sys.stdin:
            pass
        server.should_exit = True

    threading.Thread(target=watch_pipe, daemon=True).start()
    server.run()


if __name__ == '__main__':
    main()
