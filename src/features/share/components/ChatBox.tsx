import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react";
import { SentIcon, Cancel01Icon, BubbleChatIcon, Loading01Icon, ArrowLeft01Icon, CrownIcon, UserIcon } from "@hugeicons/core-free-icons";
import { ChatMessage, subscribeToMessages, sendMessage } from '../../../services/chatService';
import { UserIdentity } from '../../../services/identityService';
import { classNames } from '../../../utils/helpers';
import { getAvatarSvg } from '../../../utils/avatars';
import { renderToStaticMarkup } from 'react-dom/server';

interface ChatBoxProps {
  token: string;
  currentUser: UserIdentity;
  onClose?: () => void;
  inline?: boolean;
  isReadOnly?: boolean;
}

export function ChatBox({ token, currentUser, onClose, inline, isReadOnly = false }: ChatBoxProps) {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [visibleTimes, setVisibleTimes] = useState<Record<string, boolean>>({});
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  const renderSenderAvatar = (senderName: string) => (
    <div className="w-full h-full">
      {getAvatarSvg(senderName)}
    </div>
  );

  const renderRoleIcon = (role?: string) => {
    if (!role) return null;
    const isLead = role.toLowerCase().includes('trưởng') || role.toLowerCase().includes('người tạo');
    if (isLead) {
      return (
        <span className="inline-flex items-center justify-center ml-1.5 select-none" title={t("roles.leader")}>
          <HugeiconsIcon icon={CrownIcon} className="w-3.5 h-3.5 text-amber-500 fill-amber-500/10" />
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center ml-1.5 select-none opacity-80" title="Thành viên">
        <HugeiconsIcon icon={UserIcon} className="w-3 h-3 text-slate-400" />
      </span>
    );
  };

  const toggleTime = (msgId: string) => {
    setVisibleTimes(prev => ({
      ...prev,
      [msgId]: !prev[msgId]
    }));
  };

  useEffect(() => {
    let unsubscribe: () => void;
    
    subscribeToMessages(
      token,
      (newMessages) => {
        setMessages(newMessages);
        setLoading(false);
      },
      (error) => {
        console.error(error);
        setLoading(false);
      }
    ).then(unsub => {
      unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [token]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || sending) return;

    setSending(true);
    try {
      const avatarHtml = renderToStaticMarkup(getAvatarSvg(currentUser.name));
      await sendMessage(token, inputText, currentUser, avatarHtml);
      setInputText('');
    } catch (error) {
      console.error("Lỗi khi gửi tin:", error);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getMessageDateString = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);

      if (d.toDateString() === today.toDateString()) {
        return "Hôm nay";
      } else if (d.toDateString() === yesterday.toDateString()) {
        return "Hôm qua";
      } else {
        return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      }
    } catch {
      return '';
    }
  };

  // Helper to render the actual chat UI (Header, Messages Feed, Input Area)
  const renderChatContent = (isMobileFullscreen: boolean, onBackClick?: () => void) => {
    return (
      <div className="bg-white dark:bg-kat-surface flex flex-col overflow-hidden h-full w-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-kat-hero-start via-kat-hero-end to-kat-primary-usable p-4 text-white flex justify-between items-center shrink-0 border-b border-kat-border dark:border-slate-800/80 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            {isMobileFullscreen && onBackClick && (
              <button 
                onClick={onBackClick}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors mr-1 shrink-0 active:scale-95"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="w-5 h-5 text-white" />
              </button>
            )}
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner shrink-0">
              <HugeiconsIcon icon={BubbleChatIcon} className="w-5 h-5 text-kat-primary-light animate-pulse" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-[14px] sm:text-[15px] tracking-wide text-white flex items-center gap-1.5">
                Hộp Thoại Chuyến Đi
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_#10B981]"></span>
                </span>
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-300 truncate">
                <span className="truncate">Đang chat: <span className="font-semibold text-white">{currentUser.name}</span></span>
              </div>
            </div>
          </div>
          {!isMobileFullscreen && !inline && onClose && (
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-all duration-200 hover:rotate-90 active:scale-90"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="w-5 h-5" />
            </button>
          )}
        </div>
 
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-[#F8FAFC]/30 to-[#F8FAFC] dark:from-kat-surface/30 dark:to-kat-bg flex flex-col custom-scrollbar">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <HugeiconsIcon icon={Loading01Icon} className="w-8 h-8 animate-spin text-kat-primary" />
              <span className="text-xs text-kat-muted mt-2">Đang tải tin nhắn...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none">
              <div className="w-16 h-16 rounded-full bg-kat-primary-soft flex items-center justify-center mb-3">
                <HugeiconsIcon icon={BubbleChatIcon} className="w-8 h-8 text-kat-primary-usable" />
              </div>
              <h4 className="font-bold text-kat-text text-sm mb-1">{t("chat.emptyTitle")}</h4>
              <p className="text-xs text-kat-muted max-w-[200px]">{t("chat.emptySubtitle")}</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isMe = msg.senderName === currentUser.name;
              const dateStr = getMessageDateString(msg.createdAt);
              const showDateSeparator = index === 0 || getMessageDateString(messages[index - 1].createdAt) !== dateStr;
              
              const prevMsg = index > 0 ? messages[index - 1] : null;
              const nextMsg = index < messages.length - 1 ? messages[index + 1] : null;
              
              const isPrevSame = prevMsg && prevMsg.senderName === msg.senderName && !showDateSeparator;
              
              const nextDateStr = nextMsg ? getMessageDateString(nextMsg.createdAt) : '';
              const showNextDateSeparator = nextMsg && nextDateStr !== dateStr;
              const isNextSame = nextMsg && nextMsg.senderName === msg.senderName && !showNextDateSeparator;
              
              const showAvatar = !isMe && !isPrevSame;
              const msgKey = msg.id || index.toString();
              const isTimeVisible = !!visibleTimes[msgKey];
              
              return (
                <React.Fragment key={msg.id || index}>
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-4 select-none">
                      <div className="bg-[#E2E8F0]/60 dark:bg-slate-800/60 text-kat-text dark:text-slate-350 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm tracking-wider uppercase border border-kat-border/40 dark:border-slate-700/30">
                        {dateStr}
                      </div>
                    </div>
                  )}
                  
                  <div 
                    className={classNames(
                      "flex max-w-[85%] group transition-all duration-300",
                      isMe ? "ml-auto flex-row-reverse" : "mr-auto",
                      isPrevSame ? "mt-0.5" : (index === 0 ? "mt-0" : "mt-3")
                    )}
                  >
                    {!isMe && (
                      <div className={classNames(
                        "w-8 h-8 rounded-full shrink-0 mr-2 mt-auto",
                        showAvatar && msg.senderAvatar 
                          ? "overflow-hidden bg-[#E2E8F0]/40 dark:bg-slate-800/40 border border-kat-border/60 dark:border-slate-700/40 shadow-sm transition-transform duration-200 hover:scale-110" 
                          : ""
                      )}>
                        {showAvatar ? renderSenderAvatar(msg.senderName) : null}
                      </div>
                    )}
                    
                    <div className={classNames(
                      "flex flex-col",
                      isMe ? "items-end" : "items-start"
                    )}>
                      {!isMe && showAvatar && (
                        <div className="flex items-center mb-1 ml-1 select-none">
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{msg.senderName}</span>
                          {renderRoleIcon(msg.senderRole)}
                        </div>
                      )}
                      
                      <div 
                        onClick={() => toggleTime(msgKey)}
                        className={classNames(
                          "px-4 py-2.5 relative transition-all duration-300 break-words max-w-full shadow-[0_2px_8px_rgba(3,13,46,0.02)] cursor-pointer select-none",
                          isMe 
                            ? classNames(
                                "bg-gradient-to-br from-kat-primary to-kat-primary-usable text-white hover:-translate-x-1 hover:shadow-md hover:shadow-kat-primary/15",
                                isPrevSame && isNextSame ? "rounded-l-2xl rounded-r-md" :
                                isPrevSame && !isNextSame ? "rounded-l-2xl rounded-tr-md rounded-br-2xl" :
                                !isPrevSame && isNextSame ? "rounded-l-2xl rounded-tr-2xl rounded-br-md" :
                                "rounded-2xl rounded-tr-none"
                              )
                            : classNames(
                                "bg-white dark:bg-slate-800 text-kat-text border border-slate-100 dark:border-slate-700/50 hover:translate-x-1 hover:shadow-md",
                                isPrevSame && isNextSame ? "rounded-r-2xl rounded-l-md" :
                                isPrevSame && !isNextSame ? "rounded-r-2xl rounded-tl-md rounded-bl-2xl" :
                                !isPrevSame && isNextSame ? "rounded-r-2xl rounded-tl-2xl rounded-bl-md" :
                                "rounded-2xl rounded-tl-none"
                              )
                        )}
                      >
                        <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
                      </div>
                      
                      <div className={classNames(
                        "overflow-hidden transition-all duration-200 ease-in-out select-none",
                        isTimeVisible ? "max-h-5 opacity-100 mt-1" : "max-h-0 opacity-0"
                      )}>
                        <span className="text-[9px] text-kat-muted mx-1.5">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
 
        {/* Input */}
        {isReadOnly ? (
          <div className="mx-4 my-3 p-3 bg-slate-50 dark:bg-slate-800/45 border border-kat-border/40 dark:border-slate-700/40 rounded-[20px] text-center text-[12px] font-bold text-slate-400 dark:text-slate-400 select-none flex items-center justify-center gap-1.5 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 animate-pulse" />
            Chuyến đi đã kết thúc &mdash; Chỉ xem trò chuyện
          </div>
        ) : (
          <form 
            onSubmit={handleSend}
            className="mx-4 my-3 p-1.5 bg-white/85 dark:bg-slate-800/80 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-[22px] flex items-center gap-2 shrink-0 shadow-[0_8px_24px_rgba(3,13,46,0.06)] dark:shadow-none focus-within:shadow-[0_12px_28px_rgba(0,191,183,0.12)] focus-within:border-kat-primary/40 transition-all duration-300"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={t("chat.inputPlaceholder")}
              className="flex-1 bg-transparent border-0 rounded-full px-3 py-1.5 text-xs text-kat-text placeholder-kat-muted/65 focus:outline-none transition-all duration-200"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || sending}
              className={classNames(
                "w-9 h-9 rounded-full text-white flex items-center justify-center transition-all duration-300 shrink-0 shadow-md active:scale-90 motion-press",
                inputText.trim() && !sending
                  ? "bg-gradient-to-r from-kat-primary to-kat-primary-usable hover:scale-105 shadow-kat-primary/20 hover:shadow-[0_0_12px_rgba(0,191,183,0.4)]"
                  : "bg-slate-100 dark:bg-slate-900 text-slate-300 dark:text-slate-600 shadow-none scale-100 cursor-not-allowed"
              )}
            >
              {sending ? (
                <HugeiconsIcon icon={Loading01Icon} className="w-4 h-4 animate-spin" />
              ) : (
                <HugeiconsIcon icon={SentIcon} className="w-4 h-4 ml-0.5" />
              )}
            </button>
          </form>
        )}
      </div>
    );
  };

  if (inline) {
    return (
      <>
        {/* Fullscreen Chat Modal on Mobile */}
        {isMobileModalOpen && (
          <div className="fixed inset-0 bg-white dark:bg-kat-bg z-[999] flex flex-col animate-slideUp">
            {renderChatContent(true, () => setIsMobileModalOpen(false))}
          </div>
        )}

        {/* Responsive Layout wrapper */}
        <div className="w-full">
          {/* Mobile View: Invitation CTA Card */}
          <div className="block sm:hidden bg-white dark:bg-kat-surface border border-kat-border dark:border-kat-border/40 rounded-[24px] p-6 shadow-soft dark:shadow-none text-center flex flex-col items-center justify-center h-[280px]">
            <div className="w-16 h-16 rounded-full bg-kat-primary-soft flex items-center justify-center mb-4 relative">
              <HugeiconsIcon icon={BubbleChatIcon} className="w-7 h-7 text-kat-primary animate-pulse" />
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
              </span>
            </div>
            <h4 className="font-bold text-kat-text text-base tracking-wide">{t("chat.title")}</h4>
            <p className="text-xs text-kat-muted mt-1 mb-5 leading-relaxed">
              {t("chat.connectedAs")} <strong className="text-kat-text font-semibold">{currentUser.name}</strong>
            </p>
            <button
              onClick={() => setIsMobileModalOpen(true)}
              className="bg-gradient-to-r from-kat-primary to-kat-primary-usable text-white px-8 py-3 rounded-full font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-xs tracking-wider uppercase"
            >
              {t("chat.openBtn")}
            </button>
          </div>

          {/* Desktop View: Standard Embedded ChatBox */}
          <div className="hidden sm:flex flex-col w-full h-[550px] sm:h-[650px] rounded-[24px] border border-kat-border dark:border-kat-border/40 shadow-soft dark:shadow-none overflow-hidden">
            {renderChatContent(false)}
          </div>
        </div>
      </>
    );
  }

  // Floating button drawer view (if applicable)
  return (
    <>
      {/* Mobile view: Fullscreen overlay */}
      <div className="block sm:hidden">
        <div className="fixed inset-0 bg-white dark:bg-kat-bg z-[999] flex flex-col">
          {renderChatContent(true, onClose)}
        </div>
      </div>

      {/* Desktop view: Standard floating card */}
      <div className="hidden sm:flex fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[350px] sm:w-[400px] h-[550px] max-h-[80vh] rounded-[24px] shadow-floating dark:shadow-none border border-kat-border dark:border-kat-border/40 z-50 flex-col overflow-hidden animate-slideUp">
        {renderChatContent(false, onClose)}
      </div>
    </>
  );
}
