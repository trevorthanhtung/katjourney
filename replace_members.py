import re

def replace_roles_help_sheet():
    filepath = "src/components/RolesHelpSheet.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    if "useTranslation" not in content:
        content = content.replace(
            'import { BottomSheet } from "./ui";',
            'import { BottomSheet } from "./ui";\nimport { useTranslation } from "react-i18next";'
        )
        content = content.replace(
            '  onClose: () => void;\n}) {',
            '  onClose: () => void;\n}) {\n  const { t } = useTranslation();'
        )
        
    # Replace role titles and descriptions
    content = content.replace('"Trưởng nhóm"', 't("roles.roleLeader")')
    content = content.replace('"Người tạo chuyến đi và có toàn quyền quản trị tối cao."', 't("roles.roleLeaderDesc")')
    content = content.replace('"Tài xế"', 't("roles.roleDriver")')
    content = content.replace('"Phụ trách di chuyển, lái xe và quản lý phương tiện chính."', 't("roles.roleDriverDesc")')
    content = content.replace('"Dẫn đường"', 't("roles.roleNavigator")')
    content = content.replace('"Phụ trách dẫn đường, lộ trình di chuyển và bản đồ."', 't("roles.roleNavigatorDesc")')
    content = content.replace('"Quản lý chi phí"', 't("roles.roleCostManager")')
    content = content.replace('"Quản lý quỹ chung, ghi chép và chia tiền chi tiêu."', 't("roles.roleCostManagerDesc")')
    content = content.replace('"Người đồng hành"', 't("roles.roleCompanion")')
    content = content.replace('"Xem thông tin chuyến đi và gửi các ý kiến đề xuất."', 't("roles.roleCompanionDesc")')
    
    # Replace permissions
    content = content.replace('"Sửa lịch trình trực tiếp"', 't("roles.permEditTripDirectly")')
    content = content.replace('"Quản lý chi phí trực tiếp"', 't("roles.permManageCostDirectly")')
    content = content.replace('"Đề xuất thêm chi phí"', 't("roles.permSuggestCost")')
    content = content.replace('"Đề xuất sửa lịch trình"', 't("roles.permSuggestTrip")')
    
    # Replace headers
    content = content.replace('title="Thông tin các vai trò"', 'title={t("roles.rolesHelpTitle")}')
    content = content.replace('subtitle="Mỗi thành viên có trách nhiệm khác nhau để cùng vận hành chuyến đi"', 'subtitle={t("roles.rolesHelpSubtitle")}')
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)


def replace_more_screen():
    filepath = "src/features/more/MoreScreen.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    # I've already made sure useTranslation is there in MoreScreen from earlier steps
    
    # Members section headers & overview
    content = content.replace('Thành viên</h2>', '{t("members.membersTitle")}</h2>')
    content = content.replace('Quản lý những người cùng tham gia và chia sẻ hành trình.</p>', '{t("members.membersSubtitle")}</p>')
    content = content.replace('Thêm thành viên\n            </button>', '{t("members.addMember")}\n            </button>')
    content = content.replace('{t("members.statMembers")}', '{t("members.statMembers")}') # already mapped properly if it was there? Wait, the earlier one used hardcoded.
    content = content.replace('uppercase tracking-wider mt-1.5">Thành viên</span>', 'uppercase tracking-wider mt-1.5">{t("members.statMembers")}</span>')
    content = content.replace('uppercase tracking-wider mt-1.5">Phân công</span>', 'uppercase tracking-wider mt-1.5">{t("members.statTasks")}</span>')
    content = content.replace('uppercase tracking-wider mt-1.5">Đã chi trả</span>', 'uppercase tracking-wider mt-1.5">{t("members.statPaid")}</span>')
    content = content.replace('text-slate-400")}>\n                    {members.length >= 2 ? "Sẵn sàng" : "Cần thêm"}\n                  </span>', 'text-slate-400")}>\n                    {members.length >= 2 ? t("members.statReady") : t("members.statNeedMore")}\n                  </span>')
    content = content.replace('uppercase tracking-wider mt-1.5">Chia chi phí</span>', 'uppercase tracking-wider mt-1.5">{t("members.statSplit")}</span>')
    
    content = content.replace('<p>Thêm thành viên để chia chi phí, phân công chuẩn bị và tổng kết chuyến đi rõ ràng hơn.</p>', '<p>{t("members.emptyMembers")}</p>')
    content = content.replace('<span>Thêm thành viên để chia chi phí, phân công chuẩn bị và tổng kết chuyến đi rõ ràng hơn.</span>', '<span>{t("members.emptyMembers")}</span>')
    
    content = content.replace('Danh sách thành viên', '{t("members.memberListTitle")}')
    content = content.replace('placeholder="Tìm kiếm thành viên hoặc vai trò..."', 'placeholder={t("members.searchMember")}')
    content = content.replace('Không tìm thấy thành viên nào khớp với từ khóa', '{t("members.noSearchResults")}')
    content = content.replace('Chưa có thành viên nào trong chuyến đi.', '{t("members.noMembersYet")}')
    
    # MemberCardRow
    content = content.replace('SĐT: <span', '{t("members.phonePrefix")}<span')
    content = content.replace('Nhóm: <span', '{t("members.groupPrefix")}<span')
    content = content.replace('Đã chi: {formatMoney', '{t("members.paidPrefix")}{formatMoney')
    content = content.replace('lần)`}', '{t("members.paidTimes")})`}')
    content = content.replace('{assignedTasksCount} việc', '{assignedTasksCount} {t("members.taskCount")}')
    
    content = content.replace('title="Trưởng nhóm"', 'title={t("roles.roleLeader")}')
    content = content.replace('title="Quản lý chi phí"', 'title={t("roles.roleCostManager")}')
    content = content.replace('title="Tài xế"', 'title={t("roles.roleDriver")}')
    content = content.replace('title="Dẫn đường"', 'title={t("roles.roleNavigator")}')
    content = content.replace('title="Hành lý"', 'title={t("roles.roleLuggage")}')
    content = content.replace('title="Bạn đồng hành"', 'title={t("roles.roleCompanion")}')
    
    # Member Form
    content = content.replace('title="Thêm thành viên"', 'title={t("members.formAddTitle")}')
    content = content.replace('title="Thông tin thành viên"', 'title={t("members.formEditTitle")}')
    content = content.replace('label="Tên thành viên *"', 'label={t("members.nameLabel")}')
    content = content.replace('placeholder="VD: Tùng"', 'placeholder={t("members.namePlaceholder")}')
    content = content.replace('Vui lòng nhập tên thành viên.</p>', '{t("members.nameRequired")}</p>')
    
    content = content.replace('Giới tính (để tạo ảnh đại diện ngẫu nhiên)</span>', '{t("members.genderLabel")}</span>')
    content = content.replace('\n                Nam\n              </button>', '\n                {t("members.genderMale")}\n              </button>')
    content = content.replace('\n                Nữ\n              </button>', '\n                {t("members.genderFemale")}\n              </button>')
    content = content.replace('\n                Khác\n              </button>', '\n                {t("members.genderOther")}\n              </button>')
    
    content = content.replace('label="Nhóm / Gia đình (Tuỳ chọn)"', 'label={t("members.groupLabel")}')
    content = content.replace('placeholder="VD: Gia đình A, Nhóm bạn B..."', 'placeholder={t("members.groupPlaceholder")}')
    content = content.replace('label="Điện thoại (Tuỳ chọn)"', 'label={t("members.phoneLabel")}')
    content = content.replace('placeholder="VD: 0987654321"', 'placeholder={t("members.phonePlaceholder")}')
    content = content.replace('Dùng để liên hệ nhanh trong chuyến đi khi cần.</span>', '{t("members.phoneHelp")}</span>')
    
    content = content.replace('Vai trò trong chuyến đi</span>', '{t("members.roleLabel")}</span>')
    content = content.replace('Xem vai trò</span>', '{t("members.viewRoles")}</span>')
    
    content = content.replace('label="Ghi chú (Tuỳ chọn)"', 'label={t("members.noteLabel")}')
    content = content.replace('placeholder="Ghi chú thêm về thành viên này..."', 'placeholder={t("members.notePlaceholder")}')
    
    content = content.replace('Hủy</button>', '{t("members.btnCancel")}</button>')
    content = content.replace('{editingMemberId ? "Lưu thay đổi" : "Thêm thành viên"}', '{editingMemberId ? t("members.btnSave") : t("members.btnAdd")}')
    
    # Pre-select roles logic inside AddMember => we can keep string literals if they're used for logic,
    # but the display ones in buttons must be translated.
    # We will let "Người đồng hành", "Quản lý chi phí", "Tài xế", "Dẫn đường" in the UI loop use the mapped translation.
    # Since we can't easily replace the dynamic mapping inside the loop blindly with string replacement, let's target the known instances.
    content = re.sub(r'\{r\}<', '{t(`roles.role${r === "Người đồng hành" ? "Companion" : r === "Quản lý chi phí" ? "CostManager" : r === "Tài xế" ? "Driver" : "Navigator"}`)}<', content)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)


def replace_shared_members_section():
    filepath = "src/features/share/components/SharedMembersSection.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    content = content.replace('Thành viên</h3>', '{t("members.membersTitle")}</h3>')
    content = content.replace('placeholder="Tìm kiếm thành viên hoặc vai trò..."', 'placeholder={t("members.searchMember")}')
    
    content = content.replace('Đề xuất mới', '{t("members.suggestNew")}')
    content = content.replace('Đề xuất đổi vai trò', '{t("members.suggestChangeRole")}')
    content = content.replace('Đề xuất xóa', '{t("members.suggestDelete")}')
    
    content = content.replace('title="Tùy chọn đề xuất"', 'title={t("members.options")}')
    content = content.replace('Đổi vai trò', '{t("members.changeRole")}')
    content = content.replace('Đề xuất xóa\n            </button>', '{t("members.suggestDelete")}\n            </button>')
    
    content = content.replace('Đề xuất thêm thành viên', '{t("members.btnSuggestAdd")}')
    content = content.replace('title="Đề xuất xóa thành viên?"', 'title={t("members.suggestDeleteTitle")}')
    content = content.replace('description="Bạn đang gửi đề xuất xóa thành viên này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất."', 'description={t("members.suggestDeleteDesc")}')
    content = content.replace('confirmLabel="Đề xuất xóa"', 'confirmLabel={t("members.suggestDeleteBtn")}')
    
    content = content.replace('title="Đề xuất đổi vai trò"', 'title={t("members.suggestRoleTitle")}')
    content = content.replace('Thành viên: <span', '{t("members.memberLabel")}<span')
    content = content.replace('Chọn vai trò mới</span>', '{t("members.chooseNewRole")}</span>')
    content = content.replace('Gửi đề xuất đổi vai trò\n          </button>', '{t("members.btnSuggestRole")}\n          </button>')
    content = content.replace('Gửi đề xuất thêm\n          </button>', '{t("members.btnSuggestAdd")}\n          </button>')

    content = content.replace('title="Trưởng nhóm"', 'title={t("roles.roleLeader")}')
    content = content.replace('title="Quản lý chi phí"', 'title={t("roles.roleCostManager")}')
    content = content.replace('title="Tài xế"', 'title={t("roles.roleDriver")}')
    content = content.replace('title="Dẫn đường"', 'title={t("roles.roleNavigator")}')
    content = content.replace('title="Hành lý"', 'title={t("roles.roleLuggage")}')
    content = content.replace('title="Bạn đồng hành"', 'title={t("roles.roleCompanion")}')
    
    content = content.replace('SĐT: <span', '{t("members.phonePrefix")}<span')
    # Actually SharedMembersSection.tsx handles some things via variables, like `{member.group}` but wait it has:
    # {t("members.groupPrefix")} is already there? Yes! Let me check `SharedMembersSection.tsx`... Wait, I saw `{t("members.groupPrefix")}` in `SharedMembersSection.tsx` in the file view previously, on line 427. Oh, so I've already done some work in it? Or was it already translated? Yes, `groupPrefix` was already translated in `SharedMembersSection.tsx`.
    
    # We replace literal text inside the loop in SharedMembersSection
    content = re.sub(r'>\s*\{r\}\s*</button>', '>{t(`roles.role${r === "Người đồng hành" ? "Companion" : r === "Quản lý chi phí" ? "CostManager" : r === "Tài xế" ? "Driver" : "Navigator"}`)}</button>', content)

    # Missing form elements inside SharedMembersSection
    content = content.replace('label="Tên thành viên *"', 'label={t("members.nameLabel")}')
    content = content.replace('placeholder="VD: Nguyễn Văn A"', 'placeholder={t("members.namePlaceholder")}')
    content = content.replace('Vui lòng nhập tên thành viên.</p>', '{t("members.nameRequired")}</p>')
    content = content.replace('Giới tính (để tạo ảnh đại diện ngẫu nhiên)</span>', '{t("members.genderLabel")}</span>')
    content = content.replace('Nam\n              </button>', '{t("members.genderMale")}\n              </button>')
    content = content.replace('Nữ\n              </button>', '{t("members.genderFemale")}\n              </button>')
    content = content.replace('Khác\n              </button>', '{t("members.genderOther")}\n              </button>')
    
    content = content.replace('Không tìm thấy thành viên nào khớp với từ khóa', '{t("members.noSearchResults")}')
    content = content.replace('Chưa có thành viên nào trong chuyến đi.', '{t("members.noMembersYet")}')
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

replace_roles_help_sheet()
replace_more_screen()
replace_shared_members_section()
