import Dexie from 'dexie';

const db = new Dexie('KatJourneyDB');
db.version(2).stores({
  trips: '++id, title, location, startDate, endDate, createdAt, updatedAt, tripType',
  expenses: '++id, tripId, amount, description, payer, category, date, eventId, originalCurrency, originalAmount',
});

db.open().then(async () => {
  const trips = await db.table('trips').toArray();
  console.log("Trips:", JSON.stringify(trips, null, 2));
  
  const expenses = await db.table('expenses').toArray();
  console.log("Expenses:", JSON.stringify(expenses, null, 2));
  
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
