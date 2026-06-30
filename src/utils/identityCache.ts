export interface UserIdentity {
  id?: string;
  name: string;
  isGuest: boolean;
  canEdit: boolean;
  role?: string;
}

let memoryIdentity: Record<string, UserIdentity> = {};

export const saveIdentity = (identity: UserIdentity, tripId: string | number) => {
  const key = `kat_id_${tripId}`;
  memoryIdentity[key] = identity;
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(identity));
  }
};

export const getIdentity = (tripId: string | number): UserIdentity | null => {
  const key = `kat_id_${tripId}`;
  if (memoryIdentity[key]) return memoryIdentity[key];

  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        memoryIdentity[key] = parsed;
        return parsed;
      } catch (e) {
        return null;
      }
    }
  }
  return null;
};

export const clearIdentity = (tripId: string | number) => {
  const key = `kat_id_${tripId}`;
  delete memoryIdentity[key];
  if (typeof window !== "undefined") {
    localStorage.removeItem(key);
  }
};
