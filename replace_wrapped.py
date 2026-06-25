import re

filepath = "src/features/more/MoreScreen.tsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

replacements = {
    # Header title
    '<h2 className="text-[28px] md:text-[32px] font-extrabold tracking-tight text-kat-dark">Tổng kết hành trình</h2>':
    '<h2 className="text-[28px] md:text-[32px] font-extrabold tracking-tight text-kat-dark">{t("more.featureWrapped")}</h2>',
    
    # Subtitle
    '<p className="mt-0.5 text-[14px] md:text-[15px] font-medium text-slate-500 dark:text-slate-400">Nhìn lại những dấu ấn đáng nhớ trong chuyến đi của bạn.</p>':
    '<p className="mt-0.5 text-[14px] md:text-[15px] font-medium text-slate-500 dark:text-slate-400">{t("more.wrappedSubtitle")}</p>',
    
    # Exporting
    '<span>{isGeneratingPdf ? "Đang xuất..." : "Xuất PDF"}</span>':
    '<span>{isGeneratingPdf ? t("more.wrappedExporting") : t("more.wrappedExportPdf")}</span>',
    
    # Day trip
    'Chuyến đi trong ngày': '{t("more.wrappedDayTrip")}',
    
    # Stats
    '<span className="text-[12px] font-bold text-slate-500 dark:text-slate-450 mt-1 block">Ngày hành trình</span>':
    '<span className="text-[12px] font-bold text-slate-500 dark:text-slate-450 mt-1 block">{t("more.wrappedDays")}</span>',
    
    '<span className="text-[12px] font-bold text-slate-500 dark:text-slate-450 mt-1 block">Mục lịch trình</span>':
    '<span className="text-[12px] font-bold text-slate-500 dark:text-slate-450 mt-1 block">{t("more.wrappedEvents")}</span>',
    
    '<span className="text-[12px] font-bold text-slate-500 dark:text-slate-450 mt-1 block">Hành lý</span>':
    '<span className="text-[12px] font-bold text-slate-500 dark:text-slate-450 mt-1 block">{t("more.wrappedPacking")}</span>',
    
    '<span className="text-[12px] font-bold text-slate-500 dark:text-slate-450 mt-1 block">Bài viết</span>':
    '<span className="text-[12px] font-bold text-slate-500 dark:text-slate-450 mt-1 block">{t("more.wrappedJournals")}</span>',
    
    # Finances
    'CHI PHÍ CHUYẾN ĐI': '{t("more.wrappedExpenseTitle")}',
    '<p className="text-[14px] font-semibold text-slate-500 dark:text-slate-450">Tổng chi phí</p>':
    '<p className="text-[14px] font-semibold text-slate-500 dark:text-slate-450">{t("more.wrappedTotalExpense")}</p>',
    
    '<p className="text-[13px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Chi chung chuyến đi</p>':
    '<p className="text-[13px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">{t("more.wrappedSharedExpense")}</p>',
    
    '<p className="text-[13px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">Chi cá nhân</p>':
    '<p className="text-[13px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-wider">{t("more.wrappedPersonalExpense")}</p>',
    
    'Chưa có người đồng hành để gợi ý cân đối chia tiền.': '{t("more.wrappedNoMembersExpense")}',
    
    '<p className="text-[14px] font-semibold text-slate-500 dark:text-slate-450">Nhà tài trợ chính</p>':
    '<p className="text-[14px] font-semibold text-slate-500 dark:text-slate-450">{t("more.wrappedTopPayer")}</p>',
    
    '<span className="font-extrabold text-kat-dark">{stats.topPayer.name}</span> là người chi nhiều nhất với <span className="font-extrabold text-kat-primary-usable">{formatMoney(stats.topPayer.amount)}</span>.':
    '<span className="font-extrabold text-kat-dark">{stats.topPayer.name}</span> {t("more.wrappedTopPayerDesc")} <span className="font-extrabold text-kat-primary-usable">{formatMoney(stats.topPayer.amount)}</span>.',
    
    'Chưa có dữ liệu chi phí cho chuyến đi này.': '{t("more.wrappedNoExpenseData")}',
    
    # Mood
    'DẤU ẤN CẢM XÚC': '{t("more.wrappedMoodTitle")}',
    'Cảm xúc chủ đạo được ghi nhận từ các bài viết trong bản tin hành trình của bạn.': '{t("more.wrappedMoodDesc")}',
    'Chưa có đủ bài viết để tổng kết cảm xúc chuyến đi.': '{t("more.wrappedNoMoodData")}',
    'Đăng thêm bản tin để lưu lại cảm xúc và khoảnh khắc đáng nhớ.': '{t("more.wrappedNoMoodDesc")}',
    'Đăng bài viết đầu tiên': '{t("more.wrappedPostFirstJournal")}',
    
    # First Moment 
    'Dấu ấn đầu tiên': '{t("more.wrappedFirstMoment")}',
    
    # Replace the JS expressions correctly
    '"{sortedEvents[0].title}" vào ngày ${formatDate(sortedEvents[0].date)}':
    '"{sortedEvents[0].title}" ${t(\'more.wrappedFirstMomentEvent2\')} ${formatDate(sortedEvents[0].date)}',
    
    'Bạn đã bắt đầu với': '${t(\'more.wrappedFirstMomentEvent1\')}',
    
    'Kỷ niệm đầu tiên được ghi lại vào ngày': '${t(\'more.wrappedFirstMomentJournal1\')}',
    
    '"{firstMomentText || "Chưa có dấu ấn đầu tiên. Hãy thêm hoạt động hoặc đăng bài viết để lưu lại khoảnh khắc mở đầu."}"':
    '{firstMomentText || t("more.wrappedNoFirstMoment")}',
    
    # Busiest Day
    '<h4 className="text-[13px] font-bold text-slate-500 dark:text-slate-400">Ngày nổi bật nhất</h4>':
    '<h4 className="text-[13px] font-bold text-slate-500 dark:text-slate-400">{t("more.wrappedBusiestDay")}</h4>',
    
    '<span className="font-extrabold text-amber-600 dark:text-amber-400">{formatDate(maxEventsDate)}</span> là ngày bận rộn nhất với <span className="font-bold text-kat-dark">{maxEventsCount} hoạt động</span> được ghi nhận.':
    '<span className="font-extrabold text-amber-600 dark:text-amber-400">{formatDate(maxEventsDate)}</span> {t("more.wrappedBusiestDayDesc")} <span className="font-bold text-kat-dark">{maxEventsCount} {t("more.wrappedBusiestDayDesc2")}</span>',
    
    '"Chưa có ngày nào đủ dữ liệu để chọn làm ngày nổi bật."': 't("more.wrappedNoBusiestDay")',
    
    # Locations
    '<h4 className="text-[13px] font-bold text-slate-500 dark:text-slate-400">Điểm đến đã ghé qua</h4>':
    '<h4 className="text-[13px] font-bold text-slate-500 dark:text-slate-400">{t("more.wrappedLocations")}</h4>',
    
    '"Chưa có điểm đến cụ thể nào trong lịch trình."': 't("more.wrappedNoLocations")',
}

for k, v in replacements.items():
    content = content.replace(k, v)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Replacement MoreScreen wrapped section complete")
