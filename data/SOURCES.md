# Nguồn dữ liệu / Data provenance

Mỗi trạm trong `towers.json` có trường `source` trỏ về một mục ở đây.
Chỉ trích xuất **dữ kiện** (tọa độ, tên, kênh, độ cao) — không sao chép ảnh
vùng phủ sóng hay tài liệu có bản quyền vào repo này.

## sdtv.vn — Bản đồ phủ sóng SDTV (miền Nam + Trung)

- URL: <https://sdtv.vn/ban-do-phu-song/>
- Truy xuất: 2026-06-10 (file KMZ còn hoạt động, HTTP 200)
- Files:
  - `16TramPhatSongK3320230920.kmz` — 16 trạm K33, vintage 2023-09-20
  - `19TramPhatSongK3420211202.kmz` — 19 trạm K34, vintage 2021-12-02
  - `06TramPhatSongK3620211130fix.kmz` — 6 trạm K36, vintage 2021-11-30
  - `3TramPhatSongK3520171101.kmz` — BỎ QUA: chỉ có ảnh phủ sóng Côn Đảo, không có tọa độ trạm
- Trích xuất: tên trạm, địa chỉ, tọa độ, độ cao ăng-ten. Operator gán SDTV
  (đơn vị truyền dẫn khu vực Nam Bộ, kênh K33–K36).
- KHÔNG trích: ảnh GroundOverlay vùng phủ sóng (bản quyền SDTV).

## github.com/phuongnamthvl/giaGA — KMZ cộng đồng (miền Bắc + Bắc Trung Bộ)

- URL: <https://github.com/phuongnamthvl/giaGA>
- Truy xuất: 2026-06-10. Repo KHÔNG có LICENSE — chỉ trích dữ kiện, ghi nguồn.
- Files:
  - `k30.kmz` — 16 trạm kênh K29/K30 (Quảng Ninh → Đà Nẵng + Hà Nội Mễ Trì),
    kênh ghi rõ từng trạm trong tên placemark ("Kênh 29"/"Kênh 30")
  - `mb.kmz` — 13 trạm, trùng hoàn toàn với k30.kmz → bỏ qua
- Operator gán VTV cho mạng SFN K29/K30 phía Bắc (mạng truyền dẫn quốc gia
  của VTV; suy luận từ danh sách trạm — chưa kiểm chứng từng trạm,
  `verified: false`).

## Nguồn đối chiếu kênh/tần số (chưa nhập, dùng để kiểm tra chéo)

- avajsc.com — bảng kênh DVB-T2 theo đài: <https://avajsc.com/tin-tuc/danh-sach-cac-kenh-dvb-t2--5-dai-truyen-hinh-phat-song-kenh-dvb-t2/>
- lapdattruyenhinhkts.com — tần số và trạm phát: <https://lapdattruyenhinhkts.com/tan-so-va-tram-phat-dvb-t2.html>
- Wikipedia EN — List of digital television stations in Vietnam

## Ghi chú hiện trạng

- VTC đã NGỪNG phát sóng mặt đất từ tháng 1/2025 — mux VTC nào được thêm
  sau này phải có `status: "inactive"`.
- mic.gov.vn đã chuyển thành mst.gov.vn (sáp nhập bộ 2025); trang bản đồ
  phủ sóng cũ chỉ còn ảnh tĩnh năm 2016, không có dữ liệu tọa độ.
- CHƯA CÓ dữ liệu: miền núi phía Bắc (Hà Giang cũ, Cao Bằng, Lào Cai cũ,
  Lai Châu, Điện Biên, Sơn La, Lạng Sơn…), Tây Nguyên (Kon Tum cũ, Gia Lai
  cũ, Đắk Nông cũ), trạm AVG, tọa độ chính xác trạm DTV/RTB đồng bằng sông
  Hồng. Đóng góp qua PR rất hoan nghênh — xem CONTRIBUTING.md.
- Phân cực (polarization) không có trong bất kỳ nguồn nào → `null` toàn bộ.
- Địa chỉ (`addressOld`) giữ nguyên văn theo nguồn, dùng tên tỉnh CŨ
  (trước sáp nhập 2025); trường `province` dùng slug tỉnh MỚI.
