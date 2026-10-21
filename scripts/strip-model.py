"""Remove images and UV data; retain geometry with plain paint and wheel materials."""
from pathlib import Path
import argparse, copy, hashlib, json, struct


def strip(source, destination):
    raw = source.read_bytes()
    magic, version, length = struct.unpack_from('<III', raw)
    assert magic == 0x46546c67 and version == 2 and length == len(raw), 'Invalid GLB header'
    size, kind = struct.unpack_from('<II', raw, 12)
    assert kind == 0x4e4f534a
    old = json.loads(raw[20:20+size])
    binary_size, kind = struct.unpack_from('<II', raw, 20+size)
    assert kind == 0x004e4942
    binary = raw[28+size:28+size+binary_size]
    doc = {'asset': {'version': '2.0', 'generator': 'vehicle-flight-lab texture-free export', 'copyright': 'Model created with Meshy (https://www.meshy.ai/) - CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)', 'extras': {'license': 'CC-BY-4.0', 'sourceSha256': hashlib.sha256(raw).hexdigest(), 'changes': 'Textures, images, UVs and old metadata removed. Plain paint and wheel materials; original refined geometry retained. Sandbox glazing and lamps use procedural fragment shading.'}}, 'scene': 0, 'scenes': copy.deepcopy(old['scenes']), 'nodes': copy.deepcopy(old['nodes']), 'meshes': [], 'materials': [], 'accessors': [], 'bufferViews': [], 'buffers': []}
    data = bytearray()
    types = {5121: ('B', 1), 5123: ('H', 2), 5125: ('I', 4), 5126: ('f', 4)}
    widths = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}

    def read_accessor(index):
        a = old['accessors'][index]
        assert 'sparse' not in a, 'Sparse accessors need explicit expansion'
        v = old['bufferViews'][a['bufferView']]
        assert v.get('buffer', 0) == 0
        fmt, component_size = types[a['componentType']]
        width = widths[a['type']]
        stride = v.get('byteStride', width*component_size)
        start = v.get('byteOffset', 0) + a.get('byteOffset', 0)
        assert start+(a['count']-1)*stride+width*component_size <= len(binary)
        return [struct.unpack_from('<'+fmt*width, binary, start+i*stride) for i in range(a['count'])]

    def add_accessor(rows, component_type, type_name, bounds=False):
        while len(data) % 4:
            data.append(0)
        start = len(data)
        fmt = '<'+types[component_type][0]*widths[type_name]
        data.extend(b''.join(struct.pack(fmt, *row) for row in rows))
        doc['bufferViews'].append({'buffer': 0, 'byteOffset': start, 'byteLength': len(data)-start})
        a = {'bufferView': len(doc['bufferViews'])-1, 'componentType': component_type, 'count': len(rows), 'type': type_name}
        if bounds:
            a.update(min=list(map(min, zip(*rows))), max=list(map(max, zip(*rows))))
        doc['accessors'].append(a)
        return len(doc['accessors'])-1

    palette = {'Paint': ('#b5bdc6',.62,.34)}
    for name, (color, metal, rough) in palette.items():
        rgb = [int(color[i:i+2], 16)/255 for i in [1,3,5]]
        rgb = [v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb]
        mat = {'name': name, 'pbrMetallicRoughness': {'baseColorFactor': rgb+[1], 'metallicFactor': metal, 'roughnessFactor': rough}}
        if name in ['Headlight', 'Tail light']:
            mat['emissiveFactor'] = [.65,.8,1] if name == 'Headlight' else [.8,.01,.02]
        doc['materials'].append(mat)
    materials = {m['name']: i for i, m in enumerate(doc['materials'])}
    cached = {}
    for mi, mesh in enumerate(old['meshes']):
        new = {'name': 'Vehicle body' if mi == 0 else 'Wheel', 'primitives': []}
        for primitive in mesh['primitives']:
            assert primitive.get('mode', 4) == 4, 'Only triangle meshes are supported'
            attributes = {}
            for key in ['POSITION','NORMAL']:
                index = primitive['attributes'][key]
                if index not in cached:
                    cached[index] = add_accessor(read_accessor(index), 5126, 'VEC3', key == 'POSITION')
                attributes[key] = cached[index]
            indices = [v[0] for v in read_accessor(primitive['indices'])] if 'indices' in primitive else list(range(old['accessors'][primitive['attributes']['POSITION']]['count']))
            assert len(indices) % 3 == 0
            if mi == 0:
                groups = {materials['Paint']: indices}
            else:
                source_mat = copy.deepcopy(old['materials'][primitive['material']])
                assert not any('Texture' in k for k in source_mat.get('pbrMetallicRoughness', {}))
                source_mat.pop('extras', None)
                source_mat.pop('extensions', None)
                source_mat['name'] = 'Wheel material '+str(len(doc['materials']))
                doc['materials'].append(source_mat)
                groups = {len(doc['materials'])-1: indices}
            for material, group in groups.items():
                index = add_accessor([(i,) for i in group], 5125, 'SCALAR')
                new['primitives'].append({'attributes': attributes, 'indices': index, 'material': material})
        doc['meshes'].append(new)
    for i, node in enumerate(doc['nodes']):
        node['name'] = 'Vehicle body' if node.get('mesh') == 0 else f'Wheel {i-1}'
        node['extras'] = {key: value for key, value in node.get('extras', {}).items() if key == 'wheelIndex'}
    for scene in doc['scenes']:
        scene['name'] = 'Default vehicle'
    doc['buffers'] = [{'byteLength': len(data)}]
    text = json.dumps(doc, separators=(',',':')).encode()
    text += b' ' * (-len(text) % 4)
    data += b'\0' * (-len(data) % 4)
    result = struct.pack('<III',magic,2,12+8+len(text)+8+len(data))+struct.pack('<II',len(text),0x4e4f534a)+text+struct.pack('<II',len(data),0x004e4942)+data
    assert not any(key in doc for key in ['images','textures','samplers'])
    assert b'TEXCOORD' not in text and b'baseColorTexture' not in text
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(result)
    print(json.dumps({'bytesBefore': len(raw), 'bytesAfter': len(result), 'imagesAfter': 0, 'sha256': hashlib.sha256(result).hexdigest()}))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path)
    parser.add_argument('destination', type=Path)
    args = parser.parse_args()
    if args.destination.exists():
        parser.error('Destination already exists; choose a new file')
    strip(args.source, args.destination)
