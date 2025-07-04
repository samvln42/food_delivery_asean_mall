-- Insert Korean language
INSERT INTO Languages (code, name, is_default, is_active)
VALUES ('ko', 'Korean', FALSE, TRUE);

-- Get the language_id for Korean
SET @ko_lang_id = LAST_INSERT_ID();

-- Insert translations for Common group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'common.welcome', '환영합니다', 'common'),
(@ko_lang_id, 'common.login', '로그인', 'common'),
(@ko_lang_id, 'common.register', '회원가입', 'common'),
(@ko_lang_id, 'common.logout', '로그아웃', 'common'),
(@ko_lang_id, 'common.profile', '프로필', 'common'),
(@ko_lang_id, 'common.settings', '설정', 'common'),
(@ko_lang_id, 'common.save', '저장', 'common'),
(@ko_lang_id, 'common.cancel', '취소', 'common'),
(@ko_lang_id, 'common.delete', '삭제', 'common'),
(@ko_lang_id, 'common.edit', '편집', 'common'),
(@ko_lang_id, 'common.search', '검색', 'common'),
(@ko_lang_id, 'common.back', '뒤로', 'common'),
(@ko_lang_id, 'common.loading', '로딩 중...', 'common'),
(@ko_lang_id, 'common.error', '오류', 'common'),
(@ko_lang_id, 'common.success', '성공', 'common'),
(@ko_lang_id, 'common.yes', '예', 'common'),
(@ko_lang_id, 'common.no', '아니오', 'common'),
(@ko_lang_id, 'common.confirm', '확인', 'common'),
(@ko_lang_id, 'common.submit', '제출', 'common'),
(@ko_lang_id, 'common.close', '닫기', 'common'),
(@ko_lang_id, 'common.view', '보기', 'common'),
(@ko_lang_id, 'common.details', '상세정보', 'common'),
(@ko_lang_id, 'common.status', '상태', 'common'),
(@ko_lang_id, 'common.actions', '작업', 'common'),
(@ko_lang_id, 'common.home', '홈', 'common'),
(@ko_lang_id, 'common.about', '소개', 'common'),
(@ko_lang_id, 'common.contact', '연락처', 'common');

-- Insert translations for Authentication group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'auth.email', '이메일', 'auth'),
(@ko_lang_id, 'auth.password', '비밀번호', 'auth'),
(@ko_lang_id, 'auth.confirm_password', '비밀번호 확인', 'auth'),
(@ko_lang_id, 'auth.forgot_password', '비밀번호를 잊으셨나요?', 'auth'),
(@ko_lang_id, 'auth.reset_password', '비밀번호 재설정', 'auth'),
(@ko_lang_id, 'auth.change_password', '비밀번호 변경', 'auth'),
(@ko_lang_id, 'auth.login_success', '로그인 성공', 'auth'),
(@ko_lang_id, 'auth.register_success', '회원가입 성공', 'auth'),
(@ko_lang_id, 'auth.logout_success', '로그아웃 성공', 'auth'),
(@ko_lang_id, 'auth.verify_email', '이메일 인증', 'auth'),
(@ko_lang_id, 'auth.email_verification', '이메일 인증', 'auth'),
(@ko_lang_id, 'auth.email_verified', '이메일 인증 완료', 'auth'),
(@ko_lang_id, 'auth.google_login', 'Google로 로그인', 'auth'),
(@ko_lang_id, 'auth.verification_sent', '인증 이메일이 발송되었습니다', 'auth'),
(@ko_lang_id, 'auth.verification_required', '이메일 인증이 필요합니다', 'auth'),
(@ko_lang_id, 'auth.username', '사용자명 / 이메일', 'auth'),
(@ko_lang_id, 'auth.remember_me', '로그인 상태 유지', 'auth'),
(@ko_lang_id, 'auth.or', '또는', 'auth'),
(@ko_lang_id, 'auth.register_now', '지금 회원가입', 'auth'),
(@ko_lang_id, 'auth.login_now', '지금 로그인', 'auth'),
(@ko_lang_id, 'auth.verify_email_title', '이메일을 인증해주세요', 'auth'),
(@ko_lang_id, 'auth.verify_email_message', '{email}로 인증 코드를 발송했습니다. 이메일을 확인하고 아래에 인증 코드를 입력해주세요', 'auth'),
(@ko_lang_id, 'auth.verification_code', '인증 코드', 'auth'),
(@ko_lang_id, 'auth.verification_code_placeholder', '이메일에서 받은 인증 코드를 입력하세요', 'auth'),
(@ko_lang_id, 'auth.verification_code_format', '인증 코드 형식: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX', 'auth'),
(@ko_lang_id, 'auth.verifying', '이메일 인증 중...', 'auth'),
(@ko_lang_id, 'auth.verify_success', '이메일 인증 완료! 이제 로그인할 수 있습니다', 'auth'),
(@ko_lang_id, 'auth.resend_code', '인증 코드 재발송', 'auth'),
(@ko_lang_id, 'auth.resend_success', '{email}로 인증 이메일을 재발송했습니다', 'auth'),
(@ko_lang_id, 'auth.resend_countdown', '{seconds}초 후에 재발송할 수 있습니다', 'auth'),
(@ko_lang_id, 'auth.agree_terms', '이용약관에 동의합니다', 'auth'),
(@ko_lang_id, 'auth.required_field', '필수 항목', 'auth'),
(@ko_lang_id, 'auth.phone', '전화번호', 'auth'),
(@ko_lang_id, 'auth.address', '주소', 'auth'),
(@ko_lang_id, 'auth.role', '역할', 'auth'),
(@ko_lang_id, 'auth.customer', '고객', 'auth'),
(@ko_lang_id, 'auth.restaurant', '레스토랑', 'auth');

-- Insert translations for Validation group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'validation.required', '이 필드는 필수입니다', 'validation'),
(@ko_lang_id, 'validation.email_invalid', '유효하지 않은 이메일 주소입니다', 'validation'),
(@ko_lang_id, 'validation.password_mismatch', '비밀번호가 일치하지 않습니다', 'validation'),
(@ko_lang_id, 'validation.password_length', '비밀번호는 최소 8자 이상이어야 합니다', 'validation'),
(@ko_lang_id, 'validation.invalid_credentials', '유효하지 않은 인증 정보입니다', 'validation');

-- Insert translations for Restaurant group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'restaurant.name', '레스토랑 이름', 'restaurant'),
(@ko_lang_id, 'restaurant.description', '설명', 'restaurant'),
(@ko_lang_id, 'restaurant.address', '주소', 'restaurant'),
(@ko_lang_id, 'restaurant.phone', '전화번호', 'restaurant'),
(@ko_lang_id, 'restaurant.opening_hours', '영업시간', 'restaurant'),
(@ko_lang_id, 'restaurant.categories', '카테고리', 'restaurant'),
(@ko_lang_id, 'restaurant.menu', '메뉴', 'restaurant'),
(@ko_lang_id, 'restaurant.reviews', '리뷰', 'restaurant'),
(@ko_lang_id, 'restaurant.rating', '평점', 'restaurant'),
(@ko_lang_id, 'restaurant.status', '상태', 'restaurant'),
(@ko_lang_id, 'restaurant.create', '레스토랑 생성', 'restaurant'),
(@ko_lang_id, 'restaurant.edit', '레스토랑 편집', 'restaurant'),
(@ko_lang_id, 'restaurant.delete', '레스토랑 삭제', 'restaurant');

-- Insert translations for Product group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'product.name', '상품명', 'product'),
(@ko_lang_id, 'product.description', '설명', 'product'),
(@ko_lang_id, 'product.price', '가격', 'product'),
(@ko_lang_id, 'product.category', '카테고리', 'product'),
(@ko_lang_id, 'product.image', '이미지', 'product'),
(@ko_lang_id, 'product.quantity', '수량', 'product'),
(@ko_lang_id, 'product.availability', '재고 상태', 'product'),
(@ko_lang_id, 'product.create', '상품 생성', 'product'),
(@ko_lang_id, 'product.edit', '상품 편집', 'product'),
(@ko_lang_id, 'product.delete', '상품 삭제', 'product');

-- Insert translations for Order group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'order.number', '주문번호', 'order'),
(@ko_lang_id, 'order.status', '주문 상태', 'order'),
(@ko_lang_id, 'order.total', '총 금액', 'order'),
(@ko_lang_id, 'order.items', '주문 항목', 'order'),
(@ko_lang_id, 'order.date', '주문일', 'order'),
(@ko_lang_id, 'order.delivery_address', '배송 주소', 'order'),
(@ko_lang_id, 'order.payment_method', '결제 방법', 'order'),
(@ko_lang_id, 'order.status.pending', '대기 중', 'order'),
(@ko_lang_id, 'order.status.confirmed', '확인됨', 'order'),
(@ko_lang_id, 'order.status.preparing', '준비 중', 'order'),
(@ko_lang_id, 'order.status.ready', '배송 준비 완료', 'order'),
(@ko_lang_id, 'order.status.delivering', '배송 중', 'order'),
(@ko_lang_id, 'order.status.delivered', '배송 완료', 'order'),
(@ko_lang_id, 'order.status.cancelled', '취소됨', 'order');

-- Insert translations for Cart group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'cart.empty', '장바구니가 비어있습니다', 'cart'),
(@ko_lang_id, 'cart.add', '장바구니에 추가', 'cart'),
(@ko_lang_id, 'cart.remove', '장바구니에서 제거', 'cart'),
(@ko_lang_id, 'cart.clear', '장바구니 비우기', 'cart'),
(@ko_lang_id, 'cart.checkout', '결제하기', 'cart'),
(@ko_lang_id, 'cart.total', '총액', 'cart'),
(@ko_lang_id, 'cart.items', '장바구니 항목', 'cart'),
(@ko_lang_id, 'cart.add_items', '장바구니에 항목 추가', 'cart');

-- Insert translations for Profile group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'profile.personal_info', '개인정보', 'profile'),
(@ko_lang_id, 'profile.update', '프로필 업데이트', 'profile'),
(@ko_lang_id, 'profile.orders', '내 주문', 'profile'),
(@ko_lang_id, 'profile.favorites', '내 즐겨찾기', 'profile'),
(@ko_lang_id, 'profile.addresses', '내 주소', 'profile'),
(@ko_lang_id, 'profile.notifications', '내 알림', 'profile');

-- Insert translations for Error Messages group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'error.general', '문제가 발생했습니다', 'error'),
(@ko_lang_id, 'error.network', '네트워크 오류', 'error'),
(@ko_lang_id, 'error.unauthorized', '권한이 없습니다', 'error'),
(@ko_lang_id, 'error.not_found', '찾을 수 없습니다', 'error'),
(@ko_lang_id, 'error.server_error', '서버 오류', 'error'),
(@ko_lang_id, 'error.forbidden', '접근이 금지되었습니다', 'error');

-- Insert translations for Notifications group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'notification.new_order', '새 주문', 'notification'),
(@ko_lang_id, 'notification.order_status', '주문 상태 업데이트', 'notification'),
(@ko_lang_id, 'notification.order_cancelled', '주문 취소', 'notification'),
(@ko_lang_id, 'notification.profile_updated', '프로필 업데이트', 'notification');

-- Insert translations for Dashboard group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'dashboard.overview', '개요', 'dashboard'),
(@ko_lang_id, 'dashboard.sales', '매출', 'dashboard'),
(@ko_lang_id, 'dashboard.orders', '주문', 'dashboard'),
(@ko_lang_id, 'dashboard.customers', '고객', 'dashboard'),
(@ko_lang_id, 'dashboard.popular_items', '인기 상품', 'dashboard'),
(@ko_lang_id, 'dashboard.recent_orders', '최근 주문', 'dashboard'),
(@ko_lang_id, 'dashboard.statistics', '통계', 'dashboard');

-- Insert translations for Admin group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'admin.users', '사용자 관리', 'admin'),
(@ko_lang_id, 'admin.restaurants', '레스토랑 관리', 'admin'),
(@ko_lang_id, 'admin.categories', '카테고리 관리', 'admin'),
(@ko_lang_id, 'admin.orders', '주문 관리', 'admin'),
(@ko_lang_id, 'admin.settings', '시스템 설정', 'admin'),
(@ko_lang_id, 'admin.notifications', '시스템 알림', 'admin');

-- Insert translations for Favorites group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'favorites.title', '즐겨찾기 목록', 'favorites'),
(@ko_lang_id, 'favorites.empty', '즐겨찾기 목록이 없습니다', 'favorites'),
(@ko_lang_id, 'favorites.add', '즐겨찾기에 추가', 'favorites'),
(@ko_lang_id, 'favorites.remove', '즐겨찾기에서 제거', 'favorites'),
(@ko_lang_id, 'favorites.empty_message', '즐겨찾기 목록에 좋아하는 레스토랑이나 메뉴를 추가하세요', 'favorites'),
(@ko_lang_id, 'favorites.search_restaurant', '레스토랑 검색', 'favorites');

-- Insert translations for Address group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'address.title', '내 주소', 'address'),
(@ko_lang_id, 'address.empty', '주소가 없습니다', 'address'),
(@ko_lang_id, 'address.add', '새 주소 추가', 'address'),
(@ko_lang_id, 'address.empty_message', '편리한 배송을 위해 주소를 추가하세요', 'address'),
(@ko_lang_id, 'address.development_notice', '주소 관리 기능은 개발 중입니다', 'address');

-- Insert translations for Settings group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'settings.general', '일반 설정', 'settings'),
(@ko_lang_id, 'settings.account', '계정 설정', 'settings'),
(@ko_lang_id, 'settings.privacy', '개인정보 설정', 'settings'),
(@ko_lang_id, 'settings.notifications', '알림 설정', 'settings'),
(@ko_lang_id, 'settings.language', '언어 설정', 'settings'),
(@ko_lang_id, 'settings.appearance', '외관 설정', 'settings');

-- Insert translations for About group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'about.title', '회사 소개', 'about'),
(@ko_lang_id, 'about.mission', '우리의 미션', 'about'),
(@ko_lang_id, 'about.mission_text', '우리는 고품질 레스토랑과 고객을 연결하여 좋아하는 곳에서 맛있는 음식을 즐길 수 있도록 하는 선도적인 온라인 음식 주문 플랫폼입니다', 'about'),
(@ko_lang_id, 'about.mission_text2', '첨단 기술과 친절한 서비스로 편리하고 빠르며 만족스러운 음식 주문 경험을 제공하겠습니다', 'about'),
(@ko_lang_id, 'about.popularity', '우리의 인기', 'about'),
(@ko_lang_id, 'about.best_quality', '최고의 음식 품질', 'about'),
(@ko_lang_id, 'about.fast', '빠른 배송', 'about'),
(@ko_lang_id, 'about.safe_delivery', '안전한 배송', 'about'),
(@ko_lang_id, 'about.local_support', '지역 레스토랑 지원', 'about'),
(@ko_lang_id, 'about.vision', '비전', 'about'),
(@ko_lang_id, 'about.vision_text', '우리는 고품질 레스토랑과 고객을 연결하여 좋아하는 곳에서 맛있는 음식을 즐길 수 있도록 하는 선도적인 온라인 음식 주문 플랫폼입니다', 'about'),
(@ko_lang_id, 'about.services', '우리의 서비스', 'about'),
(@ko_lang_id, 'about.service_fast', '빠른 배송', 'about'),
(@ko_lang_id, 'about.service_fast_text', '30-45분 내에 음식을 손에 전달', 'about'),
(@ko_lang_id, 'about.service_quality', '좋은 품질', 'about'),
(@ko_lang_id, 'about.service_quality_text', '선별을 통한 좋은 품질의 레스토랑', 'about'),
(@ko_lang_id, 'about.service_payment', '쉬운 결제', 'about'),
(@ko_lang_id, 'about.service_payment_text', '다양한 결제 방법 지원', 'about');

-- Insert translations for Contact group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'contact.title', '연락처', 'contact'),
(@ko_lang_id, 'contact.phone', '전화번호', 'contact'),
(@ko_lang_id, 'contact.email', '이메일', 'contact'),
(@ko_lang_id, 'contact.address', '주소', 'contact'),
(@ko_lang_id, 'contact.hours', '영업시간', 'contact'),
(@ko_lang_id, 'contact.hours_text', '월요일-일요일 8:00-22:00', 'contact'),
(@ko_lang_id, 'contact.form_title', '메시지 보내기', 'contact'),
(@ko_lang_id, 'contact.name', '이름', 'contact'),
(@ko_lang_id, 'contact.name_placeholder', '이름을 입력하세요', 'contact'),
(@ko_lang_id, 'contact.email_placeholder', '이메일을 입력하세요', 'contact'),
(@ko_lang_id, 'contact.subject', '제목', 'contact'),
(@ko_lang_id, 'contact.subject_placeholder', '메시지 제목을 입력하세요', 'contact'),
(@ko_lang_id, 'contact.message', '메시지', 'contact'),
(@ko_lang_id, 'contact.message_placeholder', '메시지를 입력하세요', 'contact'),
(@ko_lang_id, 'contact.send', '메시지 보내기', 'contact'),
(@ko_lang_id, 'contact.sending', '전송 중...', 'contact'),
(@ko_lang_id, 'contact.success', '메시지가 성공적으로 전송되었습니다. 24시간 내에 연락드리겠습니다', 'contact'),
(@ko_lang_id, 'contact.error', '메시지 전송 중 오류가 발생했습니다. 다시 시도해주세요', 'contact'),
(@ko_lang_id, 'contact.fill_all', '모든 정보를 입력해주세요', 'contact'),
(@ko_lang_id, 'contact.other_ways', '다른 연락 방법', 'contact');

-- Insert translations for Help group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'help.title', '고객센터', 'help'),
(@ko_lang_id, 'help.faq', '자주 묻는 질문 (FAQ)', 'help'),
(@ko_lang_id, 'help.how_to_order', '음식 주문 방법', 'help'),
(@ko_lang_id, 'help.how_to_order_text', '1. 레스토랑 선택\n2. 메뉴 선택 후 장바구니에 추가\n3. 목록 확인 후 배송 주소 입력\n4. 결제 방법 선택 후 주문 확인', 'help'),
(@ko_lang_id, 'help.how_to_pay', '결제 방법', 'help'),
(@ko_lang_id, 'help.how_to_pay_text', '신용카드, 직불카드, 계좌이체, 현금 결제(일부 지역)를 지원합니다', 'help'),
(@ko_lang_id, 'help.delivery_time', '배송 시간', 'help'),
(@ko_lang_id, 'help.delivery_time_text', '일반적으로 거리와 주문 복잡도에 따라 30-45분이 소요됩니다', 'help'),
(@ko_lang_id, 'help.track_order', '주문 추적 방법', 'help'),
(@ko_lang_id, 'help.track_order_text', '"주문 내역" 페이지나 이메일, SMS를 통해 주문 상태를 추적할 수 있습니다', 'help'),
(@ko_lang_id, 'help.cancel_order', '주문 취소 방법', 'help'),
(@ko_lang_id, 'help.cancel_order_text', '주문 후 5분 이내에 취소할 수 있습니다. 이 시간을 초과하면 고객센터에 문의해주세요', 'help'),
(@ko_lang_id, 'help.delivery_fee', '배송비', 'help'),
(@ko_lang_id, 'help.delivery_fee_text', '배송비는 15바트이며 거리에 따라 달라질 수 있습니다. 200바트 이상 주문 시 무료 배송입니다', 'help'),
(@ko_lang_id, 'help.contact_us', '연락처', 'help'),
(@ko_lang_id, 'help.contact_us_text', '찾고 계신 답변이 없다면 다음으로 연락해주세요:\n전화: {phone} | 이메일: {email}', 'help');

-- Insert translations for Terms group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'terms.title', '이용약관', 'terms'),
(@ko_lang_id, 'terms.acceptance', '1. 약관 동의', 'terms'),
(@ko_lang_id, 'terms.acceptance_text', '서비스를 이용함으로써 여기에 명시된 모든 약관과 조건을 준수하는 것에 동의합니다', 'terms'),
(@ko_lang_id, 'terms.account', '2. 계정 생성', 'terms'),
(@ko_lang_id, 'terms.account_text', '• 만 18세 이상이거나 부모의 동의가 있어야 합니다\n• 제공된 정보는 정확하고 최신이어야 합니다\n• 비밀번호 보안 유지에 대한 책임이 있습니다', 'terms'),
(@ko_lang_id, 'terms.ordering', '3. 주문 및 결제', 'terms'),
(@ko_lang_id, 'terms.ordering_text', '• 표시된 가격에는 세금이 포함됩니다\n• 결제는 우리가 설정한 채널을 통해 이루어져야 합니다\n• 주문 후 5분 이내에 주문을 취소할 수 있습니다', 'terms'),
(@ko_lang_id, 'terms.delivery', '4. 배송', 'terms'),
(@ko_lang_id, 'terms.delivery_text', '• 정시 배송을 노력하지만 지연될 수 있습니다\n• 수령인은 만 18세 이상이거나 부모의 동의가 있어야 합니다\n• 수령인이 없으면 15분 내에 연락드리겠습니다', 'terms'),
(@ko_lang_id, 'terms.refund', '5. 환불 및 보증', 'terms'),
(@ko_lang_id, 'terms.refund_text', '• 음식에 품질 문제가 있으면 환불하거나 교체해드립니다\n• 음식 수령 후 1시간 이내에 문제를 신고해야 합니다\n• 환불은 7-14 영업일 내에 처리됩니다', 'terms'),
(@ko_lang_id, 'terms.liability', '6. 책임 제한', 'terms'),
(@ko_lang_id, 'terms.liability_text', '우리의 과실이 아닌 경우 서비스 이용으로 인한 모든 손해에 대해 책임지지 않습니다', 'terms'),
(@ko_lang_id, 'terms.modification', '7. 약관 수정', 'terms'),
(@ko_lang_id, 'terms.modification_text', '30일 전 고지 후 언제든지 이 약관을 수정할 권리를 보유합니다', 'terms'),
(@ko_lang_id, 'terms.effective_date', '시행일', 'terms'),
(@ko_lang_id, 'terms.contact_us', '연락처', 'terms');

-- Insert translations for Privacy group
INSERT INTO Translations (language_id, `key`, value, `group`) VALUES
(@ko_lang_id, 'privacy.title', '개인정보 처리방침', 'privacy'),
(@ko_lang_id, 'privacy.intro', '소개', 'privacy'),
(@ko_lang_id, 'privacy.intro_text', '이 개인정보 처리방침은 개인정보를 수집, 사용, 보호하는 방법을 설명합니다', 'privacy'),
(@ko_lang_id, 'privacy.collection', '수집하는 정보', 'privacy'),
(@ko_lang_id, 'privacy.collection_text', '• 개인정보 (이름, 이메일, 전화번호)\n• 배송 정보 (주소, 배송 지시사항)\n• 결제 정보\n• 기기 및 사용 정보', 'privacy'),
(@ko_lang_id, 'privacy.use', '정보 사용 방법', 'privacy'),
(@ko_lang_id, 'privacy.use_text', '• 주문 처리 및 배송\n• 주문에 대한 소통\n• 서비스 개선\n• 프로모션 자료 발송 (동의 시)', 'privacy'),
(@ko_lang_id, 'privacy.sharing', '정보 공유', 'privacy'),
(@ko_lang_id, 'privacy.sharing_text', '개인정보를 판매하지 않습니다. 다음과 같은 경우에만 정보를 공유합니다:\n• 주문 이행을 위한 레스토랑\n• 주문 배송을 위한 배송 파트너\n• 결제 처리를 위한 결제 처리업체', 'privacy'),
(@ko_lang_id, 'privacy.security', '보안', 'privacy'),
(@ko_lang_id, 'privacy.security_text', '개인정보를 보호하기 위한 적절한 보안 조치를 구현합니다', 'privacy'),
(@ko_lang_id, 'privacy.cookies', '쿠키', 'privacy'),
(@ko_lang_id, 'privacy.cookies_text', '경험 개선 및 웹사이트 트래픽 분석을 위해 쿠키를 사용합니다', 'privacy'),
(@ko_lang_id, 'privacy.rights', '귀하의 권리', 'privacy'),
(@ko_lang_id, 'privacy.rights_text', '다음과 같은 권리가 있습니다:\n• 개인정보 접근\n• 개인정보 수정\n• 개인정보 삭제\n• 개인정보 처리에 대한 이의제기', 'privacy'),
(@ko_lang_id, 'privacy.contact', '개인정보 관련 문의', 'privacy'),
(@ko_lang_id, 'privacy.contact_text', '이 개인정보 처리방침에 대한 질문이 있으시면 다음으로 연락해주세요: {email}', 'privacy'),
(@ko_lang_id, 'privacy.updates', '정책 업데이트', 'privacy'),
(@ko_lang_id, 'privacy.updates_text', '이 정책을 수시로 업데이트할 수 있습니다. 중요한 변경사항이 있으면 알려드리겠습니다', 'privacy');