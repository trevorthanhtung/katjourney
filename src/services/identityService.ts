export interface UserIdentity {
  id?: string;
  name: string;
  isGuest: boolean;
  canEdit: boolean;
}

let memoryIdentity: Record<string, UserIdentity> = {};

export const saveIdentity = (identity: UserIdentity, tripId: string | number) => {
  memoryIdentity[`kat_id_${tripId}`] = identity;
};

export const getIdentity = (tripId: string | number): UserIdentity | null => {
  return memoryIdentity[`kat_id_${tripId}`] || null;
};

export const clearIdentity = (tripId: string | number) => {
  delete memoryIdentity[`kat_id_${tripId}`];
};
