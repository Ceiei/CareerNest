"""Copy an existing SSOT once, using SQLite backup so WAL data is included."""
import argparse
import json
import shutil
import sqlite3
import tempfile
from pathlib import Path
from .paths import data_directory


def migrate(source, target):
    source, target = Path(source).resolve(), Path(target).resolve()
    if source == target or not (source / 'career.db').is_file():
        return 'no_source'
    if target.exists():
        # Never merge two directories or replace a live/established database.
        if any(target.iterdir()):
            return 'target_exists'
        target.rmdir()
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='career-migration-', dir=target.parent) as temp:
        staged=Path(temp)/'data'; staged.mkdir(mode=0o700)
        with sqlite3.connect(f'file:{source / "career.db"}?mode=ro', uri=True) as original:
            with sqlite3.connect(staged/'career.db') as copied:
                original.backup(copied)
                if copied.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                    raise RuntimeError('旧数据库检查失败，未迁移')
        for name in ('assets','outputs'):
            if (source/name).is_dir():
                shutil.copytree(source/name,staged/name)
        (staged/'migration.json').write_text(json.dumps({'source':str(source),'original_preserved':True},ensure_ascii=False), encoding='utf-8')
        (staged/'career.db').chmod(0o600)
        # Config tokens intentionally rotate. The old browser credential cannot edit the new SSOT.
        staged.rename(target)
    return 'migrated'


if __name__ == '__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('source'); parser.add_argument('--target',default=str(data_directory()))
    args=parser.parse_args(); print(migrate(args.source,args.target))
