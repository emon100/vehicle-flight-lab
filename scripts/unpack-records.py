"""Verify and optionally expand the losslessly compressed historical records."""
from pathlib import Path
import argparse, gzip, hashlib, json

ROOT = Path(__file__).resolve().parent.parent


def unpack(check_only=False):
    records = json.loads((ROOT/'docs/records.json').read_text())
    for record in records:
        source = (ROOT/record['path']).resolve()
        target = (ROOT/record['unpacked']).resolve()
        source.relative_to(ROOT)
        target.relative_to(ROOT)
        raw = gzip.decompress(source.read_bytes())
        assert len(raw) == record['bytes'] and hashlib.sha256(raw).hexdigest() == record['sha256'], f'Corrupt record: {record["path"]}'
        if target.exists():
            assert target.read_bytes() == raw, f'Refusing to replace a changed record: {record["unpacked"]}'
        elif not check_only:
            target.parent.mkdir(parents=True, exist_ok=True)
            with target.open('xb') as stream:
                stream.write(raw)
    print(f'Verified {len(records)} historical records'+(' without writing files.' if check_only else '; expanded missing records.'))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    unpack(args.check)
