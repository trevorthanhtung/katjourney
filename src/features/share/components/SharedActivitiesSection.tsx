import React, { useState } from 'react';
import { Route, Clock, MapPin, MapPinned, Plus, MoreVertical } from 'lucide-react';
import { EventItem } from '../../../db';
import { formatDate, classNames } from '../../../utils/helpers';
import { submitChangeRequest } from '../../../services/sharedTripRequestService';
import { BottomSheet, Input, Textarea } from '../../../components/ui';

export function SharedActivitiesSection({ 
  token, 
  mode, 
  activities, 
  changeRequests = [] 
}: { 
  token: string; 
  mode: string; 
  activities: EventItem[]; 
  changeRequests?: any[];
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', date: '', time: '', location: '', notes: '' });

  const isRequestEdit = mode === 'request_edit';

  const mergedActivities = React.useMemo(() => {
    const list = activities.map(item => {
      const pendingDelete = changeRequests.some(r => r.section === 'activities' && r.action === 'delete' && String(r.targetId) === String(item.id));
      const updateReq = changeRequests.find(r => r.section === 'activities' && r.action === 'update' && String(r.targetId) === String(item.id));
      
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
          changeRequestId: changeRequests.find(r => r.section === 'activities' && r.action === 'delete' && String(r.targetId) === String(item.id))?.id
        };
      }
      return item;
    });

    const pendingCreates = changeRequests.filter(r => r.section === 'activities' && r.action === 'create');
    pendingCreates.forEach(r => {
      list.push({
        id: `pending-create-${r.id}`,
        ...r.after,
        isPendingCreate: true,
        changeRequestId: r.id
      } as any);
    });

    list.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return (a.time || "").localeCompare(b.time || "");
    });

    return list;
  }, [activities, changeRequests]);

  function startAdd() {
    setForm({ title: '', date: '', time: '', location: '', notes: '' });
    setIsFormOpen(true);
    setEditingId(null);
  }

  function startEdit(item: EventItem) {
    setForm({
      title: item.title,
      date: item.date,
      time: item.time || '',
      location: item.location || '',
      notes: item.notes || ''
    });
    setEditingId(String(item.id));
    setIsFormOpen(true);
  }

  async function handleSave() {
    if (!form.title || !form.date) {
      alert('Vui lòng nhập tên hoạt động và ngày.');
      return;
    }
    
    try {
      if (!editingId) {
        await submitChangeRequest(token, {
          section: 'activities',
          action: 'create',
          after: form,
          note: ''
        });
        setIsFormOpen(false);
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } else {
        const currentItem = activities.find(a => String(a.id) === editingId);
        await submitChangeRequest(token, {
          section: 'activities',
          action: 'update',
          targetId: editingId,
          before: currentItem as any,
          after: form
        });
        setEditingId(null);
        setIsFormOpen(false);
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      }
    } catch (e: any) {
      console.error(e);
      alert('Lỗi khi gửi đề xuất: ' + e.message);
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Bạn muốn đề xuất xóa hoạt động này?')) {
      try {
        const currentItem = activities.find(a => String(a.id) === id);
        await submitChangeRequest(token, {
          section: 'activities',
          action: 'delete',
          targetId: id,
          before: currentItem as any
        });
        alert('Đã gửi đề xuất. Chủ chuyến đi sẽ xem và phản hồi.');
      } catch (e: any) {
        alert('Lỗi khi gửi đề xuất: ' + e.message);
      }
    }
  }

  return (
    <section className="bg-white rounded-3xl border border-slate-200/60 p-5 md:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2">
          <Route className="h-6 w-6 text-kat-primary" />
          <h3 className="text-[18px] font-black text-[#030D2E]">Lịch trình chi tiết</h3>
        </div>
      </div>

      <div className="space-y-6">
        {mergedActivities.map((item, idx) => {
          const isPending = item.isPendingCreate || item.isPendingUpdate || item.isPendingDelete;
          return (
            <div key={item.id} className="relative flex gap-4 pl-1 group">
              <div className="absolute bottom-0 left-[21px] top-8 w-0.5 bg-slate-200 group-last:bg-transparent" />
              <div className="relative z-10 flex shrink-0 mt-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 ring-4 ring-white shadow-sm border border-slate-200/60">
                  <MapPinned className="h-4.5 w-4.5" />
                </div>
              </div>
              
              <div 
                className={classNames(
                  "flex flex-col w-full min-w-0 pt-0.5 pb-4 border-b border-slate-100/70 group-last:border-transparent transition-all rounded-2xl px-3",
                  item.isPendingCreate || item.isPendingUpdate ? "bg-sky-50/40 border border-sky-100/50 my-1 py-3" : "",
                  item.isPendingDelete ? "bg-slate-50/30 opacity-70" : ""
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <h4 className={classNames(
                      "text-[15px] font-bold text-[#030D2E] break-words",
                      item.isPendingDelete ? "line-through text-slate-400 opacity-60" : ""
                    )}>
                      {item.title}
                    </h4>
                    
                    {item.isPendingDelete && (
                      <span className="inline-flex items-center rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-600 shrink-0 select-none animate-fadeIn">
                        Đề xuất xóa
                      </span>
                    )}
                    {item.isPendingCreate && (
                      <span className="inline-flex items-center rounded-full bg-sky-50 border border-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-600 shrink-0 select-none animate-fadeIn">
                        Đề xuất mới
                      </span>
                    )}
                    {item.isPendingUpdate && (
                      <span className="inline-flex items-center rounded-full bg-amber-50 border border-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-600 shrink-0 select-none animate-fadeIn">
                        Đề xuất sửa
                      </span>
                    )}
                  </div>

                  {isRequestEdit && !isPending && (
                    <div className="relative shrink-0">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === String(item.id) ? null : String(item.id));
                        }}
                        className="flex h-11 w-11 items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-50 active:scale-90 transition-all focus:outline-none"
                        title="Tùy chọn đề xuất"
                      >
                        <MoreVertical className="h-4.5 w-4.5" />
                      </button>
                      
                      {activeMenuId === String(item.id) && (
                        <>
                          <div 
                            className="fixed inset-0 z-35" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                            }}
                          />
                          <div className="absolute right-0 mt-1 z-40 w-32 rounded-xl bg-white border border-slate-200/80 shadow-floating py-1.5 animate-fadeIn">
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                startEdit(item);
                              }}
                              className="flex w-full items-center px-4 py-2 text-[13.5px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              Đề xuất sửa
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                handleDelete(String(item.id));
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

                <div className={classNames(
                  "mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-medium text-slate-500",
                  item.isPendingDelete ? "opacity-60" : ""
                )}>
                  {item.time && (
                    <span className={classNames(
                      "flex items-center gap-1 font-bold text-kat-primary",
                      item.isPendingDelete ? "line-through text-slate-400" : ""
                    )}>
                      <Clock className="h-3.5 w-3.5" />
                      {item.time}
                    </span>
                  )}
                  <span className={item.isPendingDelete ? "line-through" : ""}>{formatDate(item.date)}</span>
                </div>

                {item.location && (
                  <p className={classNames(
                    "mt-1.5 text-[13.5px] text-slate-600 flex items-start gap-1.5",
                    item.isPendingDelete ? "line-through opacity-60" : ""
                  )}>
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                    <span className="break-words">{item.location}</span>
                  </p>
                )}

                {item.notes && (
                  <div className={classNames(
                    "mt-2 rounded-xl bg-slate-50 p-3 border border-slate-100",
                    item.isPendingDelete ? "opacity-60" : ""
                  )}>
                    <p className={classNames("text-[13px] text-slate-600 whitespace-pre-wrap", item.isPendingDelete ? "line-through" : "")}>{item.notes}</p>
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
          className="mt-6 flex h-11 w-full items-center justify-center gap-1.5 text-[14px] font-bold text-kat-primary border-2 border-dashed border-slate-200 hover:border-kat-primary/40 hover:bg-slate-50/50 rounded-xl transition-all"
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
        title={editingId ? "Đề xuất sửa hoạt động" : "Đề xuất thêm hoạt động"}
      >
        <div className="flex flex-col gap-5 py-2">
          <Input
            label="Tên hoạt động"
            value={form.title}
            onChange={val => setForm({ ...form, title: val })}
            placeholder="Ví dụ: Ăn trưa tại quán ngon, Di chuyển đến khách sạn..."
          />
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                label="Ngày thực hiện"
                type="date"
                value={form.date}
                onChange={val => setForm({ ...form, date: val })}
              />
            </div>
            <div className="w-1/3">
              <Input
                label="Giờ"
                type="time"
                value={form.time}
                onChange={val => setForm({ ...form, time: val })}
              />
            </div>
          </div>
          <Input
            label="Địa điểm"
            value={form.location}
            onChange={val => setForm({ ...form, location: val })}
            placeholder="Ví dụ: Nhà hàng Sen Tây Hồ, Hà Nội..."
          />
          <Textarea
            label="Ghi chú thêm"
            value={form.notes}
            onChange={val => setForm({ ...form, notes: val })}
            placeholder="Mô tả chi tiết hoặc lưu ý cho hoạt động này..."
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
