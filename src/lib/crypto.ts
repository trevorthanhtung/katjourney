import CryptoJS from "crypto-js";

// Khóa bảo mật tự động sinh cho thiết bị
const ENCRYPTION_KEY_NAME = "kat_journey_device_secret";
let SECRET_KEY = typeof localStorage !== "undefined" ? localStorage.getItem(ENCRYPTION_KEY_NAME) : null;

if (!SECRET_KEY && typeof localStorage !== "undefined") {
  // Tạo khóa AES 256 bit ngẫu nhiên
  SECRET_KEY = CryptoJS.lib.WordArray.random(256 / 8).toString();
  localStorage.setItem(ENCRYPTION_KEY_NAME, SECRET_KEY);
}

// Các trường làm Index trong Dexie thì KHÔNG ĐƯỢC mã hóa
const indexedFields = [
  "id", "tripId", "title", "startDate", "endDate", "createdAt", 
  "name", "date", "completed", "category", "payer", "section", 
  "mood", "tripType", "type", "activityId"
];

const isIndexedField = (key: string) => indexedFields.includes(key);

export const encryptObject = (obj: any) => {
  if (!obj || typeof obj !== "object" || !SECRET_KEY) return obj;
  
  const encryptedObj: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (isIndexedField(key) || val === undefined || val === null) {
      encryptedObj[key] = val;
    } else {
      try {
        const stringified = JSON.stringify(val);
        // Add prefix để nhận biết field này đã được mã hóa
        encryptedObj[key] = "ENC:" + CryptoJS.AES.encrypt(stringified, SECRET_KEY).toString();
      } catch (e) {
        encryptedObj[key] = val;
      }
    }
  }
  return encryptedObj;
};

export const decryptObject = (obj: any) => {
  if (!obj || typeof obj !== "object" || !SECRET_KEY) return obj;
  
  const decryptedObj: any = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (isIndexedField(key) || typeof val !== 'string' || !val.startsWith("ENC:")) {
      decryptedObj[key] = val;
    } else {
      try {
        const ciphertext = val.substring(4); // bỏ "ENC:"
        const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
        const decryptedStr = bytes.toString(CryptoJS.enc.Utf8);
        if (decryptedStr) {
          decryptedObj[key] = JSON.parse(decryptedStr);
        } else {
          decryptedObj[key] = val;
        }
      } catch (e) {
        // Fallback nếu giải mã thất bại (có thể khóa bị đổi)
        decryptedObj[key] = val;
      }
    }
  }
  return decryptedObj;
};
