import json
import os
import re

# Update vi.json
with open('src/locales/vi.json', 'r', encoding='utf-8') as f:
    vi_data = json.load(f)

vi_data['sharedScreen'].update({
    "bannerDirectEdit": "Chỉnh sửa trực tiếp",
    "bannerSuggestMode": "Chế độ Đề xuất",
    "bannerDirectEditDesc": "Vai trò \"{{role}}\": Bạn có quyền chỉnh sửa trực tiếp phần được phân công.",
    "bannerSuggestModeDesc": "Các thay đổi của bạn sẽ được gửi cho chủ chuyến đi xét duyệt.",
    "closeBanner": "Đóng thông báo"
})

with open('src/locales/vi.json', 'w', encoding='utf-8') as f:
    json.dump(vi_data, f, ensure_ascii=False, indent=2)

# Update en.json
with open('src/locales/en.json', 'r', encoding='utf-8') as f:
    en_data = json.load(f)

if 'sharedScreen' not in en_data:
    en_data['sharedScreen'] = {}

en_data['sharedScreen'].update({
    "bannerDirectEdit": "Direct Edit",
    "bannerSuggestMode": "Suggestion Mode",
    "bannerDirectEditDesc": "Role \"{{role}}\": You have permission to directly edit your assigned parts.",
    "bannerSuggestModeDesc": "Your changes will be sent to the trip owner for review.",
    "closeBanner": "Close notification"
})

with open('src/locales/en.json', 'w', encoding='utf-8') as f:
    json.dump(en_data, f, ensure_ascii=False, indent=2)

# Update SharedTripScreen.tsx
with open('src/features/share/SharedTripScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace classes for green banner
content = content.replace(
    '"text-white py-2.5 px-4 shadow-md select-none border-b border-white/5",',
    '"py-2.5 px-4 shadow-md select-none border-b",\n          (userRoleLower.includes("tài xế") || userRoleLower.includes("dẫn đường") || userRoleLower.includes("quản lý chi phí"))\n            ? "text-emerald-900 border-emerald-200/50 bg-gradient-to-r from-emerald-50 via-emerald-100/80 to-teal-50/50 dark:text-white dark:border-white/5 dark:bg-gradient-to-r dark:from-[#003830] dark:via-[#005c56] dark:to-[#004c43]"\n            : "text-sky-900 border-sky-200/50 bg-gradient-to-r from-sky-50 via-sky-100/80 to-indigo-50/50 dark:text-white dark:border-white/5 dark:bg-gradient-to-r dark:from-[#0a122c] dark:via-[#0f1d4a] dark:to-[#161330]"'
)

# Remove the old ternary logic for the banner background
old_bg_logic = '''
          (userRoleLower.includes("tài xế") || userRoleLower.includes("dẫn đường") || userRoleLower.includes("quản lý chi phí")) 
            ? "bg-gradient-to-r from-[#003830] via-[#005c56] to-[#004c43]" 
            : "bg-gradient-to-r from-[#0a122c] via-[#0f1d4a] to-[#161330]"'''
content = content.replace(old_bg_logic, '')

# Replace "text-white/90" with "text-emerald-800/90 dark:text-white/90" for green, but wait, it's shared text. Let's just use "text-slate-800 dark:text-white/90".
content = content.replace(
    'className="flex items-center gap-2.5 text-[12px] font-bold text-white/90"',
    'className="flex items-center gap-2.5 text-[12px] font-bold text-slate-800 dark:text-white/90"'
)

# Replace close button text color
content = content.replace(
    'className="text-white/40 hover:text-white/85 p-1 rounded-full transition-colors cursor-pointer shrink-0"',
    'className="text-slate-400 hover:text-slate-700 dark:text-white/40 dark:hover:text-white/85 p-1 rounded-full transition-colors cursor-pointer shrink-0"'
)

content = content.replace(
    'title="Đóng thông báo"',
    'title={t("sharedScreen.closeBanner")}'
)

# Replace "Chỉnh sửa trực tiếp" and "Chế độ Đề xuất" badges
content = content.replace(
    '                    ? "Chỉnh sửa trực tiếp"\n                    : "Chế độ Đề xuất"',
    '                    ? t("sharedScreen.bannerDirectEdit")\n                    : t("sharedScreen.bannerSuggestMode")'
)

# Replace descriptions
old_desc = '''
                  <span className="text-white/85 font-medium">
                    {userRoleLower.includes("tài xế") || userRoleLower.includes("dẫn đường") || userRoleLower.includes("quản lý chi phí")
                      ? `Vai trò "${currentUser?.role}": Bạn có quyền chỉnh sửa trực tiếp phần được phân công.`
                      : "Các thay đổi của bạn sẽ được gửi cho chủ chuyến đi xét duyệt."
                    }
                  </span>'''
new_desc = '''
                  <span className="text-slate-700/85 dark:text-white/85 font-medium">
                    {userRoleLower.includes("tài xế") || userRoleLower.includes("dẫn đường") || userRoleLower.includes("quản lý chi phí")
                      ? t("sharedScreen.bannerDirectEditDesc", { role: currentUser?.role || "" })
                      : t("sharedScreen.bannerSuggestModeDesc")
                    }
                  </span>'''
content = content.replace(old_desc, new_desc)

with open('src/features/share/SharedTripScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
