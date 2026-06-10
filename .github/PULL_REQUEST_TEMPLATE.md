<!-- PR dữ liệu (data/towers.json) — đánh dấu các mục đã làm -->

## Checklist PR dữ liệu

- [ ] Nguồn được trích dẫn trong trường `source` (URL + ngày nếu có)
- [ ] Tọa độ đã kiểm tra trên bản đồ (đúng vị trí trạm, không đảo lat/lon)
- [ ] Trường `province` dùng tên tỉnh MỚI sau sáp nhập 2025 (slug trong `data/aux/provinces.json`)
- [ ] Đã chạy `node scripts/validate-data.mjs` (hoặc đợi bot kiểm tra)
- [ ] KHÔNG kèm ảnh vùng phủ sóng hay tài liệu có bản quyền
- [ ] `verified: true` chỉ khi có bằng chứng (ảnh trạm, tài liệu chính thức, hoặc báo cáo thu sóng thực tế) dẫn trong `sourceUrl`/`notes`

## Mô tả

<!-- Trạm nào, nguồn nào, có gì đáng chú ý -->
