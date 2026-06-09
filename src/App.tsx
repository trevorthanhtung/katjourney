import { useLiveQuery } from "dexie-react-hooks";
import { Backpack, CalendarDays, CheckCircle, Compass, Menu, Plus, WalletCards } from "lucide-react";
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

function App() {
  const [activeTab, setActiveTab] = useState<"home" | "timeline" | "expenses" | "checklist" | "more">("home");
  const [moreSection, setMoreSection] = useState<"overview" | "journal" | "packing" | "wrapped" | "settings" | "members">("overview");
  const trips = useLiveQuery(() => db.trips.toArray()) ?? [];
  const [selectedTripId, setSelectedTripId] = useState<number | null>(null);
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [isManagingTrips, setIsManagingTrips] = useState(false);
  
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
    <div className="font-sans text-slate-900 antialiased selection:bg-emerald-100 selection:text-emerald-900">
      <header className="sticky top-0 z-40 bg-sand/90 px-4 pb-3 pt-3 backdrop-blur-xl border-b border-emerald-900/5 shadow-sm" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-extrabold tracking-tight text-slate-800">KAT Journey</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {!(isManagingTrips || (!tripId && !isCreatingTrip)) && (
              <button
                onClick={() => setIsManagingTrips(true)}
                className="flex items-center justify-center truncate rounded-full bg-slate-900 px-5 py-2 text-[14px] font-medium text-white shadow-md hover:bg-slate-800 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all"
              >
                Trang chủ
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col" style={{ paddingBottom: "calc(7rem + env(safe-area-inset-bottom))" }}>
        <div className="flex-1 px-4 py-6">
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
                  setSelectedTripId(id);
                }} />
              </div>
            </div>
          ) : trip && tripId ? (
            <div className="animate-fadeIn">
              {activeTab === "home" && <HomeScreen trip={trip} members={members} events={events} expenses={expenses} checklist={checklist} totalExpense={totalExpense} perPerson={perPerson} onNavigateTab={setActiveTab} onNavigateMore={navigateToMore} />}
              {activeTab === "timeline" && <TimelineScreen trip={trip} events={events} />}
              {activeTab === "expenses" && <ExpensesScreen expenses={expenses} members={members} totalExpense={totalExpense} perPerson={perPerson} tripId={tripId} />}
              {activeTab === "checklist" && <ChecklistScreen checklist={checklist} tripId={tripId} />}
              {activeTab === "more" && <MoreScreen trip={trip} members={members} events={events} expenses={expenses} checklist={checklist} journals={journals} packingItems={packingItems} onTripDeleted={() => setSelectedTripId(null)} onTripSelected={setSelectedTripId} section={moreSection} setSection={setMoreSection} />}
            </div>
          ) : (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-500"></div>
            </div>
          )}
        </div>
      </main>

      {!isManagingTrips && tripId && (
        <nav className="fixed inset-x-4 z-40 mx-auto max-w-[400px]" style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}>
          <div className="flex h-[68px] items-center justify-between rounded-full bg-white/90 px-3 shadow-floating backdrop-blur-xl ring-1 ring-slate-900/5">
            <button
              className={classNames("relative flex h-[52px] w-[52px] items-center justify-center rounded-full transition-all duration-300", activeTab === "home" ? "bg-emerald-50 text-emerald-600" : "text-slate-400 hover:text-slate-600")}
              onClick={() => setActiveTab("home")}
              aria-label="Tổng quan"
            >
              <Compass className="h-[22px] w-[22px]" strokeWidth={activeTab === "home" ? 2.5 : 2} />
            </button>
            <button
              className={classNames("relative flex h-[52px] w-[52px] items-center justify-center rounded-full transition-all duration-300", activeTab === "timeline" ? "bg-emerald-50 text-emerald-600" : "text-slate-400 hover:text-slate-600")}
              onClick={() => setActiveTab("timeline")}
              aria-label="Lịch trình"
            >
              <CalendarDays className="h-[22px] w-[22px]" strokeWidth={activeTab === "timeline" ? 2.5 : 2} />
            </button>
            <button
              className={classNames("relative flex h-[52px] w-[52px] items-center justify-center rounded-full transition-all duration-300", activeTab === "expenses" ? "bg-emerald-50 text-emerald-600" : "text-slate-400 hover:text-slate-600")}
              onClick={() => setActiveTab("expenses")}
              aria-label="Chi phí"
            >
              <WalletCards className="h-[22px] w-[22px]" strokeWidth={activeTab === "expenses" ? 2.5 : 2} />
            </button>
            <button
              className={classNames("relative flex h-[52px] w-[52px] items-center justify-center rounded-full transition-all duration-300", activeTab === "checklist" ? "bg-emerald-50 text-emerald-600" : "text-slate-400 hover:text-slate-600")}
              onClick={() => setActiveTab("checklist")}
              aria-label="Chuẩn bị"
            >
              <CheckCircle className="h-[22px] w-[22px]" strokeWidth={activeTab === "checklist" ? 2.5 : 2} />
            </button>
            <button
              className={classNames("relative flex h-[52px] w-[52px] items-center justify-center rounded-full transition-all duration-300", activeTab === "more" ? "bg-emerald-50 text-emerald-600" : "text-slate-400 hover:text-slate-600")}
              onClick={() => {
                setMoreSection("overview");
                setActiveTab("more");
              }}
              aria-label="Thêm"
            >
              <Menu className="h-[22px] w-[22px]" strokeWidth={activeTab === "more" ? 2.5 : 2} />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}

export default App;
