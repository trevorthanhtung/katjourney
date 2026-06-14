import { firebaseEnabled, initFirebase } from "../lib/firebase";
import type { User, Unsubscribe } from "firebase/auth";

/**
 * Chuyển đổi mã lỗi Firebase Auth sang tiếng Việt thân thiện với người dùng.
 */
export function getFriendlyAuthErrorMessage(error: any): string {
  if (!error) return "Đã xảy ra lỗi không xác định.";
  if (typeof error === "string") return error;
  
  const code = error.code;
  switch (code) {
    case "auth/popup-closed-by-user":
      return "Cửa sổ đăng nhập đã bị đóng bởi người dùng.";
    case "auth/popup-blocked":
      return "Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng cho phép popup trong cài đặt trình duyệt để tiếp tục.";
    case "auth/cancelled-popup-request":
      return "Yêu cầu đăng nhập qua cửa sổ popup đã bị hủy.";
    case "auth/network-request-failed":
      return "Lỗi kết nối mạng. Vui lòng kiểm tra lại kết nối Internet của bạn.";
    case "auth/credential-already-in-use":
      return "Tài khoản Google này đã được liên kết với một tài khoản KAT Journey khác. Không thể liên kết với tài khoản Khách hiện tại.";
    case "auth/operation-not-allowed":
      return "Phương thức đăng nhập này chưa được kích hoạt trên hệ thống.";
    case "auth/invalid-credential":
      return "Thông tin xác thực tài khoản không chính xác, vui lòng thử lại.";
    case "auth/user-disabled":
      return "Tài khoản này đã bị vô hiệu hóa hoặc khóa.";
    case "auth/email-already-in-use":
      return "Địa chỉ email này đã được sử dụng bởi một tài khoản khác.";
    case "auth/invalid-email":
      return "Địa chỉ email không hợp lệ. Vui lòng kiểm tra lại định dạng email.";
    case "auth/weak-password":
      return "Mật khẩu quá yếu. Mật khẩu cần có ít nhất 6 ký tự.";
    case "auth/wrong-password":
      return "Mật khẩu không chính xác. Vui lòng kiểm tra và thử lại.";
    case "auth/user-not-found":
      return "Không tìm thấy tài khoản liên kết với email này. Vui lòng đăng ký.";
    case "auth/too-many-requests":
      return "Tài khoản đã bị tạm khóa do nhập sai nhiều lần. Vui lòng thử lại sau.";
    default:
      return error.message || "Đã xảy ra lỗi trong quá trình xác thực.";
  }
}

/**
 * Đăng nhập ẩn danh dưới dạng Khách (Guest).
 */
export async function signInAsGuest(): Promise<User> {
  if (!firebaseEnabled) {
    throw new Error("Không thể kết nối đến Firebase. Cấu hình ứng dụng (Environment Variables) bị thiếu.");
  }

  try {
    const { auth } = await initFirebase();
    const { signInAnonymously } = await import("firebase/auth");
    
    if (auth.currentUser) {
      return auth.currentUser;
    }
    
    const credential = await signInAnonymously(auth);
    return credential.user;
  } catch (error: any) {
    console.error("[AuthService] signInAsGuest error:", error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * Đăng nhập bằng Google.
 * Hỗ trợ liên kết tài khoản (linkWithPopup) nếu người dùng hiện tại đang là tài khoản Khách (Anonymous User)
 * để bảo toàn Firebase UID cùng các dữ liệu Cloud Share/Permissions đi kèm.
 */
export async function signInWithGoogle(): Promise<User> {
  if (!firebaseEnabled) {
    throw new Error("Không thể kết nối đến Firebase. Cấu hình ứng dụng (Environment Variables) bị thiếu.");
  }

  try {
    const { auth } = await initFirebase();
    const { GoogleAuthProvider, signInWithPopup, linkWithPopup } = await import("firebase/auth");
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    
    const currentUser = auth.currentUser;
    
    // Nếu có user hiện tại và là tài khoản ẩn danh (Khách), thực hiện liên kết
    if (currentUser && currentUser.isAnonymous) {
      try {
        console.log("[AuthService] Linking current anonymous user to Google account...", currentUser.uid);
        const result = await linkWithPopup(currentUser, provider);
        console.log("[AuthService] Linking success! Preserved UID:", result.user.uid);
        return result.user;
      } catch (linkError: any) {
        console.error("[AuthService] Link account error:", linkError);
        // Trả về lỗi đã được dịch nghĩa
        throw new Error(getFriendlyAuthErrorMessage(linkError));
      }
    } else {
      // Trường hợp chưa đăng nhập gì cả, hoặc session hiện tại là tài khoản thật (Google)
      console.log("[AuthService] Initiating standard Google Sign-In...");
      const result = await signInWithPopup(auth, provider);
      return result.user;
    }
  } catch (error: any) {
    console.error("[AuthService] signInWithGoogle error:", error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * Đăng xuất người dùng.
 * Nếu là tài khoản Khách (Anonymous), tiến hành xóa tài khoản trên Firebase
 * để tránh rác dữ liệu lưu trữ quá nhiều tài khoản ảo.
 */
export async function signOutUser(): Promise<void> {
  if (!firebaseEnabled) return;

  try {
    const { auth } = await initFirebase();
    const currentUser = auth.currentUser;
    
    if (currentUser && currentUser.isAnonymous) {
      console.log("[AuthService] Deleting anonymous user to clean up Firebase...");
      try {
        await currentUser.delete();
        console.log("[AuthService] Anonymous user deleted successfully.");
      } catch (delErr: any) {
        // Fallback to normal sign out if delete fails (e.g. requires-recent-login)
        console.warn("[AuthService] Could not delete anonymous user, falling back to sign out:", delErr);
        await auth.signOut();
      }
    } else {
      await auth.signOut();
      console.log("[AuthService] User signed out successfully.");
    }
  } catch (error: any) {
    console.error("[AuthService] signOutUser error:", error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * Cập nhật tên hiển thị của người dùng.
 */
export async function updateUserDisplayName(name: string): Promise<void> {
  if (!firebaseEnabled) {
    throw new Error("Không thể kết nối đến Firebase.");
  }
  try {
    const { auth } = await initFirebase();
    const { updateProfile } = await import("firebase/auth");
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: name });
      console.log("[AuthService] Display name updated successfully:", name);
    } else {
      throw new Error("Không tìm thấy người dùng hiện tại.");
    }
  } catch (error: any) {
    console.error("[AuthService] updateUserDisplayName error:", error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * Lấy thông tin người dùng hiện tại.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!firebaseEnabled) return null;
  try {
    const { auth } = await initFirebase();
    return auth.currentUser;
  } catch (error) {
    console.error("[AuthService] getCurrentUser error:", error);
    return null;
  }
}

/**
 * Lắng nghe thay đổi trạng thái xác thực thời gian thực.
 * Trả về hàm huỷ đăng ký (unsubscribe) đồng bộ.
 */
export function observeAuthState(callback: (user: User | null) => void): () => void {
  let unsubscribe: Unsubscribe | null = null;
  let isCancelled = false;

  if (!firebaseEnabled) {
    // Trả về trạng thái null ngay lập tức nếu Firebase chưa bật
    setTimeout(() => callback(null), 0);
    return () => {};
  }

  initFirebase()
    .then(({ auth }) => {
      if (isCancelled) return;
      import("firebase/auth").then(({ onAuthStateChanged }) => {
        if (isCancelled) return;
        unsubscribe = onAuthStateChanged(auth, (user) => {
          callback(user);
        });
      });
    })
    .catch((err) => {
      console.error("[AuthService] observeAuthState init error:", err);
      callback(null);
    });

  return () => {
    isCancelled = true;
    if (unsubscribe) {
      unsubscribe();
    }
  };
}

/**
 * Đăng ký tài khoản mới bằng Email và Mật khẩu.
 */
export async function signUpWithEmailAndPassword(email: string, password: string, fullName: string): Promise<User> {
  if (!firebaseEnabled) {
    throw new Error("Không thể kết nối đến Firebase. Cấu hình ứng dụng (Environment Variables) bị thiếu.");
  }

  try {
    const { auth } = await initFirebase();
    const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
    
    console.log("[AuthService] Registering user with email/password...");
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    
    console.log("[AuthService] Updating user profile with full name...");
    await updateProfile(credential.user, { displayName: fullName });
    
    return credential.user;
  } catch (error: any) {
    console.error("[AuthService] signUpWithEmailAndPassword error:", error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}

/**
 * Đăng nhập bằng Email và Mật khẩu.
 */
export async function signInWithEmailAndPassword(email: string, password: string): Promise<User> {
  if (!firebaseEnabled) {
    throw new Error("Không thể kết nối đến Firebase. Cấu hình ứng dụng (Environment Variables) bị thiếu.");
  }

  try {
    const { auth } = await initFirebase();
    const { signInWithEmailAndPassword: fbSignIn } = await import("firebase/auth");
    
    console.log("[AuthService] Logging in user with email/password...");
    const credential = await fbSignIn(auth, email, password);
    return credential.user;
  } catch (error: any) {
    console.error("[AuthService] signInWithEmailAndPassword error:", error);
    throw new Error(getFriendlyAuthErrorMessage(error));
  }
}
