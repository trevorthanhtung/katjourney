import React, { useState } from 'react';
import { WalletCards, CheckCircle, BookOpenText, FileText, AlertTriangle, Plus, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Expense, ChecklistItem, JournalEntry, TravelDocument, BackupPlan } from '../../../db';
import { formatMoney } from '../../../utils/helpers';
import { submitChangeRequest } from '../../../services/sharedTripRequestService';
import { BottomSheet, Input } from '../../../components/ui';

const classNames = (...classes: any[]) => classes.filter(Boolean).join(' ');

export function SharedExpensesSection({ 
  token, 
  mode, 
  expenses, 
  changeRequests = [] 
}: { 
  token: string; 
  mode: string; 
  expenses: Expense[]; 
  changeRequests?: any[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [form, setForm] = useState({ description: '', amount: '', payer: '' });

  const isRequestEdit = mode === 'request_edit';

  // Merge pending change requests into expenses list for visual diffs
  const mergedExpenses = React.useMemo(() => {
    const list = expenses.map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'expenses' && r.action === 'delete' && String(r.targetId) === String(item.id));
      const updateReq = changeRequests.find(r => r.section === 'expenses' && r.action === 'update' && String(r.targetId) === String(item.id));
      
      if (updateReq) {
        return {
          ...item,
          ...updateReq.after,
          isPendingUpdate: true,
          changeRequestId: updateReq.id
        };
      }
      if (pendingDelete) {
        return {
          ...item,
          isPendingDelete: true,
          changeRequestId: changeRequests.find(r => r.section === 'expenses' && r.action === 'delete' && String(r.targetId) === String(item.id))?.id
        };
      }
      return item;
    });

    const pendingCreates = changeRequests.filter(r => r.section === 'expenses' && r.action === 'create');
    pendingCreates.forEach(r => {
      list.push({
        id: `pending-create-${r.id}`,
        ...r.after,
        isPendingCreate: true,
        changeRequestId: r.id
      } as any);
    });

    return list;
  }, [expenses, changeRequests]);

  function startAdd() { setForm({ description: '', amount: '', payer: '' }); setEditingId(null); setIsFormOpen(true); }
  function startEdit(item: Expense) { setForm({ description: item.description, amount: String(item.amount), payer: item.payer || '' }); setEditingId(String(item.id)); setIsFormOpen(true); }

  async function handleSave() {
    if (!form.description || !form.amount) {
      alert('Vui lòng nhập tên chi phí và số tiền.');
      return;
    }
    try {
      if (!editingId) {
        await submitChangeRequest(token, { section: 'expenses', action: 'create', after: { ...form, amount: Number(form.amount) } });
        setIsFormOpen(false);
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } else {
        const before = expenses.find(e => String(e.id) === editingId);
        await submitChangeRequest(token, { section: 'expenses', action: 'update', targetId: editingId, before: before as any, after: { ...form, amount: Number(form.amount) } });
        setEditingId(null);
        setIsFormOpen(false);
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      }
    } catch (e: any) { alert('Lỗi khi gửi đề xuất: ' + e.message); }
  }

  async function handleDelete(id: string) {
    if (confirm('Bạn muốn đề xuất xóa chi phí này?')) {
      const before = expenses.find(e => String(e.id) === id);
      try {
        await submitChangeRequest(token, { section: 'expenses', action: 'delete', targetId: id, before: before as any });
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } catch (e: any) { alert('Lỗi khi gửi đề xuất: ' + e.message); }
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <WalletCards className="h-5 w-5 text-amber-500" />
          <h3 className="text-[16px] font-black text-[#030D2E]">Chi phí chuyến đi</h3>
        </div>
      </div>
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100/50 mt-1">
        {mergedExpenses.map((e, idx) => {
          const isPending = e.isPendingCreate || e.isPendingUpdate || e.isPendingDelete;
          return (
            <div 
              key={e.id} 
              className={classNames(
                "flex justify-between items-center py-3 px-4 transition-all rounded-xl", 
                idx % 2 === 0 ? "bg-slate-50/40" : "bg-transparent",
                e.isPendingCreate || e.isPendingUpdate ? "bg-sky-50/40 border border-sky-100/50 my-1 py-3.5" : "",
                e.isPendingDelete ? "bg-slate-50/30 opacity-70" : ""
              )}
            >
              <div className="flex flex-wrap items-baseline gap-2 min-w-0 flex-1">
                <span className={classNames(
                  "text-[14.5px] font-semibold text-slate-700 break-words",
                  e.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
                )}>
                  {e.description}
                </span>
                
                {e.isPendingDelete && (
                  <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 shrink-0 select-none animate-fadeIn">
                    Đề xuất xóa
                  </span>
                )}
                {e.isPendingCreate && (
                  <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600 shrink-0 select-none animate-fadeIn">
                    Đề xuất mới
                  </span>
                )}
                {e.isPendingUpdate && (
                  <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 shrink-0 select-none animate-fadeIn">
                    Đề xuất sửa
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className={classNames(
                  "text-[14.5px] font-bold text-[#030D2E]",
                  e.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
                )}>
                  {formatMoney(e.amount)}
                </span>
                {isRequestEdit && !isPending && (
                  <div className="relative shrink-0">
                    <button 
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setActiveMenuId(activeMenuId === String(e.id) ? null : String(e.id));
                      }}
                      className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 active:scale-90 transition-all focus:outline-none"
                      title="Tùy chọn đề xuất"
                    >
                      <MoreVertical className="h-4.5 w-4.5" />
                    </button>
                    
                    {activeMenuId === String(e.id) && (
                      <>
                        <div 
                          className="fixed inset-0 z-35" 
                          onClick={(ev) => {
                            ev.stopPropagation();
                            setActiveMenuId(null);
                          }}
                        />
                        <div className="absolute right-0 mt-1 z-40 w-32 rounded-xl bg-white border border-slate-200/80 shadow-floating py-1.5 animate-fadeIn">
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              startEdit(e);
                            }}
                            className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            Đề xuất sửa
                          </button>
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              handleDelete(String(e.id));
                            }}
                            className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            Đề xuất xóa
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {isRequestEdit && (
        <button 
          onClick={startAdd} 
          className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 text-[14px] font-bold text-kat-primary border-2 border-dashed border-slate-200 hover:border-kat-primary/40 hover:bg-slate-50/50 rounded-xl transition-all"
          title="Đề xuất thêm"
        >
          <Plus className="h-4 w-4" /> Đề xuất thêm
        </button>
      )}

      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Đề xuất sửa chi phí" : "Đề xuất thêm chi phí"}
      >
        <div className="flex flex-col gap-5 py-2">
          <Input
            label="Tên chi phí / Mô tả"
            value={form.description}
            onChange={val => setForm({ ...form, description: val })}
            placeholder="Nhập mô tả chi phí..."
          />
          <Input
            label="Số tiền"
            type="number"
            value={form.amount}
            onChange={val => setForm({ ...form, amount: val })}
            placeholder="Nhập số tiền chi phí..."
          />
          <button
            onClick={handleSave}
            className="mt-2 w-full h-[50px] rounded-[16px] bg-kat-primary font-black text-white hover:brightness-105 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            Gửi đề xuất
          </button>
        </div>
      </BottomSheet>
    </section>
  );
}

export function SharedChecklistSection({ 
  token, 
  mode, 
  checklist, 
  changeRequests = [] 
}: { 
  token: string; 
  mode: string; 
  checklist: ChecklistItem[]; 
  changeRequests?: any[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '' });
  
  const isRequestEdit = mode === 'request_edit';

  function startAdd() {
    setForm({ title: '' });
    setEditingId(null);
    setIsFormOpen(true);
  }

  function startEdit(item: ChecklistItem) {
    setForm({ title: item.title });
    setEditingId(String(item.id));
    setIsFormOpen(true);
  }

  // Merge pending change requests into checklist for visual diffs
  const mergedChecklist = React.useMemo(() => {
    const list = checklist.map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'checklist' && r.action === 'delete' && String(r.targetId) === String(item.id));
      const updateReq = changeRequests.find(r => r.section === 'checklist' && r.action === 'update' && String(r.targetId) === String(item.id));
      
      if (updateReq) {
        return {
          ...item,
          ...updateReq.after,
          isPendingUpdate: true,
          changeRequestId: updateReq.id
        };
      }
      if (pendingDelete) {
        return {
          ...item,
          isPendingDelete: true,
          changeRequestId: changeRequests.find(r => r.section === 'checklist' && r.action === 'delete' && String(r.targetId) === String(item.id))?.id
        };
      }
      return item;
    });

    const pendingCreates = changeRequests.filter(r => r.section === 'checklist' && r.action === 'create');
    pendingCreates.forEach(r => {
      list.push({
        id: `pending-create-${r.id}`,
        ...r.after,
        isPendingCreate: true,
        changeRequestId: r.id
      } as any);
    });

    return list;
  }, [checklist, changeRequests]);

  async function handleToggle(item: ChecklistItem) {
    if (!isRequestEdit) return;
    try {
      await submitChangeRequest(token, { section: 'checklist', action: 'update', targetId: String(item.id), before: item as any, after: { completed: !item.completed } });
      alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
    } catch (e: any) { alert('Lỗi: ' + e.message); }
  }

  async function handleSave() {
    if (!form.title) {
      alert('Vui lòng nhập nội dung chuẩn bị.');
      return;
    }
    
    try {
      if (!editingId) {
        await submitChangeRequest(token, { section: 'checklist', action: 'create', after: { title: form.title, completed: false, section: 'Khác' } });
        setIsFormOpen(false);
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } else if (editingId) {
        const before = checklist.find(c => String(c.id) === editingId);
        await submitChangeRequest(token, { section: 'checklist', action: 'update', targetId: editingId, before: before as any, after: { title: form.title } });
        setEditingId(null);
        setIsFormOpen(false);
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      }
    } catch (e: any) { alert('Lỗi: ' + e.message); }
  }

  async function handleDelete(id: string) {
    if (confirm('Bạn muốn đề xuất xóa mục này?')) {
      const before = checklist.find(c => String(c.id) === id);
      try {
        await submitChangeRequest(token, { section: 'checklist', action: 'delete', targetId: id, before: before as any });
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } catch (e: any) { alert('Lỗi: ' + e.message); }
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-purple-500" />
          <h3 className="text-[16px] font-black text-[#030D2E]">Danh sách chuẩn bị</h3>
        </div>
      </div>
      <div className="divide-y divide-slate-100 border-t border-b border-slate-100/50 mt-1">
        {mergedChecklist.map((c, idx) => {
          const isPending = c.isPendingCreate || c.isPendingUpdate || c.isPendingDelete;
          return (
            <div 
              key={c.id} 
              className={classNames(
                "flex justify-between items-center py-3 px-4 transition-all rounded-xl", 
                idx % 2 === 0 ? "bg-slate-50/40" : "bg-transparent",
                c.isPendingCreate || c.isPendingUpdate ? "bg-sky-50/40 border border-sky-100/50 my-1 py-3.5" : "",
                c.isPendingDelete ? "bg-slate-50/30 opacity-70" : ""
              )}
            >
              <label className="flex items-start gap-3 cursor-pointer group flex-1 min-w-0">
                <input 
                  type="checkbox" 
                  checked={c.completed} 
                  onChange={() => handleToggle(c)} 
                  disabled={!isRequestEdit || isPending} 
                  className="w-5 h-5 rounded-md border-slate-300 text-kat-primary mt-0.5 focus:ring-kat-primary" 
                />
                <div className="flex flex-wrap items-baseline gap-2 min-w-0">
                  <span className={classNames(
                    "text-[14.5px] font-semibold break-words", 
                    c.completed ? 'text-slate-400 line-through' : 'text-slate-700',
                    c.isPendingDelete ? 'line-through text-slate-400 opacity-60' : ''
                  )}>
                    {c.title}
                  </span>
                  {c.isPendingDelete && (
                    <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 shrink-0 select-none animate-fadeIn">
                      Đề xuất xóa
                    </span>
                  )}
                  {c.isPendingCreate && (
                    <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600 shrink-0 select-none animate-fadeIn">
                      Đề xuất mới
                    </span>
                  )}
                  {c.isPendingUpdate && (
                    <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 shrink-0 select-none animate-fadeIn">
                      Đề xuất sửa
                    </span>
                  )}
                </div>
              </label>
              {isRequestEdit && !isPending && (
                <div className="relative shrink-0 ml-2">
                  <button 
                    onClick={(ev) => {
                      ev.stopPropagation();
                      setActiveMenuId(activeMenuId === String(c.id) ? null : String(c.id));
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 active:scale-90 transition-all focus:outline-none"
                    title="Tùy chọn đề xuất"
                  >
                    <MoreVertical className="h-4.5 w-4.5" />
                  </button>
                  
                  {activeMenuId === String(c.id) && (
                    <>
                      <div 
                        className="fixed inset-0 z-35" 
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setActiveMenuId(null);
                        }}
                      />
                      <div className="absolute right-0 mt-1 z-40 w-32 rounded-xl bg-white border border-slate-200/80 shadow-floating py-1.5 animate-fadeIn">
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            startEdit(c);
                          }}
                          className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Đề xuất sửa
                        </button>
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            handleDelete(String(c.id));
                          }}
                          className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          Đề xuất xóa
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      {isRequestEdit && (
        <button 
          onClick={startAdd} 
          className="mt-3 flex h-11 w-full items-center justify-center gap-1.5 text-[14px] font-bold text-kat-primary border-2 border-dashed border-slate-200 hover:border-kat-primary/40 hover:bg-slate-50/50 rounded-xl transition-all"
          title="Đề xuất thêm"
        >
          <Plus className="h-4 w-4" /> Đề xuất thêm
        </button>
      )}

      <BottomSheet
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingId(null);
        }}
        title={editingId ? "Đề xuất sửa chuẩn bị" : "Đề xuất thêm chuẩn bị"}
      >
        <div className="flex flex-col gap-5 py-2">
          <Input
            label="Tên món chuẩn bị"
            value={form.title}
            onChange={val => setForm({ title: val })}
            placeholder="Ví dụ: Mang theo bản đồ, Mua đồ ăn vặt..."
          />
          <button
            onClick={handleSave}
            className="mt-2 w-full h-[50px] rounded-[16px] bg-kat-primary font-black text-white hover:brightness-105 active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
          >
            Gửi đề xuất
          </button>
        </div>
      </BottomSheet>
    </section>
  );
}

export function SharedJournalsSection({ 
  token, 
  mode, 
  journals, 
  changeRequests = [] 
}: { 
  token: string; 
  mode: string; 
  journals: JournalEntry[]; 
  changeRequests?: any[];
}) {
  const isRequestEdit = mode === 'request_edit';

  const mergedJournals = React.useMemo(() => {
    return journals.map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'journals' && r.action === 'delete' && String(r.targetId) === String(item.id));
      return {
        ...item,
        isPendingDelete: pendingDelete
      };
    });
  }, [journals, changeRequests]);

  async function handleDelete(j: JournalEntry) {
    if (confirm('Bạn muốn đề xuất xóa nhật ký này?')) {
      try {
        await submitChangeRequest(token, { section: 'journals', action: 'delete', targetId: String(j.id), before: j as any });
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } catch (e: any) { alert('Lỗi: ' + e.message); }
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-3">
        <BookOpenText className="h-5 w-5 text-sky-500" />
        <h3 className="text-[16px] font-black text-[#030D2E]">Nhật ký chuyến đi</h3>
      </div>
      <div className="space-y-4">
        {mergedJournals.map(j => (
          <div 
            key={j.id} 
            className={classNames(
              "rounded-xl p-4 border transition-all", 
              j.isPendingDelete ? "border-rose-100 bg-slate-50/50 opacity-70" : "bg-slate-50 border-slate-105"
            )}
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-wrap items-baseline gap-2">
                <h4 className={classNames(
                  "text-[15px] font-bold text-slate-800",
                  j.isPendingDelete ? "line-through text-slate-400" : ""
                )}>
                  {j.title}
                </h4>
                {j.isPendingDelete && (
                  <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 select-none animate-fadeIn">
                    Đề xuất xóa
                  </span>
                )}
              </div>
              {isRequestEdit && !j.isPendingDelete && (
                <button 
                  onClick={() => handleDelete(j)} 
                  className="text-slate-400 hover:text-rose-600 text-sm font-semibold p-1 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Đề xuất xóa
                </button>
              )}
            </div>
            <p className={classNames(
              "mt-2 text-[14px] text-slate-600 leading-relaxed whitespace-pre-wrap",
              j.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
            )}>
              {j.content}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SharedBackupPlansSection({ 
  token, 
  mode, 
  backupPlans, 
  changeRequests = [] 
}: { 
  token: string; 
  mode: string; 
  backupPlans: BackupPlan[]; 
  changeRequests?: any[];
}) {
  const isRequestEdit = mode === 'request_edit';

  const mergedBackupPlans = React.useMemo(() => {
    return backupPlans.map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'backupPlans' && r.action === 'delete' && String(r.targetId) === String(item.id));
      return {
        ...item,
        isPendingDelete: pendingDelete
      };
    });
  }, [backupPlans, changeRequests]);

  async function handleDelete(b: BackupPlan) {
    if (confirm('Bạn muốn đề xuất xóa phương án này?')) {
      try {
        await submitChangeRequest(token, { section: 'backupPlans', action: 'delete', targetId: String(b.id), before: b as any });
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } catch (e: any) { alert('Lỗi: ' + e.message); }
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-3">
        <AlertTriangle className="h-5 w-5 text-orange-500" />
        <h3 className="text-[16px] font-black text-[#030D2E]">Phương án dự phòng</h3>
      </div>
      <div className="space-y-4">
        {mergedBackupPlans.map(b => (
          <div 
            key={b.id} 
            className={classNames(
              "rounded-xl p-4 border transition-all",
              b.isPendingDelete ? "border-rose-100 bg-slate-50/50 opacity-70" : "bg-orange-50/50 border-orange-100"
            )}
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-wrap items-baseline gap-2">
                <h4 className={classNames(
                  "text-[14px] font-bold text-orange-800",
                  b.isPendingDelete ? "line-through text-slate-400" : ""
                )}>
                  Tình huống: {b.title}
                </h4>
                {b.isPendingDelete && (
                  <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 select-none animate-fadeIn">
                    Đề xuất xóa
                  </span>
                )}
              </div>
              {isRequestEdit && !b.isPendingDelete && (
                <button 
                  onClick={() => handleDelete(b)} 
                  className="text-slate-400 hover:text-rose-600 text-sm font-semibold p-1 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Đề xuất xóa
                </button>
              )}
            </div>
            {b.reason && (
              <p className={classNames(
                "mt-1 text-[13.5px] text-orange-700/80 font-medium whitespace-pre-wrap",
                b.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
              )}>
                Giải pháp: {b.reason}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SharedDocumentsSection({ 
  token, 
  mode, 
  documents, 
  changeRequests = [] 
}: { 
  token: string; 
  mode: string; 
  documents: TravelDocument[]; 
  changeRequests?: any[];
}) {
  const isRequestEdit = mode === 'request_edit';

  const mergedDocuments = React.useMemo(() => {
    return documents.map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'travelDocuments' && r.action === 'delete' && String(r.targetId) === String(item.id));
      return {
        ...item,
        isPendingDelete: pendingDelete
      };
    });
  }, [documents, changeRequests]);

  async function handleDelete(d: TravelDocument) {
    if (confirm('Bạn muốn đề xuất xóa tài liệu này?')) {
      try {
        await submitChangeRequest(token, { section: 'travelDocuments', action: 'delete', targetId: String(d.id), before: d as any });
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } catch (e: any) { alert('Lỗi: ' + e.message); }
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/60 p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-3">
        <FileText className="h-5 w-5 text-rose-500" />
        <h3 className="text-[16px] font-black text-[#030D2E]">Giấy tờ & đặt chỗ</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {mergedDocuments.map(d => (
          <div 
            key={d.id} 
            className={classNames(
              "flex flex-col gap-1 rounded-xl p-3 border transition-all",
              d.isPendingDelete ? "border-rose-100 bg-slate-50/50 opacity-70" : "bg-slate-50 border-slate-200"
            )}
          >
             <div className="flex justify-between items-start">
              <div className="flex flex-wrap items-baseline gap-2">
                <span className={classNames(
                  "text-[14px] font-bold text-slate-700",
                  d.isPendingDelete ? "line-through text-slate-400" : ""
                )}>
                  {d.title}
                </span>
                {d.isPendingDelete && (
                  <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 select-none animate-fadeIn">
                    Đề xuất xóa
                  </span>
                )}
              </div>
              {isRequestEdit && !d.isPendingDelete && (
                <button 
                  onClick={() => handleDelete(d)} 
                  className="text-slate-400 hover:text-rose-600 text-sm font-semibold p-1 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Đề xuất xóa
                </button>
              )}
            </div>
            <span className={classNames(
              "text-[13px] text-slate-500",
              d.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
            )}>
              {d.note}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
