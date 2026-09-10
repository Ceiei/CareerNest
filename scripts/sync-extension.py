"""Replace generated files, retaining a reversible backup of the previous package."""
import shutil
from datetime import datetime
from pathlib import Path

root=Path(__file__).resolve().parents[1]
source=root/'.output/chrome-mv3';target=root/'chrome-mv3'
assert (source/'manifest.json').is_file(), 'Build the extension first'
if target.exists():
    backup=root/'archive'/('extension-build-'+datetime.now().strftime('%Y%m%d-%H%M%S-%f'))
    backup.parent.mkdir(exist_ok=True);target.rename(backup)
shutil.copytree(source,target)
assert sorted(p.relative_to(source) for p in source.rglob('*') if p.is_file()) == sorted(p.relative_to(target) for p in target.rglob('*') if p.is_file())
print('Extension synchronized; obsolete editor bundles removed from the loaded directory.')
