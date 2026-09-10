"""Create an allowlisted source release, never copy the developer workspace wholesale."""
import hashlib
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    'README.md', 'PRIVACY.md', 'IMPLEMENTATION_STATUS.md', '.gitignore',
    'package.json', 'package-lock.json', 'tsconfig.json', 'vitest.config.ts', 'wxt.config.ts',
    'Start Career OS.command', 'Start Career OS.cmd',
    'desktop/CareerOS.swift', 'desktop/build.py', 'desktop/service_entry.py',
    'scripts/demo-common.mjs', 'scripts/setup-demo.mjs', 'scripts/start-demo.mjs',
    'scripts/quick-start.mjs', 'scripts/python-task.mjs', 'scripts/doctor.py',
    'scripts/package-demo.py', 'scripts/sync-extension.py', 'scripts/export-workspace-schema.ts',
    'scripts/smoke-desktop.mjs', '.github/workflows/demo.yml',
    'test-pages/university-form.html', 'test-pages/harness.ts', 'docs/RELEASING.md',
    'local_service/__init__.py', 'local_service/app.py', 'local_service/demo.py',
    'local_service/engine.py', 'local_service/models.py', 'local_service/paths.py',
    'local_service/migrate.py', 'local_service/run.py', 'local_service/test_app.py',
    'local_service/test_demo.py', 'local_service/requirements.txt',
    'local_service/requirements-demo.txt', 'local_service/requirements-desktop.txt',
    'local_service/templates/resume_cn.tex', 'local_service/static/index.html',
    'local_service/static/workspace.js', 'local_service/static/workspace.css',
    'local_service/static/schema.json', 'local_service/static/demo-form.html',
]
TREES = {
    'entrypoints': {'.ts', '.css', '.html'}, 'utils': {'.ts'}, 'types': {'.ts'},
    'tests': {'.ts'}, 'public': {'.png', '.svg'}, 'desktop/electron': {'.cjs'},
    'chrome-mv3': {'.json', '.js', '.html', '.css', '.svg', '.png'},
}


def selected_files():
    selected = set(FILES)
    for folder, extensions in TREES.items():
        for file in (ROOT / folder).rglob('*'):
            relative = file.relative_to(ROOT)
            if file.is_symlink():
                raise ValueError(f'Symlinks are not release inputs: {relative}')
            if file.is_file() and file.suffix in extensions and not any(part.startswith('.') or part == '__pycache__' for part in relative.parts):
                selected.add(relative.as_posix())
    for name in selected:
        file = ROOT / name
        if not file.is_file() or file.is_symlink():
            raise ValueError(f'Missing or unsafe release input: {name}')
        if file.suffix in {'.txt', '.json'} and ('token' in file.name.lower() or 'backup' in file.name.lower()):
            raise ValueError(f'Credential/data file is not publishable: {name}')
    return sorted(selected)


def main():
    version = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))['version']
    manifest = json.loads((ROOT / 'chrome-mv3/manifest.json').read_text(encoding='utf-8'))
    if manifest['version'] != version:
        raise ValueError('Rebuild and synchronize the extension before packaging')
    built = ROOT / '.output/chrome-mv3'
    if built.is_dir():
        actual = {p.relative_to(ROOT / 'chrome-mv3').as_posix(): p.read_bytes() for p in (ROOT / 'chrome-mv3').rglob('*') if p.is_file()}
        expected = {p.relative_to(built).as_posix(): p.read_bytes() for p in built.rglob('*') if p.is_file()}
        if actual != expected:
            raise ValueError('chrome-mv3 differs from the current build; run demo:setup')
    files = selected_files()
    destination = ROOT / 'release'
    destination.mkdir(exist_ok=True)
    name = f'Career-OS-demo-{version}'
    target = destination / f'{name}.zip'
    checksums = {}
    with zipfile.ZipFile(target, 'w', zipfile.ZIP_DEFLATED) as archive:
        for relative in files:
            data = (ROOT / relative).read_bytes()
            checksums[relative] = hashlib.sha256(data).hexdigest()
            info = zipfile.ZipInfo(f'{name}/{relative}')
            info.create_system = 3
            info.external_attr = (0o100755 if relative.endswith('.command') else 0o100644) << 16
            archive.writestr(info, data, compress_type=zipfile.ZIP_DEFLATED)
        archive.writestr(f'{name}/RELEASE_FILES.json', json.dumps(checksums, indent=2) + '\n')
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    target.with_suffix('.zip.sha256').write_text(f'{digest}  {target.name}\n', encoding='utf-8')
    print(f'{target}\n{len(files)} allowlisted files; {target.stat().st_size:,} bytes\nSHA256 {digest}')


if __name__ == '__main__':
    main()
