#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
简化版STP元数据提取器 - 无需OpenCASCADE依赖
用于快速获取STP文件的基本信息并生成占位符3D数据

如果需要完整的STP→GLB转换，请安装：
  pip install pythonocc-core  # 或
  pip install OCP             # 或
  使用 FreeCAD: freecad stp_to_glb.py

此脚本作为fallback方案，提供：
1. STP文件元数据提取
2. 基于文件名和分类的程序化3D几何体参数
3. JSON格式的模型信息输出
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Optional, Tuple


class STPMetadataExtractor:
    """STP文件元数据提取器"""

    # 分类到3D参数的映射
    CATEGORY_PARAMS = {
        '增压泵': {
            'geometry': 'cylinder',
            'color': '#4a90d9',
            'metalness': 0.7,
            'roughness': 0.2,
            'scale': [1.5, 2.0, 1.5],
        },
        '滤芯': {
            'geometry': 'cylinder',
            'color': '#f0f0f0',
            'metalness': 0.3,
            'roughness': 0.8,
            'scale': [1.0, 2.0, 1.0],
        },
        '电磁阀': {
            'geometry': 'box',
            'color': '#2d5a87',
            'metalness': 0.8,
            'roughness': 0.15,
            'scale': [1.8, 1.2, 1.2],
        },
        '管接件': {
            'geometry': 'cylinder',
            'color': '#7cb342',
            'metalness': 0.6,
            'roughness': 0.3,
            'scale': [0.8, 1.2, 0.8],
        },
        '适配器': {
            'geometry': 'cone',
            'color': '#ff7043',
            'metalness': 0.7,
            'roughness': 0.25,
            'scale': [1.0, 1.5, 1.0],
        },
        '螺钉': {
            'geometry': 'screw',
            'color': '#888888',
            'metalness': 0.95,
            'roughness': 0.05,
            'scale': [0.6, 1.6, 0.6],
        },
        'default': {
            'geometry': 'box',
            'color': '#607d8b',
            'metalness': 0.6,
            'roughness': 0.3,
            'scale': [1.0, 1.0, 1.0],
        }
    }

    def __init__(self):
        self.results = []

    def extract_from_file(self, filepath: str) -> Dict:
        """从单个STP文件提取元数据"""
        path = Path(filepath)
        
        if not path.exists():
            return {'error': f'File not found: {filepath}'}

        result = {
            'filename': path.name,
            'stem': path.stem,
            'extension': path.suffix.lower(),
            'size_bytes': path.stat().st_size,
            'size_formatted': self._format_size(path.stat().st_size),
            'modified_time': path.stat().st_mtime,
            'category': path.parent.name,
            'parsed_info': self._parse_filename(path.stem),
            'geometry_params': {},
        }

        # 尝试读取文件头部的文本信息（STEP文件是ASCII格式）
        try:
            header_info = self._read_step_header(filepath)
            result['step_header'] = header_info
        except Exception as e:
            result['header_error'] = str(e)

        # 根据分类确定3D参数
        category = result['category']
        if category in self.CATEGORY_PARAMS:
            result['geometry_params'] = self.CATEGORY_PARAMS[category]
        else:
            # 尝试根据文件名推断类型
            inferred_type = self._infer_type_from_name(result['filename'])
            result['geometry_params'] = self.CATEGORY_PARAMS.get(
                inferred_type,
                self.CATEGORY_PARAMS['default']
            )
            result['inferred_type'] = inferred_type

        self.results.append(result)
        return result

    def extract_directory(self, dir_path: str, recursive: bool = True) -> List[Dict]:
        """提取目录下所有STP文件的元数据"""
        directory = Path(dir_path)

        if not directory.exists():
            return [{'error': f'Directory not found: {dir_path}'}]

        pattern = '**/*.stp' if recursive else '*.stp'
        files = list(directory.glob(pattern))
        files.extend(directory.glob(pattern.upper()))

        print(f'📂 找到 {len(files)} 个STP文件\n')

        for idx, file in enumerate(sorted(files), 1):
            print(f'[{idx}/{len(files)}] 处理: {file.name}')
            self.extract_from_file(str(file))

        return self.results

    def export_json(self, output_file: str):
        """导出结果为JSON"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        print(f'\n✅ 已导出到: {output_file}')

    def _parse_filename(self, stem: str) -> Dict:
        """解析文件名中的信息"""
        info = {
            'code': stem,
            'parts': re.split(r'[_\-]', stem),
        }

        # 尝试识别编码模式
        if re.match(r'^\d+[A-Za-z]', stem):
            info['code_pattern'] = 'numeric_prefix'
        elif re.match(r'^[A-Za-z]\d', stem):
            info['code_pattern'] = 'alpha_numeric'
        else:
            info['code_pattern'] = 'other'

        return info

    def _infer_type_from_name(self, filename: str) -> str:
        """根据文件名推断零件类型"""
        name_lower = filename.lower()

        if any(kw in name_lower for kw in ['pump', '增压', '水泵']):
            return '增压泵'
        elif any(kw in name_lower for kw in ['filter', '滤芯', 'filter_']):
            return '滤芯'
        elif any(kw in name_lower for kw in ['valve', '电磁阀', 'solenoid']):
            return '电磁阀'
        elif any(kw in name_lower for kw in ['fitting', '接头', '弯通', '三通', 'adapter']):
            return '管接件'
        elif any(kw in name_lower for kw in ['screw', '螺钉', 'bolt', 'nut']):
            return '螺钉'
        elif any(kw in name_lower for kw in ['adapter', '适配']):
            return '适配器'

        return 'default'

    def _read_step_header(self, filepath: str, lines: int = 50) -> Dict:
        """读取STEP文件头部信息"""
        info = {}

        try:
            with open(filepath, 'r', encoding='latin-1') as f:
                content = f.read(lines * 100)  # 读取前50行左右的内容

                # 查找HEADER部分
                header_match = re.search(r'HEADER;(.+?)ENDSEC;', content, re.DOTALL | re.IGNORECASE)
                if header_match:
                    header_text = header_match.group(1)

                    # 提取常见字段
                    fields = {
                        'FILE_DESCRIPTION': r'FILE_DESCRIPTION\s*\(\s*\'([^\']*)\'',
                        'FILE_NAME': r'FILE_NAME\s*\(\s*\'([^\']*)\'',
                        'FILE_SCHEMA': r'FILE_SCHEMA\s*\(\s*\'([^\']*)\'',
                        'TIME_STAMP': r'TIME_STAMP\s*\(\s*\'([^\']*)\'',
                    }

                    for field_name, pattern in fields.items():
                        match = re.search(pattern, header_text, re.IGNORECASE)
                        if match:
                            info[field_name] = match.group(1).strip()

                    info['has_header'] = True
                else:
                    info['has_header'] = False

                # 统计实体数量
                entity_count = len(re.findall(r'#\d+\s*=', content))
                info['entity_count_estimate'] = entity_count

                # 文件大小估算
                total_lines = content.count('\n')
                info['total_lines_estimate'] = total_lines

        except Exception as e:
            info['error'] = str(e)

        return info

    @staticmethod
    def _format_size(bytes_size: int) -> str:
        """格式化文件大小"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if bytes_size < 1024:
                return f'{bytes_size:.2f} {unit}'
            bytes_size /= 1024
        return f'{bytes_size:.2f} TB'


def main():
    import argparse

    parser = argparse.ArgumentParser(description='STP文件元数据提取器')
    parser.add_argument('--input', type=str, help='输入文件或目录')
    parser.add_argument('--output', type=str, default='stp_metadata.json', help='输出JSON路径')
    parser.add_argument('--recursive', action='store_true', help='递归处理子目录')
    args = parser.parse_args()

    extractor = STPMetadataExtractor()

    if args.input:
        input_path = Path(args.input)
        if input_path.is_file():
            result = extractor.extract_from_file(args.input)
            print('\n📄 文件信息:')
            print(json.dumps(result, ensure_ascii=False, indent=2))
        elif input_path.is_dir():
            results = extractor.extract_directory(args.input, args.recursive)
    else:
        # 默认处理项目中的STP文件夹
        default_dir = Path(r'D:\00-汤阿铸工作文件夹\2026年项目文件\07-workbuddy工具创建\通用件模型库资料\图纸')
        if default_dir.exists():
            results = extractor.extract_directory(str(default_dir))
        else:
            print(f'❌ 默认目录不存在: {default_dir}')
            return

    if extractor.results:
        extractor.export_json(args.output)


if __name__ == '__main__':
    main()
