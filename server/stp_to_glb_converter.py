#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
STP to GLB Converter - CAD模型格式转换器
将STEP/STP格式的CAD图纸转换为浏览器可渲染的GLB (glTF Binary) 格式

使用方法:
  1. 批量转换: python stp_to_glb_converter.py --input-dir ./stp_files --output-dir ./glb_models
  2. 单文件转换: python stp_to_glb_converter.py --input file.stp --output file.glb
  3. 测试模式:   python stp_to_glb_converter.py --test

依赖:
  pip install trimesh[easy] pygltflib numpy
"""

import os
import sys
import json
import argparse
from pathlib import Path
from typing import Optional, Tuple, List, Dict
import time

try:
    import trimesh
    import numpy as np
except ImportError as e:
    print(f"❌ 缺少依赖库: {e}")
    print("请运行: pip install trimesh[easy] pygltflib numpy")
    sys.exit(1)


class STPConverter:
    """STP/STEP 文件到 GLB 的转换器"""

    def __init__(self, output_dir: str = "./converted_glbs"):
        """
        初始化转换器

        Args:
            output_dir: 输出目录路径
        """
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # 转换统计
        self.stats = {
            'total': 0,
            'success': 0,
            'failed': 0,
            'skipped': 0,
            'files': []
        }

    def convert_single(self, input_path: str, output_path: Optional[str] = None) -> Tuple[bool, str]:
        """
        转换单个STP文件为GLB格式

        Args:
            input_path: 输入的STP文件路径
            output_path: 输出的GLB文件路径（可选）

        Returns:
            Tuple[是否成功, 消息或错误信息]
        """
        input_file = Path(input_path)

        if not input_file.exists():
            return False, f"输入文件不存在: {input_path}"

        if output_path is None:
            # 自动生成输出路径
            output_path = self.output_dir / f"{input_file.stem}.glb"
        else:
            output_path = Path(output_path)

        # 如果输出已存在且更新时间比源文件新，跳过
        if output_path.exists() and output_path.stat().st_mtime > input_file.stat().st_mtime:
            self.stats['skipped'] += 1
            return True, "已存在且为最新版本"

        try:
            start_time = time.time()

            print(f"🔄 正在转换: {input_file.name}")

            # 加载STEP文件（强制转换为mesh）
            # 注意：这需要OpenCASCADE支持，如果不可用会尝试其他方法
            scene = trimesh.load(str(input_file), force='mesh')

            # 如果是Scene对象，直接导出；如果是单个Mesh，包装成Scene
            if isinstance(scene, trimesh.Scene):
                mesh_scene = scene
            elif isinstance(scene, trimesh.Trimesh):
                mesh_scene = trimesh.Scene()
                mesh_scene.add_geometry(scene)
            else:
                # 尝试转换为mesh
                if hasattr(scene, 'to_mesh'):
                    mesh = scene.to_mesh()
                    mesh_scene = trimesh.Scene()
                    mesh_scene.add_geometry(mesh)
                else:
                    return False, f"不支持的文件类型: {type(scene)}"

            # 导出为GLB格式
            glb_data = mesh_scene.export(file_type='glb', include_normals=True, include_texcoords=False)

            # 写入文件
            with open(output_path, 'wb') as f:
                f.write(glb_data)

            elapsed = time.time() - start_time
            file_size = output_path.stat().st_size / 1024  # KB

            print(f"✅ 转换成功: {output_path.name} ({file_size:.1f}KB, {elapsed:.2f}s)")

            self.stats['success'] += 1
            self.stats['files'].append({
                'input': str(input_file),
                'output': str(output_path),
                'size_kb': round(file_size, 1),
                'time_sec': round(elapsed, 2),
                'status': 'success'
            })

            return True, f"转换成功 ({elapsed:.2f}s)"

        except Exception as e:
            error_msg = str(e)
            print(f"❌ 转换失败: {input_file.name} - {error_msg}")

            self.stats['failed'] += 1
            self.stats['files'].append({
                'input': str(input_file),
                'output': str(output_path) if output_path else None,
                'error': error_msg,
                'status': 'failed'
            })

            return False, error_msg

    def convert_directory(self, input_dir: str, recursive: bool = True) -> Dict:
        """
        批量转换目录下的所有STP文件

        Args:
            input_dir: 输入目录
            recursive: 是否递归子目录

        Returns:
            转换统计信息字典
        """
        input_path = Path(input_dir)

        if not input_path.exists():
            return {'error': f"目录不存在: {input_dir}"}

        # 查找所有STP/STEP文件
        pattern = '**/*.stp' if recursive else '*.stp'
        stp_files = list(input_path.glob(pattern))
        stp_files.extend(input_path.glob(pattern.upper()))  # .STP

        pattern_step = '**/*.step' if recursive else '*.step'
        step_files = list(input_path.glob(pattern_step))
        step_files.extend(input_path.glob(pattern_step.upper()))

        all_files = list(set(stp_files + step_files))  # 去重

        print(f"\n📂 在目录 '{input_dir}' 中找到 {len(all_files)} 个STP文件\n")
        print("=" * 60)

        self.stats['total'] = len(all_files)

        for idx, stp_file in enumerate(sorted(all_files), 1):
            print(f"[{idx}/{len(all_files)}]", end=" ")
            self.convert_single(str(stp_file))

        print("\n" + "=" * 60)
        print(f"\n📊 转换完成！统计:")
        print(f"   总计文件数: {self.stats['total']}")
        print(f"   ✅ 成功: {self.stats['success']}")
        print(f"   ❌ 失败: {self.stats['failed']}")
        print(f("   ⏭️  跳过: {self.stats['skipped']}"))
        print(f"   📁 输出目录: {self.output_dir.absolute()}")

        # 保存统计报告
        report_path = self.output_dir / 'conversion_report.json'
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(self.stats, f, ensure_ascii=False, indent=2)
        print(f"   📄 统计报告: {report_path}")

        return self.stats


def test_conversion():
    """测试转换功能"""
    print("🧪 测试STP转GLB功能...\n")

    # 使用示例文件测试
    test_stp = Path(r'D:\00-汤阿铸工作文件夹\2026年项目文件\07-workbuddy工具创建\通用件模型库资料\图纸\增压泵\23603105030.stp')

    if not test_stp.exists():
        print(f"⚠️ 测试文件不存在: {test_stp}")
        return

    converter = STPConverter(output_dir="./test_output")

    success, msg = converter.convert_single(str(test_stp))

    print(f"\n{'='*40}")
    if success:
        print("✅ 测试通过!")
        print(f"   输出文件: ./test_output/{test_stp.stem}.glb")
    else:
        print("❌ 测试失败:")
        print(f"   错误: {msg}")


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description='STP/STEP 到 GLB 格式转换器',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
示例:
  %(prog)s --test                              # 运行测试
  %(prog)s --input file.stp                     # 转换单文件
  %(prog)s --input-dir ./cad_files               # 批量转换目录
  %(prog)s --input-dir ./cad_files --recursive   # 递归转换子目录
        """
    )

    parser.add_argument('--test', action='store_true',
                        help='运行测试模式')
    parser.add_argument('--input', type=str,
                        help='输入的单个STP文件路径')
    parser.add_argument('--output', type=str,
                        help='输出的GLB文件路径（仅单文件模式）')
    parser.add_argument('--input-dir', type=str,
                        help='输入目录路径（批量模式）')
    parser.add_argument('--output-dir', type=str, default='./converted_glbs',
                        help='输出目录（默认: ./converted_glbs）')
    parser.add_argument('--recursive', action='store_true',
                        help='递归处理子目录')

    args = parser.parse_args()

    if args.test:
        test_conversion()
    elif args.input:
        converter = STPConverter(output_dir=args.output_dir or './')
        success, msg = converter.convert_single(args.input, args.output)
        print(f"\n结果: {'✅ 成功' if success else '❌ 失败'} - {msg}")
    elif args.input_dir:
        converter = STPConverter(output_dir=args.output_dir)
        converter.convert_directory(args.input_dir, args.recursive)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
