import re

def replace_shared_members_section():
    filepath = "src/features/share/components/SharedMembersSection.tsx"
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Headers
    content = content.replace('Thành viên</h3>', '{t("members.membersTitle")}</h3>')
    
    # Input placeholder
    content = content.replace('placeholder="Tìm kiếm thành viên hoặc vai trò..."', 'placeholder={t("members.searchMember")}')
    
    # Empty states inside template literal
    content = content.replace(
        '`Không tìm thấy thành viên nào khớp với từ khóa "${searchQuery}"`',
        '`${t("members.noSearchResults")} "${searchQuery}"`'
    )
    content = content.replace(
        '"Chưa có thành viên nào trong chuyến đi."',
        't("members.noMembersYet")'
    )
    
    # Badges
    content = content.replace('Đề xuất mới\n                        </span>', '{t("members.suggestNew")}\n                        </span>')
    content = content.replace('Đề xuất đổi vai trò\n                        </span>', '{t("members.suggestChangeRole")}\n                        </span>')
    content = content.replace('Đề xuất xóa\n                        </span>', '{t("members.suggestDelete")}\n                        </span>')
    
    # Dropdown menu
    content = content.replace('title="Tùy chọn đề xuất"', 'title={t("members.options")}')
    content = content.replace('\n              Đổi vai trò\n            </button>', '\n              {t("members.changeRole")}\n            </button>')
    content = content.replace('\n              Đề xuất xóa\n            </button>', '\n              {t("members.suggestDelete")}\n            </button>')
    
    # Add Member button
    content = content.replace('title="Đề xuất thêm thành viên"', 'title={t("members.btnSuggestAdd")}')
    content = content.replace('/> Đề xuất thêm thành viên\n        </button>', '/> {t("members.btnSuggestAdd")}\n        </button>')
    
    # Form Sheet
    content = content.replace('title="Đề xuất thêm thành viên"', 'title={t("members.formAddTitle")}')
    content = content.replace('label="Tên thành viên *"', 'label={t("members.nameLabel")}')
    content = content.replace('placeholder="VD: Nguyễn Văn A"', 'placeholder={t("members.namePlaceholder")}')
    content = content.replace('Vui lòng nhập tên thành viên.</p>', '{t("members.nameRequired")}</p>')
    content = content.replace('Giới tính (để tạo ảnh đại diện ngẫu nhiên)</span>', '{t("members.genderLabel")}</span>')
    content = content.replace('\n                Nam\n              </button>', '\n                {t("members.genderMale")}\n              </button>')
    content = content.replace('\n                Nữ\n              </button>', '\n                {t("members.genderFemale")}\n              </button>')
    content = content.replace('\n                Khác\n              </button>', '\n                {t("members.genderOther")}\n              </button>')
    content = content.replace('\n            Gửi đề xuất thêm\n          </button>', '\n            {t("members.btnSuggestAdd")}\n          </button>')

    # Delete Confirm Modal
    content = content.replace('title="Đề xuất xóa thành viên?"', 'title={t("members.suggestDeleteTitle")}')
    content = content.replace('description="Bạn đang gửi đề xuất xóa thành viên này. Chủ chuyến đi sẽ xem và xét duyệt đề xuất."', 'description={t("members.suggestDeleteDesc")}')
    content = content.replace('confirmLabel="Đề xuất xóa"', 'confirmLabel={t("members.suggestDeleteBtn")}')
    
    # Suggest Role Bottom Sheet
    content = content.replace('title="Đề xuất đổi vai trò"', 'title={t("members.suggestRoleTitle")}')
    content = content.replace('Thành viên: <span', '{t("members.memberLabel")}<span')
    content = content.replace('Chọn vai trò mới</span>', '{t("members.chooseNewRole")}</span>')
    content = content.replace('\n            Gửi đề xuất đổi vai trò\n          </button>', '\n            {t("members.btnSuggestRole")}\n          </button>')

    # Roles strings
    content = content.replace('title={t("roles.leader")}', 'title={t("roles.roleLeader")}')
    content = content.replace('title={t("roles.costManager")}', 'title={t("roles.roleCostManager")}')
    content = content.replace('title={t("roles.driver")}', 'title={t("roles.roleDriver")}')
    content = content.replace('title={t("roles.navigator")}', 'title={t("roles.roleNavigator")}')
    content = content.replace('title="Hành lý"', 'title={t("roles.roleLuggage")}')
    content = content.replace('title="Bạn đồng hành"', 'title={t("roles.roleCompanion")}')
    
    # Dynamic roles render
    content = re.sub(r'>\s*\{r\}\s*</button>', '>{t(`roles.role${r === "Người đồng hành" ? "Companion" : r === "Quản lý chi phí" ? "CostManager" : r === "Tài xế" ? "Driver" : "Navigator"}`)}</button>', content)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

replace_shared_members_section()
