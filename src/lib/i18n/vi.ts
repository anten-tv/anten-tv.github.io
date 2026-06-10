// All UI strings — single locale, single file.
export const vi = {
  appName: 'Anten VN',

  // Navigation
  navMap: 'Bản đồ',
  navList: 'Gần bạn',
  navAim: 'Chỉnh ăng-ten',

  // Map / towers
  loadingMap: 'Đang tải bản đồ…',
  towerActive: 'Đang phát',
  towerInactive: 'Ngừng phát',
  towerUnknown: 'Chưa rõ',
  verifiedBadge: 'Đã kiểm chứng',
  unverified: 'chưa kiểm chứng',
  coverageToggle: 'Vùng phủ (ước tính)',
  coverageDisclaimer:
    'Vùng phủ ước tính theo địa hình và độ cao ăng-ten, chỉ mang tính tham khảo.',

  // Tower detail
  distance: 'Khoảng cách',
  bearing: 'Hướng',
  height: 'Độ cao ăng-ten',
  heightShort: 'ăng-ten cao',
  channels: 'Kênh phát',
  polarization: 'Phân cực',
  polarizationUnknown: 'chưa rõ — thường là ngang (H)',
  polarizationShort: 'phân cực',
  polarizationUnknownShort: 'phân cực chưa rõ (thường H)',
  sourceLabel: 'Nguồn',
  reportError: 'Báo lỗi',
  aimCta: 'Chỉnh ăng-ten',
  statusLabel: 'Trạng thái',

  // Aim screen
  aimCorrect: 'ĐÚNG HƯỚNG',
  aimTolerance:
    'La bàn điện thoại có sai số ±10°. Xoay ăng-ten từ từ quanh hướng này để dò tín hiệu tốt nhất.',
  aimNoCompass:
    'Thiết bị không có la bàn. Dùng số độ bên dưới với la bàn thật hoặc ứng dụng la bàn.',
  enableCompass: 'Bật la bàn',
  compassExplainer:
    'Ứng dụng cần quyền truy cập cảm biến hướng để chỉ hướng ăng-ten. Nhấn nút bên dưới và chọn "Cho phép".',
  compassDenied:
    'Quyền la bàn bị từ chối. Tải lại trang rồi nhấn "Bật la bàn" lần nữa, hoặc dùng số độ bên dưới.',
  calibrationTitle: 'Hiệu chỉnh la bàn',
  calibrationBody:
    'Xoay điện thoại theo hình số 8 vài lần. Tránh đứng gần mái tôn, lan can sắt, ô tô.',
  calibrationDismiss: 'Đã hiểu',

  // Location
  locating: 'Đang định vị… (có thể mất 1-2 phút ngoài trời)',
  lastKnownFix: 'vị trí lần trước',
  manualLocation: 'Vị trí thủ công',
  manualLocationHint: 'Chọn tỉnh/thành hoặc chấm vị trí trên bản đồ',
  pickBanner: 'Nhấn vào bản đồ để chọn vị trí của bạn',
  pickOnMap: 'Chấm trên bản đồ',
  useGps: 'Dùng GPS',
  pickProvince: 'Chọn tỉnh/thành',
  locationDenied:
    'Không truy cập được vị trí. Chọn vị trí thủ công để tiếp tục.',
  locationDeniedList:
    'Không truy cập được vị trí — danh sách xếp theo tên. Vào tab "Chỉnh ăng-ten" để chọn vị trí thủ công.',

  // Offline / data
  offlineReady: 'Đã sẵn sàng dùng ngoại tuyến',
  offline: 'Ngoại tuyến',
  dataInfo: (n: number, updated: string) =>
    `Dữ liệu: ${n} trạm, cập nhật ${updated}`,
  dataVintageDisclaimer:
    'Dữ liệu nguồn 2017–2023, có thể đã thay đổi. Nhấn "Báo lỗi" nếu thấy sai.',
  tilesOfflineNote:
    'Bản đồ nền chỉ có sẵn ngoại tuyến ở khu vực đã xem. Danh sách trạm và la bàn luôn hoạt động.',

  // Onboarding
  onboarding1Title: 'Tìm trạm phát gần bạn',
  onboarding1Body:
    'Xem tất cả trạm phát DVB-T2 trên bản đồ, kèm kênh và khoảng cách.',
  onboarding2Title: 'Xoay ăng-ten vào vùng xanh',
  onboarding2Body:
    'La bàn chỉ hướng tới trạm. Xoay ăng-ten từ từ quanh hướng đó để dò tín hiệu.',
  onboarding3Title: 'Hoạt động ngoại tuyến',
  onboarding3Body:
    'Sau lần tải đầu, ứng dụng và dữ liệu trạm hoạt động không cần mạng.',
  onboardingSkip: 'Bỏ qua',
  onboardingNext: 'Tiếp',
  onboardingDone: 'Bắt đầu',

  // Contribute
  contribute: 'Đóng góp',
  noDataRegion:
    'Khu vực này chưa có dữ liệu trạm — không có nghĩa là không có sóng. Bạn biết trạm ở đây? Hãy đóng góp!',

  // Install
  install: 'Cài đặt ứng dụng',
  iosInstallHint:
    'Cài lên màn hình chính: nhấn nút Chia sẻ rồi chọn "Thêm vào MH chính".',

  // Cardinal directions, 16-wind
  cardinals: [
    'Bắc',
    'Bắc Đông Bắc',
    'Đông Bắc',
    'Đông Đông Bắc',
    'Đông',
    'Đông Đông Nam',
    'Đông Nam',
    'Nam Đông Nam',
    'Nam',
    'Nam Tây Nam',
    'Tây Nam',
    'Tây Tây Nam',
    'Tây',
    'Tây Tây Bắc',
    'Tây Bắc',
    'Bắc Tây Bắc',
  ] as const,
}
