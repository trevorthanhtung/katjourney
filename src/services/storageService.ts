import { initFirebase } from "../lib/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// 1. Hàm nén ảnh bằng Canvas (Max 800px, Quality 0.7)
export const compressImage = (file: File): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = Math.min(1, MAX_WIDTH / img.width);
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2d context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        // Xuất ra định dạng WebP nén 70%
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas to Blob failed'));
        }, 'image/webp', 0.7);
      };
      img.onerror = () => reject(new Error('Image load failed'));
    };
    reader.onerror = () => reject(new Error('File read failed'));
  });
};

// Helper to convert Blob to Base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// 2. Hàm xử lý ảnh Giấy tờ (Lưu trực tiếp dưới dạng Base64)
export const uploadDocumentImage = async (file: File, tripId: string | number): Promise<string> => {
  const compressedBlob = await compressImage(file);
  // Không dùng Firebase Storage nữa, chuyển thẳng thành chuỗi Base64
  const base64Url = await blobToBase64(compressedBlob);
  return base64Url;
};

// 3. Hàm xử lý Ảnh Nhật Ký (Lưu trực tiếp dưới dạng Base64)
export const uploadJournalImage = async (file: File, tripId: string | number): Promise<string> => {
  console.log("Bắt đầu nén ảnh...");
  const compressedBlob = await compressImage(file);
  console.log("Nén xong, chuyển đổi thành Base64...");
  // Không dùng Firebase Storage nữa, chuyển thẳng thành chuỗi Base64
  const base64Url = await blobToBase64(compressedBlob);
  console.log("Hoàn tất chuyển đổi Base64.");
  return base64Url;
};
