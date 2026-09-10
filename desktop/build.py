"""Build a self-contained macOS app: native WebKit shell + bundled Python service."""
import json
import plistlib
import shutil
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
build=ROOT/'desktop'/'build'; app=ROOT/'dist'/'Career OS.app'
build.mkdir(parents=True,exist_ok=True)
subprocess.run([str(ROOT/'.venv/bin/python'),'-m','PyInstaller','--noconfirm','--clean','--onedir','--name','career-service','--paths',str(ROOT),'--distpath',str(build/'service'),'--workpath',str(build/'pyinstaller'),'--specpath',str(build),'--add-data',f'{ROOT / "local_service/static"}:local_service/static','--add-data',f'{ROOT / "local_service/templates"}:local_service/templates',str(ROOT/'desktop/service_entry.py')],check=True,cwd=ROOT)
if app.exists():shutil.rmtree(app)
contents=app/'Contents';(contents/'MacOS').mkdir(parents=True);(contents/'Resources').mkdir()
shutil.copytree(build/'service/career-service',contents/'Resources/server')
subprocess.run(['xcrun','swiftc',str(ROOT/'desktop/CareerOS.swift'),'-o',str(contents/'MacOS/CareerOS'),'-framework','AppKit','-framework','WebKit','-target','arm64-apple-macosx13.0','-O'],check=True)
iconset=build/'CareerOS.iconset';iconset.mkdir(exist_ok=True)
for size in (16,32,128):shutil.copyfile(ROOT/f'public/icons/icon-{size}.png',iconset/f'icon_{size}x{size}.png')
subprocess.run(['iconutil','-c','icns',str(iconset),'-o',str(contents/'Resources/CareerOS.icns')],check=True)
info=dict(CFBundleName='Career OS',CFBundleDisplayName='Career OS',CFBundleIdentifier='local.career-os.desktop',CFBundleExecutable='CareerOS',CFBundleIconFile='CareerOS',CFBundlePackageType='APPL',CFBundleShortVersionString='0.4.0',CFBundleVersion='4',LSMinimumSystemVersion='13.0',NSHighResolutionCapable=True,NSAppTransportSecurity={'NSAllowsLocalNetworking':True})
with (contents/'Info.plist').open('wb') as f:plistlib.dump(info,f)
subprocess.run(['codesign','--force','--deep','--sign','-',str(app)],check=True)
subprocess.run(['codesign','--verify','--deep','--strict',str(app)],check=True)
print('Built:',app)
