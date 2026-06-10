# 📡 Anten VN — Dò sóng truyền hình DVB-T2

**App:** <https://anten-tv.github.io/>

PWA mã nguồn mở giúp người dùng truyền hình số mặt đất (DVB-T2) tại Việt Nam:

- 🗺 Xem **trạm phát sóng gần bạn** trên bản đồ (43 trạm, đang mở rộng)
- 🧭 **Chỉnh hướng ăng-ten** bằng la bàn điện thoại — xoay tới khi vào vùng xanh
- 📶 Xem **vùng phủ ước tính** theo địa hình (mô hình tầm nhìn vô tuyến + SRTM)
- 📴 **Hoạt động ngoại tuyến** sau lần tải đầu — kể cả la bàn và danh sách trạm
- 🤝 Dữ liệu mở (CC BY 4.0), ai cũng **đóng góp được qua pull request**

*(Open-source PWA for finding DVB-T2 TV transmitters in Vietnam and aiming
antennas using the phone compass. Offline-first, open data, contributions
via PR.)*

## Đóng góp dữ liệu

Thấy trạm chưa có trên bản đồ? Sai kênh? Trạm đã ngừng phát?

- Không quen GitHub: mở [issue báo cáo trạm](../../issues/new?template=tower-report.yml)
- Quen GitHub: sửa [`data/towers.json`](data/towers.json) ngay trên web — xem [CONTRIBUTING.md](CONTRIBUTING.md)

Dữ liệu merge vào `main` lên app trong vài phút, không cần deploy lại.

## Khu vực còn thiếu dữ liệu

Miền núi phía Bắc, Tây Nguyên, trạm DTV/RTB (K46–48) và AVG — xem danh sách
trong [CONTRIBUTING.md](CONTRIBUTING.md). Khu vực trống trên bản đồ nghĩa là
**chưa có dữ liệu**, không có nghĩa là không có sóng.

## Lưu ý độ chính xác

- Dữ liệu nguồn vintage **2017–2023** — trạm có thể đã thay đổi/ngừng phát.
  Trạm chưa kiểm chứng hiển thị "chưa kiểm chứng". Nhấn "Báo lỗi" nếu thấy sai.
- VTC đã ngừng phát sóng mặt đất từ 01/2025.
- La bàn điện thoại sai số **±10°** — app hiển thị vùng dung sai thay vì giả
  vờ chính xác. Xoay ăng-ten từ từ quanh hướng gợi ý để dò tín hiệu tốt nhất.
- Phân cực ăng-ten chưa có nguồn dữ liệu — thường là ngang (H) ở các trạm chính.
- Vùng phủ là **ước tính** từ địa hình + độ cao ăng-ten (mô hình line-of-sight,
  bán kính trái đất hiệu dụng 4/3); chưa tính công suất phát thực tế.

## Tech

React 19 + TypeScript + Vite, MapLibre GL + [OpenFreeMap](https://openfreemap.org),
vite-plugin-pwa (Workbox), không backend — hosting GitHub Pages, dữ liệu live
từ raw.githubusercontent.com. Vùng phủ tính sẵn bằng
[`scripts/generate-coverage.mjs`](scripts/generate-coverage.mjs) trên
[AWS Terrain Tiles](https://registry.opendata.aws/terrain-tiles/) (SRTM).

```bash
npm ci && npm run dev   # http://localhost:4123/
npm test                # unit tests
npm run validate-data   # kiểm tra dữ liệu
```

### Kiểm thử thiết bị thật

| Thiết bị | La bàn | Ghi chú |
|---|---|---|
| iPhone (Safari) | cần cấp quyền "Chuyển động & Hướng" | `webkitCompassHeading` |
| Android (Chrome) | tự động | `deviceorientationabsolute` |
| Máy tính | không có — hiện số độ + la bàn giấy | Tier 2 |

## Nguồn dữ liệu & ghi công

Dữ kiện trích từ: bản đồ phủ sóng [sdtv.vn](https://sdtv.vn/ban-do-phu-song/),
repo cộng đồng [phuongnamthvl/giaGA](https://github.com/phuongnamthvl/giaGA),
đối chiếu avajsc.com, lapdattruyenhinhkts.com, Wikipedia. Chi tiết từng nguồn:
[data/SOURCES.md](data/SOURCES.md). Không có ảnh/tài liệu bản quyền nào được
phân phối lại trong repo này.

## Giấy phép

- Code: [MIT](LICENSE)
- Dữ liệu (`data/`): [CC BY 4.0](DATA-LICENSE) — ghi công "Anten VN contributors"
