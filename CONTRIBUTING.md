# Đóng góp cho Anten VN

*(English: this is a community dataset of DVB-T2 transmitter sites in Vietnam.
Contribute by editing `data/towers.json` via pull request — CI validates and
comments in Vietnamese. Facts only, cite sources, never copy copyrighted
coverage imagery.)*

## Dự án cần gì nhất

Dữ liệu trạm phát ở các khu vực **chưa có trên bản đồ**:

- [ ] Miền núi phía Bắc: Hà Giang (cũ), Cao Bằng, Lào Cai (cũ), Yên Bái (cũ), Lai Châu, Điện Biên, Sơn La, Lạng Sơn, Bắc Kạn (cũ), Tuyên Quang
- [ ] Tây Nguyên: Kon Tum (cũ), Gia Lai (cũ/Pleiku), Đắk Nông (cũ)
- [ ] Tọa độ chính xác các trạm DTV/RTB (đồng bằng sông Hồng, K46–K48)
- [ ] Trạm AVG/MobiTV
- [ ] Phân cực ăng-ten (H/V) của bất kỳ trạm nào — hiện chưa có nguồn nào ghi
- [ ] Công suất phát (ERP) — giúp vẽ vùng phủ chính xác hơn

Cách dễ nhất nếu bạn không quen GitHub: mở **issue** theo mẫu
[Báo cáo trạm phát sóng](../../issues/new?template=tower-report.yml) — người
duy trì sẽ chuyển thành PR.

## Thêm trạm bằng trình duyệt (không cần cài gì)

1. Mở [`data/towers.json`](data/towers.json) → nhấn biểu tượng ✏️ (Edit)
2. GitHub tự fork repo về tài khoản của bạn
3. Thêm trạm mới **đúng vị trí theo thứ tự a→z của `id`**, theo mẫu:

```json
{
  "id": "gia-lai-pleiku",
  "name": "Đài PTTH Gia Lai",
  "lat": 13.9718,
  "lon": 108.0151,
  "province": "gia-lai",
  "addressOld": "Số 1 Lê Lợi, TP Pleiku, Gia Lai",
  "muxes": [{ "channel": 26, "operator": "VTV", "status": "active" }],
  "polarization": null,
  "heightM": null,
  "erpKw": null,
  "status": "active",
  "source": "https://... (link nguồn)",
  "sourceUrl": "https://...",
  "sourceDate": "2026-06-01",
  "verified": false,
  "notes": null
}
```

4. Chọn "Propose changes" → "Create pull request"
5. Bot kiểm tra tự động và trả lời bằng tiếng Việt nếu có lỗi cần sửa

**Giải thích từng trường:**

| Trường | Bắt buộc | Ghi chú |
|---|---|---|
| `id` | ✅ | chữ thường không dấu, gạch nối, duy nhất, KHÔNG đổi sau khi tạo |
| `name` | ✅ | tên trạm tiếng Việt có dấu |
| `lat`, `lon` | ✅ | WGS84 — lấy từ Google Maps (nhấn giữ / chuột phải) |
| `province` | ✅ | slug tỉnh MỚI sau sáp nhập 2025 — xem `data/aux/provinces.json` |
| `addressOld` | — | địa chỉ nguyên văn theo nguồn (tên tỉnh cũ giữ nguyên) |
| `muxes` | ✅ | mỗi kênh một mục; `channel` 21–48; `operator` SDTV/VTV/VTC/DTV/RTB/AVG/THVL/unknown |
| `polarization` | — | `"H"`, `"V"` hoặc `null` nếu không biết — **đừng đoán** |
| `heightM`, `erpKw` | — | `null` nếu không biết |
| `status` | ✅ | `inactive` chỉ khi TẤT CẢ mux ngừng phát |
| `source` | ✅ | nguồn ở đâu ra — URL hoặc mô tả ngắn |
| `verified` | ✅ | `true` CHỈ khi có bằng chứng dẫn trong `sourceUrl`/`notes` |

Lưu ý: **tần số KHÔNG lưu trong dữ liệu** — app tự tính `MHz = 306 + 8 × kênh`
(K33 = 570 MHz). Đừng thêm trường tần số.

## Quy tắc nguồn

- Luôn ghi nguồn: URL + ngày truy cập. Báo cáo thu sóng thực tế ("đo bằng đầu
  thu tại X ngày Y, bắt được K26") là nguồn hợp lệ.
- `verified: true` cần một trong: ảnh chụp trạm, tài liệu chính thức, hoặc báo
  cáo thu sóng thực tế — dẫn trong `sourceUrl` hoặc `notes`.
- VTC đã ngừng phát mặt đất từ 01/2025 — mux VTC thêm mới phải `"inactive"`.
- **TUYỆT ĐỐI KHÔNG** sao chép ảnh bản đồ phủ sóng, file KMZ, hay tài liệu có
  bản quyền vào repo. Chỉ trích xuất dữ kiện (tọa độ, kênh, tên).

## Chạy local (cho dev)

```bash
npm ci
npm run dev            # http://localhost:4123/
npm test               # unit tests (geo/freq/heading)
npm run validate-data  # kiểm tra data/towers.json
node scripts/generate-coverage.mjs <tower-id>  # vẽ lại vùng phủ ước tính
```

PR code: giữ nhỏ gọn; thêm dependency mới cần mở issue trước.

## Giấy phép

Code MIT; dữ liệu trong `data/` theo CC BY 4.0 (ghi công "Anten VN
contributors"). Gửi PR nghĩa là bạn đồng ý phát hành đóng góp theo giấy phép
tương ứng.
