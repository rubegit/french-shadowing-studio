#!/usr/bin/env python3
"""Tách index.html thành css/, js/, partials/ mà KHÔNG đổi nội dung (lossless).
Chạy tại thư mục gốc repo:  python3 tools/restructure.py <lệnh>
  scan                     Báo cáo các khối <style>/<script> nội tuyến (không ghi gì)
  extract [--map map.json] [--bust]   Tách khối nội tuyến ra file (giữ id/data-*), tạo src/index.src.html
                           map.json: {"blocks":[..],"file":..} gộp; {"block":N,"split":[..]} cắt; {"keep":[..]} giữ nội tuyến
  cut --id <id> --to partials/x.html  Cắt một phần tử HTML (theo id) thành partial
  build                    Ghép src/index.src.html + partials -> index.html
  verify                   Chứng minh việc tách là lossless (ngay sau extract/cut)
Chỉ dùng thư viện chuẩn Python 3."""
import re, sys, json, hashlib, argparse, pathlib, shutil, subprocess, html
P = pathlib.Path
ORIG, SRC, OUT, MAN = P('index.original.html'), P('src/index.src.html'), P('index.html'), P('tools/split-manifest.json')
TOK = re.compile(r'<!--.*?-->|<(script|style)\b([^>]*)>(.*?)</\1\s*>', re.S | re.I)
JS_TYPES = {'', 'text/javascript', 'application/javascript', 'module'}

def sha(s): return hashlib.sha256(s.encode('utf-8')).hexdigest()
def line_of(t, i): return t.count('\n', 0, i) + 1
def attrs(a):
    return {m.group(1).lower(): (m.group(2) or m.group(3) or m.group(4) or '')
            for m in re.finditer(r'([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s>]+)))?', a)}

def blocks(t):
    out = []
    for m in TOK.finditer(t):
        if not m.group(1): continue
        kind, a, body = m.group(1).lower(), attrs(m.group(2)), m.group(3)
        if not body.strip(): continue
        if kind == 'script':
            if 'src' in a or a.get('type', '').lower() not in JS_TYPES: continue
        out.append(dict(kind=kind, attrs=a, rawattrs=m.group(2), start=m.start(), end=m.end(),
                        open=t[m.start():m.start(3)], close=t[m.end(3):m.end()], body=body))
    for i, b in enumerate(out, 1): b['n'] = i
    return out

def cmd_scan(_):
    t = (ORIG if ORIG.exists() else OUT).read_text(encoding='utf-8')
    extra = ''.join(p.read_text(encoding='utf-8', errors='ignore') for p in list(P('.').glob('*.js')) + list(P('.').glob('*.css')))
    bs = blocks(t); print(f'{len(t.splitlines())} dòng, {len(bs)} khối nội tuyến\n')
    print(' #  loại    dòng-bắt-đầu   số-dòng  id và số lần id xuất hiện NGOÀI thẻ mở của nó / gợi-ý')
    for b in bs:
        first = next((l.strip() for l in b['body'].splitlines() if l.strip()), '')[:50]
        i = b['attrs'].get('id'); ref = ''
        if i: ref = f"id={i} refs={t.count(i) - b['open'].count(i) + extra.count(i)}"
        print(f"{b['n']:>3}  {b['kind']:<7} {line_of(t, b['start']):>10} {b['body'].count(chr(10)) + 1:>9}  {ref:<34} {first}")
    print('\nrefs > 0: có chỗ khác nhắc tới id này (JS/CSS/HTML). Công cụ giữ id trên thẻ thay thế; KHÔNG gộp khối đó với khối khác.')

def update_cache_busters(t):
    def repl(m):
        attr, path, old_v = m.group(1), m.group(2), m.group(3)
        p = P(path)
        if p.exists():
            new_v = sha(p.read_text(encoding='utf-8'))[:8]
            return f'{attr}="{path}?v={new_v}"'
        return m.group(0)
    return re.sub(r'(src|href)="((?:js|css)/[^"?]+)\?v=([^"]*)"', repl, t)

def build():
    src_text = update_cache_busters(SRC.read_text(encoding='utf-8'))
    SRC.write_text(src_text, encoding='utf-8')
    t = src_text; man = json.loads(MAN.read_text(encoding='utf-8'))
    for e in man['entries']:
        if e['kind'] == 'include' and e['replacement'] in t:
            p = P(e['file'])
            if p.exists(): t = t.replace(e['replacement'], p.read_text(encoding='utf-8'))
    t = update_cache_busters(t)
    OUT.write_text(t, encoding='utf-8'); return t

def cmd_extract(a):
    if not ORIG.exists(): ORIG.write_text(OUT.read_text(encoding='utf-8'), encoding='utf-8'); print('Đã sao lưu ->', ORIG)
    t = ORIG.read_text(encoding='utf-8'); bs = blocks(t)
    groups = {b['n']: [b] for b in bs}
    if a.map:
        for g in json.loads(P(a.map).read_text(encoding='utf-8')):
            if 'keep' in g:
                for n in g['keep']: groups.pop(n, None)
                continue
            if 'split' in g:  # cắt MỘT khối thành nhiều file theo số dòng
                b = next(b for b in bs if b['n'] == g['block']); b['split'] = g['split']; continue
            ns = g['blocks']; gb = [next(b for b in bs if b['n'] == n) for n in ns]
            for x, y in zip(gb, gb[1:]):
                if x['kind'] != y['kind'] or t[x['end']:y['start']].strip(): sys.exit(f"Khối {x['n']} và {y['n']} không liền kề cùng loại, không gộp được (sẽ đổi thứ tự thực thi).")
            for n in ns: groups.pop(n, None)
            groups[ns[0]] = gb; gb[0]['file'] = g['file']
    new, pos, ents = [], 0, []
    for n in sorted(groups):
        gb = groups[n]; b0, b1 = gb[0], gb[-1]
        body = ''.join(x['body'] for x in gb)
        if 'split' in b0:
            lines, parts, i = body.splitlines(keepends=True), [], 0
            for sp in b0['split']:
                j = sp.get('to_line', len(lines)); parts.append((sp['file'], ''.join(lines[i:j]))); i = j
            if i < len(lines): parts.append((b0['split'][-1]['file'], ''.join(lines[i:])))  # phần dư gộp vào file cuối
            if len(parts) > len(b0['split']): sys.exit('Danh sách split chưa phủ hết khối; thêm một mục cuối không có to_line.')
        else:
            parts = [(b0.get('file') or (f"css/{b0['n']:02d}-style.css" if b0['kind'] == 'style' else f"js/{b0['n']:02d}-script.js"), body)]
        tags = []; ids = [x['attrs'].get('id') for x in gb if x['attrs'].get('id')]
        if len(ids) > 1: print(f'  CẢNH BÁO: gộp nhiều khối có id, chỉ giữ id đầu; BỊ BỎ: {ids[1:]}')
        extra_attr = ''.join(f' {k}="{html.escape(v, quote=True)}"' for k, v in b0['attrs'].items() if k == 'id' or k.startswith('data-'))
        for pi, (f, txt) in enumerate(parts):
            ea = extra_attr if pi == 0 else ''
            if b0['kind'] == 'style':
                med = b0['attrs'].get('media'); tg = f'<link rel="stylesheet" href="{f}"{ea}' + (f' media="{med}"' if med else '') + '>'
            else:
                keep = ' type="module"' if b0['attrs'].get('type', '').lower() == 'module' else ''
                tg = f'<script{ea}{keep} src="{f}"></script>'
            if a.bust: tg = tg.replace(f'"{f}"', f'"{f}?v={sha(txt)[:8]}"')
            P(f).parent.mkdir(parents=True, exist_ok=True); P(f).write_text(txt, encoding='utf-8'); tags.append(tg)
            print(f'  {f}  ({txt.count(chr(10)) + 1} dòng)')
            if shutil.which('node') and b0['kind'] == 'script' and 'split' in b0 and b0['attrs'].get('type', '') != 'module':
                if subprocess.run(['node', '--check', f], capture_output=True).returncode: print(f'  CẢNH BÁO: {f} không phải JS hợp lệ độc lập, cắt sai ranh giới?')
        rep = '\n'.join(tags)
        new.append(t[pos:b0['start']]); new.append(rep); pos = b1['end']
        ents.append(dict(kind='extract', replacement=rep, files=[f for f, _ in parts],
                         pieces=[dict(open=x['open'], close=x['close'], body=x['body'], gap=(t[x['end']:gb[i + 1]['start']] if i + 1 < len(gb) else '')) for i, x in enumerate(gb)]))
    new.append(t[pos:]); P('src').mkdir(exist_ok=True); SRC.write_text(''.join(new), encoding='utf-8')
    MAN.parent.mkdir(exist_ok=True); MAN.write_text(json.dumps(dict(original_sha256=sha(t), entries=ents), ensure_ascii=False, indent=1), encoding='utf-8')
    build(); print('Xong. Chạy: python3 tools/restructure.py verify')

def match_end(t, m, tag):
    mt = TOK.sub(lambda x: re.sub(r'[^\n]', ' ', x.group(0)), t)  # che chú thích và script/style
    d = 1
    for x in re.finditer(r'<(/?)' + tag + r'\b[^>]*>', mt[m.end():], re.I):
        d += -1 if x.group(1) else 1
        if d == 0: return m.end() + x.end()
    sys.exit('Không tìm thấy thẻ đóng khớp.')

def cmd_cut(a):
    t = SRC.read_text(encoding='utf-8')
    m = re.search(r'<([a-zA-Z][\w-]*)\b[^>]*\bid\s*=\s*["\']' + re.escape(a.id) + r'["\'][^>]*>', t)
    if not m: sys.exit('Không thấy phần tử id=' + a.id)
    end = match_end(t, m, m.group(1)); el = t[m.start():end]
    rep = f'<!-- @include {a.to} -->'
    P(a.to).parent.mkdir(parents=True, exist_ok=True); P(a.to).write_text(el, encoding='utf-8')
    SRC.write_text(t[:m.start()] + rep + t[end:], encoding='utf-8')
    man = json.loads(MAN.read_text(encoding='utf-8')); man['entries'].append(dict(kind='include', replacement=rep, file=a.to))
    MAN.write_text(json.dumps(man, ensure_ascii=False, indent=1), encoding='utf-8'); build()
    print(f'Đã cắt #{a.id} ({el.count(chr(10)) + 1} dòng) -> {a.to}')

def cmd_verify(_):
    man = json.loads(MAN.read_text(encoding='utf-8')); t = SRC.read_text(encoding='utf-8')
    for e in reversed([e for e in man['entries'] if e['kind'] == 'include']): t = t.replace(e['replacement'], P(e['file']).read_text(encoding='utf-8'))
    for e in man['entries']:
        if e['kind'] != 'extract': continue
        body = ''.join(P(f).read_text(encoding='utf-8') for f in e['files']); s, pos, ps = '', 0, e['pieces']
        for p in ps:
            ln = len(p['body']); s += p['open'] + body[pos:pos + ln] + p['close'] + p['gap']; pos += ln
        t = t.replace(e['replacement'], s, 1)
    ok = sha(t) == man['original_sha256']
    print('LOSSLESS: đúng từng byte với bản gốc.' if ok else 'KHÁC bản gốc (bình thường nếu đã sửa file sau khi tách).'); sys.exit(0 if ok else 1)

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); sp = ap.add_subparsers(dest='c', required=True)
    sp.add_parser('scan'); e = sp.add_parser('extract'); e.add_argument('--map'); e.add_argument('--bust', action='store_true')
    c = sp.add_parser('cut'); c.add_argument('--id', required=True); c.add_argument('--to', required=True)
    sp.add_parser('build'); sp.add_parser('verify')
    a = ap.parse_args(); {'scan': cmd_scan, 'extract': cmd_extract, 'cut': cmd_cut, 'build': lambda _: build(), 'verify': cmd_verify}[a.c](a)
