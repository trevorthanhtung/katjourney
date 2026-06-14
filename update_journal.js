const fs = require('fs');

const file = 'd:\\02_PROJECTS\\5_KAT JOURNEY\\APP\\src\\features\\share\\components\\SharedSections.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
content = content.replace(
  'FileCheck2, Shirt, BriefcaseBusiness, PlugZap, Pill, Sandwich, Package, BadgeCheck, UserRoundCheck, StickyNote, Type, Minus, User, CalendarDays, Maximize2, Image as ImageIcon, Loader2',
  'FileCheck2, Shirt, BriefcaseBusiness, PlugZap, Pill, Sandwich, Package, BadgeCheck, UserRoundCheck, StickyNote, Type, Minus, User, CalendarDays, Maximize2, Image as ImageIcon, Loader2, SmilePlus, NotebookPen, Save, Sparkles'
);

// 2. Constants before SharedJournalsSection
content = content.replace(
  'export function SharedJournalsSection({ ',
  `const moodOptionList: Array<{ value: "good" | "okay" | "great" | "very_bad" | "bad"; label: string }> = [
  { value: "good", label: "Vui" },
  { value: "okay", label: "Bình yên" },
  { value: "great", label: "Hào hứng" },
  { value: "very_bad", label: "Mệt" },
  { value: "bad", label: "Bất ngờ" }
];

const moodColorClasses: Record<string, string> = {
  good: "bg-amber-500",
  okay: "bg-emerald-500",
  great: "bg-rose-500",
  very_bad: "bg-slate-400",
  bad: "bg-blue-500"
};

const promptSuggestions = [
  "Điều muốn nhớ nhất",
  "Món ăn đáng nhớ",
  "Người bạn đã gặp",
  "Khoảnh khắc vui",
  "Điều muốn nhớ mãi"
];

export function SharedJournalsSection({ `
);

// 3. State
content = content.replace(
  `    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [formContent, setFormContent] = React.useState("");
    const [imageUrl, setImageUrl] = React.useState("");
    const [uploading, setUploading] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);`,
  `    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [form, setForm] = React.useState({ 
      date: new Date().toISOString().split('T')[0], 
      title: "", 
      content: "", 
      mood: "good" as "good" | "okay" | "great" | "very_bad" | "bad", 
      imageUrl: "" 
    });
    const [uploading, setUploading] = React.useState(false);
    const [submitAttempted, setSubmitAttempted] = React.useState(false);
    const [dirty, setDirty] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);`
);

// 4. image url handling
content = content.replace(
  `        const url = await uploadJournalImage(file, tripId); 
        setImageUrl(url);`,
  `        const url = await uploadJournalImage(file, tripId); 
        setForm(prev => ({ ...prev, imageUrl: url }));
        setDirty(true);`
);

// 5. handleCreate
content = content.replace(
  `  async function handleCreate() {
      if (!formContent.trim()) return;
      try {
        const identity = getIdentity('any');
        const payload = {
          date: new Date().toISOString().split('T')[0],
          title: "",
          content: formContent.trim(),
          mood: "good",
          imageUrl: imageUrl || undefined,
          authorId: identity?.id || "guest",
          authorName: guestName || identity?.name || "Khách"
        };
        await submitChangeRequest(token, { section: 'journals', action: 'create', after: payload, status: 'auto_approved', requesterName: guestName });
        setFormContent("");
        setImageUrl("");
        setIsFormOpen(false);
      } catch (e: any) { alert('Lỗi: ' + e.message); }
    }`,
  `  const titleError = !form.title.trim() ? "Vui lòng nhập tiêu đề." : "";
    const contentError = !form.content.trim() ? "Vui lòng nhập nội dung nhật ký." : "";
    const hasError = !!titleError || !!contentError;

    async function handleCreate() {
      setSubmitAttempted(true);
      if (hasError) return;
      try {
        const identity = getIdentity('any');
        const payload = {
          date: form.date,
          title: form.title.trim(),
          content: form.content.trim(),
          mood: form.mood,
          imageUrl: form.imageUrl || undefined,
          authorId: identity?.id || "guest",
          authorName: guestName || identity?.name || "Khách"
        };
        await submitChangeRequest(token, { section: 'journals', action: 'create', after: payload, status: 'auto_approved', requesterName: guestName });
        setForm({ date: new Date().toISOString().split('T')[0], title: "", content: "", mood: "good", imageUrl: "" });
        setSubmitAttempted(false);
        setDirty(false);
        setIsFormOpen(false);
      } catch (e: any) { alert('Lỗi: ' + e.message); }
    }

    function handlePromptClick(prompt: string) {
      setForm(prev => ({
        ...prev,
        content: prev.content + (prev.content.trim() ? "\\n\\n" : "") + \`- \${prompt}: \`
      }));
      setDirty(true);
    }`
);

// 6. BottomSheet replacement
const bottomSheetRegex = /<BottomSheet[\s\S]*isOpen=\{isFormOpen\}[\s\S]*title="Viết nhật ký"[\s\S]*?>[\s\S]*?<\/BottomSheet>/m;
const newBottomSheet = \`<BottomSheet 
        isOpen={isFormOpen} 
        onClose={() => {
          setIsFormOpen(false);
        }} 
        title="Viết nhật ký hành trình"
        footer={
          <div className="flex gap-3 w-full">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(false);
              }}
              className="flex-1 inline-flex min-h-[50px] items-center justify-center rounded-[16px] bg-slate-100 px-6 font-bold text-slate-700 hover:bg-slate-200 active:scale-[0.98] transition-all duration-200"
            >
              Hủy
            </button>
            <button
              type="button"
              disabled={hasError}
              onClick={handleCreate}
              className="flex-[2] inline-flex min-h-[50px] items-center justify-center gap-2 rounded-[16px] bg-[#00BFB7] text-[#030D2E] px-6 font-black hover:brightness-105 active:scale-[0.98] transition-all duration-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-transparent disabled:cursor-not-allowed disabled:active:scale-100 disabled:opacity-100 shadow-sm"
            >
              <Save className="h-4.5 w-4.5" strokeWidth={2.5} />
              Lưu nhật ký
            </button>
          </div>
        }
      >
        <div className="space-y-4 md:space-y-5">
          {/* Date Field */}
          <div>
            <Input 
              label={
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-slate-500" />
                  Ngày ghi lại
                </span>
              } 
              type="date" 
              value={form.date} 
              onChange={(date) => { setForm({ ...form, date }); setDirty(true); }} 
            />
          </div>
  
          {/* Title Field */}
          <div>
            <Input 
              label={
                <span className="flex items-center gap-1.5">
                  <Type className="h-4 w-4 text-slate-500" />
                  Tiêu đề nhật ký *
                </span>
              } 
              value={form.title} 
              onChange={(title) => { setForm({ ...form, title }); setDirty(true); }} 
              placeholder="VD: Một ngày đáng nhớ ở Vũng Tàu" 
            />
            {(dirty || submitAttempted) && titleError && (
              <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">{titleError}</p>
            )}
          </div>
  
          {/* Mood Chips */}
          <div>
            <span className="mb-2 block text-sm font-semibold text-slate-600 flex items-center gap-1.5">
              <SmilePlus className="h-4 w-4 text-slate-500" />
              Cảm xúc hôm nay
            </span>
            <div className="flex flex-wrap gap-2">
              {moodOptionList.map((opt) => {
                const isActive = form.mood === opt.value;
                const colorDot = moodColorClasses[opt.value];
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { setForm({ ...form, mood: opt.value as any }); setDirty(true); }}
                    className={\`flex items-center gap-2 rounded-full px-4 py-2 text-[13.5px] font-bold border transition-all duration-200 active:scale-95 \${
                      isActive
                        ? "bg-[#00BFB7]/10 border-[#00BFB7] text-[#030D2E]"
                        : "bg-[#FFFDF8] border-[#E8E1D8] text-slate-600 hover:bg-slate-50"
                    }\`}
                  >
                    <span className={\`h-2.5 w-2.5 rounded-full \${colorDot}\`} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>
  
          {/* Content Field */}
          <div>
            <Textarea 
              label={
                <span className="flex items-center gap-1.5">
                  <NotebookPen className="h-4 w-4 text-slate-500" />
                  Câu chuyện của bạn *
                </span>
              } 
              value={form.content} 
              onChange={(content) => { setForm({ ...form, content }); setDirty(true); }} 
              placeholder="Ghi lại cảm xúc, câu chuyện, món ăn ngon hoặc khoảnh khắc đáng nhớ..." 
            />
            {(dirty || submitAttempted) && contentError && (
              <p className="mt-1.5 px-1 text-[13px] font-semibold text-rose-600">{contentError}</p>
            )}
          </div>
  
          {/* Image Field */}
          <div>
            {form.imageUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-slate-200">
                <img src={form.imageUrl} alt="Uploaded" className="w-full aspect-[4/3] object-cover" />
                <button
                  onClick={() => { setForm({ ...form, imageUrl: "" }); setDirty(true); }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-12 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 text-slate-500 font-bold text-[14px] hover:bg-slate-100 hover:text-[#00BFB7] transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Đang tải ảnh...</>
                  ) : (
                    <><ImageIcon className="h-5 w-5" /> Đính kèm hình ảnh</>
                  )}
                </button>
              </div>
            )}
          </div>
  
          {/* Quick Prompts Section inside Modal */}
          <div className="pt-1">
            <span className="mb-2 block text-[12.5px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-slate-500" />
              Gợi ý viết nhanh
            </span>
            <div className="flex flex-wrap gap-1.5">
              {promptSuggestions.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => handlePromptClick(prompt)}
                  className="rounded-lg bg-[#FAF7F1] border border-[#E8E1D8] px-3 py-1.5 text-[12.5px] font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  + {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      </BottomSheet>\`;

content = content.replace(bottomSheetRegex, newBottomSheet);

fs.writeFileSync(file, content, 'utf8');
console.log('Successfully updated SharedJournalsSection');
