/**
 * AI 生成内容隐式标识模块测试（立项 v0.2 P0-3）
 * 覆盖：CRC32 标准向量、PNG tEXt 注入位置与合法性、MP4 udta/AIGC 注入与结构自洽、
 *       非法输入原样返回（永不阻断交付语义）
 */
import { describe, it, expect } from 'vitest';
import {
  pngCrc32,
  buildPngTextChunk,
  appendAigcPngMetadata,
  appendAigcMp4Metadata,
} from './aigcMetadata.js';

/** 构造最小合法 PNG：签名 + IHDR + IDAT + IEND（手拼 chunk，供注入定位测试） */
function makeMinimalPng(): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const chunk = (type: string, data: Buffer): Buffer => {
    const head = Buffer.alloc(4);
    head.writeUInt32BE(data.length, 0);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(pngCrc32(Buffer.concat([Buffer.from(type, 'latin1'), data])), 0);
    return Buffer.concat([head, Buffer.from(type, 'latin1'), data, crc]);
  };
  return Buffer.concat([
    sig,
    chunk('IHDR', Buffer.alloc(13)),
    chunk('IDAT', Buffer.from([0x01, 0x02])),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** 构造最小合法 MP4：ftyp + moov(mvhd)（手拼 box，供注入测试） */
function makeMinimalMp4(): Buffer {
  const box = (type: string, payload: Buffer): Buffer => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(8 + payload.length, 0);
    head.write(type, 4, 'latin1');
    return Buffer.concat([head, payload]);
  };
  return Buffer.concat([
    box('ftyp', Buffer.from('isom', 'latin1')),
    box('moov', box('mvhd', Buffer.alloc(16))),
  ]);
}

describe('pngCrc32（IEEE CRC-32）', () => {
  it('标准测试向量 "123456789" → 0xCBF43926', () => {
    expect(pngCrc32(Buffer.from('123456789', 'latin1'))).toBe(0xcbf43926);
  });

  it('空输入 → 0x00000000（初始值/最终异或抵消）', () => {
    expect(pngCrc32(Buffer.alloc(0))).toBe(0x00000000);
  });
});

describe('buildPngTextChunk', () => {
  it('chunk 结构自洽：长度、类型、keyword\\0text、CRC 可复算', () => {
    const chunk = buildPngTextChunk('AIGC', 'hello ai');
    expect(chunk.readUInt32BE(0)).toBe(13); // 'AIGC'(4) + \0(1) + 'hello ai'(8)
    expect(chunk.subarray(4, 8).toString('latin1')).toBe('tEXt');
    expect(chunk.subarray(8, 12).toString('latin1')).toBe('AIGC');
    expect(chunk[12]).toBe(0x00);
    expect(chunk.subarray(13).subarray(0, 8).toString('latin1')).toBe('hello ai');
    // CRC 覆盖 type+data，可复算一致
    const typeAndData = chunk.subarray(4, 4 + 4 + chunk.readUInt32BE(0));
    expect(chunk.readUInt32BE(4 + 4 + chunk.readUInt32BE(0))).toBe(pngCrc32(typeAndData));
  });
});

describe('appendAigcPngMetadata（立项 P0-3）', () => {
  it('在 IHDR 之后、IDAT 之前插入 AIGC tEXt 块，其余字节保持不变', () => {
    const png = makeMinimalPng();
    const out = appendAigcPngMetadata(png);

    // 模块实际注入文案 'xinghuanhai.com ai-generated service=xinghuanhai'（48 字符）
    // tEXt chunk 总长 = 12(头尾) + 4('AIGC') + 1(\0) + 48 = 65
    expect(out.length).toBe(png.length + 65);
    expect(out.subarray(0, 33)).toEqual(png.subarray(0, 33)); // 签名 + IHDR 原样
    // tEXt chunk 位于偏移 33：长度(33-37)、类型(37-41)、keyword(41-45)
    expect(out.subarray(37, 41).toString('latin1')).toBe('tEXt');
    expect(out.subarray(41, 45).toString('latin1')).toBe('AIGC');
    expect(out.subarray(45, 45 + 48).toString('latin1')).toContain('ai-generated');
    // 原 IDAT chunk 整体后移 65 字节（33+65=98），类型仍在
    expect(out.subarray(98 + 4, 98 + 8).toString('latin1')).toBe('IDAT');
    // IEND 收尾完整（类型在 end-8）
    expect(out.subarray(out.length - 8, out.length - 4).toString('latin1')).toBe('IEND');
  });

  it('非 PNG 输入原样返回（同一引用，零改动）', () => {
    const junk = Buffer.from('not a png at all');
    expect(appendAigcPngMetadata(junk)).toBe(junk);
  });

  it('chunk 长度越界的畸形 PNG 原样返回', () => {
    const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const evil = Buffer.concat([sig, Buffer.from([0xff, 0xff, 0xff, 0xff]), Buffer.from('IDAT')]);
    expect(appendAigcPngMetadata(evil)).toBe(evil);
  });
});

describe('appendAigcMp4Metadata（立项 P0-3）', () => {
  it('moov 末尾注入 udta > AIGC box，尺寸自洽且可重新遍历', () => {
    const mp4 = makeMinimalMp4();
    const out = appendAigcMp4Metadata(mp4);

    // 重新遍历顶层 box，结构必须自洽
    let offset = 0;
    const types: string[] = [];
    let udtaPayload = '';
    while (offset + 8 <= out.length) {
      const size = out.readUInt32BE(offset);
      const type = out.subarray(offset + 4, offset + 8).toString('latin1');
      expect(size).toBeGreaterThanOrEqual(8);
      expect(offset + size).toBeLessThanOrEqual(out.length);
      types.push(type);
      if (type === 'moov') {
        // moov 内部：mvhd + 新增 udta
        let childOffset = offset + 8;
        const childTypes: string[] = [];
        while (childOffset + 8 <= offset + size) {
          const cSize = out.readUInt32BE(childOffset);
          const cType = out.subarray(childOffset + 4, childOffset + 8).toString('latin1');
          childTypes.push(cType);
          if (cType === 'udta') {
            // udta 内嵌 AIGC box：udta头(8) + aigc长度(4) + 'AIGC'(4) → 类型在 childOffset+12
            expect(out.readUInt32BE(childOffset)).toBe(cSize);
            expect(out.subarray(childOffset + 12, childOffset + 16).toString('latin1')).toBe('AIGC');
            udtaPayload = out.subarray(childOffset + 16, childOffset + cSize).toString('latin1');
          }
          childOffset += cSize;
        }
        expect(childTypes).toEqual(['mvhd', 'udta']);
      }
      offset += size;
    }
    expect(offset).toBe(out.length); // box 遍历恰好耗尽 → 无悬空字节
    expect(types).toEqual(['ftyp', 'moov']);
    expect(udtaPayload).toContain('xinghuanhai.com ai-generated');
  });

  it('非 MP4 输入原样返回（同一引用）', () => {
    const junk = Buffer.from('not an mp4');
    expect(appendAigcMp4Metadata(junk)).toBe(junk);
  });

  it('无 moov 的 MP4 原样返回', () => {
    const box = (type: string, payload: Buffer): Buffer => {
      const head = Buffer.alloc(8);
      head.writeUInt32BE(8 + payload.length, 0);
      head.write(type, 4, 'latin1');
      return Buffer.concat([head, payload]);
    };
    const noMoov = box('ftyp', Buffer.from('isom', 'latin1'));
    expect(appendAigcMp4Metadata(noMoov)).toBe(noMoov);
  });

  it('moov 子盒子结构异常（越界）时原样返回，不产出坏文件', () => {
    const head = Buffer.alloc(8);
    head.writeUInt32BE(8 + 12, 0); // moov size = 20，但子盒子声称越界长度
    head.write('moov', 4, 'latin1');
    const evilChild = Buffer.alloc(8);
    evilChild.writeUInt32BE(0xffff, 0);
    evilChild.write('mvhd', 4, 'latin1');
    const evil = Buffer.concat([head, evilChild]);
    expect(appendAigcMp4Metadata(evil)).toBe(evil);
  });
});
