import { useLiveQuery } from "dexie-react-hooks";
import { Backpack, CalendarDays, Calendar, CheckCircle, Compass, Menu, Plus, WalletCards, Settings, Plane, X, ArrowLeft, Search, Bell, BellRing, ChevronRight, Check, ListTodo, FileText, BookOpenText, Sparkles } from "lucide-react";
import React, { useState } from "react";
import { ChecklistItem, db, EventItem, Expense, JournalEntry, Member, PackingItem, Trip } from "./db";

// Components & Helpers
import { FormCard, ScreenTitle, BottomSheet } from "./components/ui";
import { classNames } from "./utils/helpers";
import { TripSearchModal } from "./components/TripSearchModal";
import { GlobalToast } from "./components/ui/ToastManager";
import { useTripReminders } from "./hooks/useTripReminders";
import { useMediaQuery } from "./hooks/useMediaQuery";

// Screens
import { HomeScreen } from "./features/home/HomeScreen";
import { TimelineScreen } from "./features/timeline/TimelineScreen";
import { ExpensesScreen } from "./features/expenses/ExpensesScreen";
import { ChecklistScreen } from "./features/checklist/ChecklistScreen";
import { MoreScreen, TripForm } from "./features/more/MoreScreen";
import { TripManagerScreen } from "./features/trips/TripManagerScreen";

const SharedTripScreen = React.lazy(() => import("./features/share/SharedTripScreen"));
import { useShareChangeRequests } from "./hooks/useShareChangeRequests";
import { ShareChangeRequestsSheet } from "./features/share/components/ShareChangeRequestsSheet";

function NavButton({ 
  isActive, 
  onClick, 
  icon: Icon, 
  label 
}: { 
  isActive: boolean; 
  onClick: () => void; 
  icon: React.ElementType; 
  label: string 
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={classNames(
        "relative flex items-center justify-center rounded-full transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] overflow-hidden motion-press",
        isActive 
          ? "bg-kat-primary/10 text-kat-primary px-4 sm:px-5 h-[52px] gap-2" 
          : "text-kat-text/60 hover:text-kat-text/80 w-[52px] h-[52px]"
      )}
    >
      <Icon className={classNames("h-[22px] w-[22px] shrink-0 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]", isActive ? "scale-100" : "scale-[0.94]")} strokeWidth={isActive ? 2.5 : 2} />
      {isActive && <span className="text-[14px] font-bold whitespace-nowrap">{label}</span>}
    </button>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<"home" | "timeline" | "expenses" | "checklist" | "more">("home");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [moreSection, setMoreSection] = useState<"overview" | "journal" | "packing" | "wrapped" | "settings" | "members" | "documents">("overview");
  const [isAppInboxOpen, setIsAppInboxOpen] = useState(false);

  const trips = useLiveQuery(() => db.trips.toArray()) ?? [];
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isManagingTrips, setIsManagingTrips] = useState(false);
  const [successToast, setSuccessToast] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Check for share link route
  const pathname = window.location.pathname;
  const isShareRoute = pathname.startsWith("/share/");
  const shareToken = isShareRoute ? pathname.replace("/share/", "") : null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };
  
  const tripId = isCreatingTrip || isManagingTrips ? null : (selectedTripId ?? trips[0]?.id ?? null);
  const trip = useLiveQuery(() => (tripId ? db.trips.get(tripId) : undefined), [tripId]);
  const members = useLiveQuery(() => (tripId ? db.members.where("tripId").equals(tripId).toArray() : []), [tripId]) ?? [];
  const events = useLiveQuery(() => (tripId ? db.events.where("tripId").equals(tripId).toArray() : []), [tripId]) ?? [];
  const expenses = useLiveQuery(() => (tripId ? db.expenses.where("tripId").equals(tripId).toArray() : []), [tripId]) ?? [];
  const checklist = useLiveQuery(() => (tripId ? db.checklist.where("tripId").equals(tripId).toArray() : []), [tripId]) ?? [];
  const journals = useLiveQuery(() => (tripId ? db.journals.where("tripId").equals(tripId).toArray() : []), [tripId]) ?? [];
  const packingItems = useLiveQuery(() => (tripId ? db.packingItems.where("tripId").equals(tripId).toArray() : []), [tripId]) ?? [];
  const travelDocuments = useLiveQuery(() => (tripId ? db.travelDocuments.where("tripId").equals(tripId).toArray() : []), [tripId]) ?? [];
  const backupPlans = useLiveQuery(() => (tripId ? db.backupPlans.where("tripId").equals(tripId).toArray() : []), [tripId]) ?? [];
  const { pendingRequests, activeToken } = useShareChangeRequests(trip);
  const reminders = useTripReminders({ trip, checklist, travelDocuments, events, backupPlans, pendingRequestsCount: pendingRequests.length });

  const sharedExpenses = expenses.filter(e => e.splitType !== "personal");
  const totalSharedExpense = sharedExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const perPerson = members.length ? totalSharedExpense / members.length : 0;

  function navigateToMore(section: "overview" | "journal" | "packing" | "wrapped" | "settings" | "members" | "documents") {
    setMoreSection(section);
    setActiveTab("more");
  }

  function renderReminderItems() {
    if (reminders.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 px-5 text-center bg-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-2.5 border border-emerald-100">
            <Check className="h-5 w-5" strokeWidth={3} />
          </div>
          <p className="text-[14px] font-bold text-[#030D2E]">Tuyệt vời! Không có nhắc nhở</p>
          <p className="text-[12px] text-slate-500 font-semibold mt-0.5">Hành trình của bạn đã sẵn sàng.</p>
        </div>
      );
    }

    return reminders.map((rem) => {
      let Icon = Bell;
      let colorClasses = "bg-slate-50 text-slate-600 border border-slate-100/50";
      
      switch (rem.tab) {
        case "timeline":
          Icon = Calendar;
          colorClasses = "bg-blue-50 text-blue-600 border border-blue-100/50";
          break;
        case "checklist":
          Icon = ListTodo;
          colorClasses = "bg-amber-50 text-amber-600 border border-amber-100/50";
          break;
        case "expenses":
          Icon = WalletCards;
          colorClasses = "bg-emerald-50 text-emerald-600 border border-emerald-100/50";
          break;
        case "documents":
          Icon = FileText;
          colorClasses = "bg-rose-50 text-rose-600 border border-rose-100/50";
          break;
        case "journal":
          Icon = BookOpenText;
          colorClasses = "bg-violet-50 text-violet-600 border border-violet-100/50";
          break;
        case "wrapped":
          Icon = Sparkles;
          colorClasses = "bg-sky-50 text-sky-600 border border-sky-100/50";
          break;
        case "share_requests" as any:
          Icon = BellRing;
          colorClasses = "bg-rose-50 text-rose-600 border border-rose-100/50";
          break;
      }

      return (
        <button
          key={rem.id}
          className="flex w-full items-center gap-3.5 bg-white p-4 text-left hover:bg-slate-50 transition-colors focus:outline-none"
          onClick={() => {
            setIsRemindersOpen(false);
            if (rem.tab === "share_requests" as any) {
              setIsAppInboxOpen(true);
            } else if (rem.tab === "documents" || rem.tab === "journal" || rem.tab === "wrapped") {
              navigateToMore(rem.tab);
            } else {
              setActiveTab(rem.tab);
            }
          }}
        >
          {/* Leading Icon */}
          <div className={classNames("flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm", colorClasses)}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <p className="text-[13.5px] font-semibold text-slate-700 leading-snug break-words">
              {rem.text}
            </p>
          </div>

          {/* Trailing Icon */}
          <ChevronRight className="h-4.5 w-4.5 shrink-0 text-slate-400" />
        </button>
      );
    });
  }

  if (isShareRoute && shareToken) {
    return (
      <React.Suspense fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#FFFDF8]">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-kat-primary/30 border-t-kat-primary"></div>
        </div>
      }>
        <SharedTripScreen token={shareToken} />
      </React.Suspense>
    );
  }

  return (
    <div className="font-sans text-kat-text antialiased selection:bg-kat-primary-light/30 selection:text-kat-text">
      <header className="sticky top-0 z-40 bg-kat-bg/90 px-4 pb-3 pt-3 backdrop-blur-xl border-b border-kat-border shadow-sm" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <GlobalToast />
        <div className="mx-auto flex max-w-[1120px] items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsManagingTrips(true)}
              className="flex items-center gap-2 hover:opacity-80 active:scale-98 transition-all focus:outline-none"
            >
              <img src="/asset/logo.png" alt="KAT Journey Logo" className="h-[28px] w-[28px] object-contain drop-shadow-sm" />
              <h1 className="text-[20px] font-extrabold tracking-tight text-kat-text">KAT Journey</h1>
            </button>
            
            {/* Desktop Navigation */}
            {!isManagingTrips && tripId && (
              <div className="hidden md:flex ml-6 gap-2 bg-kat-text/5 p-1 rounded-full">
                <button 
                  onClick={() => setActiveTab("home")}
                  className={classNames("px-5 py-2 rounded-full text-[14px] transition-all", activeTab === "home" ? "bg-white text-kat-text font-bold shadow-sm" : "text-kat-muted font-medium hover:text-kat-text hover:bg-black/5")}
                >
                  Tổng quan
                </button>
                <button 
                  onClick={() => setActiveTab("timeline")}
                  className={classNames("px-5 py-2 rounded-full text-[14px] transition-all", activeTab === "timeline" ? "bg-white text-kat-text font-bold shadow-sm" : "text-kat-muted font-medium hover:text-kat-text hover:bg-black/5")}
                >
                  Lịch trình
                </button>
                <button 
                  onClick={() => setActiveTab("expenses")}
                  className={classNames("px-5 py-2 rounded-full text-[14px] transition-all", activeTab === "expenses" ? "bg-white text-kat-text font-bold shadow-sm" : "text-kat-muted font-medium hover:text-kat-text hover:bg-black/5")}
                >
                  Chi phí
                </button>
                <button 
                  onClick={() => setActiveTab("checklist")}
                  className={classNames("px-5 py-2 rounded-full text-[14px] transition-all", activeTab === "checklist" ? "bg-white text-kat-text font-bold shadow-sm" : "text-kat-muted font-medium hover:text-kat-text hover:bg-black/5")}
                >
                  Chuẩn bị
                </button>
                <button 
                  onClick={() => {
                    setMoreSection("overview");
                    setActiveTab("more");
                  }}
                  className={classNames("px-5 py-2 rounded-full text-[14px] transition-all", activeTab === "more" ? "bg-white text-kat-text font-bold shadow-sm" : "text-kat-muted font-medium hover:text-kat-text hover:bg-black/5")}
                >
                  Thêm
                </button>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 md:gap-3">
            {!isManagingTrips && tripId && (
              <>
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-kat-surface border border-kat-border/60 text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all shadow-sm focus:outline-none"
                  title="Tìm trong chuyến đi"
                >
                  <Search className="h-4.5 w-4.5" />
                </button>

                <div className="relative">
                  <button
                    onClick={() => setIsRemindersOpen(!isRemindersOpen)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-kat-surface border border-kat-border/60 text-slate-500 hover:text-slate-800 hover:bg-slate-50 active:scale-95 transition-all shadow-sm focus:outline-none"
                    title="Việc cần chú ý"
                  >
                    {reminders.length > 0 ? (
                      <BellRing className="h-4.5 w-4.5 text-amber-500 animate-pulse" />
                    ) : (
                      <Bell className="h-4.5 w-4.5" />
                    )}
                  </button>
                  {reminders.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-black text-white ring-2 ring-white pointer-events-none">
                      {reminders.length}
                    </span>
                  )}

                  {/* Popover on Desktop (md and up) */}
                  {isRemindersOpen && isDesktop && (
                    <>
                      {/* Desktop overlay backdrop to close popover on click outside */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsRemindersOpen(false)} 
                      />
                      
                      <div className="absolute right-0 mt-2.5 z-50 w-[360px] rounded-2xl bg-white border border-slate-200/80 shadow-floating overflow-hidden animate-fadeIn">
                        {/* Popover Header */}
                        <div className="px-5 py-4 border-b border-slate-150/60 bg-[#FFFDF8]">
                          <h4 className="text-[14.5px] font-bold text-[#030D2E] leading-snug">Việc cần chú ý</h4>
                          <p className="text-[11.5px] text-slate-500 font-semibold mt-0.5 leading-normal">Các nhắc nhở quan trọng</p>
                        </div>
                        
                        {/* Popover Content */}
                        <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar">
                          {renderReminderItems()}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
            {!(isManagingTrips || (!tripId && !isCreatingTrip)) && (
              <button
                onClick={() => setIsManagingTrips(true)}
                className="flex items-center justify-center rounded-full bg-[#030D2E] text-white px-4 py-1.5 text-[13.5px] font-bold shadow-sm hover:bg-[#030D2E]/90 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#030D2E]/30 focus:ring-offset-2"
              >
                <span>Trang chủ</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className={classNames(
        "mx-auto flex min-h-screen w-full max-w-[1120px] flex-col",
        (!isManagingTrips && tripId) ? "mobile-page-content" : "pb-12"
      )}>
        <div className="flex-1 px-4 md:px-6 py-6 md:py-8">
          {isManagingTrips || (!tripId && !isCreatingTrip) ? (
            <div key="manager" className="motion-page-enter">
              <TripManagerScreen
                trips={trips}
                onOpenTrip={(id) => {
                  setSelectedTripId(id);
                  setIsManagingTrips(false);
                  setIsCreatingTrip(false);
                }}
                onCreateNew={() => {
                  setIsManagingTrips(false);
                  setIsCreatingTrip(true);
                }}
                onShowToast={showToast}
              />
            </div>
          ) : isCreatingTrip ? (
            <div key="creating" className="space-y-6 motion-page-enter">
              <ScreenTitle title="Chuyến đi mới" subtitle="Bắt đầu hành trình tiếp theo của bạn." />
              <div className="rounded-2xl border border-emerald-950/5 bg-white p-5 shadow-soft">
                <TripForm isOpen={true} onClose={() => setIsCreatingTrip(false)} onSaved={(id) => {
                  setIsCreatingTrip(false);
                  setIsManagingTrips(true);
                  setSuccessToast(id);
                  setTimeout(() => setSuccessToast(null), 4000);
                }} />
              </div>
            </div>
          ) : trip && tripId ? (
            <div key={activeTab} className="motion-page-enter">
              {activeTab === "home" && <HomeScreen trip={trip} members={members} events={events} expenses={expenses} checklist={checklist} travelDocuments={travelDocuments} totalExpense={totalExpense} perPerson={perPerson} onNavigateTab={setActiveTab} onNavigateMore={navigateToMore} onOpenInbox={() => setIsAppInboxOpen(true)} />}
              {activeTab === "timeline" && <TimelineScreen trip={trip} events={events} />}
              {activeTab === "expenses" && <ExpensesScreen expenses={expenses} members={members} totalExpense={totalExpense} perPerson={perPerson} tripId={tripId} />}
              {activeTab === "checklist" && <ChecklistScreen checklist={checklist} tripId={tripId} />}
              {activeTab === "more" && <MoreScreen trip={trip} members={members} events={events} expenses={expenses} checklist={checklist} journals={journals} packingItems={packingItems} travelDocuments={travelDocuments} onTripDeleted={() => { setSelectedTripId(null); setIsManagingTrips(true); showToast("Đã xóa chuyến đi khỏi danh sách."); }} onTripSelected={setSelectedTripId} onShowToast={showToast} section={moreSection} setSection={setMoreSection} onOpenInbox={() => setIsAppInboxOpen(true)} />}
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500"></div>
            </div>
          )}
        </div>
      </main>



      {!isManagingTrips && tripId && (
        <nav className="fixed inset-x-4 z-40 mx-auto max-w-[520px] md:hidden" style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
          <div className="flex h-[68px] items-center justify-between rounded-full bg-kat-surface/95 px-2 shadow-floating backdrop-blur-xl ring-1 ring-kat-primary/20">
            <NavButton
              isActive={activeTab === "home"}
              onClick={() => setActiveTab("home")}
              icon={Compass}
              label="Tổng quan"
            />
            <NavButton
              isActive={activeTab === "timeline"}
              onClick={() => setActiveTab("timeline")}
              icon={CalendarDays}
              label="Lịch trình"
            />
            <NavButton
              isActive={activeTab === "expenses"}
              onClick={() => setActiveTab("expenses")}
              icon={WalletCards}
              label="Chi phí"
            />
            <NavButton
              isActive={activeTab === "checklist"}
              onClick={() => setActiveTab("checklist")}
              icon={CheckCircle}
              label="Chuẩn bị"
            />
            <NavButton
              isActive={activeTab === "more"}
              onClick={() => {
                setMoreSection("overview");
                setActiveTab("more");
              }}
              icon={Menu}
              label="Thêm"
            />
          </div>
        </nav>
      )}

      {successToast && (
        <div className="fixed bottom-24 left-1/2 z-50 motion-toast-enter">
          <div className="bg-kat-text text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-4">
            <span className="text-[14px] font-medium">Đã tạo chuyến đi thành công</span>
            <button 
              onClick={() => {
                setSelectedTripId(successToast);
                setIsManagingTrips(false);
                setSuccessToast(null);
              }}
              className="text-kat-primary font-bold text-[14px] hover:text-white transition-colors"
            >
              Xem chi tiết
            </button>
            <button onClick={() => setSuccessToast(null)} className="text-slate-400 hover:text-white p-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 z-50 motion-toast-enter">
          <div className="bg-[#030D2E] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 border border-slate-200/10">
            <span className="text-[14px] font-bold">{toastMessage}</span>
          </div>
        </div>
      )}

      {tripId && (
        <TripSearchModal 
          tripId={tripId}
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
          onNavigateTab={setActiveTab}
          onNavigateMore={navigateToMore}
        />
      )}

      {/* Bottom Sheet on Mobile only */}
      {isRemindersOpen && !isDesktop && (
        <BottomSheet
          isOpen={isRemindersOpen}
          onClose={() => setIsRemindersOpen(false)}
          title="Việc cần chú ý"
          subtitle="Các nhắc nhở quan trọng"
        >
          <div className="divide-y divide-slate-100 -mx-5 -mb-4 mt-1 border-t border-slate-100">
            {renderReminderItems()}
          </div>
        </BottomSheet>
      )}

      {activeToken && tripId && (
        <ShareChangeRequestsSheet
          isOpen={isAppInboxOpen}
          onClose={() => setIsAppInboxOpen(false)}
          token={activeToken}
          requests={pendingRequests}
        />
      )}
    </div>
  );
}

export default App;
