import { useLiveQuery } from "dexie-react-hooks";
import { Backpack, CalendarDays, CheckCircle, Compass, Menu, Plus, WalletCards, Settings, Plane, X, ArrowLeft } from "lucide-react";
import React, { useState } from "react";
import { ChecklistItem, db, EventItem, Expense, JournalEntry, Member, PackingItem, Trip } from "./db";

// Components & Helpers
import { FormCard, ScreenTitle } from "./components/ui";
import { classNames } from "./utils/helpers";

// Screens
import { HomeScreen } from "./features/home/HomeScreen";
import { TimelineScreen } from "./features/timeline/TimelineScreen";
import { ExpensesScreen } from "./features/expenses/ExpensesScreen";
import { ChecklistScreen } from "./features/checklist/ChecklistScreen";
import { MoreScreen, TripForm } from "./features/more/MoreScreen";
import { TripManagerScreen } from "./features/trips/TripManagerScreen";

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
        "relative flex items-center justify-center rounded-full transition-all duration-200 overflow-hidden",
        isActive 
          ? "bg-kat-primary/10 text-kat-primary px-4 sm:px-5 h-[52px] gap-2" 
          : "text-kat-text/60 hover:text-kat-text/80 w-[52px] h-[52px]"
      )}
    >
      <Icon className="h-[22px] w-[22px] shrink-0" strokeWidth={isActive ? 2.5 : 2} />
      {isActive && <span className="text-[14px] font-bold whitespace-nowrap">{label}</span>}
    </button>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<"home" | "timeline" | "expenses" | "checklist" | "more">("home");
  const [moreSection, setMoreSection] = useState<"overview" | "journal" | "packing" | "wrapped" | "settings" | "members">("overview");
  const trips = useLiveQuery(() => db.trips.toArray()) ?? [];
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isManagingTrips, setIsManagingTrips] = useState(false);
  const [successToast, setSuccessToast] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  const sharedExpenses = expenses.filter(e => e.splitType !== "personal");
  const totalSharedExpense = sharedExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const perPerson = members.length ? totalSharedExpense / members.length : 0;

  function navigateToMore(section: "overview" | "journal" | "packing" | "wrapped" | "settings" | "members") {
    setMoreSection(section);
    setActiveTab("more");
  }

  return (
    <div className="font-sans text-kat-text antialiased selection:bg-kat-primary-light/30 selection:text-kat-text">
      <header className="sticky top-0 z-40 bg-kat-bg/90 px-4 pb-3 pt-3 backdrop-blur-xl border-b border-kat-border shadow-sm" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <div className="mx-auto flex max-w-[1120px] items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-[20px] font-extrabold tracking-tight text-kat-text">KAT Journey</h1>
            
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
          
          <div className="flex items-center gap-3">
            {!(isManagingTrips || (!tripId && !isCreatingTrip)) && (
              <button
                onClick={() => setIsManagingTrips(true)}
                className="flex items-center justify-center gap-1.5 rounded-full bg-kat-surface border border-kat-border/60 px-4 py-1.5 text-[13px] font-semibold text-kat-text shadow-sm hover:bg-kat-bg hover:border-kat-border active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-kat-border/50 focus:ring-offset-2"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Tất cả chuyến đi</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-screen w-full max-w-[1120px] flex-col" style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom))" }}>
        <div className="flex-1 px-4 md:px-6 py-6 md:py-8">
          {isManagingTrips || (!tripId && !isCreatingTrip) ? (
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
            />
          ) : isCreatingTrip ? (
            <div className="space-y-6 animate-fadeIn">
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
            <div className="animate-fadeIn">
              {activeTab === "home" && <HomeScreen trip={trip} members={members} events={events} expenses={expenses} checklist={checklist} totalExpense={totalExpense} perPerson={perPerson} onNavigateTab={setActiveTab} onNavigateMore={navigateToMore} />}
              {activeTab === "timeline" && <TimelineScreen trip={trip} events={events} />}
              {activeTab === "expenses" && <ExpensesScreen expenses={expenses} members={members} totalExpense={totalExpense} perPerson={perPerson} tripId={tripId} />}
              {activeTab === "checklist" && <ChecklistScreen checklist={checklist} tripId={tripId} />}
              {activeTab === "more" && <MoreScreen trip={trip} members={members} events={events} expenses={expenses} checklist={checklist} journals={journals} packingItems={packingItems} onTripDeleted={() => { setSelectedTripId(null); setIsManagingTrips(true); showToast("Đã xóa chuyến đi khỏi danh sách."); }} onTripSelected={setSelectedTripId} onShowToast={showToast} section={moreSection} setSection={setMoreSection} />}
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500"></div>
            </div>
          )}
        </div>
      </main>

      {(isManagingTrips || (!tripId && !isCreatingTrip)) && (
        <nav className="fixed inset-x-0 bottom-0 z-40 bg-kat-surface border-t border-kat-border pb-[env(safe-area-inset-bottom)] md:hidden">
          <div className="flex h-16 items-center justify-around px-2">
            <button className="flex flex-col items-center justify-center w-16 text-kat-primary relative">
              <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-kat-primary rounded-b-full"></span>
              <Plane className="h-[22px] w-[22px] mb-1" />
              <span className="text-[10px] font-medium text-kat-text">Tổng quan</span>
            </button>
            <button className="flex flex-col items-center justify-center w-16 text-kat-muted/50 cursor-not-allowed" disabled>
              <WalletCards className="h-[22px] w-[22px] mb-1" />
              <span className="text-[10px] font-medium">Chi phí</span>
            </button>
            <button className="flex flex-col items-center justify-center w-16 text-kat-muted/50 cursor-not-allowed" disabled>
              <CheckCircle className="h-[22px] w-[22px] mb-1" />
              <span className="text-[10px] font-medium">Chuẩn bị</span>
            </button>
            <button className="flex flex-col items-center justify-center w-16 text-kat-muted/50 cursor-not-allowed" disabled>
              <Settings className="h-[22px] w-[22px] mb-1" />
              <span className="text-[10px] font-medium">Thêm</span>
            </button>
          </div>
        </nav>
      )}

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
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
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
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-[#030D2E] text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 border border-slate-200/10">
            <span className="text-[14px] font-bold">{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
