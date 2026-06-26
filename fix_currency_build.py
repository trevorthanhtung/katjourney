import os

# 1. Fix TripSearchModal.tsx
tsm_path = 'src/components/TripSearchModal.tsx'
with open(tsm_path, 'r', encoding='utf-8') as f:
    tsm = f.read()

# Add `trip` to TripSearchModal
if 'const trip = useLiveQuery' not in tsm:
    tsm = tsm.replace(
        '  const events = useLiveQuery',
        '  const trip = useLiveQuery(async () => await db.trips.get(tripId), [tripId]);\n  const events = useLiveQuery'
    )

tsm = tsm.replace(
    '{formatMoney(item.amount, item.tripId ? (trips.find(t => t.id === item.tripId)?.defaultCurrency || "VND") : "VND")}',
    '{formatMoney(item.amount, trip?.defaultCurrency || "VND")}'
)

with open(tsm_path, 'w', encoding='utf-8') as f:
    f.write(tsm)


# 2. Fix ExpensesScreen.tsx
exp_path = 'src/features/expenses/ExpensesScreen.tsx'
with open(exp_path, 'r', encoding='utf-8') as f:
    exp = f.read()

if 'useLiveQuery' not in exp:
    exp = exp.replace(
        'import React, { useEffect, useRef, useState } from "react";',
        'import React, { useEffect, useRef, useState } from "react";\nimport { useLiveQuery } from "dexie-react-hooks";'
    )

if 'const trip = useLiveQuery(async () =>' not in exp:
    exp = exp.replace(
        'export function ExpensesScreen({\n  expenses,',
        'export function ExpensesScreen({\n  expenses,'
    ).replace(
        '  isReadOnly\n}: {\n',
        '  isReadOnly\n}: {\n'
    ).replace(
        '  isReadOnly?: boolean;\n}) {\n  const { t } = useTranslation();',
        '  isReadOnly?: boolean;\n}) {\n  const { t } = useTranslation();\n  const trip = useLiveQuery(async () => await db.trips.get(tripId), [tripId]);'
    )

with open(exp_path, 'w', encoding='utf-8') as f:
    f.write(exp)
